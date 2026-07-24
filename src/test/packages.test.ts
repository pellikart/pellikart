import { describe, it, expect } from 'vitest'
import { generatePackages, isPackageIntact, intactPackageForListing, PACKAGE_DISCOUNT_PCT } from '@/lib/packages'
import type { Vendor, RitualBoard, ActivePackage } from '@/lib/types'

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: 'v1', code: 'V001', name: 'Test Vendor', photo: '', style: '', area: '',
    price: 0, rating: 0, packageTier: '', likes: [], booked: false, amountPaid: 0,
    ...overrides,
  }
}

function cat(overrides: Partial<RitualBoard['categories'][number]> & { label: string }) {
  return { id: `c-${overrides.label}`, selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: false, ...overrides }
}

// A board that spans Venue, Decor, Photography (all core categories).
function makeBoard(overrides: Partial<RitualBoard> = {}): RitualBoard {
  return {
    id: 'r1', name: 'Reception',
    categories: [cat({ label: 'Venue' }), cat({ label: 'Decor' }), cat({ label: 'Photography' })],
    ...overrides,
  }
}

const VENDORS: Record<string, Vendor> = {
  'venue-cheap': makeVendor({ id: 'venue-cheap', category: 'Venue', price: 100000, rating: 3.5 }),
  'venue-lux': makeVendor({ id: 'venue-lux', category: 'Venue', price: 300000, rating: 4.9 }),
  'decor-cheap': makeVendor({ id: 'decor-cheap', category: 'Decor', price: 40000, rating: 4.0 }),
  'decor-lux': makeVendor({ id: 'decor-lux', category: 'Decor', price: 90000, rating: 4.8 }),
  'photo-cheap': makeVendor({ id: 'photo-cheap', category: 'Photography', price: 50000, rating: 4.2 }),
  'photo-lux': makeVendor({ id: 'photo-lux', category: 'Photography', price: 120000, rating: 5.0 }),
  // A category NOT on the board — must be ignored.
  'dj-1': makeVendor({ id: 'dj-1', category: 'DJ / Music', price: 20000, rating: 4.0 }),
}

describe('generatePackages', () => {
  it('discounts the whole bundle total; value is the summed "from" price', () => {
    const deals = generatePackages(VENDORS, makeBoard())
    expect(deals.length).toBeGreaterThan(0)
    for (const d of deals) {
      const memberPrices = d.memberListingIds.map((id) => VENDORS[id].price)
      const expectedValue = memberPrices.reduce((s, p) => s + p, 0)
      const expectedSavings = Math.round(expectedValue * PACKAGE_DISCOUNT_PCT)
      expect(d.value).toBe(expectedValue)
      expect(d.savings).toBe(expectedSavings)
      expect(d.price).toBe(expectedValue - expectedSavings)
      expect(d.discountPct).toBe(PACKAGE_DISCOUNT_PCT)
    }
  })

  it('counts a per-plate venue as rate × guests in the package total', () => {
    const plateVendors: Record<string, Vendor> = {
      ...VENDORS,
      // ₹1,800/plate × 400 = ₹7,20,000 total — pricier than both flat venues.
      'venue-plate': makeVendor({
        id: 'venue-plate', category: 'Venue', price: 1800, rating: 4.6,
        venuePricingModels: ['perPlate'], platePackages: [{ id: 'p1', name: 'Gold', pricePerPlate: 1800 }],
      }),
    }
    const guests = 400
    const deals = generatePackages(plateVendors, makeBoard(), guests)

    // Ranking uses the effective total, so Smart Saver takes the cheapest total
    // (the ₹1L flat venue), NOT the low ₹1,800/plate rate.
    const saver = deals.find((d) => d.id === 'pkg-saver')!
    expect(saver.memberListingIds).toContain('venue-cheap')

    // Wherever the per-plate venue lands, it contributes rate × guests to the total.
    const withPlate = deals.find((d) => d.memberListingIds.includes('venue-plate'))!
    expect(withPlate).toBeTruthy()
    const expectedValue = withPlate.memberListingIds.reduce((sum, id) => {
      const v = plateVendors[id]
      return sum + (id === 'venue-plate' ? v.price * guests : v.price)
    }, 0)
    expect(withPlate.value).toBe(expectedValue)
    expect(withPlate.savings).toBe(Math.round(expectedValue * PACKAGE_DISCOUNT_PCT))
  })

  it('only picks vendors whose category is on the board', () => {
    const deals = generatePackages(VENDORS, makeBoard())
    const allMembers = deals.flatMap((d) => d.memberListingIds)
    expect(allMembers).not.toContain('dj-1')
  })

  it('Smart Saver picks the cheapest per category; Top Rated picks the highest-rated', () => {
    const deals = generatePackages(VENDORS, makeBoard())
    const saver = deals.find((d) => d.id === 'pkg-saver')
    const toprated = deals.find((d) => d.id === 'pkg-toprated')
    expect(saver?.memberListingIds).toContain('venue-cheap')
    expect(saver?.memberListingIds).toContain('decor-cheap')
    expect(toprated?.memberListingIds).toContain('venue-lux')
    expect(toprated?.memberListingIds).toContain('photo-lux')
  })

  it('excludes vendors priced at 0', () => {
    const withFree = {
      ...VENDORS,
      'decor-free': makeVendor({ id: 'decor-free', category: 'Decor', price: 0, rating: 5.0 }),
    }
    const members = generatePackages(withFree, makeBoard()).flatMap((d) => d.memberListingIds)
    expect(members).not.toContain('decor-free')
  })

  it('is deterministic', () => {
    expect(generatePackages(VENDORS, makeBoard())).toEqual(generatePackages(VENDORS, makeBoard()))
  })

  it('never returns more than 10 packages', () => {
    expect(generatePackages(VENDORS, makeBoard()).length).toBeLessThanOrEqual(10)
  })

  it('dedupes recipes that resolve to the same members', () => {
    // Only one vendor per category → every recipe picks the same members → one package.
    const single = { 'v': VENDORS['venue-cheap'], 'd': VENDORS['decor-cheap'] }
    const deals = generatePackages(single, makeBoard({ categories: [cat({ label: 'Venue' }), cat({ label: 'Decor' })] }))
    expect(deals).toHaveLength(1)
  })

  it('returns nothing when fewer than two board categories have vendors', () => {
    const board = makeBoard({ categories: [cat({ label: 'Venue' })] })
    expect(generatePackages(VENDORS, board)).toEqual([])
  })

  it('returns nothing for an undefined board', () => {
    expect(generatePackages(VENDORS, undefined)).toEqual([])
  })
})

describe('isPackageIntact', () => {
  const pkg: ActivePackage = {
    id: 'pkg-x', name: 'X', memberListingIds: ['venue-cheap', 'decor-cheap'],
    value: 140000, price: 123200, savings: 16800, discountPct: 0.12,
  }

  it('is true when every member is the selected vendor of a non-removed category', () => {
    const board = makeBoard({
      categories: [
        cat({ label: 'Venue', selectedVendorId: 'venue-cheap' }),
        cat({ label: 'Decor', selectedVendorId: 'decor-cheap' }),
      ],
    })
    expect(isPackageIntact(pkg, board)).toBe(true)
  })

  it('is false when a member category is removed', () => {
    const board = makeBoard({
      categories: [
        cat({ label: 'Venue', selectedVendorId: 'venue-cheap' }),
        cat({ label: 'Decor', selectedVendorId: 'decor-cheap', removed: true }),
      ],
    })
    expect(isPackageIntact(pkg, board)).toBe(false)
  })

  it('is false when a member was swapped for a different vendor', () => {
    const board = makeBoard({
      categories: [
        cat({ label: 'Venue', selectedVendorId: 'venue-cheap' }),
        cat({ label: 'Decor', selectedVendorId: 'decor-lux' }),
      ],
    })
    expect(isPackageIntact(pkg, board)).toBe(false)
  })
})

describe('intactPackageForListing', () => {
  it('returns the intact package a selected listing belongs to', () => {
    const pkg: ActivePackage = {
      id: 'pkg-x', name: 'Signature', memberListingIds: ['venue-cheap', 'decor-cheap'],
      value: 140000, price: 123200, savings: 16800, discountPct: 0.12,
    }
    const board = makeBoard({
      activePackages: [pkg],
      categories: [
        cat({ label: 'Venue', selectedVendorId: 'venue-cheap' }),
        cat({ label: 'Decor', selectedVendorId: 'decor-cheap' }),
      ],
    })
    expect(intactPackageForListing('venue-cheap', board)?.name).toBe('Signature')
    expect(intactPackageForListing('unrelated', board)).toBeUndefined()
  })

  it('returns undefined once the package is broken', () => {
    const pkg: ActivePackage = {
      id: 'pkg-x', name: 'Signature', memberListingIds: ['venue-cheap', 'decor-cheap'],
      value: 140000, price: 123200, savings: 16800, discountPct: 0.12,
    }
    const board = makeBoard({
      activePackages: [pkg],
      categories: [
        cat({ label: 'Venue', selectedVendorId: 'venue-cheap' }),
        cat({ label: 'Decor', selectedVendorId: null }),
      ],
    })
    expect(intactPackageForListing('venue-cheap', board)).toBeUndefined()
  })
})
