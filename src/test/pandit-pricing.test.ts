import { describe, it, expect } from 'vitest'
import { getPanditFromPrice } from '@/lib/helpers'
import { emptyPanditPricing, panditCardValid, PANDIT_DEFAULT_EVENTS, type PanditPricing, type PanditCard } from '@/lib/vendor-category-config'

const card = (over: Partial<PanditCard>): PanditCard => ({
  id: 'x', event: 'Pelli (Wedding)', ritualsIncluded: [], durationHours: 3,
  durationVaries: false, purohits: 1, transportIncluded: false, price: 0, ...over,
})

const pricing: PanditPricing = {
  cards: [
    card({ id: 'a', event: 'Pelli (Wedding)', price: 15000 }),
    card({ id: 'b', event: 'Engagement', price: 8000 }),
    card({ id: 'c', event: 'Satyanarayana Swami Vratham', price: 0 }), // not offered
  ],
}

describe('getPanditFromPrice', () => {
  it('is the cheapest priced card', () => {
    expect(getPanditFromPrice(pricing)).toBe(8000)
  })
  it('returns 0 when nothing is priced', () => {
    expect(getPanditFromPrice(undefined)).toBe(0)
    expect(getPanditFromPrice({ cards: [] })).toBe(0)
    expect(getPanditFromPrice({ cards: [card({ price: 0 })] })).toBe(0)
  })
})

describe('emptyPanditPricing', () => {
  it('seeds one card per default event with price 0', () => {
    const p = emptyPanditPricing()
    expect(p.cards).toHaveLength(PANDIT_DEFAULT_EVENTS.length)
    expect(p.cards.map(c => c.event)).toEqual([...PANDIT_DEFAULT_EVENTS])
    expect(p.cards.every(c => c.price === 0)).toBe(true)
    expect(new Set(p.cards.map(c => c.id)).size).toBe(p.cards.length)
  })
})

describe('panditCardValid', () => {
  it('requires an event and a real price', () => {
    expect(panditCardValid(card({ price: 5000 }))).toBe(true)
    expect(panditCardValid(card({ price: 0 }))).toBe(false)
    expect(panditCardValid(card({ event: '  ', price: 5000 }))).toBe(false)
  })
})
