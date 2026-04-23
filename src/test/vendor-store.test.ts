import { describe, it, expect, beforeEach } from 'vitest'
import { useVendorStore } from '@/lib/vendor-store'
import type { VendorProfile, VendorPackage, VendorListing } from '@/lib/vendor-types'

const mockProfile: VendorProfile = {
  businessName: 'Test Studio',
  category: 'Photography',
  city: 'Hyderabad',
  area: 'Jubilee Hills',
  phone: '+919876543210',
  whatsapp: '+919876543210',
  email: 'test@studio.com',
  description: 'Best wedding photography',
  experience: 5,
  teamSize: '2-5',
  portfolioPhotos: [],
  rating: 0,
  profileCompleteness: 70,
  categoryFields: { shootStyles: ['Candid', 'Cinematic'] },
}

const mockPackages: VendorPackage[] = [
  { id: 'pkg-1', name: 'Basic', price: 50000, features: ['100 photos'], capacity: 'Half day' },
]

describe('Vendor Store', () => {
  beforeEach(() => {
    useVendorStore.setState({
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
      _liveMode: false,
      _userId: null,
      _vendorDbId: null,
      _listingIdMap: {},
    })
  })

  it('completes vendor onboarding in demo mode', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)
    const state = useVendorStore.getState()
    expect(state.vendorOnboardingComplete).toBe(true)
    expect(state.vendorProfile?.businessName).toBe('Test Studio')
    expect(state.vendorProfile?.category).toBe('Photography')
    expect(state.vendorListings.length).toBeGreaterThan(0)
  })

  it('stores category fields from onboarding', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)
    const fields = useVendorStore.getState().vendorProfile?.categoryFields
    expect(fields?.shootStyles).toContain('Candid')
    expect(fields?.shootStyles).toContain('Cinematic')
  })

  it('adds a listing', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)
    const initialCount = useVendorStore.getState().vendorListings.length

    const listing: VendorListing = {
      id: 'vl-test-1',
      name: 'Test Listing',
      photos: ['/photo1.jpg'],
      category: 'Photography',
      price: 150000,
      style: 'Candid + Cinematic',
      rituals: ['Pelli (Wedding)', 'Reception'],
      categoryFields: { coverageType: 'Photo + Video' },
      includes: ['Candid Photos', 'Drone Shots', 'Album'],
      createdAt: '2026-04-20',
    }

    useVendorStore.getState().addListing(listing)
    expect(useVendorStore.getState().vendorListings.length).toBe(initialCount + 1)

    const added = useVendorStore.getState().vendorListings.find(l => l.id === 'vl-test-1')
    expect(added?.name).toBe('Test Listing')
    expect(added?.rituals).toContain('Pelli (Wedding)')
    expect(added?.includes).toContain('Drone Shots')
  })

  it('updates a listing', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)

    const listing: VendorListing = {
      id: 'vl-test-2',
      name: 'Original',
      photos: [],
      category: 'Photography',
      price: 100000,
      style: 'Traditional',
      includes: [],
      createdAt: '2026-04-20',
    }
    useVendorStore.getState().addListing(listing)

    useVendorStore.getState().updateListing({ ...listing, name: 'Updated', price: 200000 })
    const updated = useVendorStore.getState().vendorListings.find(l => l.id === 'vl-test-2')
    expect(updated?.name).toBe('Updated')
    expect(updated?.price).toBe(200000)
  })

  it('toggles date blocking', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)

    // Block a date
    useVendorStore.getState().toggleDateBlock('2026-12-15', [], [])
    expect(useVendorStore.getState().vendorAvailability['2026-12-15']?.status).toBe('blocked')

    // Unblock it
    useVendorStore.getState().toggleDateBlock('2026-12-15', [], [])
    expect(useVendorStore.getState().vendorAvailability['2026-12-15']?.status).toBe('available')
  })

  it('does not unblock booked dates', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)

    // Manually set a date as booked
    useVendorStore.setState({
      vendorAvailability: {
        '2026-12-20': { status: 'booked', listingIds: [], blockedRanges: [] },
      },
    })

    // Try to toggle — should not change
    useVendorStore.getState().toggleDateBlock('2026-12-20', [], [])
    expect(useVendorStore.getState().vendorAvailability['2026-12-20']?.status).toBe('booked')
  })

  it('updates vendor profile', () => {
    useVendorStore.getState().completeVendorOnboarding(mockProfile, mockPackages)

    useVendorStore.getState().updateVendorProfile({ businessName: 'New Name', area: 'Madhapur' })
    expect(useVendorStore.getState().vendorProfile?.businessName).toBe('New Name')
    expect(useVendorStore.getState().vendorProfile?.area).toBe('Madhapur')
    // Other fields unchanged
    expect(useVendorStore.getState().vendorProfile?.category).toBe('Photography')
  })

  it('marks notifications as read', () => {
    useVendorStore.setState({
      vendorNotifications: [
        { id: 'n1', type: 'booking', title: 'New booking', body: 'Test', timestamp: '', read: false },
        { id: 'n2', type: 'trial', title: 'Trial request', body: 'Test', timestamp: '', read: false },
      ],
    })

    useVendorStore.getState().markNotificationRead('n1')
    expect(useVendorStore.getState().vendorNotifications[0].read).toBe(true)
    expect(useVendorStore.getState().vendorNotifications[1].read).toBe(false)

    useVendorStore.getState().markAllNotificationsRead()
    expect(useVendorStore.getState().vendorNotifications.every(n => n.read)).toBe(true)
  })

  it('submits a bid', () => {
    useVendorStore.setState({
      vendorBidRequests: [
        { id: 'b1', coupleNames: 'Test', eventName: 'Wedding', category: 'Decor', uploadedImage: '/img.jpg', status: 'pending' },
      ],
    })

    useVendorStore.getState().submitBid('b1', 300000, 'Can do exact design')
    const bid = useVendorStore.getState().vendorBidRequests[0]
    expect(bid.status).toBe('submitted')
    expect(bid.bidPrice).toBe(300000)
    expect(bid.bidNote).toBe('Can do exact design')
  })
})
