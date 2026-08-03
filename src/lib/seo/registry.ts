import { formatINR } from '../helpers'
import type { SeoPageDef, SeoStats, Faq, FilterValues } from './types'
import { ADAPTERS, adapterByPrefix } from './adapters'

/**
 * THE curated SEO registry.
 *
 * A page exists here only if it targets a real search with commercial intent,
 * helps a couple shortlist, and can be answered entirely from structured vendor
 * data. Filters that fail that test — valet parking, complimentary rooms,
 * bridal suite, parking, alcohol, outside catering — stay in the filter bar and
 * never mint a URL. See adapters.ts for the full UI-only filter sets.
 *
 * This is a curated architecture, not programmatic SEO: adding a page is a
 * deliberate act, and a page still has to clear MIN_INDEXABLE_RESULTS on real
 * data before it is allowed into the index or the sitemap.
 */

export interface CityDef { slug: string; name: string }
export const CITIES: CityDef[] = [{ slug: 'hyderabad', name: 'Hyderabad' }]
export function getCity(slug: string | undefined): CityDef | undefined {
  return CITIES.find((c) => c.slug === slug?.toLowerCase())
}

const rupees = (n: number | null | undefined) => (n == null ? '—' : formatINR(n))

/* ------------------------------------------------------------------ *
 * FAQ spine — three questions every page answers from its own result set.
 * ------------------------------------------------------------------ */

function spine(s: SeoStats, city: string, plural: string, unit: string): Faq[] {
  return [
    {
      q: `How many ${plural} are there in ${city}?`,
      a: s.count
        ? `We list ${s.count} ${plural} in ${city} right now. The count comes from the live database and changes as vendors join or update their pricing — it is not a number typed into an article.`
        : `We have no ${plural} listed in ${city} yet. New vendors are added weekly.`,
    },
    {
      q: `What do ${plural} cost in ${city}?`,
      a: s.minPrice != null
        ? `Across these ${s.count}, prices run from ${rupees(s.minPrice)} to ${rupees(s.maxPrice)} ${unit}, averaging ${rupees(s.avgPrice)}. Every card shows the vendor's own starting price so you can compare like with like rather than asking each one.`
        : `Pricing is shown per vendor on each card once listings are available for this search.`,
    },
    {
      q: `How do I shortlist and contact them?`,
      a: `Filter to what matters to you, add vendors to the comparison tray and read their specs side by side. Names and contact details stay hidden until you unlock — the shortlist is yours to build first, without a single sales call.`,
    },
  ]
}

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */

interface PageInput {
  category: string
  slug: string
  label: string
  h1: string
  title: string
  description: string
  intro: string
  match: SeoPageDef['match']
  presetFilters?: FilterValues
  extraFaqs?: (s: SeoStats, city: string) => Faq[]
  related: string[]
  minResults?: number
}

function page(p: PageInput, plural: string, unit: string): SeoPageDef {
  return {
    ...p,
    faqs: (s, city) => [...(p.extraFaqs?.(s, city) ?? []), ...spine(s, city, plural, unit)],
  }
}

/* ------------------------------------------------------------------ *
 * VENUES — 12 curated pages
 * ------------------------------------------------------------------ */

const VENUE_RELATED = ['', 'under-1000-per-plate', 'under-1500-per-plate', 'outdoor', 'banquet-halls', '500-guests']
const vRel = (self: string) => VENUE_RELATED.filter((s) => s !== self).slice(0, 5)

function venuePages(city: string): SeoPageDef[] {
  const P = (p: PageInput) => page(p, 'wedding venues', 'per plate')
  const priceBand = (limit: number): PageInput => ({
    category: 'Venue',
    slug: `under-${limit}-per-plate`,
    label: `Under ${formatINR(limit)} per plate`,
    h1: `Wedding Venues Under ${formatINR(limit)} Per Plate in ${city}`,
    title: `Wedding Venues Under ${formatINR(limit)} Per Plate in ${city} | Pellikart`,
    description: `Wedding venues in ${city} at or under ${formatINR(limit)} per plate. Compare capacity, parking, rooms and catering policy, then shortlist.`,
    intro: `Per-plate venues in ${city} at ${formatINR(limit)} a plate or less. The hall is free and you pay for food, so your total is the plate rate multiplied by your guest count.`,
    match: (r) => (r.facets.pricePerPlate as number | null) != null && (r.facets.pricePerPlate as number) <= limit,
    presetFilters: { price: limit },
    related: vRel(`under-${limit}-per-plate`),
    extraFaqs: (s) => [{
      q: `What is the average cost of wedding venues under ${formatINR(limit)} per plate?`,
      a: s.avgPrice != null
        ? `The ${s.count} venues here average ${rupees(s.avgPrice)} per plate, from ${rupees(s.minPrice)} to ${rupees(s.maxPrice)}. At 500 guests that is roughly ${rupees((s.avgPrice || 0) * 500)} for food alone, before decor or photography.`
        : `No venues are priced in this band right now. Try the next band up.`,
    }],
  })

  const area = (name: string): PageInput => ({
    category: 'Venue',
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    label: name,
    h1: `Wedding Venues in ${name}, ${city}`,
    title: `Wedding Venues in ${name}, ${city} — Compare Prices | Pellikart`,
    description: `Wedding venues in ${name}, ${city}. Compare per-plate price, capacity, parking and policies side by side.`,
    intro: `Wedding venues in ${name}. Location decides guest travel more than anything else on this page — a venue twenty minutes closer is worth real money in transport and goodwill.`,
    match: (r) => String(r.facets.area || '').toLowerCase() === name.toLowerCase(),
    presetFilters: { area: name },
    related: ['', 'gachibowli', 'madhapur', 'jubilee-hills', 'banjara-hills'].filter((s) => s !== name.toLowerCase().replace(/\s+/g, '-')).slice(0, 5),
  })

  const guests = (min: number): PageInput => ({
    category: 'Venue',
    slug: `${min}-guests`,
    label: `${min} guests`,
    h1: `Wedding Venues for ${min} Guests in ${city}`,
    title: `Wedding Venues for ${min} Guests in ${city} | Pellikart`,
    description: `Wedding venues in ${city} that can seat ${min} guests. Compare per-plate price, parking, rooms and catering policy.`,
    intro: `Venues in ${city} that can seat ${min} guests. Capacity removes more of a shortlist than price does, and it removes it permanently — so it is worth applying first.`,
    match: (r) => ((r.facets.capacityMax as number | null) ?? 0) >= min,
    presetFilters: { capacityMax: min },
    related: vRel(`${min}-guests`),
    extraFaqs: (s) => [{
      q: `What does a ${min}-guest wedding cost at these venues?`,
      a: s.avgPrice != null
        ? `On the average plate rate here, ${rupees(s.avgPrice)}, catering ${min} guests comes to about ${rupees((s.avgPrice || 0) * min)}. Venues charging rent quote the hall separately with catering on top.`
        : `Cost depends on whether the venue charges per plate or a flat rent. Each card shows which model applies.`,
    }],
  })

  return [
    P({
      category: 'Venue', slug: '', label: `All venues in ${city}`,
      h1: `Wedding Venues in ${city}`,
      title: `Wedding Venues in ${city} — Compare Prices & Capacity | Pellikart`,
      description: `Compare wedding venues in ${city} by per-plate price, capacity, parking and catering policy. Filter, shortlist and compare side by side.`,
      intro: `Every wedding venue we list in ${city}, with the numbers that decide it — per-plate price, capacity, parking, and the food and alcohol policies. Filter to a shortlist, then compare side by side.`,
      match: () => true,
      related: vRel(''),
      minResults: 1,
    }),
    P(priceBand(1000)),
    P(priceBand(1500)),
    P(area('Gachibowli')), P(area('Madhapur')), P(area('Jubilee Hills')), P(area('Banjara Hills')),
    P({
      category: 'Venue', slug: 'outdoor', label: 'Outdoor venues',
      h1: `Outdoor Wedding Venues in ${city}`,
      title: `Outdoor Wedding Venues in ${city} — Lawns & Farmhouses | Pellikart`,
      description: `Outdoor wedding venues in ${city} — lawns, farmhouses, rooftops and resorts. Compare per-plate price, capacity and parking.`,
      intro: `Venues in ${city} that can hold your function outdoors, including venues offering both, so you keep an indoor fallback if the weather turns.`,
      match: (r) => r.facets.setting === 'Outdoor' || r.facets.setting === 'Both',
      presetFilters: { setting: 'Outdoor' },
      related: vRel('outdoor'),
    }),
    P({
      category: 'Venue', slug: 'banquet-halls', label: 'Banquet halls',
      h1: `Banquet Halls for Weddings in ${city}`,
      title: `Banquet Halls for Weddings in ${city} — Prices & Capacity | Pellikart`,
      description: `Compare banquet halls for weddings in ${city} by per-plate price, guest capacity, parking and catering policy.`,
      intro: `Every venue in ${city} listed as a banquet hall, with price, capacity and parking on each card so you can compare like with like.`,
      match: (r) => r.facets.venueType === 'Banquet Hall',
      presetFilters: { venueType: 'Banquet Hall' },
      related: vRel('banquet-halls'),
    }),
    P({
      category: 'Venue', slug: 'farmhouses', label: 'Farmhouses',
      h1: `Farmhouses for Weddings in ${city}`,
      title: `Farmhouses for Weddings in ${city} — Prices & Capacity | Pellikart`,
      description: `Compare wedding farmhouses in ${city} by per-plate price, guest capacity, parking and outside-catering policy.`,
      intro: `Farmhouse venues in ${city}. Usually outdoor, usually further out, and usually the ones that allow an outside caterer — which is the biggest single lever on a wedding budget.`,
      match: (r) => r.facets.venueType === 'Farmhouse',
      presetFilters: { venueType: 'Farmhouse' },
      related: vRel('farmhouses'),
    }),
    P(guests(500)),
    P(guests(1000)),
  ]
}

/* ------------------------------------------------------------------ *
 * PHOTOGRAPHERS — 5 curated pages
 * ------------------------------------------------------------------ */

function photographyPages(city: string): SeoPageDef[] {
  const P = (p: PageInput) => page(p, 'wedding photographers', 'per event')
  const rel = (self: string) => ['', 'under-50000', 'under-100000', 'candid', 'drone'].filter((s) => s !== self).slice(0, 5)
  const band = (limit: number): PageInput => ({
    category: 'Photography',
    slug: `under-${limit}`,
    label: `Under ${formatINR(limit)}`,
    h1: `Wedding Photographers Under ${formatINR(limit)} in ${city}`,
    title: `Wedding Photographers Under ${formatINR(limit)} in ${city} | Pellikart`,
    description: `Wedding photographers in ${city} starting under ${formatINR(limit)} per event. Compare candid, traditional, drone and delivery time.`,
    intro: `Photographers in ${city} whose starting price is under ${formatINR(limit)}. Photography here is priced per event, not per hour — so the number on each card is what one function costs, and you add the functions you need.`,
    match: (r) => r.price > 0 && r.price <= limit,
    presetFilters: { price: limit },
    related: rel(`under-${limit}`),
    extraFaqs: (s) => [{
      q: `What does a wedding photographer cost in ${city}?`,
      a: s.minPrice != null
        ? `These ${s.count} start between ${rupees(s.minPrice)} and ${rupees(s.maxPrice)} for a single event, averaging ${rupees(s.avgPrice)}. A full wedding usually means several events, so multiply by the functions you want covered rather than reading the starting price as a total.`
        : `Photographers price per event. Each card shows their starting price.`,
    }],
  })
  return [
    P({
      category: 'Photography', slug: '', label: `All photographers in ${city}`,
      h1: `Wedding Photographers in ${city}`,
      title: `Wedding Photographers in ${city} — Compare Prices | Pellikart`,
      description: `Compare wedding photographers in ${city} by price per event, candid and traditional coverage, drone, live streaming and delivery time.`,
      intro: `Every wedding photographer we list in ${city}. Priced per event, with the services each one actually offers — candid, traditional, drone, live streaming — shown on the card rather than buried in a package PDF.`,
      match: () => true,
      related: rel(''),
      minResults: 1,
    }),
    P(band(50000)),
    P(band(100000)),
    P({
      category: 'Photography', slug: 'candid', label: 'Candid photography',
      h1: `Candid Wedding Photographers in ${city}`,
      title: `Candid Wedding Photographers in ${city} — Compare Prices | Pellikart`,
      description: `Wedding photographers in ${city} who price candid photography or candid videography. Compare rates, events covered and delivery time.`,
      intro: `Photographers in ${city} who price candid work explicitly. This list is built from what each photographer actually charges for candid coverage, not from a style label they picked in a dropdown.`,
      match: (r) => r.facets.candid === true,
      presetFilters: { candid: true },
      related: rel('candid'),
      extraFaqs: () => [{
        q: 'What is the difference between candid and traditional photography?',
        a: 'Traditional is posed and planned — family groups, the stage, the rituals shot head on. Candid is unposed, following reactions and moments as they happen. Most couples book both, and most photographers here price them as separate line items, so you can see exactly what each costs.',
      }],
    }),
    P({
      category: 'Photography', slug: 'drone', label: 'Drone coverage',
      h1: `Wedding Photographers with Drone in ${city}`,
      title: `Wedding Photographers with Drone Coverage in ${city} | Pellikart`,
      description: `Wedding photographers in ${city} who offer drone coverage, with the drone price listed separately. Compare rates and services.`,
      intro: `Photographers in ${city} who price drone coverage. Drone is almost always a separate charge rather than part of the package — these are the vendors who have put a number on it.`,
      match: (r) => r.facets.drone === true,
      presetFilters: { drone: true },
      related: rel('drone'),
      extraFaqs: () => [{
        q: 'Is drone coverage included in a photography package?',
        a: 'Usually not. It is priced separately by almost every photographer on Pellikart, which is why it has its own line on the card. Check your venue too — indoor halls and some areas near the airport restrict flying.',
      }],
    }),
  ]
}

/* ------------------------------------------------------------------ *
 * MAKEUP — 4 curated pages
 * ------------------------------------------------------------------ */

function makeupPages(city: string): SeoPageDef[] {
  const P = (p: PageInput) => page(p, 'bridal makeup artists', 'per look')
  const rel = (self: string) => ['', 'under-20000', 'airbrush', 'hd-makeup'].filter((s) => s !== self)
  return [
    P({
      category: 'Makeup', slug: '', label: `All makeup artists in ${city}`,
      h1: `Bridal Makeup Artists in ${city}`,
      title: `Bridal Makeup Artists in ${city} — Compare Prices | Pellikart`,
      description: `Compare bridal makeup artists in ${city} by price per look, groom and guest rates, hair styling and draping.`,
      intro: `Every bridal makeup artist we list in ${city}, priced per look. Groom and guest rates are shown separately, because that is where a booking quietly doubles.`,
      match: () => true,
      related: rel(''),
      minResults: 1,
    }),
    P({
      category: 'Makeup', slug: 'under-20000', label: 'Under ₹20,000',
      h1: `Bridal Makeup Artists Under ₹20,000 in ${city}`,
      title: `Bridal Makeup Artists Under ₹20,000 in ${city} | Pellikart`,
      description: `Bridal makeup artists in ${city} starting under ₹20,000 per look. Compare groom and guest rates, hair styling and draping.`,
      intro: `Makeup artists in ${city} whose bridal rate starts under ₹20,000 a look. Remember the wedding is rarely one look — most brides book two or three across the functions.`,
      match: (r) => r.price > 0 && r.price <= 20000,
      presetFilters: { price: 20000 },
      related: rel('under-20000'),
      extraFaqs: (s) => [{
        q: `What does bridal makeup cost in ${city}?`,
        a: s.minPrice != null
          ? `These ${s.count} start from ${rupees(s.minPrice)} to ${rupees(s.maxPrice)} per look, averaging ${rupees(s.avgPrice)}. Guest makeup is charged per person on top, and a trial is often extra — both are on the card.`
          : `Bridal makeup is priced per look. Each card shows the artist's starting rate.`,
      }],
    }),
    P({
      category: 'Makeup', slug: 'airbrush', label: 'Airbrush makeup',
      h1: `Airbrush Bridal Makeup Artists in ${city}`,
      title: `Airbrush Bridal Makeup Artists in ${city} | Pellikart`,
      description: `Bridal makeup artists in ${city} offering airbrush makeup. Compare price per look, groom and guest rates and hair styling.`,
      intro: `Makeup artists in ${city} who list airbrush. Airbrush sits lighter and lasts longer under lights and heat, which is why it is the usual choice for a long muhurtham day.`,
      match: (r) => r.facets.airbrush === true,
      presetFilters: { makeupType: 'Airbrush' },
      related: rel('airbrush'),
      extraFaqs: () => [{
        q: 'Is airbrush better than HD makeup?',
        a: 'Neither is strictly better. Airbrush is applied as a fine mist, sits lighter and tends to last longer in heat, which suits a long outdoor function. HD is applied conventionally and gives heavier, more buildable coverage that photographs densely. Ask for a trial in daylight and in artificial light before deciding.',
      }],
    }),
    P({
      category: 'Makeup', slug: 'hd-makeup', label: 'HD makeup',
      h1: `HD Bridal Makeup Artists in ${city}`,
      title: `HD Bridal Makeup Artists in ${city} | Pellikart`,
      description: `Bridal makeup artists in ${city} offering HD makeup. Compare price per look, groom and guest rates and hair styling.`,
      intro: `Makeup artists in ${city} who list HD makeup — heavier, buildable coverage that holds up under a photographer's lighting.`,
      match: (r) => r.facets.hd === true,
      presetFilters: { makeupType: 'HD' },
      related: rel('hd-makeup'),
    }),
  ]
}

/* ------------------------------------------------------------------ *
 * CATERERS — 4 curated pages
 * ------------------------------------------------------------------ */

function cateringPages(city: string): SeoPageDef[] {
  const P = (p: PageInput) => page(p, 'wedding caterers', 'per plate')
  const rel = (self: string) => ['', 'under-1000-per-plate', 'veg', 'non-veg'].filter((s) => s !== self)
  return [
    P({
      category: 'Catering', slug: '', label: `All caterers in ${city}`,
      h1: `Wedding Caterers in ${city}`,
      title: `Wedding Caterers in ${city} — Compare Per-Plate Prices | Pellikart`,
      description: `Compare wedding caterers in ${city} by per-plate price, cuisine, food type, serving style and menu size.`,
      intro: `Every wedding caterer we list in ${city}, priced per plate with their menu tiers laid out. Your total is the plate rate multiplied by your final headcount.`,
      match: () => true,
      related: rel(''),
      minResults: 1,
    }),
    P({
      category: 'Catering', slug: 'under-1000-per-plate', label: 'Under ₹1,000 per plate',
      h1: `Wedding Caterers Under ₹1,000 Per Plate in ${city}`,
      title: `Wedding Caterers Under ₹1,000 Per Plate in ${city} | Pellikart`,
      description: `Wedding caterers in ${city} at or under ₹1,000 per plate. Compare cuisine, menu size, staff and crockery inclusions.`,
      intro: `Caterers in ${city} at ₹1,000 a plate or less. At 500 guests that is a ceiling of ₹5,00,000 on food — the single largest line in most wedding budgets.`,
      match: (r) => r.price > 0 && r.price <= 1000,
      presetFilters: { price: 1000 },
      related: rel('under-1000-per-plate'),
    }),
    P({
      category: 'Catering', slug: 'veg', label: 'Pure veg caterers',
      h1: `Pure Veg Wedding Caterers in ${city}`,
      title: `Pure Veg Wedding Caterers in ${city} — Compare Prices | Pellikart`,
      description: `Pure vegetarian wedding caterers in ${city}. Compare per-plate price, cuisine, serving style and menu size.`,
      intro: `Caterers in ${city} who serve vegetarian food only. Worth filtering early — a caterer's food policy is rarely negotiable, so it belongs at the top of your funnel.`,
      match: (r) => r.facets.veg === true,
      presetFilters: { foodType: 'Veg only' },
      related: rel('veg'),
    }),
    P({
      category: 'Catering', slug: 'non-veg', label: 'Non-veg caterers',
      h1: `Non-Veg Wedding Caterers in ${city}`,
      title: `Non-Veg Wedding Caterers in ${city} — Compare Prices | Pellikart`,
      description: `Wedding caterers in ${city} serving non-vegetarian menus. Compare per-plate price, cuisine, biryani options and menu size.`,
      intro: `Caterers in ${city} who serve non-vegetarian menus, including those doing both. Check whether biryani is inside the plate rate or priced on top — it is the most common gap between a quote and a bill.`,
      match: (r) => r.facets.nonVeg === true,
      related: rel('non-veg'),
    }),
  ]
}

/* ------------------------------------------------------------------ *
 * DECORATORS — 2 curated pages
 * ------------------------------------------------------------------ */

function decorPages(city: string): SeoPageDef[] {
  const P = (p: PageInput) => page(p, 'wedding decorators', 'per setup')
  return [
    P({
      category: 'Decor', slug: '', label: `All decorators in ${city}`,
      h1: `Wedding Decorators in ${city}`,
      title: `Wedding Decorators in ${city} — Compare Prices | Pellikart`,
      description: `Compare wedding decorators in ${city} by starting price, coverage, fresh vs artificial flowers, lighting and setup team size.`,
      intro: `Every wedding decorator we list in ${city}, with what each setup actually covers — full venue, stage only or mandap — and whether the flowers are fresh.`,
      match: () => true,
      related: ['under-2-lakhs'],
      minResults: 1,
    }),
    P({
      category: 'Decor', slug: 'under-2-lakhs', label: 'Under ₹2 lakhs',
      h1: `Wedding Decorators Under ₹2 Lakhs in ${city}`,
      title: `Wedding Decorators Under ₹2 Lakhs in ${city} | Pellikart`,
      description: `Wedding decorators in ${city} starting under ₹2,00,000. Compare coverage, flowers, lighting and setup time.`,
      intro: `Decorators in ${city} starting under ₹2,00,000. What moves this number most is fresh versus reusable flowers and how much of the venue you are dressing — both shown on every card.`,
      match: (r) => r.price > 0 && r.price <= 200000,
      presetFilters: { price: 200000 },
      related: [''],
    }),
  ]
}

/* ------------------------------------------------------------------ *
 * MEHENDI + INVITATIONS — 1 curated page each
 * ------------------------------------------------------------------ */

function mehendiPages(city: string): SeoPageDef[] {
  return [page({
    category: 'Mehendi', slug: '', label: `All mehendi artists in ${city}`,
    h1: `Bridal Mehendi Artists in ${city}`,
    title: `Bridal Mehendi Artists in ${city} — Compare Prices | Pellikart`,
    description: `Compare bridal mehendi artists in ${city} by bridal price, guest rate per person, groom mehendi and design coverage.`,
    intro: `Every bridal mehendi artist we list in ${city}. Bridal work is priced by coverage and design, guests are priced per person — both are on the card, because guest mehendi is what turns a ₹10,000 booking into a ₹40,000 one.`,
    match: () => true,
    related: [],
    minResults: 1,
    extraFaqs: (s) => [{
      q: `How much does bridal mehendi cost in ${city}?`,
      a: s.minPrice != null
        ? `Bridal work here starts between ${rupees(s.minPrice)} and ${rupees(s.maxPrice)}, averaging ${rupees(s.avgPrice)}. The price depends on coverage — hands only, legs only, or both — and on whether the design is simple, Arabic or heavy bridal. Guest mehendi is charged per person on top.`
        : `Bridal mehendi is priced by coverage and design. Each card shows the artist's starting price.`,
    }],
  }, 'bridal mehendi artists', 'for bridal work')]
}

function invitationPages(city: string): SeoPageDef[] {
  return [page({
    category: 'Invitations', slug: '', label: `All invitation designers in ${city}`,
    h1: `Wedding Invitation Designers in ${city}`,
    title: `Wedding Invitation Cards in ${city} — Compare Prices | Pellikart`,
    description: `Compare wedding invitation designers in ${city} by price per card, type, minimum order, languages and delivery time.`,
    intro: `Wedding invitation designers in ${city}, priced per card with minimum orders and delivery timelines shown. Printing cannot start until your lagna patrika exists, so check delivery time against your date before you choose.`,
    match: () => true,
    related: [],
    minResults: 1,
  }, 'wedding invitation designers', 'per card')]
}

/* ------------------------------------------------------------------ *
 * REMAINING CATEGORIES — one city index each.
 *
 * These get an index page and nothing below it. Splitting a category with
 * single-digit stock into price bands would be exactly the programmatic SEO
 * this architecture exists to avoid: the sub-pages would all return the same
 * handful of vendors and compete with their own parent. Sub-pages get added
 * per category when the catalogue earns them.
 * ------------------------------------------------------------------ */

interface IndexInput {
  category: string
  plural: string
  unit: string
  h1: string
  title: string
  description: string
  intro: string
  extraFaqs?: (s: SeoStats, city: string) => Faq[]
}

function categoryIndex(i: IndexInput, city: string): SeoPageDef {
  return page({
    category: i.category,
    slug: '',
    label: `All ${i.plural} in ${city}`,
    h1: i.h1, title: i.title, description: i.description, intro: i.intro,
    match: () => true,
    related: [],
    minResults: 1,
    extraFaqs: i.extraFaqs,
  }, i.plural, i.unit)
}

function remainingPages(city: string): SeoPageDef[] {
  return [
    categoryIndex({
      category: 'Pandit', plural: 'wedding purohits', unit: 'per ceremony',
      h1: `Wedding Purohits in ${city}`,
      title: `Wedding Purohits & Pandits in ${city} — Compare Prices | Pellikart`,
      description: `Compare wedding purohits in ${city} by price per ceremony, rituals covered, number of purohits and whether transport is included.`,
      intro: `Purohits in ${city}, priced per ceremony with the rituals each one performs listed out. Duration often varies by community, so the card says so rather than quoting a number that will not hold.`,
      extraFaqs: (s) => [{
        q: `How much does a purohit charge for a wedding in ${city}?`,
        a: s.minPrice != null
          ? `These ${s.count} start between ${rupees(s.minPrice)} and ${rupees(s.maxPrice)} for a ceremony, averaging ${rupees(s.avgPrice)}. Ask separately whether pooja samagri is included — it is the most common addition to a quoted price.`
          : `Purohits price per ceremony. Each card shows the starting price and the rituals covered.`,
      }],
    }, city),

    categoryIndex({
      category: 'Banjantrilu', plural: 'traditional wedding bands', unit: 'per event',
      h1: `Nadaswaram & Traditional Wedding Bands in ${city}`,
      title: `Nadaswaram & Wedding Bands in ${city} — Compare Prices | Pellikart`,
      description: `Compare traditional wedding bands in ${city} by price per event, instruments, ensemble size and ceremonies covered.`,
      intro: `Nadaswaram, sannai, dhol and tavil ensembles in ${city}, priced per event. The card shows how many artists play and which ceremonies they cover, because a baraat and a muhurtham are not the same booking.`,
    }, city),

    categoryIndex({
      category: 'Live Stalls', plural: 'wedding live stalls', unit: 'per stall',
      h1: `Live Stalls for Weddings in ${city}`,
      title: `Live Stalls for Weddings in ${city} — Compare Prices | Pellikart`,
      description: `Compare live stalls for weddings in ${city} — caricatures, portraits, bangles, tattoos and more. Price, guests served and setup needed.`,
      intro: `Live entertainment stalls in ${city}. Some charge a flat price for the stall, others per guest — the card says which, along with how many guests they can serve an hour and what the venue has to provide.`,
    }, city),

    categoryIndex({
      category: 'Hosts / Entertainers', plural: 'wedding entertainers', unit: 'per event',
      h1: `Wedding Anchors & Entertainers in ${city}`,
      title: `Wedding Anchors & Entertainers in ${city} — Compare Prices | Pellikart`,
      description: `Compare wedding anchors, magicians, comedians and performers in ${city} by price per event, languages, duration and events covered.`,
      intro: `Anchors, magicians, comedians and performers in ${city}, priced per event. Languages are on every card — for a Telugu wedding with guests flying in, a bilingual anchor is usually the booking that matters.`,
    }, city),

    categoryIndex({
      category: 'DJ / Music', plural: 'wedding DJs and bands', unit: 'per event',
      h1: `Wedding DJs & Live Bands in ${city}`,
      title: `Wedding DJs & Live Bands in ${city} — Compare Prices | Pellikart`,
      description: `Compare wedding DJs and live bands in ${city} by price, performance hours, genres, sound system and emcee availability.`,
      intro: `DJs, live bands and dhol players in ${city}. Check the sound coverage against your venue size and the venue's music curfew — a 10 PM cut-off changes what you are buying.`,
    }, city),

    categoryIndex({
      category: 'Reels', plural: 'wedding reel creators', unit: 'per package',
      h1: `Wedding Reel Creators in ${city}`,
      title: `Wedding Reel & Short-Form Video Creators in ${city} | Pellikart`,
      description: `Compare wedding reel creators in ${city} by price, number of reels, turnaround time, drone footage and same-day edits.`,
      intro: `Reel and short-form video creators in ${city}. Turnaround is the number that matters here — a reel delivered three weeks late has missed its moment entirely.`,
    }, city),

    categoryIndex({
      category: 'Saree Draping', plural: 'saree draping artists', unit: 'per drape',
      h1: `Saree Draping Artists in ${city}`,
      title: `Bridal Saree Draping Artists in ${city} — Compare Prices | Pellikart`,
      description: `Compare saree draping artists in ${city} by price per drape, styles offered, guest rates and pre-pleating service.`,
      intro: `Saree draping artists in ${city}, priced per drape. Bridal, groom panche and guest rates are listed separately, along with the styles each artist actually drapes.`,
    }, city),

    categoryIndex({
      category: 'Wedding Props', plural: 'wedding prop suppliers', unit: 'per item',
      h1: `Wedding Props & Decor Items in ${city}`,
      title: `Wedding Props & Traditional Items in ${city} | Pellikart`,
      description: `Compare wedding prop suppliers in ${city} — aduthera, pelli butta, kalasham sets and more. Price, material, rental or sale.`,
      intro: `Traditional wedding props in ${city} — aduthera, pelli butta, pelli pendiri, kalasham sets and photo-booth pieces. Each card says whether it is for rent or sale and who handles delivery.`,
    }, city),
  ]
}

/* ------------------------------------------------------------------ *
 * Assembly + lookup
 * ------------------------------------------------------------------ */

export function buildPages(cityName: string): SeoPageDef[] {
  return [
    ...venuePages(cityName),
    ...photographyPages(cityName),
    ...makeupPages(cityName),
    ...cateringPages(cityName),
    ...decorPages(cityName),
    ...mehendiPages(cityName),
    ...invitationPages(cityName),
    ...remainingPages(cityName),
  ]
}

export function pagesForCategory(cityName: string, category: string): SeoPageDef[] {
  return buildPages(cityName).filter((p) => p.category === category)
}

export function getPage(cityName: string, category: string, slug: string | undefined): SeoPageDef | undefined {
  return pagesForCategory(cityName, category).find((p) => p.slug === (slug || '').toLowerCase())
}

export function seoPath(urlPrefix: string, citySlug: string, slug: string): string {
  return slug ? `/${urlPrefix}/${citySlug}/${slug}` : `/${urlPrefix}/${citySlug}`
}

/** Every curated route — the sitemap and prerenderer iterate this. */
export function allSeoRoutes(): { city: CityDef; page: SeoPageDef; urlPrefix: string; path: string }[] {
  return CITIES.flatMap((city) =>
    buildPages(city.name).map((page) => {
      const prefix = ADAPTERS.find((a) => a.category === page.category)!.urlPrefix
      return { city, page, urlPrefix: prefix, path: seoPath(prefix, city.slug, page.slug) }
    }),
  )
}

/**
 * Canonical target for a given filter state.
 *
 * Filters never appear in the URL, so a filtered view is already canonicalised
 * to its page. This additionally promotes a filter state that exactly matches
 * another curated page's preset — e.g. filtering the venue index down to
 * Gachibowli canonicalises to /venues/hyderabad/gachibowli rather than
 * competing with it. Anything else canonicalises to the page it was reached
 * from, which is the closest curated ancestor by construction.
 */
export function resolveCanonical(
  cityName: string, citySlug: string, current: SeoPageDef, active: FilterValues,
): string {
  const prefix = ADAPTERS.find((a) => a.category === current.category)!.urlPrefix
  const activeEntries = Object.entries(active).filter(([, v]) => v !== undefined && v !== '' && v !== false)
  if (activeEntries.length === 0) return seoPath(prefix, citySlug, current.slug)

  for (const candidate of pagesForCategory(cityName, current.category)) {
    const preset = Object.entries(candidate.presetFilters ?? {})
    if (preset.length !== activeEntries.length || preset.length === 0) continue
    if (preset.every(([k, v]) => String(active[k]) === String(v))) {
      return seoPath(prefix, citySlug, candidate.slug)
    }
  }
  return seoPath(prefix, citySlug, current.slug)
}

export { adapterByPrefix }
