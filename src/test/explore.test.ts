import { describe, it, expect } from 'vitest'
import { isExploreCandidate, countExploreOptions } from '@/lib/explore'
import { getDesignsForCategory } from '@/lib/mock-data'
import type { Vendor } from '@/lib/types'

// The board card promises a number ("See 8 more Decor options") and the
// explorer has to deliver it. Both read this module — these pin the count so a
// card can't advertise listings the category page then filters away.

const v = (over: Partial<Vendor> & { id: string; code: string }): Vendor =>
  ({ rituals: [], ...over }) as Vendor

describe('isExploreCandidate', () => {
  it('matches on the category code prefix, case-insensitively', () => {
    expect(isExploreCandidate(v({ id: '1', code: 'Venue 003' }), 'Venue', 'Pelli')).toBe(true)
    expect(isExploreCandidate(v({ id: '2', code: 'venue 004' }), 'Venue', 'Pelli')).toBe(true)
    expect(isExploreCandidate(v({ id: '3', code: 'Decor 001' }), 'Venue', 'Pelli')).toBe(false)
  })

  it('keeps a fanned photography row only on the event it is priced for', () => {
    const row = v({ id: 'l1::evt::a', code: 'Photography 001', rituals: ['Reception'] })
    expect(isExploreCandidate(row, 'Photography', 'Reception')).toBe(true)
    expect(isExploreCandidate(row, 'Photography', 'Haldi')).toBe(false)
  })

  it('scopes pandits and banjantrilu by event even though they are not fanned', () => {
    const pandit = v({ id: 'p1', code: 'Pandit 001', category: 'Pandit', rituals: ['Pelli (Wedding)'] })
    expect(isExploreCandidate(pandit, 'Pandit', 'Pelli (Wedding)')).toBe(true)
    expect(isExploreCandidate(pandit, 'Pandit', 'Sangeeth')).toBe(false)
  })

  it('leaves ordinary listings event-agnostic', () => {
    const venue = v({ id: 'v1', code: 'Venue 001', category: 'Venue', rituals: [] })
    expect(isExploreCandidate(venue, 'Venue', 'Any Event')).toBe(true)
  })
})

describe('countExploreOptions', () => {
  const vendors: Record<string, Vendor> = {
    a: v({ id: 'a', code: 'Venue 001' }),
    b: v({ id: 'b', code: 'Venue 002' }),
    c: v({ id: 'c', code: 'Venue 003' }),
    d: v({ id: 'd', code: 'Decor 001' }),
    e: v({ id: 'e', code: 'Photography 001::evt', rituals: ['Reception'] }),
  }

  it('counts only the listings the explorer would show', () => {
    expect(countExploreOptions({ liveMode: true, vendors, categoryLabel: 'Venue', boardName: 'Pelli' })).toBe(3)
  })

  it('excludes the listing already on the board, so the count is genuinely "other"', () => {
    expect(countExploreOptions({
      liveMode: true, vendors, categoryLabel: 'Venue', boardName: 'Pelli', excludeId: 'b',
    })).toBe(2)
  })

  it('returns 0 when the category has nothing to explore', () => {
    expect(countExploreOptions({ liveMode: true, vendors, categoryLabel: 'Mehendi', boardName: 'Pelli' })).toBe(0)
  })

  it('counts the mock catalogue in demo mode', () => {
    const expected = getDesignsForCategory('Venue').length
    expect(countExploreOptions({ liveMode: false, vendors: {}, categoryLabel: 'Venue', boardName: 'Pelli' })).toBe(expected)
    expect(expected).toBeGreaterThan(0)
  })
})
