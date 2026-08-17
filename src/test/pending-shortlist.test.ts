import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useStore } from '@/lib/store'
import {
  setPendingShortlist, readPendingShortlist, clearPendingShortlist,
} from '@/lib/pending-shortlist'
import type { RitualBoard, Vendor } from '@/lib/types'

/**
 * A visitor shortlists a listing on the public landing page, then signs in.
 * Google OAuth is a top-level redirect, so the only thing that survives is
 * localStorage — these cover the handoff on the far side of it.
 */
describe('pending shortlist', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.setState({
      ritualBoards: [], vendors: {}, _liveMode: false, _userId: null,
      _coupleDbId: null, _listingVendorMap: {},
    })
  })
  afterEach(() => vi.useRealTimers())

  it('round-trips a shortlisted listing', () => {
    setPendingShortlist({ listingId: 'listing-1', vendorId: 'vendor-1', category: 'Venue' })
    expect(readPendingShortlist()).toMatchObject({
      listingId: 'listing-1', vendorId: 'vendor-1', category: 'Venue',
    })
  })

  it('drops it after a week, so a stale click never steers a board', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    setPendingShortlist({ listingId: 'listing-1', category: 'Venue' })

    vi.setSystemTime(new Date('2026-01-06T00:00:00Z'))
    expect(readPendingShortlist()).not.toBeNull()

    vi.setSystemTime(new Date('2026-01-09T00:00:00Z'))
    expect(readPendingShortlist()).toBeNull()
    expect(localStorage.getItem('pellikart_pending_shortlist')).toBeNull()
  })

  it('survives corrupted storage without throwing', () => {
    localStorage.setItem('pellikart_pending_shortlist', 'not json')
    expect(readPendingShortlist()).toBeNull()
    localStorage.setItem('pellikart_pending_shortlist', '{"category":"Venue"}')
    expect(readPendingShortlist()).toBeNull()
  })

  it('clears', () => {
    setPendingShortlist({ listingId: 'listing-1', category: 'Venue' })
    clearPendingShortlist()
    expect(readPendingShortlist()).toBeNull()
  })
})

/** Boards for a couple who already onboarded before shortlisting anything. */
function seedBoards() {
  const boards: RitualBoard[] = [
    {
      id: 'r-engagement', name: 'Engagement',
      categories: [
        { id: 'r-engagement-c-catering', label: 'Catering', selectedVendorId: 'other', shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      ],
    },
    {
      id: 'r-pelli', name: 'Pelli (Wedding)',
      categories: [
        { id: 'r-pelli-c-venue', label: 'Venue', selectedVendorId: 'auto-picked', shortlistedVendorIds: ['auto-picked'], suggestedVendors: [], removed: false },
        { id: 'r-pelli-c-catering', label: 'Catering', selectedVendorId: 'other', shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      ],
    },
    {
      id: 'r-reception', name: 'Reception',
      categories: [
        { id: 'r-reception-c-venue', label: 'Venue', selectedVendorId: 'auto-picked-2', shortlistedVendorIds: [], suggestedVendors: [], removed: false },
      ],
    },
  ] as RitualBoard[]

  const vendors: Record<string, Vendor> = {
    'listing-1': { id: 'listing-1', category: 'Venue', price: 100 } as Vendor,
    'listing-1::evt::a': { id: 'listing-1::evt::a', category: 'Photography', price: 100 } as Vendor,
  }
  useStore.setState({ ritualBoards: boards, vendors })
}

describe('applyPendingShortlist', () => {
  beforeEach(() => {
    localStorage.clear()
    useStore.setState({ ritualBoards: [], vendors: {}, _liveMode: false, _userId: null, _listingVendorMap: {} })
    seedBoards()
  })

  const boardsAfter = () => useStore.getState().ritualBoards

  it('selects the listing into the first ritual carrying that category', () => {
    setPendingShortlist({ listingId: 'listing-1', vendorId: 'v1', category: 'Venue' })
    useStore.getState().applyPendingShortlist()

    const pelli = boardsAfter().find(b => b.id === 'r-pelli')!
    expect(pelli.categories.find(c => c.label === 'Venue')!.selectedVendorId).toBe('listing-1')
  })

  it('leaves later rituals alone rather than overwriting every event', () => {
    setPendingShortlist({ listingId: 'listing-1', category: 'Venue' })
    useStore.getState().applyPendingShortlist()

    const reception = boardsAfter().find(b => b.id === 'r-reception')!
    expect(reception.categories.find(c => c.label === 'Venue')!.selectedVendorId).toBe('auto-picked-2')
  })

  it('consumes the intent so a later login does not re-apply it', () => {
    setPendingShortlist({ listingId: 'listing-1', category: 'Venue' })
    useStore.getState().applyPendingShortlist()
    expect(readPendingShortlist()).toBeNull()
  })

  it('resolves a fanned listing id back to a real listing', () => {
    // The landing page card collapses `listing::evt::a` down to `listing`.
    setPendingShortlist({ listingId: 'listing-1::evt::a'.split('::')[0] + '::evt::a', category: 'Photography' })
    expect(readPendingShortlist()!.listingId).toBe('listing-1::evt::a')
  })

  it('drops the intent when no ritual uses that category', () => {
    setPendingShortlist({ listingId: 'listing-1', category: 'Venue' })
    useStore.setState({ ritualBoards: [] })
    useStore.getState().applyPendingShortlist()
    expect(readPendingShortlist()).toBeNull()
  })

  it('drops the intent when the listing is gone', () => {
    setPendingShortlist({ listingId: 'missing-listing', category: 'Venue' })
    useStore.getState().applyPendingShortlist()
    expect(readPendingShortlist()).toBeNull()
    const pelli = boardsAfter().find(b => b.id === 'r-pelli')!
    expect(pelli.categories.find(c => c.label === 'Venue')!.selectedVendorId).toBe('auto-picked')
  })

  it('does nothing when there is no pending shortlist', () => {
    useStore.getState().applyPendingShortlist()
    const pelli = boardsAfter().find(b => b.id === 'r-pelli')!
    expect(pelli.categories.find(c => c.label === 'Venue')!.selectedVendorId).toBe('auto-picked')
  })
})
