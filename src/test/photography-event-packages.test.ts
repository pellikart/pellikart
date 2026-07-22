import { describe, it, expect } from 'vitest'
import { getPhotographyEventFromPrice, getPhotographyModels, getPhotographyEventSelectionTotal } from '@/lib/helpers'
import { expandEventPackageListings } from '@/lib/store'
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

describe('getPhotographyModels surfaces eventBased only with a real package', () => {
  it('drops eventBased when the model is set but no package exists', () => {
    const vendor = {
      photographyPricingModels: ['hourly', 'eventBased'],
    } as unknown as Vendor
    expect(getPhotographyModels(vendor)).toEqual(['hourly'])
  })

  it('surfaces eventBased when the couple-facing listing carries its package', () => {
    const vendor = {
      photographyPricingModels: ['eventBased'],
      eventPackages: [{ id: 'a', events: ['Haldi'], prices: { drone: 15000 } }],
    } as unknown as Vendor
    expect(getPhotographyModels(vendor)).toEqual(['eventBased'])
  })
})

describe('getPhotographyEventSelectionTotal', () => {
  const vendor = {
    eventPackages: [{ id: 'a', events: ['Haldi'], prices: { candidPhotography: 40000, drone: 15000, album: 10000 } }],
  } as unknown as Vendor

  it('sums the ticked services from the single package', () => {
    expect(getPhotographyEventSelectionTotal(vendor, { services: ['candidPhotography', 'drone'] })).toBe(55000)
  })
  it('ignores services with no price and returns null when nothing priced is picked', () => {
    expect(getPhotographyEventSelectionTotal(vendor, { services: ['ledScreens'] })).toBeNull()
    expect(getPhotographyEventSelectionTotal(vendor, { services: [] })).toBeNull()
  })
})

describe('expandEventPackageListings', () => {
  const eventListing = {
    id: 'L1', category: 'Photography', name: 'Studio', vendor_id: 'V1',
    photography_pricing_models: ['eventBased'],
    event_packages: [
      { id: 'p1', events: ['Haldi', 'Mehendi'], prices: { drone: 15000 } },
      { id: 'p2', events: ['Reception'], prices: { candidPhotography: 50000 } },
    ],
    rate_card: {}, guest_packages: {},
  }

  it('fans an event-only listing into one row per package, dropping the base row', () => {
    const out = expandEventPackageListings([eventListing])
    expect(out).toHaveLength(2)
    expect(out.map(r => r.id)).toEqual(['L1::evt::p1', 'L1::evt::p2'])
    expect(out[0].rituals).toEqual(['Haldi', 'Mehendi'])
    expect(out[0].price).toBe(15000)
    expect(out[1].price).toBe(50000)
    // Each row carries only its own single package + the eventBased model.
    expect((out[0].event_packages as unknown[]).length).toBe(1)
    expect(out[0].photography_pricing_models).toEqual(['eventBased'])
  })

  it('keeps the base row (eventBased stripped) when hourly/guest also offered', () => {
    const mixed = { ...eventListing, photography_pricing_models: ['hourly', 'eventBased'], rate_card: { candidPhotographer: 3000 } }
    const out = expandEventPackageListings([mixed])
    expect(out).toHaveLength(3) // 2 package rows + base
    const base = out.find(r => r.id === 'L1')!
    expect(base.photography_pricing_models).toEqual(['hourly'])
    expect(base.event_packages).toEqual([])
  })

  it('leaves non-photography and already-expanded rows untouched, and is idempotent', () => {
    const other = { id: 'D1', category: 'Decor' }
    const once = expandEventPackageListings([eventListing, other])
    const twice = expandEventPackageListings(once)
    expect(twice).toEqual(once)
    expect(twice.some(r => r.id === 'D1')).toBe(true)
  })
})
