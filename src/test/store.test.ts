import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '@/lib/store'

describe('Couple Store', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useStore.setState({
      role: 'none',
      onboardingComplete: false,
      onboardingData: null,
      subscription: 'free',
      ritualBoards: [],
      milestoneProgress: {},
      trialSessions: {},
      trialsUsed: {},
      _liveMode: false,
      _userId: null,
      _coupleDbId: null,
      _listingVendorMap: {},
      _trialIdMap: {},
    })
  })

  it('sets role correctly', () => {
    useStore.getState().setRole('user')
    expect(useStore.getState().role).toBe('user')
  })

  it('sets role to vendor', () => {
    useStore.getState().setRole('vendor')
    expect(useStore.getState().role).toBe('vendor')
  })

  it('completes onboarding in demo mode', () => {
    const data = {
      partner1: 'Ravi',
      partner2: 'Priya',
      events: ['Pelli (Wedding)', 'Reception'],
      customEvents: [],
      eventDates: {},
      eventGuests: {},
      budget: 2000000,
      style: 'traditional',
    }
    useStore.getState().completeOnboarding(data)
    const state = useStore.getState()
    expect(state.onboardingComplete).toBe(true)
    expect(state.onboardingData?.partner1).toBe('Ravi')
    expect(state.ritualBoards.length).toBeGreaterThan(0)
    expect(Object.keys(state.vendors).length).toBeGreaterThan(0)
  })

  it('generates correct number of boards from events', () => {
    const data = {
      partner1: 'A',
      partner2: 'B',
      events: ['Pelli (Wedding)', 'Sangeeth', 'Nalugu'],
      customEvents: [],
      eventDates: {},
      eventGuests: {},
      budget: 1000000,
      style: null,
    }
    useStore.getState().completeOnboarding(data)
    expect(useStore.getState().ritualBoards.length).toBe(3)
  })

  it('selects a vendor for a category', () => {
    // First complete onboarding to get boards
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const boards = useStore.getState().ritualBoards
    const board = boards[0]
    const cat = board.categories[0]
    const vendors = useStore.getState().vendors
    const anyVendorId = Object.keys(vendors)[0]

    useStore.getState().selectVendor(board.id, cat.id, anyVendorId)

    const updated = useStore.getState().ritualBoards[0].categories[0]
    expect(updated.selectedVendorId).toBe(anyVendorId)
  })

  it('adds and removes from shortlist', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const board = useStore.getState().ritualBoards[0]
    const cat = board.categories[0]
    const vendorId = 'test-vendor-1'

    // Add
    useStore.getState().addToShortlist(board.id, cat.id, vendorId)
    let updated = useStore.getState().ritualBoards[0].categories[0]
    expect(updated.shortlistedVendorIds).toContain(vendorId)

    // Remove
    useStore.getState().removeFromShortlist(board.id, cat.id, vendorId)
    updated = useStore.getState().ritualBoards[0].categories[0]
    expect(updated.shortlistedVendorIds).not.toContain(vendorId)
  })

  it('does not duplicate shortlist entries', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const board = useStore.getState().ritualBoards[0]
    const cat = board.categories[0]
    const vendorId = 'test-vendor-dup'

    useStore.getState().addToShortlist(board.id, cat.id, vendorId)
    useStore.getState().addToShortlist(board.id, cat.id, vendorId)

    const updated = useStore.getState().ritualBoards[0].categories[0]
    const count = updated.shortlistedVendorIds.filter(id => id === vendorId).length
    expect(count).toBe(1)
  })

  it('toggles likes on vendors', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const vendorId = Object.keys(useStore.getState().vendors)[0]
    const initialLikes = useStore.getState().vendors[vendorId].likes.length

    // Like
    useStore.getState().toggleLike(vendorId, 'Mom', 'user-mom-test')
    expect(useStore.getState().vendors[vendorId].likes).toHaveLength(initialLikes + 1)
    expect(useStore.getState().vendors[vendorId].likes.some(l => l.name === 'Mom')).toBe(true)

    // Unlike
    useStore.getState().toggleLike(vendorId, 'Mom', 'user-mom-test')
    expect(useStore.getState().vendors[vendorId].likes).toHaveLength(initialLikes)
  })

  it('removes a category from a board', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const board = useStore.getState().ritualBoards[0]
    const cat = board.categories[0]

    useStore.getState().removeCategory(board.id, cat.id)
    const updated = useStore.getState().ritualBoards[0].categories[0]
    expect(updated.removed).toBe(true)
  })

  it('books a vendor', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const vendorId = Object.keys(useStore.getState().vendors)[0]
    useStore.getState().bookVendor(vendorId, 50000)

    expect(useStore.getState().vendors[vendorId].booked).toBe(true)
    expect(useStore.getState().vendors[vendorId].amountPaid).toBe(50000)
    expect(useStore.getState().milestoneProgress[vendorId]).toBe(1)
  })

  it('subscribes to a tier', () => {
    useStore.getState().subscribe('gold')
    expect(useStore.getState().subscription).toBe('gold')
    expect(useStore.getState().getMaxTrials()).toBe(3)
  })

  it('respects trial limits per subscription tier', () => {
    expect(useStore.getState().getMaxTrials()).toBe(0) // free
    useStore.getState().subscribe('silver')
    expect(useStore.getState().getMaxTrials()).toBe(1)
    useStore.getState().subscribe('gold')
    expect(useStore.getState().getMaxTrials()).toBe(3)
  })

  it('adds a new ritual board', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const initialCount = useStore.getState().ritualBoards.length
    useStore.getState().addRitualBoard('Cocktail Party', '2026-12-10')
    expect(useStore.getState().ritualBoards.length).toBe(initialCount + 1)

    const newBoard = useStore.getState().ritualBoards[useStore.getState().ritualBoards.length - 1]
    expect(newBoard.name).toBe('Cocktail Party')
    expect(newBoard.categories.length).toBeGreaterThan(0)
  })

  it('updates board dates', () => {
    useStore.getState().completeOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 1000000, style: null,
    })

    const board = useStore.getState().ritualBoards[0]
    useStore.getState().updateBoardDates(board.id, '2026-12-15', '2026-12-16', [])

    const updated = useStore.getState().ritualBoards[0]
    expect(updated.dateStart).toBe('2026-12-15')
    expect(updated.dateEnd).toBe('2026-12-16')
  })
})
