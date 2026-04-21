import { create } from "zustand";
import { AppState, SubscriptionTier, OnboardingData, Design, RitualBoard } from "./types";
import { mockVendors, mockRitualBoards, generateBoardsFromOnboarding, getVendorPriceScale, mockDesigns } from "./mock-data";
import {
  fetchCouple, upsertCouple,
  fetchRitualBoards, insertRitualBoard,
  updateBoardCategory, updateBoardDatesDb,
  fetchAllLiveVendors, fetchAllListings,
  trackEvent,
} from "./supabase-db";

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
}

export const useStore = create<AppState & LiveModeState & {
  initLiveMode: (userId: string, role: 'couple' | 'vendor') => Promise<void>
}>((set, get) => ({
  // Live mode
  _liveMode: false,
  _userId: null,
  _coupleDbId: null,
  _listingVendorMap: {},

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

        // Fetch live vendors to show in explore
        const liveVendors = await fetchAllLiveVendors()
        const listings = await fetchAllListings()

        // Build vendor map from live data
        const vendorMap: Record<string, typeof mockVendors[string]> = {}
        const lvMap: Record<string, string> = {} // listing → vendor mapping
        const categoryCounts: Record<string, number> = {}

        // Map listings as the primary vendor entries (each listing = one browsable option)
        for (const l of listings) {
          const parentVendor = liveVendors.find((v: Record<string, unknown>) => v.id === l.vendor_id)
          const cat = (l.category as string) || ''
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
          const code = `${cat} ${String(categoryCounts[cat]).padStart(3, '0')}`

          if (l.vendor_id) lvMap[l.id] = l.vendor_id as string

          vendorMap[l.id] = {
            id: l.id,
            code,
            name: parentVendor?.business_name || l.name,
            photo: (l.photos as string[])?.[0] || '',
            style: l.style || '',
            area: parentVendor?.area || '',
            price: l.price,
            rating: parentVendor?.rating || 0,
            packageTier: (l.includes as string[])?.slice(0, 4).join(' · ') || '',
            likes: [],
            booked: false,
            amountPaid: 0,
          }
        }

        set({
          _coupleDbId: couple.id,
          _listingVendorMap: lvMap,
          onboardingComplete: true,
          onboardingData: onboardingData,
          ritualBoards: boards.length > 0 ? boards : [],
          vendors: Object.keys(vendorMap).length > 0 ? vendorMap : cloneVendors(),
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
      // Generate boards from onboarding
      const boards = generateBoardsFromOnboarding(data)

      // Save couple + boards to Supabase in background
      upsertCouple(_userId, data).then(async (coupleData) => {
        if (coupleData) {
          set({ _coupleDbId: coupleData.id })
          // Insert boards
          for (let i = 0; i < boards.length; i++) {
            await insertRitualBoard(coupleData.id, boards[i], i)
          }
          // Re-fetch boards to get DB IDs
          const dbBoards = await fetchRitualBoards(coupleData.id)
          if (dbBoards.length > 0) {
            set({ ritualBoards: dbBoards })
          }
        }
      })

      // Fetch live vendors for the explore feed
      fetchAllLiveVendors().then(liveVendors => {
        fetchAllListings().then(listings => {
          const vendorMap: Record<string, typeof mockVendors[string]> = {}
          const lvMap: Record<string, string> = {}
          const categoryCounts: Record<string, number> = {}
          for (const l of listings) {
            const parentVendor = liveVendors.find((v: Record<string, unknown>) => v.id === l.vendor_id)
            const cat = (l.category as string) || ''
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
            const code = `${cat} ${String(categoryCounts[cat]).padStart(3, '0')}`
            if (l.vendor_id) lvMap[l.id] = l.vendor_id as string
            vendorMap[l.id] = {
              id: l.id, code, name: parentVendor?.business_name || l.name,
              photo: (l.photos as string[])?.[0] || '', style: l.style || '',
              area: parentVendor?.area || '', price: l.price,
              rating: parentVendor?.rating || 0,
              packageTier: (l.includes as string[])?.slice(0, 4).join(' · ') || '',
              likes: [], booked: false, amountPaid: 0,
            }
          }
          if (Object.keys(vendorMap).length > 0) {
            set({ vendors: vendorMap, _listingVendorMap: lvMap })
          }
        })
      })

      set({
        onboardingComplete: true,
        onboardingData: data,
        ritualBoards: boards, // Use local boards until DB IDs arrive
        // Keep existing vendors — live vendor fetch will override when ready
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

  subscribe: (tier) => set({ subscription: tier }),

  getMaxTrials: () => maxTrialsForTier(get().subscription),

  selectVendor: (ritualId, categoryId, vendorId) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => c.id === categoryId ? { ...c, selectedVendorId: vendorId } : c) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { selectedVendorId: vendorId })
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, 'vendor_select', _userId, vendorId)
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
    set((s) => ({
      ritualBoards: s.ritualBoards.map((b) =>
        b.id === ritualId
          ? { ...b, categories: b.categories.map((c) => {
              if (c.id === categoryId) {
                newList = c.shortlistedVendorIds.filter((id) => id !== vendorId)
                return { ...c, shortlistedVendorIds: newList, selectedVendorId: c.selectedVendorId === vendorId ? null : c.selectedVendorId }
              }
              return c
            }) }
          : b
      ),
    }))
    if (_liveMode) {
      updateBoardCategory(categoryId, { shortlistedVendorIds: newList, selectedVendorId: undefined })
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
    if (_liveMode) {
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, alreadyLiked ? 'unlike' : 'like', _userId, vendorId)
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

  bookVendor: (vendorId, amount) => {
    const { _liveMode, _userId, _listingVendorMap } = get()
    set((s) => ({
      vendors: { ...s.vendors, [vendorId]: { ...s.vendors[vendorId], booked: true, amountPaid: amount } },
      milestoneProgress: { ...s.milestoneProgress, [vendorId]: 1 },
    }))
    if (_liveMode) {
      const vid = _listingVendorMap[vendorId]
      if (vid) trackEvent(vid, 'booking', _userId, vendorId, { amount })
    }
  },

  bookAllVendors: (ritualId) => {
    const state = get();
    const board = state.ritualBoards.find((b) => b.id === ritualId);
    if (!board) return;
    const updatedVendors = { ...state.vendors };
    const updatedProgress = { ...state.milestoneProgress };
    for (const cat of board.categories) {
      if (cat.selectedVendorId && !cat.removed) {
        const v = updatedVendors[cat.selectedVendorId];
        if (v && !v.booked) {
          const amount = Math.round(v.price * 0.04);
          updatedVendors[cat.selectedVendorId] = { ...v, booked: true, amountPaid: amount };
          updatedProgress[cat.selectedVendorId] = 1;
        }
      }
    }
    set({ vendors: updatedVendors, milestoneProgress: updatedProgress });
  },

  swapVendor: (ritualId, categoryId, newVendorId) =>
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
    })),

  completeMilestone: (vendorId, totalMilestones) =>
    set((s) => {
      const current = s.milestoneProgress[vendorId] || 0;
      if (current >= totalMilestones) return s;
      return { milestoneProgress: { ...s.milestoneProgress, [vendorId]: current + 1 } };
    }),

  updateBoardDates: (ritualId, dateStart, dateEnd, removeVendorIds) => {
    const { _liveMode } = get()
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
      if (vid) trackEvent(vid, 'trial_request', _userId, vendorId)
    }
  },

  acceptTrial: (ritualId, categoryId, vendorId) =>
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial || trial.status !== 'requested') return s;
      return {
        trialSessions: { ...s.trialSessions, [trialKey]: { ...trial, status: 'accepted' as const } },
      };
    }),

  proposeNewTrialTime: (ritualId, categoryId, vendorId, newDate, newTime) =>
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
    }),

  confirmReschedule: (ritualId, categoryId, vendorId) =>
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
    }),

  markTrialDone: (ritualId, categoryId, vendorId) =>
    set((s) => {
      const trialKey = `${ritualId}-${categoryId}-${vendorId}`;
      const trial = s.trialSessions[trialKey];
      if (!trial) return s;
      return {
        trialSessions: { ...s.trialSessions, [trialKey]: { ...trial, status: 'done' as const } },
      };
    }),

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
