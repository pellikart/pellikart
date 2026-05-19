import { create } from "zustand";
import { AppState, SubscriptionTier, OnboardingData, Design, RitualBoard } from "./types";
import { mockVendors, mockRitualBoards, generateBoardsFromOnboarding, getVendorPriceScale, mockDesigns, getCategoriesForEvent, categoryWeight } from "./mock-data";
import {
  fetchCouple, upsertCouple,
  fetchRitualBoards, insertRitualBoard,
  updateBoardCategory, updateBoardDatesDb,
  fetchAllLiveVendors, fetchAllListings, fetchAllAvailability,
  trackEvent,
  createTrial, confirmTrialDb, markTrialDoneDb,
  createBids, selectBidDb, type BidRow,
  addLikeDb, removeLikeDb, fetchUserLikes,
  updateSubscriptionDb, fetchSubscriptionTier,
  createBooking, createMilestones, createEarning, createNotification,
  fetchCoupleBookings, cancelBookingDb,
  fetchMilestones, completeMilestoneDb,
  fetchCoupleTrials, fetchCoupleBids,
  saveDecorBriefDb, insertBoardCategory,
} from "./supabase-db";
import type { Vendor } from "./types";

function cloneVendors() {
  const cloned: Record<string, typeof mockVendors[string]> = {};
  for (const [k, v] of Object.entries(mockVendors)) {
    cloned[k] = { ...v, likes: v.likes.map((l) => ({ ...l })) };
  }
  return cloned;
}

function cloneBoards() {
  return mockRitualBoards.map((b) => ({
    ...b,
    categories: b.categories.map((c) => ({
      ...c,
      shortlistedVendorIds: [...c.shortlistedVendorIds],
      suggestedVendors: c.suggestedVendors.map((s) => ({ ...s })),
    })),
  }));
}

/** Build enriched vendor map from live Supabase data */
export function buildLiveVendorMap(
  liveVendors: Record<string, unknown>[],
  listings: Record<string, unknown>[],
  availability: Record<string, unknown>[]
): { vendorMap: Record<string, Vendor>; lvMap: Record<string, string> } {
  const vendorMap: Record<string, Vendor> = {}
  const lvMap: Record<string, string> = {}
  const categoryCounts: Record<string, number> = {}

  // Build availability lookup: vendorId → blocked dates
  const blockedByVendor: Record<string, string[]> = {}
  for (const a of availability) {
    const vid = a.vendor_id as string
    if (!blockedByVendor[vid]) blockedByVendor[vid] = []
    blockedByVendor[vid].push(a.date as string)
  }

  for (const l of listings) {
    const parentVendor = liveVendors.find((v) => v.id === l.vendor_id)
    const cat = (l.category as string) || ''
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    const code = `${cat} ${String(categoryCounts[cat]).padStart(3, '0')}`
    const vendorDbId = l.vendor_id as string
    if (vendorDbId) lvMap[l.id as string] = vendorDbId

    vendorMap[l.id as string] = {
      id: l.id as string,
      code,
      name: (parentVendor?.business_name as string) || (l.name as string),
      photo: (() => {
        const photos = (l.photos as string[]) || []
        const coverIdx = (l.cover_photo_index as number) ?? 0
        return photos[coverIdx] || photos[0] || ''
      })(),
      style: (l.style as string) || '',
      area: (parentVendor?.area as string) || '',
      price: l.price as number,
      rating: (parentVendor?.rating as number) || 0,
      packageTier: ((l.includes as string[]) || []).slice(0, 4).join(' · '),
      likes: [],
      booked: false,
      amountPaid: 0,
      // Extended fields
      description: (parentVendor?.description as string) || '',
      portfolioPhotos: (parentVendor?.portfolio_photos as string[]) || [],
      portfolioVideos: (parentVendor?.portfolio_videos as string[]) || [],
      listingPhotos: (l.photos as string[]) || [],
      listingVideos: (l.videos as string[]) || [],
      categoryFields: (l.category_fields as Record<string, string | string[]>) || {},
      includes: (l.includes as string[]) || [],
      phone: (parentVendor?.phone as string) || '',
      secondaryPhone: (parentVendor?.secondary_phone as string) || undefined,
      whatsapp: (parentVendor?.whatsapp as string) || '',
      email: (parentVendor?.email as string) || '',
      instagram: (parentVendor?.instagram as string) || '',
      experience: parseInt((parentVendor?.years_experience as string) || '0') || 0,
      teamSize: (parentVendor?.team_size as string) || '',
      blockedDates: blockedByVendor[vendorDbId] || [],
      category: cat,
      bundledListings: (l.bundled_listings as string[]) || [],
      bundleMandatory: (l.bundle_mandatory as boolean) || false,
      hourlyPricing: (l.hourly_pricing as { hours: number; price: number }[]) || undefined,
      paidRooms: (l.paid_rooms as import('./vendor-types').PaidRoom[]) || undefined,
      menu: (l.menu as import('./vendor-types').MenuSection[]) || undefined,
      rituals: (l.rituals as string[]) || undefined,
      transportIncluded: (l.transport_included as boolean | null) ?? undefined,
      transportExtra: (l.transport_extra as number | null) ?? undefined,
    }
  }

  return { vendorMap, lvMap }
}

function maxTrialsForTier(tier: SubscriptionTier): number {
  if (tier === 'gold') return 3;
  if (tier === 'silver') return 1;
  return 0;
}

interface LiveModeState {
  _liveMode: boolean
  _userId: string | null
  _coupleDbId: string | null
  /** Maps listing UUID → vendor UUID (for analytics tracking) */
  _listingVendorMap: Record<string, string>
  /** Maps local trial key → DB trial UUID */
  _trialIdMap: Record<string, string>
  /** Maps listing ID → ordered milestone DB IDs for the active booking (so we can mark them complete) */
  _vendorMilestones: Record<string, string[]>
}

export const useStore = create<AppState & LiveModeState & {
  initLiveMode: (userId: string, role: 'couple' | 'vendor') => Promise<void>
}>((set, get) => ({
  // Live mode
  _liveMode: false,
  _userId: null,
  _coupleDbId: null,
  _listingVendorMap: {},
  _trialIdMap: {},
  _vendorMilestones: {},

  // App state
  role: 'none',
  onboardingComplete: false,
  onboardingData: null,
  subscription: 'free',
  vendors: cloneVendors(),
  ritualBoards: cloneBoards(),
  milestoneProgress: {},
  trialSessions: {},
  trialsUsed: {},

  /**
   * Initialize live mode — fetch existing couple data from Supabase.
   * Called from LiveApp after auth succeeds.
   */
  initLiveMode: async (userId: string, role: 'couple' | 'vendor') => {
    set({ _liveMode: true, _userId: userId, role: role === 'couple' ? 'user' : 'vendor' })

    // Load subscription tier from DB
    fetchSubscriptionTier(userId).then(tier => set({ subscription: tier }))

    if (role === 'couple') {
      const couple = await fetchCouple(userId)
      if (couple && couple.onboarding_complete) {
        // Returning couple — restore their data
        const onboardingData: OnboardingData = {
          partner1: couple.partner1_name || '',
          partner2: couple.partner2_name || '',
          events: couple.events || [],
          customEvents: couple.custom_events || [],
          eventDates: couple.event_dates || {},
          eventGuests: couple.event_guests || {},
          budget: couple.budget || 0,
          style: couple.style_preference,
        }

        // Fetch boards from DB
        const boards = await fetchRitualBoards(couple.id)

        // Fetch live vendors, listings, availability, active bookings, trials, likes
        const [liveVendors, listings, availability, bookings, trials, likes] = await Promise.all([
          fetchAllLiveVendors(), fetchAllListings(), fetchAllAvailability(),
          fetchCoupleBookings(couple.id),
          fetchCoupleTrials(couple.id),
          fetchUserLikes(userId),
        ])
        const { vendorMap, lvMap } = buildLiveVendorMap(liveVendors, listings, availability)

        // Restore vendor likes (heart state) onto the in-memory vendor objects
        for (const like of likes) {
          const v = vendorMap[like.vendor_id]
          if (!v) continue
          if (!v.likes.some(l => l.userId === like.liker_user_id)) {
            vendorMap[like.vendor_id] = { ...v, likes: [...v.likes, { userId: like.liker_user_id, name: like.liker_name }] }
          }
        }

        // Restore trial state. Trials in DB store ritual_name + category_label;
        // we map back to local ritualId + categoryId via the boards we just loaded.
        const trialSessions: Record<string, import('./types').TrialInfo> = {}
        const trialIdMap: Record<string, string> = {}
        const trialsUsed: Record<string, number> = {}
        for (const t of trials) {
          const board = boards.find(b => b.name === t.ritual_name)
          if (!board) continue
          const cat = board.categories.find(c => c.label === t.category_label)
          if (!cat) continue
          const listingId = t.listing_id || ''
          const trialKey = `${board.id}-${cat.id}-${listingId}`
          const catKey = `${board.id}-${cat.id}`
          trialSessions[trialKey] = {
            status: t.status === 'requested' ? 'requested'
              : t.status === 'accepted' ? 'accepted'
              : t.status === 'rescheduled' ? 'rescheduled'
              : t.status === 'confirmed' ? 'confirmed'
              : 'done',
            requestedDate: t.requested_date,
            requestedTime: t.requested_time,
            scheduledDate: t.scheduled_date,
            scheduledTime: t.scheduled_time,
            vendorId: listingId,
            categoryLabel: cat.label,
            ritualName: board.name,
            vendorProposedDate: t.vendor_proposed_date || undefined,
            vendorProposedTime: t.vendor_proposed_time || undefined,
          }
          trialIdMap[trialKey] = t.id
          trialsUsed[catKey] = (trialsUsed[catKey] || 0) + 1
        }

        // Re-apply active bookings so booked state survives refresh
        const milestoneProgress: Record<string, number> = {}
        const vendorMilestones: Record<string, string[]> = {}
        const activeBookings = bookings.filter(b => b.status === 'active')
        const milestoneArrays = await Promise.all(
          activeBookings.map(b => fetchMilestones(b.id as string))
        )
        for (let i = 0; i < activeBookings.length; i++) {
          const b = activeBookings[i]
          const listingId = b.listing_id as string | null
          if (!listingId || !vendorMap[listingId]) continue
          vendorMap[listingId] = { ...vendorMap[listingId], booked: true, amountPaid: (b.slot_amount as number) || 0 }
          const ms = milestoneArrays[i]
          vendorMilestones[listingId] = ms.map(m => (m as Record<string, unknown>).id as string)
          milestoneProgress[listingId] = ms.filter(m => (m as Record<string, unknown>).is_complete).length || 1
        }

        set({
          _coupleDbId: couple.id,
          _listingVendorMap: lvMap,
          _vendorMilestones: vendorMilestones,
          _trialIdMap: trialIdMap,
          onboardingComplete: true,
          onboardingData: onboardingData,
          ritualBoards: boards.length > 0 ? boards : [],
          vendors: Object.keys(vendorMap).length > 0 ? vendorMap : cloneVendors(),
          milestoneProgress,
          trialSessions,
          trialsUsed,
        })
      }
      // If no couple record or not onboarded, state stays at defaults (will show onboarding)
    }
    // For vendor role, the vendor store handles its own init
  },

  setRole: (role) => set({ role }),

  completeOnboarding: (data) => {
    const { _liveMode, _userId } = get()

    if (_liveMode && _userId) {
      // Show onboarding complete immediately with empty boards
      const placeholderBoards = generateBoardsFromOnboarding(data)
      set({ onboardingComplete: true, onboardingData: data, ritualBoards: placeholderBoards })

      // Fetch live listings, build vendor map, pre-populate boards, then save to DB
      Promise.all([fetchAllLiveVendors(), fetchAllListings(), fetchAllAvailability()]).then(async ([liveVendors, listings, availability]) => {
        const { vendorMap, lvMap } = buildLiveVendorMap(liveVendors, listings, availability)

        // Pre-populate boards with live vendors (same logic as demo)
        const allEvents = [...data.events, ...data.customEvents]
        const eventWeights: Record<string, number> = {}
        let totalWeight = 0
        for (const e of allEvents) {
          const lower = e.toLowerCase()
          const w = lower.includes('pelli') && lower.includes('wedding') ? 2.5 : lower === 'reception' ? 1.5 : 1
          eventWeights[e] = w
          totalWeight += w
        }

        // Carry the vendor picked in earlier rituals forward: same category in a
        // later ritual prefers any of those previously-picked vendors (if they
        // have a listing for the new ritual that's within budget). This keeps
        // a couple talking to one photographer / caterer / etc across events.
        const carryoverByCategory: Record<string, string[]> = {}

        const boards: RitualBoard[] = allEvents.map((eventName) => {
          const id = `r-${eventName.toLowerCase().replace(/\s+/g, "-")}`
          const dateInfo = data.eventDates[eventName]
          const categories = getCategoriesForEvent(eventName)
          const perEvent = data.eventBudgets?.[eventName]
          const eventBudget = typeof perEvent === 'number'
            ? perEvent
            : data.budget * (eventWeights[eventName] / totalWeight)
          const totalCatWeight = categories.reduce((sum, c) => sum + (categoryWeight[c] || 0.05), 0)

          const cats = categories.map((label) => {
            const weight = categoryWeight[label] || 0.05
            const catBudget = eventBudget * (weight / totalCatWeight)

            // Find live listings matching this category + ritual
            const matchingListings = listings.filter(l =>
              (l.category as string) === label &&
              ((l.rituals as string[]) || []).some(r =>
                r.toLowerCase() === eventName.toLowerCase() ||
                r.toLowerCase().includes(eventName.toLowerCase().split(' ')[0])
              )
            )

            // Fall back to any listing in this category if no ritual match
            const pool = matchingListings.length > 0
              ? matchingListings
              : listings.filter(l => (l.category as string) === label)

            // Pick best vendor within budget
            let selectedId: string | null = null
            let shortlisted: string[] = []

            if (pool.length > 0) {
              // Carryover preference: try a listing from a vendor we picked for
              // this same category in an earlier ritual. Prefer order picked.
              const carryVendorIds = carryoverByCategory[label] || []
              let carryListing: typeof pool[0] | undefined
              for (const vid of carryVendorIds) {
                const within = pool.find(l => (l.vendor_id as string) === vid && (l.price as number) <= catBudget)
                if (within) { carryListing = within; break }
              }
              // Relax budget if no affordable carryover listing
              if (!carryListing) {
                for (const vid of carryVendorIds) {
                  const any = pool.find(l => (l.vendor_id as string) === vid)
                  if (any) { carryListing = any; break }
                }
              }

              if (carryListing) {
                selectedId = carryListing.id as string
                // Surface 2 other strong options alongside the carryover pick
                const others = pool.filter(l => l.id !== carryListing!.id).sort((a, b) => (b.price as number) - (a.price as number))
                shortlisted = [selectedId, ...others.slice(0, 2).map(l => l.id as string)]
              } else {
                // Original highest-affordable-price logic
                const sorted = [...pool].sort((a, b) => (a.price as number) - (b.price as number))
                const affordable = sorted.filter(l => (l.price as number) <= catBudget)
                const best = affordable.length > 0 ? affordable : [sorted[0]]
                const byPriceDesc = [...best].sort((a, b) => (b.price as number) - (a.price as number))
                selectedId = byPriceDesc[0].id
                shortlisted = byPriceDesc.slice(0, Math.min(3, byPriceDesc.length)).map(l => l.id)
              }

              // Record the chosen vendor for this category so later rituals can carry them forward
              const chosenListing = pool.find(l => l.id === selectedId)
              if (chosenListing) {
                const vId = chosenListing.vendor_id as string
                if (vId) {
                  carryoverByCategory[label] = carryoverByCategory[label] || []
                  if (!carryoverByCategory[label].includes(vId)) {
                    carryoverByCategory[label].push(vId)
                  }
                }
              }
            }

            return {
              id: `${id}-c-${label.toLowerCase().replace(/[\s\/]+/g, "-")}`,
              label,
              selectedVendorId: selectedId,
              shortlistedVendorIds: shortlisted,
              suggestedVendors: [] as { vendorId: string; suggestedBy: string }[],
              removed: false,
            }
          })

          return { id, name: eventName, dateStart: dateInfo?.start, dateEnd: dateInfo?.end !== dateInfo?.start ? dateInfo?.end : undefined, categories: cats }
        })

        // If we have live vendors, use them; otherwise fall back to demo-style
        if (Object.keys(vendorMap).length > 0) {
          set({ vendors: vendorMap, _listingVendorMap: lvMap, ritualBoards: boards })
        } else {
          // No live vendors — use mock data so boards still look populated
          const mockBoards = generateBoardsFromOnboarding(data)
          const scale = getVendorPriceScale(mockBoards, data.budget)
          const scaledVendors = cloneVendors()
          for (const key of Object.keys(scaledVendors)) {
            scaledVendors[key].price = Math.round(scaledVendors[key].price * scale)
          }
          for (const design of mockDesigns) {
            const parentVendor = scaledVendors[design.vendorId] || mockVendors[design.vendorId]
            scaledVendors[design.id] = {
              id: design.id, code: design.name,
              name: `${design.name} by ${parentVendor?.name || 'Vendor'}`,
              photo: design.photo, style: design.style,
              area: parentVendor?.area || '', capacity: parentVendor?.capacity,
              price: Math.round(design.price * scale), rating: design.rating,
              packageTier: design.description, likes: [], booked: false, amountPaid: 0,
              // Inherit category-specific fields so the Compare table shows real detail for design listings
              categoryFields: parentVendor?.categoryFields,
              category: parentVendor?.category || (parentVendor?.code as string | undefined)?.split(' ')[0],
              bundledListings: parentVendor?.bundledListings,
              bundleMandatory: parentVendor?.bundleMandatory,
              hourlyPricing: parentVendor?.hourlyPricing,
              paidRooms: parentVendor?.paidRooms,
              includes: parentVendor?.includes,
              transportIncluded: parentVendor?.transportIncluded,
              transportExtra: parentVendor?.transportExtra,
            }
          }
          set({ vendors: scaledVendors, ritualBoards: mockBoards })
        }

        // Save to Supabase in background
        const coupleData = await upsertCouple(_userId!, data)
        if (coupleData) {
          set({ _coupleDbId: coupleData.id })
          const currentBoards = get().ritualBoards
          for (let i = 0; i < currentBoards.length; i++) {
            await insertRitualBoard(coupleData.id, currentBoards[i], i)
          }
          const dbBoards = await fetchRitualBoards(coupleData.id)
          if (dbBoards.length > 0) {
            set({ ritualBoards: dbBoards })
          }
        }
      })
    } else {
      // Demo mode — use mock data
      const boards = generateBoardsFromOnboarding(data);
      const scale = getVendorPriceScale(boards, data.budget);

      const scaledVendors = cloneVendors();
      for (const key of Object.keys(scaledVendors)) {
        scaledVendors[key].price = Math.round(scaledVendors[key].price * scale);
      }

      for (const design of mockDesigns) {
        const parentVendor = scaledVendors[design.vendorId] || mockVendors[design.vendorId];
        scaledVendors[design.id] = {
          id: design.id, code: design.name,
          name: `${design.name} by ${parentVendor?.name || 'Vendor'}`,
          photo: design.photo, style: design.style,
          area: parentVendor?.area || '', capacity: parentVendor?.capacity,
          price: Math.round(design.price * scale), rating: design.rating,
          packageTier: design.description, likes: [], booked: false, amountPaid: 0,
          // Inherit category-specific fields so the Compare table shows real detail for design listings
          categoryFields: parentVendor?.categoryFields,
          category: parentVendor?.category || (parentVendor?.code as string | undefined)?.split(' ')[0],
          bundledListings: parentVendor?.bundledListings,
          bundleMandatory: parentVendor?.bundleMandatory,
          hourlyPricing: parentVendor?.hourlyPricing,
          paidRooms: parentVendor?.paidRooms,
          includes: parentVendor?.includes,
          transportIncluded: parentVendor?.transportIncluded,
          transportExtra: parentVendor?.transportExtra,
        };
      }

      set({
        onboardingComplete: true,
        onboardingData: data,
        ritualBoards: boards,
        vendors: scaledVendors,
      });
    }
  },

  subscribe: (tier) => {
    set({ subscription: tier })
    const { _liveMode, _userId } = get()
    if (_liveMode && _userId) {
      updateSubscriptionDb(_userId, tier)
    }
  },

  getMaxTrials: () => maxTrialsForTier(get().subscription),

  selectVendor: (ritualId, categoryId, vendorId) => {
    const { _liveMode, _userId, _listingVendorMap, vendors } = get()
    // When selecting a venue with hourly pricing, default the tier to 24 hr (or first tier).
    const v = vendors[vendorId]
    const defaultTier = v?.hourlyPricing && v.hourlyPricing.length > 0
      ? (v.hourlyPricing.find(t => t.hours === 24)?.hours || v.hourlyPricing[0].hours)
      : undefined
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, selectedVendorId: vendorId, selectedTierHours: defaultTier } : c) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { selectedVendorId: vendorId, selectedTierHours: defaultTier })
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, 'vendor_select', _userId, vendorId)
    }
  },

  selectVendorTier: (ritualId, categoryId, tierHours) => {
    const { _liveMode } = get()
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, selectedTierHours: tierHours } : c) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { selectedTierHours: tierHours })
    }
  },

  addToShortlist: (ritualId, categoryId, vendorId) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    let newList: string[] = []
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => {
              if (c.id === categoryId && !c.shortlistedVendorIds.includes(vendorId)) {
                newList = [...c.shortlistedVendorIds, vendorId]
                return { ...c, shortlistedVendorIds: newList }
              }
              return c
            }) }
          : b
      ),
    }))
    if (_liveMode && newList.length > 0) {
      updateBoardCategory(categoryId, { shortlistedVendorIds: newList })
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, 'shortlist_add', _userId, vendorId)
    }
  },

  removeFromShortlist: (ritualId, categoryId, vendorId) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    let newList: string[] = []
    let clearedSelection = false
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => {
              if (c.id === categoryId) {
                newList = c.shortlistedVendorIds.filter((id) => id !== vendorId)
                if (c.selectedVendorId === vendorId) clearedSelection = true
                return { ...c, shortlistedVendorIds: newList, selectedVendorId: c.selectedVendorId === vendorId ? null : c.selectedVendorId }
              }
              return c
            }) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, clearedSelection
        ? { shortlistedVendorIds: newList, selectedVendorId: null }
        : { shortlistedVendorIds: newList }
      )
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, 'shortlist_remove', _userId, vendorId)
    }
  },

  toggleLike: (vendorId, userName, userId) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    const vendor = get().vendors[vendorId]
    if (!vendor) return
    const alreadyLiked = vendor.likes.some((l) => l.userId === userId)
    set((s) => ({
      vendors: { ...s.vendors, [vendorId]: { ...vendor, likes: alreadyLiked ? vendor.likes.filter((l) => l.userId !== userId) : [...vendor.likes, { userId, name: userName }] } },
    }))
    if (_liveMode && _userId) {
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, alreadyLiked ? 'unlike' : 'like', _userId, vendorId)
      if (alreadyLiked) {
        removeLikeDb(_userId, vendorId, userId)
      } else {
        addLikeDb(_userId, vendorId, userName, userId)
      }
    }
  },

  removeCategory: (ritualId, categoryId) => {
    const { _liveMode } = get()
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, removed: true } : c) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { removed: true })
    }
  },

  restoreCategory: (ritualId, categoryId) => {
    const { _liveMode } = get()
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, removed: false } : c) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { removed: false })
    }
  },

  setDecorBrief: (ritualId, categoryId, brief) => {
    const { _liveMode } = get()
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, decorBrief: brief } : c) }
          : b
      ),
    }))
    if (_liveMode) {
      saveDecorBriefDb(categoryId, brief)
    }
  },

  addBoardCategory: (ritualId, label) => {
    const { _liveMode } = get()
    // Don't add if a category with this label already exists on the board
    const board = get().ritualBoards.find(b => b.id === ritualId)
    if (!board || board.categories.some(c => c.label === label)) return

    const tempId = `${ritualId}-c-${label.toLowerCase().replace(/[\s/]+/g, '-')}-${Date.now()}`
    const newCategory = {
      id: tempId,
      label,
      selectedVendorId: null,
      shortlistedVendorIds: [],
      suggestedVendors: [],
      removed: false,
    }

    set((s) => ({
      ritualBoards: s.ritualBoards.map(b =>
        b.id === ritualId ? { ...b, categories: [...b.categories, newCategory] } : b
      ),
    }))

    if (_liveMode) {
      insertBoardCategory(ritualId, label).then(row => {
        if (row) {
          // Swap the temp id for the real DB UUID so future updates target the right row
          set((s) => ({
            ritualBoards: s.ritualBoards.map(b =>
              b.id === ritualId
                ? { ...b, categories: b.categories.map(c => c.id === tempId ? { ...c, id: row.id as string } : c) }
                : b
            ),
          }))
        }
      })
    }
  },

  bookVendor: (vendorId, amount) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    const vendor = get().vendors[vendorId]
    set((s) => ({
      vendors: { ...s.vendors, [vendorId]: { ...s.vendors[vendorId], booked: true, amountPaid: amount } },
      milestoneProgress: { ...s.milestoneProgress, [vendorId]: 1 },
    }))
    if (_liveMode && _userId) {
      const vid = _listingVendorMap[vendorId]
      if (vid) {
        trackEvent(vid, 'booking', _userId, vendorId, { amount })
        const price = vendor?.price || amount * 20
        createBooking(_userId, vid, vendorId, '', '', price, amount, 5).then(async booking => {
          if (booking) {
            const milestones = await createMilestones(booking.id, ['Slot booked', 'Planning started', 'Final confirmation', 'Event day', 'Completed'])
            if (milestones.length > 0) {
              set(s => ({ _vendorMilestones: { ...s._vendorMilestones, [vendorId]: milestones.map(m => m.id) } }))
            }
            createEarning(vid, booking.id, '', '', amount, 'slot')
          }
        })
      }
    }
  },

  cancelBooking: (vendorId) => {
    const { _liveMode, _coupleDbId } = get()
    set((s) => {
      const v = s.vendors[vendorId]
      if (!v || !v.booked) return s
      const { [vendorId]: _, ...remainingProgress } = s.milestoneProgress
      const { [vendorId]: __, ...remainingMilestones } = s._vendorMilestones
      return {
        vendors: { ...s.vendors, [vendorId]: { ...s.vendors[vendorId], booked: false, amountPaid: 0 } },
        milestoneProgress: remainingProgress,
        _vendorMilestones: remainingMilestones,
      }
    })
    if (_liveMode && _coupleDbId) {
      cancelBookingDb(_coupleDbId, vendorId)
    }
  },

  bookAllVendors: (ritualId) => {
    const state = get();
    const board = state.ritualBoards.find((b) => b.id === ritualId);
    if (!board) return;
    const updatedVendors = { ...state.vendors };
    const updatedProgress = { ...state.milestoneProgress };
    const newlyBooked: { listingId: string; amount: number; price: number }[] = []
    for (const cat of board.categories) {
      if (cat.selectedVendorId && !cat.removed) {
        const v = updatedVendors[cat.selectedVendorId];
        if (v && !v.booked) {
          const amount = Math.round(v.price * 0.04);
          updatedVendors[cat.selectedVendorId] = { ...v, booked: true, amountPaid: amount };
          updatedProgress[cat.selectedVendorId] = 1;
          newlyBooked.push({ listingId: cat.selectedVendorId, amount, price: v.price })
        }
      }
    }
    set({ vendors: updatedVendors, milestoneProgress: updatedProgress });

    const { _liveMode, _userId, _listingVendorMap } = state
    if (_liveMode && _userId && newlyBooked.length > 0) {
      for (const b of newlyBooked) {
        const vid = _listingVendorMap[b.listingId]
        if (!vid) continue
        trackEvent(vid, 'booking', _userId, b.listingId, { amount: b.amount })
        createBooking(_userId, vid, b.listingId, ritualId, '', b.price, b.amount, 4).then(async booking => {
          if (booking) {
            const milestones = await createMilestones(booking.id, ['Slot booked', 'Planning started', 'Final confirmation', 'Event day', 'Completed'])
            if (milestones.length > 0) {
              set(s => ({ _vendorMilestones: { ...s._vendorMilestones, [b.listingId]: milestones.map(m => m.id) } }))
            }
            createEarning(vid, booking.id, '', '', b.amount, 'slot')
          }
        })
      }
    }
  },

  swapVendor: (ritualId, categoryId, newVendorId) => {
    const { _liveMode, _coupleDbId } = get()
    // Capture the previously-selected vendor BEFORE mutating state — we may need to cancel its booking
    const board = get().ritualBoards.find((b) => b.id === ritualId)
    const oldCat = board?.categories.find((c) => c.id === categoryId)
    const oldVendorId = oldCat?.selectedVendorId
    const oldVendor = oldVendorId ? get().vendors[oldVendorId] : null
    const oldWasBooked = !!oldVendor?.booked

    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) =>
              c.id === categoryId
                ? { ...c, selectedVendorId: newVendorId, shortlistedVendorIds: c.shortlistedVendorIds.includes(newVendorId) ? c.shortlistedVendorIds : [...c.shortlistedVendorIds, newVendorId] }
                : c
            ) }
          : b
      ),
      // Locally clear the old vendor's booked state — couple has forfeited it
      vendors: oldWasBooked && oldVendorId
        ? { ...s.vendors, [oldVendorId]: { ...s.vendors[oldVendorId], booked: false, amountPaid: 0 } }
        : s.vendors,
      _vendorMilestones: oldWasBooked && oldVendorId
        ? Object.fromEntries(Object.entries(s._vendorMilestones).filter(([k]) => k !== oldVendorId))
        : s._vendorMilestones,
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { selectedVendorId: newVendorId })
      if (oldWasBooked && oldVendorId && _coupleDbId) {
        cancelBookingDb(_coupleDbId, oldVendorId)
      }
    }
  },

  completeMilestone: (vendorId, totalMilestones) => {
    const { _liveMode, _vendorMilestones } = get()
    let nextIndex = -1
    set((s) => {
      const current = s.milestoneProgress[vendorId] || 0;
      if (current >= totalMilestones) return s;
      nextIndex = current
      return { milestoneProgress: { ...s.milestoneProgress, [vendorId]: current + 1 } };
    })
    if (_liveMode && nextIndex >= 0) {
      const milestoneIds = _vendorMilestones[vendorId]
      if (milestoneIds && milestoneIds[nextIndex]) {
        completeMilestoneDb(milestoneIds[nextIndex])
      }
    }
  },

  updateBoardDates: (ritualId, dateStart, dateEnd, removeVendorIds) => {
    const { _liveMode } = get()
    // Capture which categories will have their selection cleared, so we can mirror to DB
    const boardBefore = get().ritualBoards.find((b) => b.id === ritualId)
    const clearedCategoryIds = boardBefore
      ? boardBefore.categories.filter(c => c.selectedVendorId && removeVendorIds.includes(c.selectedVendorId)).map(c => c.id)
      : []

    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? {
              ...b,
              dateStart: dateStart || undefined,
              dateEnd: dateEnd || undefined,
              categories: b.categories.map((c) => {
                if (c.selectedVendorId && removeVendorIds.includes(c.selectedVendorId)) {
                  return { ...c, selectedVendorId: null };
                }
                return c;
              }),
            }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardDatesDb(ritualId, dateStart, dateEnd)
      for (const catId of clearedCategoryIds) {
        updateBoardCategory(catId, { selectedVendorId: null })
      }
    }
  },

  requestTrial: (ritualId, categoryId, vendorId, date, time) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    set((s) => {
      const catKey = `${ritualId}-${categoryId}`;
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const used = s.trialsUsed[catKey] || 0;
      const max = maxTrialsForTier(s.subscription);
      if (used >= max) return s;
      if (s.trialSessions[trialKey]) return s;

      const board = s.ritualBoards.find((b) => b.id === ritualId);
      const cat = board?.categories.find((c) => c.id === categoryId);

      return {
        trialSessions: {
          ...s.trialSessions,
          [trialKey]: {
            status: 'requested' as const,
            requestedDate: date,
            requestedTime: time,
            scheduledDate: date,
            scheduledTime: time,
            vendorId,
            categoryLabel: cat?.label || '',
            ritualName: board?.name || '',
          },
        },
        trialsUsed: { ...s.trialsUsed, [catKey]: used + 1 },
      };
    })
    if (_liveMode) {
      const vid = _listingVendorMap[vendorId]
      if (vid) {
        trackEvent(vid, 'trial_request', _userId, vendorId)
        const board = get().ritualBoards.find(b => b.id === ritualId)
        const cat = board?.categories.find(c => c.id === categoryId)
        createTrial(_userId!, vid, vendorId, board?.name || '', cat?.label || '', date, time).then(row => {
          if (row) set(s => ({ _trialIdMap: { ...s._trialIdMap, [`${ritualId}-${categoryId}-${vendorId}`]: row.id } }))
        })
      }
    }
  },

  acceptTrial: (ritualId, categoryId, vendorId) => {
    // This is called from vendor side — handled in vendor store for live mode
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'requested') return s;
      return {
        trialSessions: { ...s.trialSessions, [trialKey]: { ...trial, status: 'accepted' as const } },
      };
    })
  },

  proposeNewTrialTime: (ritualId, categoryId, vendorId, newDate, newTime) => {
    // This is called from vendor side — handled in vendor store for live mode
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'requested') return s;
      return {
        trialSessions: {
          ...s.trialSessions,
          [trialKey]: { ...trial, status: 'rescheduled' as const, vendorProposedDate: newDate, vendorProposedTime: newTime },
        },
      };
    })
  },

  confirmReschedule: (ritualId, categoryId, vendorId) => {
    const { _liveMode, _trialIdMap } = get()
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'rescheduled') return s;
      return {
        trialSessions: {
          ...s.trialSessions,
          [trialKey]: {
            ...trial,
            status: 'confirmed' as const,
            scheduledDate: trial.vendorProposedDate || trial.scheduledDate,
            scheduledTime: trial.vendorProposedTime || trial.scheduledTime,
          },
        },
      };
    })
    if (_liveMode) {
      const dbId = _trialIdMap[`${ritualId}-${categoryId}-${vendorId}`]
      if (dbId) confirmTrialDb(dbId)
    }
  },

  markTrialDone: (ritualId, categoryId, vendorId) => {
    const { _liveMode, _trialIdMap } = get()
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial) return s;
      return {
        trialSessions: { ...s.trialSessions, [trialKey]: { ...trial, status: 'done' as const } },
      };
    })
    if (_liveMode) {
      const dbId = _trialIdMap[`${ritualId}-${categoryId}-${vendorId}`]
      if (dbId) markTrialDoneDb(dbId)
    }
  },

  addDesignAsVendor: (design) =>
    set((s) => {
      if (s.vendors[design.id]) return s;
      const parentVendor = s.vendors[design.vendorId] || mockVendors[design.vendorId];
      return {
        vendors: {
          ...s.vendors,
          [design.id]: {
            id: design.id, code: design.name,
            name: `${design.name} by ${parentVendor?.name || 'Vendor'}`,
            photo: design.photo, style: design.style,
            area: parentVendor?.area || '', capacity: parentVendor?.capacity,
            price: design.price, rating: design.rating,
            packageTier: design.description, likes: [], booked: false, amountPaid: 0,
            // Inherit the parent vendor's category-specific fields so the Compare table
            // can surface the same detail for design listings.
            categoryFields: parentVendor?.categoryFields,
            category: parentVendor?.category || (parentVendor?.code as string | undefined)?.split(' ')[0],
            bundledListings: parentVendor?.bundledListings,
            bundleMandatory: parentVendor?.bundleMandatory,
            hourlyPricing: parentVendor?.hourlyPricing,
            paidRooms: parentVendor?.paidRooms,
            includes: parentVendor?.includes,
            transportIncluded: parentVendor?.transportIncluded,
            transportExtra: parentVendor?.transportExtra,
          },
        },
      };
    }),

  addRitualBoard: (name, dateStart, dateEnd) => {
    const { _liveMode, _coupleDbId } = get()
    const id = `r-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const defaultCats = ["Venue", "Catering", "Decor", "Photography", "Makeup", "DJ / Music"];
    const board: RitualBoard = {
      id,
      name,
      dateStart,
      dateEnd: dateEnd !== dateStart ? dateEnd : undefined,
      categories: defaultCats.map((label) => ({
        id: `${id}-c-${label.toLowerCase().replace(/[\s\/]+/g, "-")}`,
        label,
        selectedVendorId: null,
        shortlistedVendorIds: [],
        suggestedVendors: [],
        removed: false,
      })),
    }

    set((s) => ({ ritualBoards: [...s.ritualBoards, board] }))

    if (_liveMode && _coupleDbId) {
      insertRitualBoard(_coupleDbId, board, get().ritualBoards.length - 1).then(async (dbBoard) => {
        if (dbBoard) {
          // Re-fetch to get DB IDs for categories
          const boards = await fetchRitualBoards(_coupleDbId)
          if (boards.length > 0) set({ ritualBoards: boards })
        }
      })
    }
  },
}));
