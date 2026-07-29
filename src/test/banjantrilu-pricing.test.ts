import { describe, it, expect } from 'vitest'
import { getBanjantriluFromPrice } from '@/lib/helpers'
import { expandBanjantriluListings } from '@/lib/store'
import { emptyBanjantriluPricing, banjantriluCardValid, BANJANTRILU_DEFAULT_EVENTS, type BanjantriluPricing } from '@/lib/vendor-category-config'

const pricing: BanjantriluPricing = {
  cards: [
    { id: 'a', event: 'Pelli (Wedding)', artists: 5, hours: 4, price: 40000 },
    { id: 'b', event: 'Pelli Koduku/Pellikuthuru Function', artists: 3, hours: 2, price: 20000 },
    { id: 'c', event: 'Haldi', artists: 2, hours: 1, price: 0 }, // not offered
  ],
}

describe('getBanjantriluFromPrice', () => {
  it('is the cheapest priced card', () => {
    expect(getBanjantriluFromPrice(pricing)).toBe(20000)
  })
  it('returns 0 when nothing is priced', () => {
    expect(getBanjantriluFromPrice(undefined)).toBe(0)
    expect(getBanjantriluFromPrice({ cards: [] })).toBe(0)
    expect(getBanjantriluFromPrice({ cards: [{ id: 'x', event: 'Haldi', artists: 1, hours: 1, price: 0 }] })).toBe(0)
  })
})

describe('emptyBanjantriluPricing', () => {
  it('seeds one card per default event with price 0', () => {
    const p = emptyBanjantriluPricing()
    expect(p.cards).toHaveLength(BANJANTRILU_DEFAULT_EVENTS.length)
    expect(p.cards.map(c => c.event)).toEqual([...BANJANTRILU_DEFAULT_EVENTS])
    expect(p.cards.every(c => c.price === 0)).toBe(true)
    // Card ids are unique.
    expect(new Set(p.cards.map(c => c.id)).size).toBe(p.cards.length)
  })
})

describe('banjantriluCardValid', () => {
  it('requires an event and a real price', () => {
    expect(banjantriluCardValid({ id: 'a', event: 'Pelli (Wedding)', artists: 2, hours: 2, price: 5000 })).toBe(true)
    expect(banjantriluCardValid({ id: 'b', event: 'Pelli (Wedding)', artists: 2, hours: 2, price: 0 })).toBe(false)
    expect(banjantriluCardValid({ id: 'c', event: '  ', artists: 2, hours: 2, price: 5000 })).toBe(false)
  })
})

describe('expandBanjantriluListings', () => {
  const listing = {
    id: 'L1', category: 'Banjantrilu', name: 'Nadaswaram Group', vendor_id: 'V1',
    banjantrilu_pricing: pricing,
  }

  it('fans one row per priced card, tagged to that ritual at its price', () => {
    const out = expandBanjantriluListings([listing])
    expect(out).toHaveLength(2) // Haldi (price 0) is dropped
    expect(out.map(r => r.id)).toEqual(['L1::bmt::a', 'L1::bmt::b'])
    expect(out[0].rituals).toEqual(['Pelli (Wedding)'])
    expect(out[0].price).toBe(40000)
    expect(out[1].rituals).toEqual(['Pelli Koduku/Pellikuthuru Function'])
    expect(out[1].price).toBe(20000)
    // Each fanned row carries just its own card (event + artists + hours).
    const p0 = out[0].banjantrilu_pricing as BanjantriluPricing
    expect(p0.cards).toHaveLength(1)
    expect(p0.cards[0].event).toBe('Pelli (Wedding)')
    expect(p0.cards[0].artists).toBe(5)
    expect(p0.cards[0].hours).toBe(4)
  })

  it('passes through a Banjantrilu listing with no priced cards', () => {
    const empty = { id: 'L2', category: 'Banjantrilu', banjantrilu_pricing: { cards: [] } }
    expect(expandBanjantriluListings([empty])).toEqual([empty])
  })

  it('leaves non-Banjantrilu + already-expanded rows untouched, and is idempotent', () => {
    const other = { id: 'D1', category: 'Photography' }
    const once = expandBanjantriluListings([listing, other])
    const twice = expandBanjantriluListings(once)
    expect(twice).toEqual(once)
    expect(twice.some(r => r.id === 'D1')).toBe(true)
  })
})
