import { describe, it, expect } from 'vitest'
import {
  buildPages, allSeoRoutes, getPage, getCity, seoPath, resolveCanonical, pagesForCategory,
} from '@/lib/seo/registry'
import { ADAPTERS, adapterByPrefix, venueAdapter, photographyAdapter, makeupAdapter } from '@/lib/seo/adapters'
import { applyFilters, computeStats, sortRows, isIndexable, MIN_INDEXABLE_RESULTS } from '@/lib/seo/types'
import { itemListLd } from '@/lib/useSeoHead'
import type { Vendor } from '@/lib/types'

/**
 * The curated architecture is only worth having if it stays curated. The first
 * test is the important one: it pins the exact set of indexable URLs, so adding
 * a page is a deliberate act that has to be made here too.
 */
const APPROVED_URLS = [
  '/venues/hyderabad',
  '/venues/hyderabad/under-1000-per-plate',
  '/venues/hyderabad/under-1500-per-plate',
  '/venues/hyderabad/gachibowli',
  '/venues/hyderabad/madhapur',
  '/venues/hyderabad/jubilee-hills',
  '/venues/hyderabad/banjara-hills',
  '/venues/hyderabad/outdoor',
  '/venues/hyderabad/banquet-halls',
  '/venues/hyderabad/farmhouses',
  '/venues/hyderabad/500-guests',
  '/venues/hyderabad/1000-guests',
  '/photographers/hyderabad',
  '/photographers/hyderabad/under-50000',
  '/photographers/hyderabad/under-100000',
  '/photographers/hyderabad/candid',
  '/photographers/hyderabad/drone',
  '/makeup-artists/hyderabad',
  '/makeup-artists/hyderabad/under-20000',
  '/makeup-artists/hyderabad/airbrush',
  '/makeup-artists/hyderabad/hd-makeup',
  '/caterers/hyderabad',
  '/caterers/hyderabad/under-1000-per-plate',
  '/caterers/hyderabad/veg',
  '/caterers/hyderabad/non-veg',
  '/decorators/hyderabad',
  '/decorators/hyderabad/under-2-lakhs',
  '/mehendi-artists/hyderabad',
  '/wedding-invitations/hyderabad',
]

function vendor(over: Partial<Vendor> = {}): Vendor {
  return {
    id: 'v1', code: 'Venue 001', publicCode: 'PK-VEN-1234-1',
    name: 'Sri Venkateswara Convention',   // must never surface publicly
    photo: '', style: '', area: 'Gachibowli', price: 400000, rating: 4.5,
    packageTier: '', likes: [], booked: false, amountPaid: 0, category: 'Venue',
    categoryFields: {
      venueType: 'Banquet Hall', setting: 'Indoor', capacity: ['200', '800'],
      parkingSpots: '150 cars', valetParking: 'Yes', complimentaryRooms: 'Yes',
      foodPolicy: 'Non-veg allowed', alcoholPolicy: 'Allowed', outsideCatering: 'Allowed',
    },
    platePackages: [{ id: 'p1', name: 'Silver', pricePerPlate: 900 }],
    ...over,
  } as Vendor
}

describe('curated SEO registry', () => {
  it('exposes exactly the approved URLs and nothing else', () => {
    const actual = allSeoRoutes().map((r) => r.path).sort()
    expect(actual).toEqual([...APPROVED_URLS].sort())
  })

  it('does not mint a page for any UI-only filter', () => {
    // These stay interactive filters by policy. If one ever becomes a page it
    // must be added to APPROVED_URLS deliberately, not appear by accident.
    const banned = ['valet', 'complimentary-rooms', 'bridal-suite', 'parking', 'alcohol', 'outside-catering', 'veg-only', 'indoor']
    const slugs = allSeoRoutes().map((r) => r.path)
    for (const b of banned) {
      expect(slugs.some((s) => s.includes(b))).toBe(false)
    }
  })

  it('keeps those filters available in the UI', () => {
    const keys = venueAdapter.filters.map((f) => f.key)
    for (const k of ['valetParking', 'complimentaryRooms', 'parkingSpots', 'alcoholPolicy', 'outsideCatering']) {
      expect(keys).toContain(k)
    }
  })

  it('gives every page unique H1, title, description and intro', () => {
    const pages = buildPages('Hyderabad')
    for (const field of ['h1', 'title', 'description', 'intro'] as const) {
      const values = pages.map((p) => p[field])
      expect(new Set(values).size).toBe(values.length)
    }
  })

  it('keeps meta descriptions within a sane length', () => {
    for (const p of buildPages('Hyderabad')) {
      expect(p.description.length).toBeGreaterThan(50)
      expect(p.description.length).toBeLessThanOrEqual(165)
    }
  })

  it('gives every page a distinct FAQ set', () => {
    const stats = computeStats([venueAdapter.toRow(vendor())])
    const firstQuestions = buildPages('Hyderabad').map((p) => p.faqs(stats, 'Hyderabad')[0]?.q)
    expect(firstQuestions.every(Boolean)).toBe(true)
    for (const p of buildPages('Hyderabad')) {
      expect(p.faqs(stats, 'Hyderabad').length).toBeGreaterThanOrEqual(3)
    }
  })

  it('never leaves a placeholder in generated FAQ copy, even with no results', () => {
    const empty = computeStats([])
    for (const p of buildPages('Hyderabad')) {
      for (const f of p.faqs(empty, 'Hyderabad')) {
        expect(f.a).not.toMatch(/undefined|NaN|null/)
      }
    }
  })

  it('resolves every related link to a real page in the same category', () => {
    for (const p of buildPages('Hyderabad')) {
      const siblings = new Set(pagesForCategory('Hyderabad', p.category).map((x) => x.slug))
      for (const rel of p.related) expect(siblings.has(rel)).toBe(true)
      expect(p.related).not.toContain(p.slug)
    }
  })

  it('resolves pages and cities from URL segments', () => {
    expect(getCity('hyderabad')?.name).toBe('Hyderabad')
    expect(adapterByPrefix('photographers')?.category).toBe('Photography')
    expect(adapterByPrefix('nope')).toBeUndefined()
    expect(getPage('Hyderabad', 'Venue', 'outdoor')?.h1).toContain('Outdoor')
    // A removed page must not resolve — these were dropped as non-curated.
    expect(getPage('Hyderabad', 'Venue', 'valet-parking')).toBeUndefined()
    expect(getPage('Hyderabad', 'Venue', 'in-gachibowli')).toBeUndefined()
  })

  it('builds paths correctly', () => {
    expect(seoPath('venues', 'hyderabad', '')).toBe('/venues/hyderabad')
    expect(seoPath('makeup-artists', 'hyderabad', 'airbrush')).toBe('/makeup-artists/hyderabad/airbrush')
  })
})

describe('indexability threshold', () => {
  const page = getPage('Hyderabad', 'Venue', 'outdoor')!

  it('withholds a page that has not earned its slot', () => {
    expect(isIndexable(page, 0)).toBe(false)
    expect(isIndexable(page, MIN_INDEXABLE_RESULTS - 1)).toBe(false)
    expect(isIndexable(page, MIN_INDEXABLE_RESULTS)).toBe(true)
  })

  it('lets a category index page through on a single listing', () => {
    const index = getPage('Hyderabad', 'Venue', '')!
    expect(index.minResults).toBe(1)
    expect(isIndexable(index, 1)).toBe(true)
  })
})

describe('canonical resolution', () => {
  const city = 'Hyderabad'
  const index = getPage(city, 'Venue', '')!

  it('canonicalises an unfiltered page to itself', () => {
    expect(resolveCanonical(city, 'hyderabad', index, {})).toBe('/venues/hyderabad')
  })

  it('promotes a filter state that matches a curated page', () => {
    // Filtering the index down to Gachibowli must not compete with the
    // Gachibowli landing page — it points at it.
    expect(resolveCanonical(city, 'hyderabad', index, { area: 'Gachibowli' }))
      .toBe('/venues/hyderabad/gachibowli')
    expect(resolveCanonical(city, 'hyderabad', index, { venueType: 'Farmhouse' }))
      .toBe('/venues/hyderabad/farmhouses')
  })

  it('falls back to the page it was reached from for uncurated combinations', () => {
    expect(resolveCanonical(city, 'hyderabad', index, { valetParking: true, alcoholPolicy: 'Allowed' }))
      .toBe('/venues/hyderabad')
  })
})

describe('adapters — paywall', () => {
  it('never carries a business name into any category row', () => {
    for (const a of ADAPTERS) {
      const row = a.toRow(vendor({ category: a.category }))
      expect(JSON.stringify(row)).not.toContain('Sri Venkateswara')
      expect(row.label).toBe('PK-VEN-1234-1')
    }
  })

  it('never leaks a name into ItemList structured data', () => {
    const rows = [venueAdapter.toRow(vendor())]
    const ld = JSON.stringify(itemListLd(rows, '/venues/hyderabad', 'Venues', 'EventVenue'))
    expect(ld).toContain('PK-VEN-1234-1')
    expect(ld).not.toContain('Sri Venkateswara')
  })
})

describe('adapters — extraction', () => {
  it('venue: reads price, capacity and parking off real-world shapes', () => {
    const r = venueAdapter.toRow(vendor())
    expect(r.price).toBe(900)
    expect(r.priceUnit).toBe('per plate')
    expect(r.facets.capacityMax).toBe(800)
    expect(r.facets.parkingSpots).toBe(150)   // "150 cars"
  })

  it('venue: a legacy bare capacity reads as an upper bound', () => {
    const r = venueAdapter.toRow(vendor({ categoryFields: { capacity: '300' } }))
    expect(r.facets.capacityMax).toBe(300)
    expect(r.specs.find(([k]) => k === 'Capacity')?.[1]).toBe('Up to 300')
  })

  it('photography: derives candid and drone from event-package prices', () => {
    const p = photographyAdapter.toRow(vendor({
      category: 'Photography',
      eventPackages: [{ id: 'e1', events: ['Pelli (Wedding)'], prices: { candidPhotography: 45000, drone: 15000 } }],
    }))
    expect(p.facets.candid).toBe(true)
    expect(p.facets.drone).toBe(true)
    expect(p.facets.traditional).toBe(false)
    expect(p.price).toBe(15000)   // cheapest priced service
  })

  it('photography: an unpriced service is not claimed as offered', () => {
    const p = photographyAdapter.toRow(vendor({
      category: 'Photography',
      eventPackages: [{ id: 'e1', events: ['Reception'], prices: { drone: 0, candidPhotography: 30000 } }],
    }))
    expect(p.facets.drone).toBe(false)
    expect(p.facets.candid).toBe(true)
  })

  it('makeup: reads the bridal from-price and add-on services', () => {
    const m = makeupAdapter.toRow(vendor({
      category: 'Makeup',
      makeupPricing: { bridalByEvent: { 'Bridal Makeup (Wedding)': 25000 }, groomPrice: 6000, guestPricePerPerson: 3500 },
      hairStylingPricing: { bridalPricePerLook: 8000 },
    }))
    expect(m.price).toBe(25000)
    expect(m.facets.groomPrice).toBe(6000)
    expect(m.facets.hairStyling).toBe(true)
  })
})

describe('generic filtering, sorting and stats', () => {
  const a = venueAdapter.toRow(vendor({ id: 'a', platePackages: [{ id: 'p', name: 'x', pricePerPlate: 700 }] }))
  const b = venueAdapter.toRow(vendor({
    id: 'b', area: 'Madhapur',
    platePackages: [{ id: 'p', name: 'x', pricePerPlate: 1500 }],
    categoryFields: { ...vendor().categoryFields, valetParking: 'No', setting: 'Outdoor' },
  }))
  const rows = [a, b]
  const defs = venueAdapter.filters

  it('applies max, min, enum and bool filters', () => {
    expect(applyFilters(rows, defs, { price: 1000 }).map((r) => r.id)).toEqual(['a'])
    expect(applyFilters(rows, defs, { capacityMax: 900 })).toHaveLength(0)
    expect(applyFilters(rows, defs, { area: 'Madhapur' }).map((r) => r.id)).toEqual(['b'])
    expect(applyFilters(rows, defs, { valetParking: true }).map((r) => r.id)).toEqual(['a'])
    expect(applyFilters(rows, defs, { setting: 'Outdoor' }).map((r) => r.id)).toEqual(['b'])
  })

  it('treats an unset filter as no constraint', () => {
    expect(applyFilters(rows, defs, {})).toHaveLength(2)
    expect(applyFilters(rows, defs, { price: undefined, valetParking: false })).toHaveLength(2)
  })

  it('sorts without mutating the input', () => {
    const before = rows.map((r) => r.id)
    expect(sortRows(rows, 'price-desc').map((r) => r.id)).toEqual(['b', 'a'])
    expect(rows.map((r) => r.id)).toEqual(before)
  })

  it('computes price and facet statistics', () => {
    const s = computeStats(rows)
    expect(s.count).toBe(2)
    expect(s.minPrice).toBe(700)
    expect(s.avgPrice).toBe(1100)
    expect(s.num.capacityMax.max).toBe(800)
    expect(s.enumCounts.setting.Outdoor).toBe(1)
    expect(s.areas).toEqual(['Gachibowli', 'Madhapur'])
  })

  it('survives an empty result set', () => {
    const s = computeStats([])
    expect(s.count).toBe(0)
    expect(s.minPrice).toBeNull()
    expect(s.num.capacityMax).toBeUndefined()
  })
})
