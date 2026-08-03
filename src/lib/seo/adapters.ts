import type { Vendor } from '../types'
import {
  formatINR, listingDisplayName, parseCapacityRange, getVenuePlateFromPrice,
  getPhotographyEventFromPrice, getMakeupFromPrice, getMehendiFromPrice,
} from '../helpers'
import { PHOTOGRAPHY_EVENT_SERVICES } from '../vendor-category-config'
import type { CategoryAdapter, SeoRow } from './types'

/**
 * One adapter per vendor category — the category's row shape, card specs and
 * UI-only filters. The landing-page shell is category-agnostic; everything
 * category-specific lives here.
 *
 * PAYWALL: every adapter labels a row with listingDisplayName(v, false), the
 * anonymous public code. No adapter reads v.name, so a business name cannot
 * reach a public page, its structured data, or its prerendered HTML.
 */

const label = (v: Vendor) => listingDisplayName(v, false)
const photo = (v: Vendor) => v.listingPhotos?.[0] || v.photo || ''
const cf = (v: Vendor, k: string): string => {
  const val = v.categoryFields?.[k]
  return typeof val === 'string' ? val : ''
}
const cfInt = (v: Vendor, k: string): number | null => {
  const n = parseInt(cf(v, k), 10)
  return Number.isFinite(n) ? n : null
}
const dash = (s: string | number | null | undefined) => (s == null || s === '' ? '—' : String(s))

/** Price band options shared by the money filters, scaled per category. */
const bands = (values: number[]) =>
  values.map((value) => ({ value, label: `Under ${formatINR(value)}` }))

/* ------------------------------------------------------------------ *
 * Venue
 * ------------------------------------------------------------------ */

export const venueAdapter: CategoryAdapter = {
  category: 'Venue',
  urlPrefix: 'venues',
  noun: 'wedding venue',
  nounPlural: 'wedding venues',
  toRow(v) {
    const plate = getVenuePlateFromPrice(v.platePackages)
    const pricePerPlate = plate > 0 ? plate : null
    const cap = parseCapacityRange(
      (v.categoryFields?.capacity as string | string[] | undefined) ?? v.capacity?.toString(),
    )
    const capacityMax = cap?.[1] ?? null
    const capacityMin = cap?.[0] ?? null
    const parking = cfInt(v, 'parkingSpots')
    const setting = cf(v, 'setting')
    const rooms = cf(v, 'complimentaryRooms') === 'Yes'
    const paidRooms = (v.paidRooms || []).reduce((s, r) => s + (r.count || 0), 0)
    // A bare legacy capacity parses to [0, n]; "0–300" reads like a bug.
    const capLabel = capacityMax == null ? '—' : capacityMin ? `${capacityMin}–${capacityMax}` : `Up to ${capacityMax}`

    const bits = [
      capacityMax ? `Seats up to ${capacityMax}` : '',
      setting === 'Both' ? 'Indoor & outdoor' : setting,
      cf(v, 'valetParking') === 'Yes' ? 'Valet' : parking ? `${parking} car parking` : '',
      rooms ? 'Complimentary rooms' : paidRooms ? `${paidRooms} guest rooms` : '',
    ].filter(Boolean)

    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: pricePerPlate ?? v.price ?? 0,
      priceUnit: pricePerPlate != null ? 'per plate' : 'venue rent',
      area: v.venueLocation?.area || v.area || '',
      summary: bits.slice(0, 4).join(' · '),
      specs: [
        ['Capacity', capLabel],
        ['Parking', parking != null ? `${parking} cars` : '—'],
        ['Type', dash(cf(v, 'venueType'))],
        ['Setting', dash(setting)],
        ['Food', dash(cf(v, 'foodPolicy'))],
        ['Alcohol', dash(cf(v, 'alcoholPolicy'))],
        ['Rooms', rooms ? `${cfInt(v, 'complimentaryRoomsCount') ?? 'Yes'} free` : paidRooms ? `${paidRooms} paid` : '—'],
        ['Outside catering', dash(cf(v, 'outsideCatering'))],
      ],
      facets: {
        price: pricePerPlate ?? v.price ?? 0,
        pricePerPlate,
        capacityMax, capacityMin,
        parkingSpots: parking,
        venueType: cf(v, 'venueType'),
        setting,
        foodPolicy: cf(v, 'foodPolicy'),
        alcoholPolicy: cf(v, 'alcoholPolicy'),
        outsideCatering: cf(v, 'outsideCatering'),
        valetParking: cf(v, 'valetParking') === 'Yes',
        complimentaryRooms: rooms,
        area: v.venueLocation?.area || v.area || '',
      },
    }
  },
  // Valet, rooms, parking, alcohol and outside catering are UI-only by policy —
  // useful to filter on, not worth an indexable page each.
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([800, 1000, 1250, 1500, 2000, 2500]) },
    { kind: 'min', key: 'capacityMax', label: 'Capacity', options: [100, 250, 500, 750, 1000, 1500].map((v) => ({ value: v, label: `${v}+ guests` })) },
    { kind: 'enum', key: 'area', label: 'Area' },
    { kind: 'enum', key: 'venueType', label: 'Venue type' },
    { kind: 'enum', key: 'setting', label: 'Setting', options: ['Indoor', 'Outdoor', 'Both'] },
    { kind: 'min', key: 'parkingSpots', label: 'Parking', options: [50, 100, 200, 300, 500].map((v) => ({ value: v, label: `${v}+ cars` })) },
    { kind: 'enum', key: 'foodPolicy', label: 'Food', options: ['Veg only', 'Non-veg allowed'] },
    { kind: 'enum', key: 'alcoholPolicy', label: 'Alcohol', options: ['Allowed', 'BYOB only', 'Not allowed'] },
    { kind: 'enum', key: 'outsideCatering', label: 'Outside catering', options: ['Allowed', 'In-house mandatory', 'Not allowed'] },
    { kind: 'bool', key: 'valetParking', label: 'Valet' },
    { kind: 'bool', key: 'complimentaryRooms', label: 'Free rooms' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'EventVenue',
}

/* ------------------------------------------------------------------ *
 * Photography — no listing spec fields exist for this category, so every
 * facet is derived from the per-event pricing cards, which are real data.
 * ------------------------------------------------------------------ */

const PHOTO_SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  PHOTOGRAPHY_EVENT_SERVICES.map((s) => [s.key, s.label]),
)

export const photographyAdapter: CategoryAdapter = {
  category: 'Photography',
  urlPrefix: 'photographers',
  noun: 'wedding photographer',
  nounPlural: 'wedding photographers',
  toRow(v) {
    const pkgs = v.eventPackages || []
    const from = getPhotographyEventFromPrice(pkgs)
    const offered = new Set<string>()
    for (const p of pkgs) {
      for (const [k, price] of Object.entries(p.prices || {})) if ((price ?? 0) > 0) offered.add(k)
    }
    const events = [...new Set(pkgs.flatMap((p) => p.events || []))]
    const durations = pkgs.map((p) => p.durationHours || 0).filter((n) => n > 0)
    const deliveries = pkgs.map((p) => p.deliveryDays || 0).filter((n) => n > 0)
    const services = [...offered].map((k) => PHOTO_SERVICE_LABEL[k] || k)

    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: from || v.price || 0,
      priceUnit: 'per event, from',
      area: v.area || '',
      summary: [
        services.length ? `${services.length} services priced` : '',
        events.length ? `${events.length} events covered` : '',
        durations.length ? `${Math.max(...durations)}h coverage` : '',
        deliveries.length ? `${Math.min(...deliveries)}-day delivery` : '',
      ].filter(Boolean).join(' · '),
      specs: [
        ['Candid photo', offered.has('candidPhotography') ? 'Yes' : '—'],
        ['Candid video', offered.has('candidVideography') ? 'Yes' : '—'],
        ['Traditional', offered.has('traditionalPhotography') ? 'Yes' : '—'],
        ['Drone', offered.has('drone') ? 'Yes' : '—'],
        ['Live streaming', offered.has('liveStreaming') ? 'Yes' : '—'],
        ['LED screens', offered.has('ledScreens') ? 'Yes' : '—'],
        ['Events covered', events.length ? String(events.length) : '—'],
        ['Delivery', deliveries.length ? `${Math.min(...deliveries)} days` : '—'],
      ],
      facets: {
        price: from || v.price || 0,
        candid: offered.has('candidPhotography') || offered.has('candidVideography'),
        traditional: offered.has('traditionalPhotography') || offered.has('traditionalVideography'),
        drone: offered.has('drone'),
        liveStreaming: offered.has('liveStreaming'),
        album: offered.has('album'),
        services,
        events,
        eventCount: events.length,
        deliveryDays: deliveries.length ? Math.min(...deliveries) : null,
        area: v.area || '',
      },
    }
  },
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([25000, 50000, 75000, 100000, 150000]) },
    { kind: 'includes', key: 'events', label: 'Event' },
    { kind: 'bool', key: 'candid', label: 'Candid' },
    { kind: 'bool', key: 'traditional', label: 'Traditional' },
    { kind: 'bool', key: 'drone', label: 'Drone' },
    { kind: 'bool', key: 'liveStreaming', label: 'Live streaming' },
    { kind: 'bool', key: 'album', label: 'Album' },
    { kind: 'enum', key: 'area', label: 'Area' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'Service',
}

/* ------------------------------------------------------------------ *
 * Makeup
 * ------------------------------------------------------------------ */

export const makeupAdapter: CategoryAdapter = {
  category: 'Makeup',
  urlPrefix: 'makeup-artists',
  noun: 'bridal makeup artist',
  nounPlural: 'bridal makeup artists',
  toRow(v) {
    const p = v.makeupPricing
    const from = getMakeupFromPrice(p)
    const groom = p?.groomPrice ?? 0
    const guest = p?.guestPricePerPerson ?? 0
    const addons = Object.entries(p?.addons || {}).filter(([, n]) => (n ?? 0) > 0).map(([k]) => k)
    const events = Object.entries(p?.bridalByEvent || {}).filter(([, n]) => (n ?? 0) > 0).map(([k]) => k)
    // makeupType is authored in a step that never renders today, so it is
    // usually blank — the pages that read it stay unindexed until it fills.
    const type = cf(v, 'makeupType')

    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: from || v.price || 0,
      priceUnit: 'per look, from',
      area: v.area || '',
      summary: [
        events.length ? `${events.length} bridal looks priced` : '',
        groom ? `Groom ${formatINR(groom)}` : '',
        guest ? `Guest ${formatINR(guest)}` : '',
        v.hairStylingPricing ? 'Hair styling' : '',
      ].filter(Boolean).join(' · '),
      specs: [
        ['Bridal from', from ? formatINR(from) : '—'],
        ['Groom', groom ? formatINR(groom) : '—'],
        ['Guest', guest ? formatINR(guest) : '—'],
        ['Looks priced', events.length ? String(events.length) : '—'],
        ['Type', dash(type)],
        ['Hair styling', v.hairStylingPricing ? 'Yes' : '—'],
        ['Draping', v.sareeDrapingPricing ? 'Yes' : '—'],
        ['Add-ons', addons.length ? String(addons.length) : '—'],
      ],
      facets: {
        price: from || v.price || 0,
        groomPrice: groom || null,
        guestPrice: guest || null,
        makeupType: type,
        airbrush: type.toLowerCase().includes('airbrush'),
        hd: type.toUpperCase().includes('HD'),
        hairStyling: !!v.hairStylingPricing,
        draping: !!v.sareeDrapingPricing,
        area: v.area || '',
      },
    }
  },
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([10000, 15000, 20000, 30000, 50000]) },
    { kind: 'max', key: 'guestPrice', label: 'Guest price', options: bands([1000, 2000, 3000, 5000]) },
    { kind: 'enum', key: 'makeupType', label: 'Makeup type' },
    { kind: 'bool', key: 'hairStyling', label: 'Hair styling' },
    { kind: 'bool', key: 'draping', label: 'Draping' },
    { kind: 'enum', key: 'area', label: 'Area' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'Service',
}

/* ------------------------------------------------------------------ *
 * Catering
 * ------------------------------------------------------------------ */

export const cateringAdapter: CategoryAdapter = {
  category: 'Catering',
  urlPrefix: 'caterers',
  noun: 'wedding caterer',
  nounPlural: 'wedding caterers',
  toRow(v) {
    const plate = getVenuePlateFromPrice(v.platePackages)
    const tiers = (v.platePackages || []).filter((p) => p.pricePerPlate > 0)
    const foodType = cf(v, 'foodType')
    const cuisines = Array.isArray(v.categoryFields?.cuisineTypes) ? (v.categoryFields.cuisineTypes as string[]) : []
    const dishes = (v.menu || []).reduce((s, sec) => s + sec.dishIds.length + (sec.customDishes?.length || 0), 0)

    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: plate || v.price || 0,
      priceUnit: 'per plate',
      area: v.area || '',
      summary: [
        tiers.length ? `${tiers.length} menu tiers` : '',
        foodType,
        cuisines.slice(0, 2).join(', '),
        dishes ? `${dishes} dishes` : '',
      ].filter(Boolean).join(' · '),
      specs: [
        ['From', plate ? formatINR(plate) : '—'],
        ['Menu tiers', tiers.length ? String(tiers.length) : '—'],
        ['Food type', dash(foodType)],
        ['Serving style', dash(cf(v, 'servingStyle'))],
        ['Min plates', dash(cf(v, 'minPlates'))],
        ['Max plates', dash(cf(v, 'maxPlates'))],
        ['Staff', dash(cf(v, 'staffIncluded'))],
        ['Dishes', dishes ? String(dishes) : '—'],
      ],
      facets: {
        price: plate || v.price || 0,
        foodType,
        veg: foodType === 'Veg only',
        nonVeg: foodType === 'Non-veg' || foodType === 'Veg & Non-veg',
        cuisines,
        servingStyle: cf(v, 'servingStyle'),
        staffIncluded: cf(v, 'staffIncluded'),
        dishCount: dishes || null,
        area: v.area || '',
      },
    }
  },
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([500, 800, 1000, 1500, 2000]) },
    { kind: 'enum', key: 'foodType', label: 'Food type', options: ['Veg only', 'Non-veg', 'Veg & Non-veg'] },
    { kind: 'includes', key: 'cuisines', label: 'Cuisine' },
    { kind: 'enum', key: 'servingStyle', label: 'Serving style', options: ['Buffet', 'Banti Bojanalu'] },
    { kind: 'enum', key: 'area', label: 'Area' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'Service',
}

/* ------------------------------------------------------------------ *
 * Decor
 * ------------------------------------------------------------------ */

export const decorAdapter: CategoryAdapter = {
  category: 'Decor',
  urlPrefix: 'decorators',
  noun: 'wedding decorator',
  nounPlural: 'wedding decorators',
  toRow(v) {
    const specialities = Array.isArray(v.categoryFields?.decorSpeciality) ? (v.categoryFields.decorSpeciality as string[]) : []
    const flowers = cf(v, 'flowerType')
    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: v.price || 0,
      priceUnit: 'from',
      area: v.area || '',
      summary: [
        cf(v, 'decorType'), flowers, cf(v, 'setupTeamSize'),
        specialities.slice(0, 2).join(', '),
      ].filter(Boolean).join(' · '),
      specs: [
        ['From', v.price ? formatINR(v.price) : '—'],
        ['Coverage', dash(cf(v, 'decorType'))],
        ['Flowers', dash(flowers)],
        ['Lighting', dash(cf(v, 'ledLighting'))],
        ['Setup team', dash(cf(v, 'setupTeamSize'))],
        ['Setup time', dash(cf(v, 'setupTime'))],
        ['Teardown', dash(cf(v, 'teardownIncluded'))],
        ['Props', dash(cf(v, 'propsIncluded'))],
      ],
      facets: {
        price: v.price || 0,
        decorType: cf(v, 'decorType'),
        flowerType: flowers,
        freshFlowers: flowers === 'Fresh flowers' || flowers === 'Mix of both',
        specialities,
        ledLighting: cf(v, 'ledLighting'),
        area: v.area || '',
      },
    }
  },
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([100000, 200000, 300000, 500000]) },
    { kind: 'enum', key: 'decorType', label: 'Coverage' },
    { kind: 'includes', key: 'specialities', label: 'Speciality' },
    { kind: 'bool', key: 'freshFlowers', label: 'Fresh flowers' },
    { kind: 'enum', key: 'area', label: 'Area' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'Service',
}

/* ------------------------------------------------------------------ *
 * Mehendi
 * ------------------------------------------------------------------ */

export const mehendiAdapter: CategoryAdapter = {
  category: 'Mehendi',
  urlPrefix: 'mehendi-artists',
  noun: 'bridal mehendi artist',
  nounPlural: 'bridal mehendi artists',
  toRow(v) {
    const p = v.mehendiPricing
    const from = getMehendiFromPrice(p)
    const guest = p?.guestPricePerPerson ?? 0
    const groom = p?.groomPrice ?? 0
    const combos = Object.values(p?.bridal || {}).reduce(
      (s, byDesign) => s + Object.values(byDesign || {}).filter((n) => (n ?? 0) > 0).length, 0,
    )
    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: from || v.price || 0,
      priceUnit: 'bridal, from',
      area: v.area || '',
      summary: [
        combos ? `${combos} bridal options priced` : '',
        guest ? `Guest ${formatINR(guest)}/person` : '',
        groom ? `Groom ${formatINR(groom)}` : '',
        p?.conesIncluded ? 'Cones included' : '',
      ].filter(Boolean).join(' · '),
      specs: [
        ['Bridal from', from ? formatINR(from) : '—'],
        ['Groom', groom ? formatINR(groom) : '—'],
        ['Guest / person', guest ? formatINR(guest) : '—'],
        ['Options priced', combos ? String(combos) : '—'],
        ['Cones', p?.conesIncluded ? 'Included' : '—'],
        ['Bridal offered', p?.bridalOffered ? 'Yes' : '—'],
        ['Area', dash(v.area)],
        ['Rating', v.rating ? v.rating.toFixed(1) : '—'],
      ],
      facets: {
        price: from || v.price || 0,
        guestPrice: guest || null,
        groomPrice: groom || null,
        groom: groom > 0,
        conesIncluded: !!p?.conesIncluded,
        area: v.area || '',
      },
    }
  },
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([5000, 10000, 15000, 25000]) },
    { kind: 'max', key: 'guestPrice', label: 'Guest price', options: bands([300, 500, 800, 1200]) },
    { kind: 'bool', key: 'groom', label: 'Groom mehendi' },
    { kind: 'bool', key: 'conesIncluded', label: 'Cones included' },
    { kind: 'enum', key: 'area', label: 'Area' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'Service',
}

/* ------------------------------------------------------------------ *
 * Invitations
 * ------------------------------------------------------------------ */

export const invitationsAdapter: CategoryAdapter = {
  category: 'Invitations',
  urlPrefix: 'wedding-invitations',
  noun: 'wedding invitation designer',
  nounPlural: 'wedding invitation designers',
  toRow(v) {
    const languages = Array.isArray(v.categoryFields?.languages) ? (v.categoryFields.languages as string[]) : []
    return {
      id: v.id, label: label(v), photo: photo(v), rating: v.rating || 0,
      price: v.price || 0,
      priceUnit: 'per card, from',
      area: v.area || '',
      summary: [
        cf(v, 'inviteType'), cf(v, 'minQty') ? `Min ${cf(v, 'minQty')}` : '',
        cf(v, 'deliveryTimeline'), languages.slice(0, 2).join(', '),
      ].filter(Boolean).join(' · '),
      specs: [
        ['From', v.price ? formatINR(v.price) : '—'],
        ['Type', dash(cf(v, 'inviteType'))],
        ['Design', dash(cf(v, 'design'))],
        ['Min order', dash(cf(v, 'minQty'))],
        ['Delivery', dash(cf(v, 'deliveryTimeline'))],
        ['Digital version', dash(cf(v, 'digitalVersion'))],
        ['Box packaging', dash(cf(v, 'boxPackaging'))],
        ['Languages', languages.length ? languages.join(', ') : '—'],
      ],
      facets: {
        price: v.price || 0,
        inviteType: cf(v, 'inviteType'),
        design: cf(v, 'design'),
        languages,
        digital: cf(v, 'digitalVersion') === 'Included',
        area: v.area || '',
      },
    }
  },
  filters: [
    { kind: 'max', key: 'price', label: 'Budget', options: bands([100, 250, 500, 1000]) },
    { kind: 'enum', key: 'inviteType', label: 'Type' },
    { kind: 'includes', key: 'languages', label: 'Language' },
    { kind: 'bool', key: 'digital', label: 'Digital version' },
    { kind: 'enum', key: 'area', label: 'Area' },
  ],
  compareRows: (r) => r.specs,
  schemaType: 'Service',
}

/* ------------------------------------------------------------------ */

export const ADAPTERS: CategoryAdapter[] = [
  venueAdapter, photographyAdapter, makeupAdapter,
  cateringAdapter, decorAdapter, mehendiAdapter, invitationsAdapter,
]

export function adapterByPrefix(prefix: string | undefined): CategoryAdapter | undefined {
  return ADAPTERS.find((a) => a.urlPrefix === prefix?.toLowerCase())
}

export function adapterByCategory(category: string): CategoryAdapter | undefined {
  return ADAPTERS.find((a) => a.category === category)
}

export type { SeoRow }
