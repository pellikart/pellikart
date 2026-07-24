import { describe, it, expect } from 'vitest'
import { guestCountFor, getCategorySelectionTotal } from '@/lib/helpers'
import type { Vendor, Category } from '@/lib/types'

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return {
    id: 'v1', code: 'V001', name: 'Test Venue', photo: '', style: '', area: '',
    price: 0, rating: 0, packageTier: '', likes: [], booked: false, amountPaid: 0,
    ...overrides,
  }
}
function makeCategory(overrides: Partial<Category> = {}): Category {
  return { id: 'c1', label: 'Venue', selectedVendorId: 'v1', shortlistedVendorIds: [], suggestedVendors: [], removed: false, ...overrides }
}

describe('guestCountFor', () => {
  it('reads an exact number (new stepper value)', () => {
    expect(guestCountFor('400')).toBe(400)
    expect(guestCountFor('50')).toBe(50)
  })
  it('uses the UPPER limit of a legacy range bucket', () => {
    expect(guestCountFor('200-500')).toBe(500)
    expect(guestCountFor('100-200')).toBe(200)
  })
  it('uses the lower value for an open-ended "1000+" bucket', () => {
    expect(guestCountFor('1000+')).toBe(1000)
  })
  it('returns 0 when unset', () => {
    expect(guestCountFor(undefined)).toBe(0)
    expect(guestCountFor('')).toBe(0)
  })
})

describe('getCategorySelectionTotal — per-plate venue', () => {
  const venue = makeVendor({
    category: 'Venue',
    platePackages: [
      { id: 'p-silver', name: 'Silver', pricePerPlate: 1200 },
      { id: 'p-gold', name: 'Gold', pricePerPlate: 1800 },
    ],
  })

  it('returns the per-plate RATE when no guest count is passed', () => {
    const cat = makeCategory({ selectedPlatePackageId: 'p-gold' })
    expect(getCategorySelectionTotal(venue, cat)).toBe(1800)
  })

  it('returns rate × guests (the TOTAL) when a guest count is passed', () => {
    const cat = makeCategory({ selectedPlatePackageId: 'p-gold' })
    expect(getCategorySelectionTotal(venue, cat, 400)).toBe(1800 * 400)
  })

  it('reflects the picked package', () => {
    const cat = makeCategory({ selectedPlatePackageId: 'p-silver' })
    expect(getCategorySelectionTotal(venue, cat, 300)).toBe(1200 * 300)
  })

  it('falls back to the rate when guests is 0', () => {
    const cat = makeCategory({ selectedPlatePackageId: 'p-silver' })
    expect(getCategorySelectionTotal(venue, cat, 0)).toBe(1200)
  })

  it('returns null when no plate package is selected', () => {
    expect(getCategorySelectionTotal(venue, makeCategory(), 400)).toBeNull()
  })
})
