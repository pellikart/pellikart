import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  boardReadiness, buildConsultSnapshot,
  setLocalConsult, readLocalConsult, clearLocalConsult,
} from '@/lib/consult'
import type { Category, RitualBoard, Vendor } from '@/lib/types'

function cat(label: string, over: Partial<Category> = {}): Category {
  return {
    id: `c-${label.toLowerCase()}`,
    label,
    selectedVendorId: null,
    shortlistedVendorIds: [],
    suggestedVendors: [],
    removed: false,
    ...over,
  }
}

const vendors: Record<string, Vendor> = {
  v1: { id: 'v1', code: 'PK-1', name: 'Rajesh Photography', price: 50000 } as Vendor,
  v2: { id: 'v2', code: 'PK-2', name: 'Sri Convention', price: 200000 } as Vendor,
  v3: { id: 'v3', code: 'PK-3', name: 'Bloom Decor', price: 75000 } as Vendor,
}

function board(categories: Category[], over: Partial<RitualBoard> = {}): RitualBoard {
  return { id: 'b1', name: 'Pelli (Wedding)', categories, ...over }
}

/**
 * The board is the couple's whole journey, and it ends nowhere until we hand it
 * to a human. These cover when we make that offer and what the expert receives.
 */
describe('boardReadiness', () => {
  it('is not ready on a single pick — that is still browsing', () => {
    const r = boardReadiness(board([
      cat('Venue', { selectedVendorId: 'v2' }),
      cat('Decor'),
      cat('Photographer'),
    ]), vendors)
    expect(r).toMatchObject({ filled: 1, total: 3, ready: false })
  })

  it('is ready at two picks', () => {
    const r = boardReadiness(board([
      cat('Venue', { selectedVendorId: 'v2' }),
      cat('Photographer', { selectedVendorId: 'v1' }),
      cat('Decor'),
    ]), vendors)
    expect(r).toMatchObject({ filled: 2, ready: true })
  })

  it('is ready when a one-category board is fully decided', () => {
    const r = boardReadiness(board([cat('Venue', { selectedVendorId: 'v2' })]), vendors)
    expect(r).toMatchObject({ filled: 1, total: 1, ready: true })
  })

  it('ignores removed categories and picks pointing at vendors that are gone', () => {
    const r = boardReadiness(board([
      cat('Venue', { selectedVendorId: 'deleted-listing' }),
      cat('Catering', { removed: true, selectedVendorId: 'v1' }),
      cat('Decor'),
    ]), vendors)
    expect(r).toMatchObject({ filled: 0, total: 2, ready: false })
  })

  it('points at a shortlisted category first — they are closest to deciding', () => {
    const r = boardReadiness(board([
      cat('Venue', { selectedVendorId: 'v2' }),
      cat('Decor'),
      cat('Photographer', { shortlistedVendorIds: ['v1'] }),
    ]), vendors)
    expect(r.nextCategory?.label).toBe('Photographer')
    expect(r.deciding).toBe(1)
  })

  it('falls back to the first untouched category', () => {
    const r = boardReadiness(board([
      cat('Venue', { selectedVendorId: 'v2' }),
      cat('Decor'),
      cat('Photographer'),
    ]), vendors)
    expect(r.nextCategory?.label).toBe('Decor')
  })

  it('handles a missing board', () => {
    expect(boardReadiness(undefined, vendors)).toMatchObject({ filled: 0, total: 0, ready: false })
  })
})

describe('buildConsultSnapshot', () => {
  const b = board([
    cat('Venue', { selectedVendorId: 'v2' }),
    cat('Photographer', { selectedVendorId: 'v1' }),
    cat('Decor', { shortlistedVendorIds: ['v3', 'v1'] }),
    cat('Catering'),
    cat('Mehendi', { removed: true }),
  ], { dateStart: '2026-11-20', dateEnd: '2026-11-21' })

  it('splits the board into picked, deciding and missing', () => {
    const s = buildConsultSnapshot(b, vendors)
    expect(s.picked.map(p => p.category)).toEqual(['Venue', 'Photographer'])
    expect(s.deciding).toEqual([{ category: 'Decor', shortlisted: 2 }])
    expect(s.missing).toEqual(['Catering'])
  })

  it('totals the picks and carries real vendor names for the expert', () => {
    const s = buildConsultSnapshot(b, vendors)
    expect(s.total).toBe(250000)
    expect(s.picked[0].vendor).toBe('Sri Convention')
  })

  it('carries the dates and guest count the couple set', () => {
    const s = buildConsultSnapshot(b, vendors, { guestBucket: '400' })
    expect(s).toMatchObject({ boardName: 'Pelli (Wedding)', dateStart: '2026-11-20', dateEnd: '2026-11-21', guests: 400 })
  })

  it('summarises the couple\'s other events so the expert sees the whole wedding', () => {
    const other = board([cat('Venue', { selectedVendorId: 'v3' }), cat('Decor')], { id: 'b2', name: 'Haldi' })
    const s = buildConsultSnapshot(b, vendors, { allBoards: [b, other] })
    expect(s.otherBoards).toEqual([{ name: 'Haldi', filled: 1, total: 2 }])
  })

  it('leaves otherBoards off when this is their only event', () => {
    expect(buildConsultSnapshot(b, vendors, { allBoards: [b] }).otherBoards).toBeUndefined()
  })
})

/** The ask has to be remembered locally: an anonymous demo visitor has no row
 *  to read back, and even a signed-in couple shouldn't wait on a fetch before
 *  the banner stops asking. */
describe('local consult record', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('round-trips a request', () => {
    setLocalConsult({ boardId: 'b1', phone: '+91 98765 43210', preferredSlot: '3:00 PM – 6:00 PM' })
    expect(readLocalConsult()).toMatchObject({ boardId: 'b1', phone: '+91 98765 43210' })
  })

  it('expires after a month so a months-old call never suppresses a fresh ask', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    setLocalConsult({ phone: '9876543210' })

    vi.setSystemTime(new Date('2026-01-20T00:00:00Z'))
    expect(readLocalConsult()).not.toBeNull()

    vi.setSystemTime(new Date('2026-02-15T00:00:00Z'))
    expect(readLocalConsult()).toBeNull()
    expect(localStorage.getItem('pellikart_consult_request')).toBeNull()
  })

  it('survives corrupted storage without throwing', () => {
    localStorage.setItem('pellikart_consult_request', 'not json')
    expect(readLocalConsult()).toBeNull()
    localStorage.setItem('pellikart_consult_request', '{"phone":"9876543210"}')
    expect(readLocalConsult()).toBeNull()
  })

  it('clears', () => {
    setLocalConsult({ phone: '9876543210' })
    clearLocalConsult()
    expect(readLocalConsult()).toBeNull()
  })
})
