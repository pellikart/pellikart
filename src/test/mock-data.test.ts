import { describe, it, expect } from 'vitest'
import {
  mockVendors, mockRitualBoards, mockDesigns,
  generateBoardsFromOnboarding, getVendorPriceScale,
  getCategoriesForEvent, categoryWeight,
  getDesignsForCategory,
} from '@/lib/mock-data'
import type { OnboardingData } from '@/lib/types'

describe('Mock Data', () => {
  it('has vendors for all categories', () => {
    const categories = new Set(Object.values(mockVendors).map(v => {
      // Extract category from vendor ID prefix
      const id = v.id
      if (id.includes('venue')) return 'Venue'
      if (id.includes('catering')) return 'Catering'
      if (id.includes('photo')) return 'Photography'
      if (id.includes('decor')) return 'Decor'
      if (id.includes('makeup')) return 'Makeup'
      if (id.includes('mehendi')) return 'Mehendi'
      if (id.includes('dj')) return 'DJ / Music'
      if (id.includes('pandit')) return 'Pandit'
      if (id.includes('invite')) return 'Invitations'
      return 'Other'
    }))
    expect(categories.size).toBeGreaterThanOrEqual(8)
  })

  it('vendors have required fields', () => {
    for (const v of Object.values(mockVendors)) {
      expect(v.id).toBeTruthy()
      expect(v.name).toBeTruthy()
      expect(v.price).toBeGreaterThan(0)
      expect(v.rating).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(v.likes)).toBe(true)
    }
  })

  it('mock ritual boards have categories', () => {
    expect(mockRitualBoards.length).toBeGreaterThan(0)
    for (const board of mockRitualBoards) {
      expect(board.name).toBeTruthy()
      expect(board.categories.length).toBeGreaterThan(0)
    }
  })

  it('mock designs exist', () => {
    expect(mockDesigns.length).toBeGreaterThan(0)
    for (const d of mockDesigns) {
      expect(d.id).toBeTruthy()
      expect(d.vendorId).toBeTruthy()
      expect(d.price).toBeGreaterThan(0)
    }
  })
})

describe('getCategoriesForEvent', () => {
  it('returns correct categories for Pelli (Wedding)', () => {
    const cats = getCategoriesForEvent('Pelli (Wedding)')
    expect(cats).toContain('Venue')
    expect(cats).toContain('Catering')
    expect(cats).toContain('Pandit')
    expect(cats).toContain('Invitations')
  })

  it('returns correct categories for Sangeeth', () => {
    const cats = getCategoriesForEvent('Sangeeth')
    expect(cats).toContain('DJ / Music')
    expect(cats).not.toContain('Pandit')
  })

  it('returns correct categories for Nalugu', () => {
    const cats = getCategoriesForEvent('Nalugu')
    expect(cats).toContain('Venue')
    expect(cats).toContain('Photography')
    expect(cats).not.toContain('Makeup')
  })

  it('returns correct categories for Nischitartham', () => {
    const cats = getCategoriesForEvent('Nischitartham')
    expect(cats).toContain('Makeup')
    expect(cats).not.toContain('Pandit')
  })

  it('returns default categories for unknown events', () => {
    const cats = getCategoriesForEvent('Custom Party')
    expect(cats.length).toBeGreaterThan(0)
    expect(cats).toContain('Venue')
  })
})

describe('categoryWeight', () => {
  it('has weights for all main categories', () => {
    expect(categoryWeight['Venue']).toBeDefined()
    expect(categoryWeight['Catering']).toBeDefined()
    expect(categoryWeight['Photography']).toBeDefined()
  })

  it('venue is the heaviest', () => {
    expect(categoryWeight['Venue']).toBeGreaterThan(categoryWeight['Photography'])
    expect(categoryWeight['Venue']).toBeGreaterThan(categoryWeight['Makeup'])
  })

  it('weights sum to approximately 1', () => {
    const total = Object.values(categoryWeight).reduce((s, w) => s + w, 0)
    expect(total).toBeGreaterThan(0.9)
    expect(total).toBeLessThanOrEqual(1.1)
  })
})

describe('generateBoardsFromOnboarding', () => {
  const data: OnboardingData = {
    partner1: 'Ravi',
    partner2: 'Priya',
    events: ['Pelli (Wedding)', 'Reception'],
    customEvents: [],
    eventDates: {
      'Pelli (Wedding)': { start: '2026-12-12', end: '2026-12-12' },
      'Reception': { start: '2026-12-14', end: '2026-12-14' },
    },
    eventGuests: {},
    budget: 2000000,
    style: 'traditional',
  }

  it('creates one board per event', () => {
    const boards = generateBoardsFromOnboarding(data)
    expect(boards.length).toBe(2)
  })

  it('boards have correct event names', () => {
    const boards = generateBoardsFromOnboarding(data)
    expect(boards[0].name).toBe('Pelli (Wedding)')
    expect(boards[1].name).toBe('Reception')
  })

  it('boards have categories with selected vendors', () => {
    const boards = generateBoardsFromOnboarding(data)
    for (const board of boards) {
      expect(board.categories.length).toBeGreaterThan(0)
      // At least some categories should have selected vendors
      const withVendor = board.categories.filter(c => c.selectedVendorId)
      expect(withVendor.length).toBeGreaterThan(0)
    }
  })

  it('shortlisted vendors exist', () => {
    const boards = generateBoardsFromOnboarding(data)
    for (const board of boards) {
      for (const cat of board.categories) {
        if (cat.selectedVendorId) {
          expect(cat.shortlistedVendorIds.length).toBeGreaterThan(0)
          expect(cat.shortlistedVendorIds).toContain(cat.selectedVendorId)
        }
      }
    }
  })

  it('includes custom events', () => {
    const dataWithCustom = {
      ...data,
      customEvents: ['Cocktail Night'],
    }
    const boards = generateBoardsFromOnboarding(dataWithCustom)
    expect(boards.length).toBe(3)
    expect(boards[2].name).toBe('Cocktail Night')
  })
})

describe('getVendorPriceScale', () => {
  it('returns a positive scale factor', () => {
    const boards = generateBoardsFromOnboarding({
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 2000000, style: null,
    })
    const scale = getVendorPriceScale(boards, 2000000)
    expect(scale).toBeGreaterThan(0)
  })
})

describe('getDesignsForCategory', () => {
  it('returns designs for Photography', () => {
    const designs = getDesignsForCategory('Photography')
    expect(designs.length).toBeGreaterThan(0)
  })

  it('returns designs for Venue', () => {
    const designs = getDesignsForCategory('Venue')
    expect(designs.length).toBeGreaterThan(0)
  })

  it('returns empty for non-design categories', () => {
    const designs = getDesignsForCategory('NonExistent')
    expect(designs.length).toBe(0)
  })
})
