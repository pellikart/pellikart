import { describe, it, expect } from 'vitest'
import { getPhotographyEventFromPrice, getPhotographyModels } from '@/lib/helpers'
import type { PhotographyEventPackage } from '@/lib/vendor-category-config'
import type { Vendor } from '@/lib/types'

describe('getPhotographyEventFromPrice', () => {
  it('returns 0 for no cards / empty prices', () => {
    expect(getPhotographyEventFromPrice(undefined)).toBe(0)
    expect(getPhotographyEventFromPrice([])).toBe(0)
    expect(getPhotographyEventFromPrice([{ id: 'a', events: ['Haldi'], prices: {} }])).toBe(0)
  })

  it('is the cheapest single priced service across all cards', () => {
    const cards: PhotographyEventPackage[] = [
      { id: 'a', events: ['Haldi', 'Mehendi'], prices: { candidPhotography: 40000, drone: 15000 } },
      { id: 'b', events: ['Pelli (Wedding)'], prices: { traditionalPhotography: 8000, album: 12000 } },
    ]
    expect(getPhotographyEventFromPrice(cards)).toBe(8000)
  })
})

describe('getPhotographyModels does not surface eventBased to couples yet', () => {
  it('filters eventBased out so the detail sheet is unaffected', () => {
    const vendor = {
      photographyPricingModels: ['hourly', 'eventBased'],
    } as unknown as Vendor
    expect(getPhotographyModels(vendor)).toEqual(['hourly'])
  })

  it('an event-only photographer surfaces no couple-facing model (for now)', () => {
    const vendor = {
      photographyPricingModels: ['eventBased'],
      eventPackages: [{ id: 'a', events: ['Haldi'], prices: { drone: 15000 } }],
    } as unknown as Vendor
    expect(getPhotographyModels(vendor)).toEqual([])
  })
})
