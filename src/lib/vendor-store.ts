import { create } from 'zustand'
import { VendorState, VendorProfile, VendorPackage, VendorListing, resolveVenueSlots } from './vendor-types'
import { useStore } from './store'
import {
  mockVendorBookings, mockVendorTrials, mockVendorBidRequests,
  mockVendorNotifications, mockVendorReviews, mockVendorEarnings,
  getMockListingsForCategory,
  mockVendorAnalytics, generateMockAvailability,
} from './vendor-mock-data'
import {
  fetchVendor, upsertVendor, updateVendorFields, setVendorLiveById,
  fetchVendorById, upsertVendorById, updateVendorFieldsById,
  fetchVendorListings, insertListing, updateListingDb, deleteListingDb,
  fetchVendorAvailability, upsertAvailability,
  fetchVendorTrials as fetchVendorTrialsDb, acceptTrialDb, proposeNewTrialTimeDb, declineTrialDb,
  fetchVendorBidsDb, submitBidDb,
  fetchVendorBookingsDb, fetchVendorReviewsDb, fetchVendorEarningsDb,
  fetchNotifications, markNotificationReadDb, markAllNotificationsReadDb,
  fetchMilestones, completeMilestoneDb,
  fetchVendorPackages, insertPackage, updatePackageDb, deletePackageDb,
  respondToReviewDb,
  createEarning,
  type TrialRow, type BidRow,
} from './supabase-db'

/** Map a raw vendor_listings DB row into the app's VendorListing shape.
 *  Shared by initLiveMode (owner) and initAdminEditMode (admin editing). Empty
 *  jsonb defaults ({} / []) come back as undefined so the category editors fall
 *  back to their `empty*()` shapes rather than a malformed empty object. */
function mapDbListingToVendorListing(l: Record<string, unknown>): VendorListing {
  const obj = (v: unknown): unknown =>
    v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0 ? v : undefined
  const arr = (v: unknown): unknown => (Array.isArray(v) && v.length > 0 ? v : undefined)
  const rawSizes = l.sizes
  const sizes = Array.isArray(rawSizes) && rawSizes.length > 0
    ? (rawSizes as Array<{ widthFt: number; heightFt: number; price: number }>)
    : undefined
  return {
    id: `vl-${l.id}`,
    name: l.name as string,
    photos: (l.photos as string[]) || [],
    videos: arr(l.videos) as string[] | undefined,
    coverPhotoIndex: (l.cover_photo_index as number) ?? 0,
    category: l.category as string,
    price: l.price as number,
    sizes,
    style: (l.style as string) || '',
    rituals: (l.rituals as string[]) || [],
    categoryFields: (l.category_fields as Record<string, string | string[]>) || {},
    includes: (l.includes as string[]) || [],
    createdAt: (l.created_at as string)?.split('T')[0] || '',
    bundledListings: (l.bundled_listings as string[]) || [],
    bundleMandatory: (l.bundle_mandatory as boolean) || false,
    // Category-specific data — must round-trip or the vendor loses their
    // pricing on refresh (and a later save would blank it in the DB).
    venueLocation: (() => { const v = l.venue_location as import('./vendor-types').VenueLocation | null; return v && v.address ? v : undefined })(),
    venuePricingModels: arr(l.venue_pricing_models) as import('./vendor-types').VenuePricingModel[] | undefined,
    hourlyPricing: arr(l.hourly_pricing) as { hours: number; price: number }[] | undefined,
    platePackages: arr(l.plate_packages) as import('./vendor-types').PlatePackage[] | undefined,
    slots: resolveVenueSlots(l.plate_slots, l.plate_packages),
    paidRooms: arr(l.paid_rooms) as import('./vendor-types').PaidRoom[] | undefined,
    inHouseDecor: (() => { const d = l.in_house_decor as import('./vendor-types').InHouseDecor | null; return d && typeof d.compulsory === 'boolean' ? d : undefined })(),
    menu: arr(l.menu) as import('./vendor-types').MenuSection[] | undefined,
    menuPhotos: arr(l.menu_photos) as string[] | undefined,
    menuMode: (l.menu_mode as import('./vendor-types').MenuMode) || undefined,
    rateCard: obj(l.rate_card) as import('./vendor-category-config').PhotographyRateCard | undefined,
    availableHours: arr(l.available_hours) as number[] | undefined,
    photographyPricingModels: arr(l.photography_pricing_models) as import('./vendor-category-config').PhotographyPricingModel[] | undefined,
    guestPackages: obj(l.guest_packages) as import('./vendor-category-config').PhotographyGuestPackages | undefined,
    guestPackagePhotographers: obj(l.guest_package_photographers) as Record<string, number> | undefined,
    guestPackageVideographers: obj(l.guest_package_videographers) as Record<string, number> | undefined,
    mehendiPricing: obj(l.mehendi_pricing) as import('./vendor-category-config').MehendiPricing | undefined,
    makeupPricing: obj(l.makeup_pricing) as import('./vendor-category-config').MakeupPricing | undefined,
    sareeDrapingPricing: obj(l.saree_draping_pricing) as import('./vendor-category-config').SareeDrapingPricing | undefined,
    hairStylingPricing: obj(l.hair_styling_pricing) as import('./vendor-category-config').HairStylingPricing | undefined,
    transportIncluded: (l.transport_included as boolean | null) ?? undefined,
    transportExtra: (l.transport_extra as number | null) ?? undefined,
  }
}

/** Map a raw vendors DB row into the app's VendorProfile shape. Shared by
 *  initLiveMode and initAdminEditMode. */
function mapDbVendorToProfile(vendor: Record<string, unknown>): VendorProfile {
  return {
    businessName: vendor.business_name as string,
    category: vendor.category as string,
    city: (vendor.city as string) || 'Hyderabad',
    area: (vendor.area as string) || '',
    phone: (vendor.phone as string) || '',
    secondaryPhone: (vendor.secondary_phone as string) || undefined,
    whatsapp: (vendor.whatsapp as string) || '',
    email: (vendor.email as string) || '',
    instagram: (vendor.instagram as string) || undefined,
    description: (vendor.description as string) || '',
    experience: parseInt(vendor.years_experience as string) || 0,
    teamSize: (vendor.team_size as string) || '',
    portfolioPhotos: Array.isArray(vendor.portfolio_photos) ? vendor.portfolio_photos as string[] : [],
    portfolioVideos: Array.isArray(vendor.portfolio_videos) ? vendor.portfolio_videos as string[] : undefined,
    rating: (vendor.rating as number) || 0,
    categoryFields: (vendor.category_fields as Record<string, string | string[]>) || {},
  }
}

interface LiveModeState {
  /** When true, all mutations persist to Supabase */
  _liveMode: boolean
  /** When true, this store is editing an admin-created vendor (user_id NULL).
   *  Profile writes are keyed by vendor row id instead of user_id. */
  _adminMode: boolean
  _userId: string | null
  _vendorDbId: string | null
  /** Maps local listing IDs to Supabase UUIDs */
  _listingIdMap: Record<string, string>
  /** Maps local package IDs to Supabase UUIDs */
  _packageIdMap: Record<string, string>
  /** Maps booking ID → ordered milestone DB IDs (so we can mark them complete) */
  _bookingMilestones: Record<string, string[]>
}

export const useVendorStore = create<VendorState & LiveModeState & {
  initLiveMode: (userId: string) => Promise<void>
  initAdminEditMode: (vendorId: string) => Promise<void>
}>((set, get) => ({
  // Live mode state
  _liveMode: false,
  _adminMode: false,
  _userId: null,
  _vendorDbId: null,
  _listingIdMap: {},
  _packageIdMap: {},
  _bookingMilestones: {},

  // App state
  vendorOnboardingComplete: false,
  vendorProfile: null,
  vendorPackages: [],
  vendorDesigns: [],
  vendorListings: [],
  vendorAvailability: {},
  vendorBookings: [],
  vendorTrials: [],
  vendorBidRequests: [],
  vendorNotifications: [],
  vendorReviews: [],
  vendorEarnings: [],
  vendorAnalytics: mockVendorAnalytics,

  /**
   * Initialize live mode — fetch existing vendor data from Supabase.
   * Called from LiveApp after auth succeeds.
   */
  initLiveMode: async (userId: string) => {
    set({ _liveMode: true, _userId: userId })

    const vendor = await fetchVendor(userId)
    if (vendor) {
      // Returning vendor — restore their data
      const profile = mapDbVendorToProfile(vendor)

      // Fetch listings
      const dbListings = await fetchVendorListings(vendor.id)
      const listingIdMap: Record<string, string> = {}
      const listings: VendorListing[] = dbListings.map((l: Record<string, unknown>) => {
        listingIdMap[`vl-${l.id}`] = l.id as string
        return mapDbListingToVendorListing(l)
      })

      // Fetch availability
      const dbAvail = await fetchVendorAvailability(vendor.id)
      const availability: VendorState['vendorAvailability'] = {}
      for (const a of dbAvail) {
        availability[a.date] = {
          status: a.status,
          listingIds: a.listing_ids || [],
          blockedRanges: a.blocked_ranges || [],
        }
      }

      // Fetch trials, bids, bookings, reviews, earnings, notifications, packages from DB
      const [dbTrials, dbBids, dbBookings, dbReviews, dbEarnings, dbNotifications, dbPackages] = await Promise.all([
        fetchVendorTrialsDb(vendor.id),
        fetchVendorBidsDb(vendor.id),
        fetchVendorBookingsDb(vendor.id),
        fetchVendorReviewsDb(vendor.id),
        fetchVendorEarningsDb(vendor.id),
        fetchNotifications(userId),
        fetchVendorPackages(vendor.id),
      ])

      // Map DB trials to vendor store format
      const mappedTrials = dbTrials.map((t) => {
        const ext = t as TrialRow & { decline_reason?: string | null }
        return {
          id: t.id,
          coupleNames: 'Couple', // We don't have couple names yet in the trial row
          eventName: t.ritual_name,
          category: t.category_label,
          status: (t.status === 'requested' || t.status === 'rescheduled' ? 'pending'
            : t.status === 'done' ? 'completed'
            : t.status === 'accepted' || t.status === 'confirmed' ? 'scheduled'
            : t.status === 'declined' ? 'declined'
            : 'pending') as 'pending' | 'scheduled' | 'completed' | 'declined',
          requestedDate: t.requested_date,
          scheduledDate: t.scheduled_date || undefined,
          vendorProposedDate: t.vendor_proposed_date || undefined,
          vendorProposedTime: t.vendor_proposed_time || undefined,
          declineReason: ext.decline_reason || undefined,
        }
      })

      // Map DB bids to vendor store format. decor_brief is joined in fetchVendorBidsDb.
      const mappedBids = dbBids.map((b: BidRow) => ({
        id: b.id,
        coupleNames: 'Couple',
        eventName: b.ritual_name,
        category: b.category_label,
        uploadedImage: b.uploaded_image,
        status: b.status,
        bidPrice: b.bid_price || undefined,
        bidNote: b.bid_note || undefined,
        decorBrief: b.decor_brief ?? undefined,
      }))

      // Fetch milestones for every booking so we can persist milestone marking
      const bookingMilestoneArrays = await Promise.all(
        dbBookings.map((b: Record<string, unknown>) => fetchMilestones(b.id as string))
      )
      const bookingMilestones: Record<string, string[]> = {}

      // Sum all earnings (slot + milestone + final) per booking so totalPaid
      // and remainingBalance reflect actual money received, not just the slot deposit.
      const earningsByBooking: Record<string, number> = {}
      for (const e of dbEarnings) {
        const bid = ((e as Record<string, unknown>).booking_id as string) || ''
        if (!bid) continue
        earningsByBooking[bid] = (earningsByBooking[bid] || 0) + (((e as Record<string, unknown>).amount as number) || 0)
      }

      // Map DB bookings — compute actual milestone progress from real rows
      const mappedBookings = dbBookings.map((b: Record<string, unknown>, idx: number) => {
        const ms = bookingMilestoneArrays[idx]
        const bookingId = b.id as string
        bookingMilestones[bookingId] = ms.map(m => (m as Record<string, unknown>).id as string)
        const completed = ms.filter(m => (m as Record<string, unknown>).is_complete).length
        const total = ms.length || 5
        const totalValue = (b.total_value as number) || 0
        const slotAmount = (b.slot_amount as number) || 0
        const paid = earningsByBooking[bookingId] ?? slotAmount
        return {
          id: bookingId,
          coupleNames: '',
          eventName: (b.category_label as string) || '',
          eventDate: (b.booked_at as string)?.split('T')[0] || '',
          category: (b.category_label as string) || '',
          packageTier: '',
          totalValue,
          slotAmountPaid: slotAmount,
          totalPaid: paid,
          remainingBalance: Math.max(0, totalValue - paid),
          milestoneProgress: completed || (b.status === 'active' ? 1 : completed),
          totalMilestones: total,
          status: (b.status as 'active' | 'completed' | 'cancelled') || 'active',
          phone: '',
          whatsapp: '',
        }
      })

      // Map DB reviews
      const mappedReviews = dbReviews.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        coupleNames: (r.couple_names as string) || '',
        eventName: (r.event_name as string) || '',
        eventDate: (r.event_date as string) || '',
        rating: (r.rating as number) || 5,
        text: (r.text as string) || '',
        datePosted: (r.created_at as string)?.split('T')[0] || '',
        vendorResponse: (r.vendor_response as string) || undefined,
        vendorRespondedAt: (r.vendor_responded_at as string) || undefined,
      }))

      // Map DB packages
      const packageIdMap: Record<string, string> = {}
      const mappedPackages = dbPackages.map((p) => {
        const localId = `vp-${p.id}`
        packageIdMap[localId] = p.id
        return {
          id: localId,
          name: p.name,
          price: p.price,
          features: p.features || [],
          capacity: p.capacity || '',
        }
      })

      // Map DB earnings
      const mappedEarnings = dbEarnings.map((e: Record<string, unknown>) => ({
        id: e.id as string,
        bookingId: (e.booking_id as string) || '',
        coupleNames: (e.couple_names as string) || '',
        eventName: (e.event_name as string) || '',
        amount: (e.amount as number) || 0,
        type: (e.type as 'slot' | 'milestone' | 'final') || 'slot',
        date: (e.created_at as string)?.split('T')[0] || '',
      }))

      // Map DB notifications
      const mappedNotifications = dbNotifications.map((n: Record<string, unknown>) => ({
        id: n.id as string,
        type: (n.type as string) || 'system',
        title: (n.title as string) || '',
        body: (n.body as string) || '',
        timestamp: (n.created_at as string) || '',
        read: (n.is_read as boolean) || false,
        link: (n.deep_link as string) || undefined,
      }))

      set({
        _vendorDbId: vendor.id,
        _listingIdMap: listingIdMap,
        _packageIdMap: packageIdMap,
        _bookingMilestones: bookingMilestones,
        vendorOnboardingComplete: vendor.onboarding_complete,
        vendorProfile: profile,
        vendorPackages: mappedPackages,
        vendorListings: listings,
        vendorAvailability: availability,
        vendorBookings: mappedBookings,
        vendorTrials: mappedTrials,
        vendorBidRequests: mappedBids,
        vendorNotifications: mappedNotifications,
        vendorReviews: mappedReviews,
        vendorEarnings: mappedEarnings,
      })
    }
    // If no vendor record, user hasn't onboarded yet — state stays empty
  },

  // Admin editing a pre-built (user_id NULL) vendor. Points the whole vendor UI
  // at an existing vendors row by id. Reuses every downstream write path (which
  // key on _vendorDbId); only the vendors-row profile writes re-key by id, via
  // the _adminMode flag checked in completeVendorOnboarding / updateVendorProfile.
  initAdminEditMode: async (vendorId: string) => {
    set({ _liveMode: true, _adminMode: true, _userId: null, _vendorDbId: vendorId })

    const vendor = await fetchVendorById(vendorId)
    if (!vendor) {
      console.error('[vendor-store] initAdminEditMode: vendor not found', vendorId)
      return
    }

    const profile = mapDbVendorToProfile(vendor)

    const [dbListings, dbAvail, dbPackages] = await Promise.all([
      fetchVendorListings(vendorId),
      fetchVendorAvailability(vendorId),
      fetchVendorPackages(vendorId),
    ])

    const listingIdMap: Record<string, string> = {}
    const listings: VendorListing[] = dbListings.map((l: Record<string, unknown>) => {
      listingIdMap[`vl-${l.id}`] = l.id as string
      return mapDbListingToVendorListing(l)
    })

    const availability: VendorState['vendorAvailability'] = {}
    for (const a of dbAvail) {
      availability[a.date] = {
        status: a.status,
        listingIds: a.listing_ids || [],
        blockedRanges: a.blocked_ranges || [],
      }
    }

    const packageIdMap: Record<string, string> = {}
    const mappedPackages = dbPackages.map((p) => {
      const localId = `vp-${p.id}`
      packageIdMap[localId] = p.id
      return { id: localId, name: p.name, price: p.price, features: p.features || [], capacity: p.capacity || '' }
    })

    // Couple-interaction data (bookings/trials/bids/reviews/earnings/notifications)
    // never applies to an admin-created vendor — leave those arrays empty.
    set({
      _listingIdMap: listingIdMap,
      _packageIdMap: packageIdMap,
      vendorOnboardingComplete: vendor.onboarding_complete,
      vendorProfile: profile,
      vendorPackages: mappedPackages,
      vendorListings: listings,
      vendorAvailability: availability,
      vendorBookings: [],
      vendorTrials: [],
      vendorBidRequests: [],
      vendorNotifications: [],
      vendorReviews: [],
      vendorEarnings: [],
    })
  },

  completeVendorOnboarding: async (profile, packages, markComplete = true) => {
    const { _liveMode, _adminMode, _userId, _vendorDbId } = get()
    console.log('[vendor-store] completeVendorOnboarding — liveMode:', _liveMode, 'adminMode:', _adminMode, 'userId:', _userId)

    // Admin edit mode: the shell vendor row already exists (created before the
    // editor opened), so update it by id rather than upserting by user_id.
    if (_liveMode && _adminMode && _vendorDbId) {
      await upsertVendorById(_vendorDbId, profile)

      const packageIdMap: Record<string, string> = {}
      for (let i = 0; i < packages.length; i++) {
        const p = packages[i]
        const row = await insertPackage(_vendorDbId, p, i)
        if (row) packageIdMap[p.id] = row.id
      }

      set({
        _packageIdMap: packageIdMap,
        vendorOnboardingComplete: markComplete,
        vendorProfile: profile,
        vendorPackages: packages,
        vendorListings: [],
        vendorAvailability: {},
        vendorBookings: [],
        vendorTrials: [],
        vendorBidRequests: [],
        vendorNotifications: [],
        vendorReviews: [],
        vendorEarnings: [],
      })
      return
    }

    if (_liveMode && _userId) {
      // Save vendor to Supabase FIRST so we have the DB ID for photo uploads.
      // Start NOT live: the vendor is only flipped live (via setVendorLive) once
      // their first listing row is confirmed saved — so we never advertise a
      // vendor to couples before a discoverable listing actually exists.
      const vendorData = await upsertVendor(_userId, profile, false)
      console.log('[vendor-store] upsertVendor result:', vendorData?.id || 'FAILED')
      if (vendorData) {
        set({ _vendorDbId: vendorData.id })
      }

      // Persist initial packages, capturing DB IDs
      const packageIdMap: Record<string, string> = {}
      if (vendorData && packages.length > 0) {
        for (let i = 0; i < packages.length; i++) {
          const p = packages[i]
          const row = await insertPackage(vendorData.id, p, i)
          if (row) packageIdMap[p.id] = row.id
        }
      }

      set({
        _packageIdMap: packageIdMap,
        vendorOnboardingComplete: markComplete,
        vendorProfile: profile,
        vendorPackages: packages,
        vendorListings: [],
        vendorAvailability: {},
        vendorBookings: [],
        vendorTrials: [],
        vendorBidRequests: [],
        vendorNotifications: [],
        vendorReviews: [],
        vendorEarnings: [],
      })
    } else {
      // Demo mode — use mock data
      const mockListings = getMockListingsForCategory(profile.category)
      set({
        vendorOnboardingComplete: markComplete,
        vendorProfile: profile,
        vendorPackages: packages,
        vendorListings: markComplete ? mockListings : [],
        vendorAvailability: generateMockAvailability(),
        vendorBookings: mockVendorBookings,
        vendorTrials: mockVendorTrials,
        vendorBidRequests: mockVendorBidRequests,
        vendorNotifications: mockVendorNotifications,
        vendorReviews: mockVendorReviews,
        vendorEarnings: mockVendorEarnings,
      })

      // Seed mock trial requests in demo mode
      useStore.setState((s) => ({
        trialSessions: {
          ...s.trialSessions,
          'r-wedding-c-wed-photo-v-photo-1': {
            status: 'requested' as const,
            requestedDate: '2026-04-10',
            requestedTime: '11:00 AM',
            scheduledDate: '2026-04-10',
            scheduledTime: '11:00 AM',
            vendorId: 'v-photo-1',
            categoryLabel: 'Photography',
            ritualName: 'Wedding',
          },
          'r-engagement-c-eng-photo-v-photo-2': {
            status: 'requested' as const,
            requestedDate: '2026-04-12',
            requestedTime: '3:00 PM',
            scheduledDate: '2026-04-12',
            scheduledTime: '3:00 PM',
            vendorId: 'v-photo-2',
            categoryLabel: 'Photography',
            ritualName: 'Engagement',
          },
        },
      }))
    }
  },

  toggleDateBlock: (date, listingIds, blockedRanges) =>
    set((s) => {
      const current = s.vendorAvailability[date]
      if (current?.status === 'booked') return s
      const isCurrentlyBlocked = current?.status === 'blocked'
      const newStatus = isCurrentlyBlocked ? 'available' as const : 'blocked' as const

      // Persist in background
      if (s._liveMode && s._vendorDbId) {
        upsertAvailability(s._vendorDbId, date, newStatus, listingIds, blockedRanges)
      }

      return {
        vendorAvailability: {
          ...s.vendorAvailability,
          [date]: isCurrentlyBlocked
            ? { status: 'available' as const, listingIds: [], blockedRanges: [] }
            : { status: 'blocked' as const, listingIds, blockedRanges },
        },
      }
    }),

  submitBid: (bidId, price, note) => {
    const { _liveMode } = get()
    set((s) => ({
      vendorBidRequests: s.vendorBidRequests.map((b) =>
        b.id === bidId ? { ...b, status: 'submitted' as const, bidPrice: price, bidNote: note } : b
      ),
    }))
    if (_liveMode) {
      submitBidDb(bidId, price, note)
    }
  },

  scheduleTrial: (trialId, _date) => {
    const { _liveMode } = get()
    set((s) => ({
      vendorTrials: s.vendorTrials.map((t) =>
        t.id === trialId ? { ...t, status: 'scheduled' as const, scheduledDate: _date } : t
      ),
    }))
    if (_liveMode) {
      // scheduleTrial on vendor side = accepting the trial
      acceptTrialDb(trialId)
    }
  },

  proposeTrialNewTime: (trialId, newDate, newTime) => {
    const { _liveMode } = get()
    set((s) => ({
      vendorTrials: s.vendorTrials.map((t) =>
        t.id === trialId
          ? { ...t, status: 'pending' as const, scheduledDate: newDate, vendorProposedDate: newDate, vendorProposedTime: newTime }
          : t
      ),
    }))
    if (_liveMode) {
      proposeNewTrialTimeDb(trialId, newDate, newTime)
    }
  },

  declineTrial: (trialId, reason) => {
    const { _liveMode } = get()
    set((s) => ({
      vendorTrials: s.vendorTrials.map((t) =>
        t.id === trialId ? { ...t, status: 'declined' as const, declineReason: reason || undefined } : t
      ),
    }))
    if (_liveMode) {
      declineTrialDb(trialId, reason)
    }
  },

  markNotificationRead: (id) => {
    const { _liveMode } = get()
    set((s) => ({
      vendorNotifications: s.vendorNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
    if (_liveMode) markNotificationReadDb(id)
  },

  markAllNotificationsRead: () => {
    const { _liveMode, _userId } = get()
    set((s) => ({
      vendorNotifications: s.vendorNotifications.map((n) => ({ ...n, read: true })),
    }))
    if (_liveMode && _userId) markAllNotificationsReadDb(_userId)
  },

  addNotification: (notification) => {
    set((s) => ({ vendorNotifications: [notification, ...s.vendorNotifications] }))
  },

  addListing: async (listing) => {
    const { _liveMode, _vendorDbId } = get()

    // Optimistically add to local state so the UI updates immediately.
    set((s) => ({
      vendorListings: [...s.vendorListings, listing],
    }))

    if (_liveMode) {
      // Live mode: the listing only counts once the DB row is confirmed. If the
      // write fails (or there's no vendor DB id), roll back the optimistic add
      // and report failure so the caller can surface an error instead of
      // silently stranding the vendor as "live" with no discoverable listing.
      if (!_vendorDbId) {
        set((s) => ({ vendorListings: s.vendorListings.filter((l) => l.id !== listing.id) }))
        console.error('[vendor-store] addListing: no _vendorDbId in live mode')
        return false
      }
      const data = await insertListing(_vendorDbId, listing)
      if (!data) {
        set((s) => ({ vendorListings: s.vendorListings.filter((l) => l.id !== listing.id) }))
        return false
      }
      set((s) => ({
        _listingIdMap: { ...s._listingIdMap, [listing.id]: data.id },
      }))
      // A confirmed listing means the vendor is discoverable — flip them live
      // right here so visibility never depends on a later setVendorLive landing.
      // Best-effort: the listing is already saved, so we still report success
      // even if this flip fails (it's retried by the onboarding flow too).
      await setVendorLiveById(_vendorDbId)
    }

    return true
  },

  updateListing: (listing) => {
    const { _liveMode, _listingIdMap } = get()

    set((s) => ({
      vendorListings: s.vendorListings.map((l) => l.id === listing.id ? listing : l),
    }))

    if (_liveMode) {
      const dbId = _listingIdMap[listing.id]
      if (dbId) updateListingDb(dbId, listing)
    }
  },

  updateVendorProfile: (updates) => {
    const { _liveMode, _adminMode, _userId, _vendorDbId } = get()

    set((s) => ({
      vendorProfile: s.vendorProfile ? { ...s.vendorProfile, ...updates } : null,
    }))

    if (_liveMode && _adminMode && _vendorDbId) {
      updateVendorFieldsById(_vendorDbId, updates)
    } else if (_liveMode && _userId) {
      updateVendorFields(_userId, updates)
    }
  },

  deleteListing: (listingId) => {
    const { _liveMode, _listingIdMap } = get()
    const dbId = _listingIdMap[listingId]
    set((s) => {
      const { [listingId]: _, ...remainingMap } = s._listingIdMap
      return {
        vendorListings: s.vendorListings.filter((l) => l.id !== listingId),
        _listingIdMap: remainingMap,
      }
    })
    if (_liveMode && dbId) {
      deleteListingDb(dbId)
    }
  },

  addPackage: (pkg) => {
    const { _liveMode, _vendorDbId } = get()
    set((s) => ({ vendorPackages: [...s.vendorPackages, pkg] }))
    if (_liveMode && _vendorDbId) {
      insertPackage(_vendorDbId, pkg, get().vendorPackages.length - 1).then(row => {
        if (row) {
          set(s => ({ _packageIdMap: { ...s._packageIdMap, [pkg.id]: row.id } }))
        }
      })
    }
  },

  updatePackage: (pkg) => {
    const { _liveMode, _packageIdMap } = get()
    set((s) => ({
      vendorPackages: s.vendorPackages.map(p => p.id === pkg.id ? pkg : p),
    }))
    if (_liveMode) {
      const dbId = _packageIdMap[pkg.id]
      if (dbId) updatePackageDb(dbId, pkg)
    }
  },

  deletePackage: (packageId) => {
    const { _liveMode, _packageIdMap } = get()
    const dbId = _packageIdMap[packageId]
    set((s) => {
      const { [packageId]: _, ...remainingMap } = s._packageIdMap
      return {
        vendorPackages: s.vendorPackages.filter(p => p.id !== packageId),
        _packageIdMap: remainingMap,
      }
    })
    if (_liveMode && dbId) deletePackageDb(dbId)
  },

  completeBookingMilestone: (bookingId) => {
    const { _liveMode, _vendorDbId, _bookingMilestones } = get()
    const booking = get().vendorBookings.find(b => b.id === bookingId)
    if (!booking || booking.milestoneProgress >= booking.totalMilestones) return

    const nextIndex = booking.milestoneProgress
    const nonSlotMilestones = Math.max(1, booking.totalMilestones - 1)
    // Even split of (total - slot) across the non-slot milestones.
    const paymentAmount = nextIndex === 0
      ? 0  // shouldn't happen (slot is auto-completed at booking), but guard anyway
      : Math.round((booking.totalValue - booking.slotAmountPaid) / nonSlotMilestones)
    const isFinal = nextIndex === booking.totalMilestones - 1
    const earningType: 'milestone' | 'final' = isFinal ? 'final' : 'milestone'

    // Update local state: advance milestone, increment totalPaid, decrement remainingBalance.
    set((s) => ({
      vendorBookings: s.vendorBookings.map(b => {
        if (b.id !== bookingId) return b
        const newPaid = b.totalPaid + paymentAmount
        return {
          ...b,
          milestoneProgress: b.milestoneProgress + 1,
          totalPaid: newPaid,
          remainingBalance: Math.max(0, b.totalValue - newPaid),
        }
      }),
    }))

    if (_liveMode) {
      const milestoneIds = _bookingMilestones[bookingId]
      if (milestoneIds && milestoneIds[nextIndex]) {
        completeMilestoneDb(milestoneIds[nextIndex])
      }
      if (paymentAmount > 0 && _vendorDbId) {
        createEarning(_vendorDbId, bookingId, booking.coupleNames, booking.eventName, paymentAmount, earningType).then(row => {
          if (row) {
            const r = row as Record<string, unknown>
            set(s => ({
              vendorEarnings: [
                {
                  id: r.id as string,
                  bookingId,
                  coupleNames: (r.couple_names as string) || booking.coupleNames,
                  eventName: (r.event_name as string) || booking.eventName,
                  amount: (r.amount as number) || paymentAmount,
                  type: ((r.type as 'slot' | 'milestone' | 'final') || earningType),
                  date: ((r.created_at as string) || new Date().toISOString()).split('T')[0],
                },
                ...s.vendorEarnings,
              ],
            }))
          }
        })
      }
    } else if (paymentAmount > 0) {
      // Demo mode — still reflect the payment in the local earnings list
      set(s => ({
        vendorEarnings: [
          {
            id: `ve-local-${Date.now()}`,
            bookingId,
            coupleNames: booking.coupleNames,
            eventName: booking.eventName,
            amount: paymentAmount,
            type: earningType,
            date: new Date().toISOString().split('T')[0],
          },
          ...s.vendorEarnings,
        ],
      }))
    }
  },

  respondToReview: (reviewId, response) => {
    const { _liveMode } = get()
    const now = new Date().toISOString()
    set((s) => ({
      vendorReviews: s.vendorReviews.map(r =>
        r.id === reviewId ? { ...r, vendorResponse: response || undefined, vendorRespondedAt: response ? now : undefined } : r
      ),
    }))
    if (_liveMode) {
      respondToReviewDb(reviewId, response)
    }
  },
}))
