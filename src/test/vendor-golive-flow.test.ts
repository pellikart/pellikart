import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVendorStore } from '@/lib/vendor-store'
import * as db from '@/lib/supabase-db'
import type { VendorProfile, VendorPackage, VendorListing } from '@/lib/vendor-types'

// ── Live-mode vendor onboarding → go-live flow ──────────────────────────────
// The real path a vendor takes in front of us: complete onboarding (which must
// NOT advertise them yet), then add a listing (which is what actually makes
// them discoverable to couples). This guards two documented traps:
//   1. Visibility trap — a vendor must never end up is_live with no listing,
//      and adding a confirmed listing MUST flip them live.
//   2. _vendorDbId leak — onboarding several vendors in one session shares a
//      global id; an explicit vendorId on addListing must win, so a listing
//      never lands on a previous vendor.
vi.mock('@/lib/supabase-db')

const profile: VendorProfile = {
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
  categoryFields: {},
}

const packages: VendorPackage[] = [
  { id: 'pkg-1', name: 'Basic', price: 50000, features: ['100 photos'], capacity: 'Half day' },
]

const listing: VendorListing = {
  id: 'vl-new-1',
  name: 'Wedding Story',
  photos: ['/p1.jpg'],
  category: 'Photography',
  price: 150000,
  style: 'Candid',
  includes: ['Album'],
  createdAt: '2026-07-15',
}

function resetStore(overrides: Record<string, unknown> = {}) {
  useVendorStore.setState({
    vendorOnboardingComplete: false,
    vendorProfile: null,
    vendorPackages: [],
    vendorListings: [],
    _liveMode: true,
    _adminMode: false,
    _userId: 'user-1',
    _vendorDbId: null,
    _listingIdMap: {},
    _packageIdMap: {},
    ...overrides,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStore()
  vi.mocked(db.upsertVendor).mockResolvedValue({ id: 'vendor-db-1' } as never)
  vi.mocked(db.insertPackage).mockResolvedValue({ id: 'pkg-db-1' } as never)
  vi.mocked(db.insertListing).mockResolvedValue({ id: 'listing-db-1' } as never)
  vi.mocked(db.setVendorLiveById).mockResolvedValue(undefined as never)
})

describe('completeVendorOnboarding (live mode)', () => {
  it('persists the vendor as NOT live yet, saves packages, and captures the DB id', async () => {
    const id = await useVendorStore.getState().completeVendorOnboarding(profile, packages)

    // Vendor is saved with isLive=false — never advertised before a listing exists.
    expect(db.upsertVendor).toHaveBeenCalledWith('user-1', profile, false)
    expect(db.insertPackage).toHaveBeenCalledTimes(1)
    expect(id).toBe('vendor-db-1')

    const s = useVendorStore.getState()
    expect(s._vendorDbId).toBe('vendor-db-1')
    expect(s.vendorOnboardingComplete).toBe(true)
    // Live mode must NOT inject demo mock listings.
    expect(s.vendorListings).toEqual([])
  })
})

describe('addListing (live mode) — visibility trap', () => {
  it('inserts the listing and flips the vendor live so couples can find them', async () => {
    resetStore({ _vendorDbId: 'vendor-db-1' })

    const ok = await useVendorStore.getState().addListing(listing)

    expect(ok).toBe(true)
    expect(db.insertListing).toHaveBeenCalledWith('vendor-db-1', listing)
    expect(db.setVendorLiveById).toHaveBeenCalledWith('vendor-db-1')
    expect(useVendorStore.getState()._listingIdMap[listing.id]).toBe('listing-db-1')
  })

  it('never strands a vendor live with no listing when there is no vendor id', async () => {
    resetStore({ _vendorDbId: null })

    const ok = await useVendorStore.getState().addListing(listing)

    expect(ok).toBe(false)
    expect(db.insertListing).not.toHaveBeenCalled()
    expect(db.setVendorLiveById).not.toHaveBeenCalled()
    // Optimistic add is rolled back.
    expect(useVendorStore.getState().vendorListings).toEqual([])
  })

  it('rolls back and stays not-live when the DB insert fails', async () => {
    resetStore({ _vendorDbId: 'vendor-db-1' })
    vi.mocked(db.insertListing).mockResolvedValueOnce(null as never)

    const ok = await useVendorStore.getState().addListing(listing)

    expect(ok).toBe(false)
    expect(db.setVendorLiveById).not.toHaveBeenCalled()
    expect(useVendorStore.getState().vendorListings).toEqual([])
  })
})

describe('addListing (live mode) — _vendorDbId leak', () => {
  it('files the listing on the explicit vendor id, not the stale global', async () => {
    // Global points at a previously-onboarded vendor; explicit target must win.
    resetStore({ _vendorDbId: 'OLD-vendor' })

    const ok = await useVendorStore.getState().addListing(listing, 'NEW-vendor')

    expect(ok).toBe(true)
    expect(db.insertListing).toHaveBeenCalledWith('NEW-vendor', listing)
    expect(db.setVendorLiveById).toHaveBeenCalledWith('NEW-vendor')
  })
})
