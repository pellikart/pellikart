import { describe, it, expect } from 'vitest'
import { shouldShowBundlePopup, buildBundleEntries, planBundleApplication } from '@/lib/bundle'
import type { Vendor, RitualBoard } from '@/lib/types'

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: 'v1',
    code: 'V001',
    name: 'Test Vendor',
    photo: '',
    style: '',
    area: '',
    price: 0,
    rating: 0,
    packageTier: '',
    likes: [],
    booked: false,
    amountPaid: 0,
    ...overrides,
  }
}

function makeBoard(overrides: Partial<RitualBoard> = {}): RitualBoard {
  return {
    id: 'r1',
    name: 'Reception',
    categories: [
      { id: 'c-venue', label: 'Venue', selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      { id: 'c-decor', label: 'Decor', selectedVendorId: 'old-decor-id', shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      { id: 'c-cater', label: 'Catering', selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: true },
    ],
    ...overrides,
  }
}

describe('shouldShowBundlePopup', () => {
  it('returns true when venue has mandatory bundle with listings', () => {
    const venue = makeVendor({ category: 'Venue', bundleMandatory: true, bundledListings: ['decor-1'] })
    expect(shouldShowBundlePopup(venue)).toBe(true)
  })

  it('returns false when vendor is not a venue', () => {
    const decor = makeVendor({ category: 'Decor', bundleMandatory: true, bundledListings: ['x'] })
    expect(shouldShowBundlePopup(decor)).toBe(false)
  })

  it('returns false when bundleMandatory is false (bundle is optional)', () => {
    const venue = makeVendor({ category: 'Venue', bundleMandatory: false, bundledListings: ['decor-1'] })
    expect(shouldShowBundlePopup(venue)).toBe(false)
  })

  it('returns false when bundleMandatory is undefined', () => {
    const venue = makeVendor({ category: 'Venue', bundledListings: ['decor-1'] })
    expect(shouldShowBundlePopup(venue)).toBe(false)
  })

  it('returns false when bundledListings is empty', () => {
    const venue = makeVendor({ category: 'Venue', bundleMandatory: true, bundledListings: [] })
    expect(shouldShowBundlePopup(venue)).toBe(false)
  })

  it('returns false when bundledListings is undefined', () => {
    const venue = makeVendor({ category: 'Venue', bundleMandatory: true })
    expect(shouldShowBundlePopup(venue)).toBe(false)
  })

  it('returns false when vendor is undefined', () => {
    expect(shouldShowBundlePopup(undefined)).toBe(false)
  })
})

describe('buildBundleEntries', () => {
  it('returns one entry per bundled listing id', () => {
    const vendors = {
      'decor-1': makeVendor({ id: 'decor-1', name: 'Floral Mandap', category: 'Decor', price: 50000 }),
      'cater-1': makeVendor({ id: 'cater-1', name: 'Veg Feast', category: 'Catering', price: 800 }),
    }
    const result = buildBundleEntries(['decor-1', 'cater-1'], vendors)
    expect(result).toEqual([
      { id: 'decor-1', name: 'Floral Mandap', category: 'Decor', price: 50000 },
      { id: 'cater-1', name: 'Veg Feast', category: 'Catering', price: 800 },
    ])
  })

  it('drops listing ids that are not in the vendor map', () => {
    const vendors = {
      'decor-1': makeVendor({ id: 'decor-1', name: 'Floral Mandap', category: 'Decor', price: 50000 }),
    }
    const result = buildBundleEntries(['decor-1', 'missing-listing'], vendors)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('decor-1')
  })

  it('falls back to vendor code when name is empty', () => {
    const vendors = {
      'decor-1': makeVendor({ id: 'decor-1', code: 'Decor 003', name: '', category: 'Decor', price: 50000 }),
    }
    expect(buildBundleEntries(['decor-1'], vendors)[0].name).toBe('Decor 003')
  })

  it('uses empty string when category is missing', () => {
    const vendors = {
      'unknown-1': makeVendor({ id: 'unknown-1', name: 'X', price: 100 }),
    }
    expect(buildBundleEntries(['unknown-1'], vendors)[0].category).toBe('')
  })

  it('returns empty array when no ids passed', () => {
    expect(buildBundleEntries([], {})).toEqual([])
  })
})

describe('planBundleApplication', () => {
  it('plans a selection for each bundle whose category exists on the board', () => {
    const board = makeBoard()
    const bundles = [
      { id: 'new-decor', name: 'Floral', category: 'Decor', price: 0 },
      { id: 'new-cater', name: 'Veg', category: 'Catering', price: 0 },
    ]
    expect(planBundleApplication(board, bundles)).toEqual([
      { categoryId: 'c-decor', listingId: 'new-decor', needsRestore: false },
      { categoryId: 'c-cater', listingId: 'new-cater', needsRestore: true },
    ])
  })

  it('marks needsRestore=true for categories that are removed', () => {
    const board = makeBoard()
    const bundles = [{ id: 'new-cater', name: 'Veg', category: 'Catering', price: 0 }]
    const plan = planBundleApplication(board, bundles)
    expect(plan).toHaveLength(1)
    expect(plan[0].needsRestore).toBe(true)
  })

  it('marks needsRestore=false for categories that are active', () => {
    const board = makeBoard()
    const bundles = [{ id: 'new-decor', name: 'Floral', category: 'Decor', price: 0 }]
    const plan = planBundleApplication(board, bundles)
    expect(plan[0].needsRestore).toBe(false)
  })

  it('skips bundles whose category is not present on the board', () => {
    const board = makeBoard()
    const bundles = [{ id: 'photog-1', name: 'Lens', category: 'Photography', price: 0 }]
    expect(planBundleApplication(board, bundles)).toEqual([])
  })

  it('skips silently when board has no categories', () => {
    const board = makeBoard({ categories: [] })
    const bundles = [{ id: 'new-decor', name: 'Floral', category: 'Decor', price: 0 }]
    expect(planBundleApplication(board, bundles)).toEqual([])
  })

  it('returns empty when bundles array is empty', () => {
    expect(planBundleApplication(makeBoard(), [])).toEqual([])
  })
})

describe('end-to-end bundle popup decision (integration of the three helpers)', () => {
  it('a Venue with a mandatory bundle of Decor + Catering produces a plan that replaces existing picks', () => {
    // Set up: vendor has linked Decor and Catering listings to this venue.
    const vendors: Record<string, Vendor> = {
      'venue-1': makeVendor({ id: 'venue-1', name: 'Royal Hall', category: 'Venue', bundleMandatory: true, bundledListings: ['decor-1', 'cater-1'] }),
      'decor-1': makeVendor({ id: 'decor-1', name: 'Floral Mandap', category: 'Decor', price: 50000 }),
      'cater-1': makeVendor({ id: 'cater-1', name: 'Veg Feast', category: 'Catering', price: 800 }),
    }
    const board = makeBoard()  // c-decor has a previous pick 'old-decor-id', c-cater is removed

    // 1) Popup decision fires
    expect(shouldShowBundlePopup(vendors['venue-1'])).toBe(true)

    // 2) Bundle payload is built correctly
    const bundles = buildBundleEntries(vendors['venue-1'].bundledListings!, vendors)
    expect(bundles).toHaveLength(2)

    // 3) Plan describes the replacements that the user-side acceptBundle() will perform
    const plan = planBundleApplication(board, bundles)
    expect(plan).toEqual([
      { categoryId: 'c-decor', listingId: 'decor-1', needsRestore: false },  // replaces 'old-decor-id'
      { categoryId: 'c-cater', listingId: 'cater-1', needsRestore: true },   // restores then selects
    ])
  })
})
