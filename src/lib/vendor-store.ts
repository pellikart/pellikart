import { create } from 'zustand'
import { VendorState, VendorProfile, VendorPackage } from './vendor-types'
import { useStore } from './store'
import {
  mockVendorBookings, mockVendorTrials, mockVendorBidRequests,
  mockVendorNotifications, mockVendorReviews, mockVendorEarnings,
  getMockListingsForCategory,
  mockVendorAnalytics, generateMockAvailability,
} from './vendor-mock-data'

export const useVendorStore = create<VendorState>((set) => ({
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

  completeVendorOnboarding: (profile, packages) => {
    // Generate mock listings based on the vendor's category
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

    // Seed mock trial requests in the main store so vendor side has something to act on
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
  },

  toggleDateBlock: (date, listingIds, blockedRanges) =>
    set((s) => {
      const current = s.vendorAvailability[date]
      if (current?.status === 'booked') return s
      const isCurrentlyBlocked = current?.status === 'blocked'
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

  addListing: (listing) =>
    set((s) => ({
      vendorListings: [...s.vendorListings, listing],
    })),

  updateListing: (listing) =>
    set((s) => ({
      vendorListings: s.vendorListings.map((l) => l.id === listing.id ? listing : l),
    })),

  updateVendorProfile: (updates) =>
    set((s) => ({
      vendorProfile: s.vendorProfile ? { ...s.vendorProfile, ...updates } : null,
    })),
}))
