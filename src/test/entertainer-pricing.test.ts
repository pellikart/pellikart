import { describe, it, expect } from 'vitest'
import { getEntertainerFromPrice, getEntertainerEventRate } from '@/lib/helpers'
import { expandEntertainerListings } from '@/lib/store'
import type { EntertainerPricing } from '@/lib/vendor-category-config'

const pricing: EntertainerPricing = {
  eventRates: [
    { id: 'a', event: 'Pelli (Wedding)', price: 50000 },
    { id: 'b', event: 'Sangeeth', price: 30000 },
    { id: 'c', event: 'Haldi', price: 0 }, // not offered
  ],
  durationHours: 3,
  additionalHourCharge: 5000,
  languages: ['Hindi', 'Telugu'],
}

describe('getEntertainerFromPrice', () => {
  it('is the cheapest priced event rate', () => {
    expect(getEntertainerFromPrice(pricing)).toBe(30000)
  })
  it('returns 0 when nothing is priced', () => {
    expect(getEntertainerFromPrice(undefined)).toBe(0)
    expect(getEntertainerFromPrice({ eventRates: [] })).toBe(0)
    expect(getEntertainerFromPrice({ eventRates: [{ id: 'x', event: 'Haldi', price: 0 }] })).toBe(0)
  })
})

describe('getEntertainerEventRate', () => {
  it('returns the price for a specific event', () => {
    expect(getEntertainerEventRate(pricing, 'Sangeeth')).toBe(30000)
  })
  it('returns 0 for an unpriced or missing event', () => {
    expect(getEntertainerEventRate(pricing, 'Haldi')).toBe(0)
    expect(getEntertainerEventRate(pricing, 'Reception')).toBe(0)
  })
})

describe('expandEntertainerListings', () => {
  const listing = {
    id: 'L1', category: 'Hosts / Entertainers', name: 'Anchor', vendor_id: 'V1',
    entertainer_pricing: pricing,
  }

  it('fans one row per priced event, tagged to that ritual at its rate', () => {
    const out = expandEntertainerListings([listing])
    expect(out).toHaveLength(2) // Haldi (price 0) is dropped
    expect(out.map(r => r.id)).toEqual(['L1::ent::a', 'L1::ent::b'])
    expect(out[0].rituals).toEqual(['Pelli (Wedding)'])
    expect(out[0].price).toBe(50000)
    expect(out[1].rituals).toEqual(['Sangeeth'])
    expect(out[1].price).toBe(30000)
    // Each fanned row carries just its own rate but keeps the shared details.
    const p0 = out[0].entertainer_pricing as EntertainerPricing
    expect(p0.eventRates).toHaveLength(1)
    expect(p0.eventRates[0].event).toBe('Pelli (Wedding)')
    expect(p0.durationHours).toBe(3)
    expect(p0.languages).toEqual(['Hindi', 'Telugu'])
  })

  it('passes through an entertainer listing with no priced rates', () => {
    const empty = { id: 'L2', category: 'Hosts / Entertainers', entertainer_pricing: { eventRates: [] } }
    expect(expandEntertainerListings([empty])).toEqual([empty])
  })

  it('leaves non-entertainer + already-expanded rows untouched, and is idempotent', () => {
    const other = { id: 'D1', category: 'Photography' }
    const once = expandEntertainerListings([listing, other])
    const twice = expandEntertainerListings(once)
    expect(twice).toEqual(once)
    expect(twice.some(r => r.id === 'D1')).toBe(true)
  })
})
