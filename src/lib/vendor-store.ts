import { create } from 'zustand'
import { VendorState, VendorProfile, VendorPackage, VendorListing } from './vendor-types'
import { useStore } from './store'
import {
  mockVendorBookings, mockVendorTrials, mockVendorBidRequests,
  mockVendorNotifications, mockVendorReviews, mockVendorEarnings,
  getMockListingsForCategory,
  mockVendorAnalytics, generateMockAvailability,
} from './vendor-mock-data'
import {
  fetchVendor, upsertVendor, updateVendorFields,
  fetchVendorListings, insertListing, updateListingDb,
  fetchVendorAvailability, upsertAvailability,
} from './supabase-db'

interface LiveModeState {
  /** When true, all mutations persist to Supabase */
  _liveMode: boolean
  _userId: string | null
  _vendorDbId: string | null
  /** Maps local listing IDs to Supabase UUIDs */
  _listingIdMap: Record<string, string>
}

export const useVendorStore = create<VendorState & LiveModeState & {
  initLiveMode: (userId: string) => Promise<void>
}>((set, get) => ({
  // Live mode state
  _liveMode: false,
  _userId: null,
  _vendorDbId: null,
  _listingIdMap: {},

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
      const profile: VendorProfile = {
        businessName: vendor.business_name,
        category: vendor.category,
        city: vendor.city || 'Hyderabad',
        area: vendor.area || '',
        phone: vendor.phone || '',
        whatsapp: vendor.whatsapp || '',
        email: vendor.email || '',
        description: vendor.description || '',
        experience: parseInt(vendor.years_experience) || 0,
        teamSize: vendor.team_size || '',
        portfolioPhotos: vendor.portfolio_photos || [],
        rating: vendor.rating || 0,
        profileCompleteness: 0,
        categoryFields: vendor.category_fields || {},
      }

      // Fetch listings
      const dbListings = await fetchVendorListings(vendor.id)
      const listingIdMap: Record<string, string> = {}
      const listings: VendorListing[] = dbListings.map((l: Record<string, unknown>) => {
        const localId = `vl-${l.id}`
        listingIdMap[localId] = l.id as string
        return {
          id: localId,
          name: l.name as string,
          photos: (l.photos as string[]) || [],
          category: l.category as string,
          price: l.price as number,
          style: (l.style as string) || '',
          rituals: (l.rituals as string[]) || [],
          categoryFields: (l.category_fields as Record<string, string | string[]>) || {},
          includes: (l.includes as string[]) || [],
          createdAt: (l.created_at as string)?.split('T')[0] || '',
        }
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

      set({
        _vendorDbId: vendor.id,
        _listingIdMap: listingIdMap,
        vendorOnboardingComplete: vendor.onboarding_complete,
        vendorProfile: profile,
        vendorListings: listings,
        vendorAvailability: availability,
        // These don't exist in DB yet — show empty states
        vendorBookings: [],
        vendorTrials: [],
        vendorBidRequests: [],
        vendorNotifications: [],
        vendorReviews: [],
        vendorEarnings: [],
      })
    }
    // If no vendor record, user hasn't onboarded yet — state stays empty
  },

  completeVendorOnboarding: async (profile, packages) => {
    const { _liveMode, _userId } = get()
    console.log('[vendor-store] completeVendorOnboarding — liveMode:', _liveMode, 'userId:', _userId)

    if (_liveMode && _userId) {
      // Save vendor to Supabase FIRST so we have the DB ID for photo uploads
      const vendorData = await upsertVendor(_userId, profile, true)
      console.log('[vendor-store] upsertVendor result:', vendorData?.id || 'FAILED')
      if (vendorData) {
        set({ _vendorDbId: vendorData.id })
      }

      set({
        vendorOnboardingComplete: true,
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
        vendorOnboardingComplete: true,
        vendorProfile: profile,
        vendorPackages: packages,
        vendorListings: mockListings,
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

  submitBid: (bidId, price, note) =>
    set((s) => ({
      vendorBidRequests: s.vendorBidRequests.map((b) =>
        b.id === bidId ? { ...b, status: 'submitted' as const, bidPrice: price, bidNote: note } : b
      ),
    })),

  scheduleTrial: (trialId, date) =>
    set((s) => ({
      vendorTrials: s.vendorTrials.map((t) =>
        t.id === trialId ? { ...t, status: 'scheduled' as const, scheduledDate: date } : t
      ),
    })),

  markNotificationRead: (id) =>
    set((s) => ({
      vendorNotifications: s.vendorNotifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      vendorNotifications: s.vendorNotifications.map((n) => ({ ...n, read: true })),
    })),

  addListing: (listing) => {
    const { _liveMode, _vendorDbId } = get()

    // Update local state immediately
    set((s) => ({
      vendorListings: [...s.vendorListings, listing],
    }))

    // Persist in background
    if (_liveMode && _vendorDbId) {
      insertListing(_vendorDbId, listing).then(data => {
        if (data) {
          set(s => ({
            _listingIdMap: { ...s._listingIdMap, [listing.id]: data.id },
          }))
        }
      })
    }
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
    const { _liveMode, _userId } = get()

    set((s) => ({
      vendorProfile: s.vendorProfile ? { ...s.vendorProfile, ...updates } : null,
    }))

    if (_liveMode && _userId) {
      updateVendorFields(_userId, updates)
    }
  },
}))
