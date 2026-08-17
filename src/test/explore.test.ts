import { describe, it, expect } from 'vitest'
import { isExploreCandidate } from '@/lib/explore'
import type { Vendor } from '@/lib/types'

// Which listings the category explorer shows. The event-scoping rules are the
// subtle part: a photography row fanned per event, or a pandit priced only for
// the wedding, must not surface on every other board.

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
