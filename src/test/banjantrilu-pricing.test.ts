import { describe, it, expect } from 'vitest'
import { getBanjantriluFromPrice } from '@/lib/helpers'
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
