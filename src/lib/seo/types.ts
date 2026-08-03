import type { Vendor } from '../types'

/**
 * Shared shape for every SEO landing page, across every vendor category.
 *
 * Curated search architecture: a landing page is a registry entry, never a
 * component. One shell renders all of them; a CategoryAdapter supplies the
 * category's row shape, its card specs and its UI-only filters.
 *
 * Free of React and browser APIs so the build-time prerenderer can import it.
 */

/** One vendor listing, flattened for the landing pages. */
export interface SeoRow {
  id: string
  /** Anonymous public code (e.g. "PK-VEN-0042-1"). NEVER the business name. */
  label: string
  photo: string
  rating: number
  /** Headline number shown on the card. */
  price: number
  /** Unit suffix for the headline, e.g. "per plate". */
  priceUnit: string
  area: string
  /** One-line summary under the price. */
  summary: string
  /** Card spec grid — label/value pairs, category-specific. */
  specs: [string, string][]
  /** The values page predicates and filters read. */
  facets: Record<string, string | number | boolean | string[] | null>
}

/** A UI-only filter. These never appear in the URL and never mint a page. */
export type FilterDef =
  /** Numeric facet must be <= the chosen value (price bands). */
  | { kind: 'max'; key: string; label: string; options: { value: number; label: string }[] }
  /** Numeric facet must be >= the chosen value (capacity, parking). */
  | { kind: 'min'; key: string; label: string; options: { value: number; label: string }[] }
  /** String facet equals the chosen value. Options derived from data when omitted. */
  | { kind: 'enum'; key: string; label: string; options?: string[] }
  /** String-array facet contains the chosen value. */
  | { kind: 'includes'; key: string; label: string; options?: string[] }
  /** Boolean facet must be true when the chip is on. */
  | { kind: 'bool'; key: string; label: string }

export type FilterValues = Record<string, string | number | boolean | undefined>

export interface CategoryAdapter {
  /** The vendor category in the database, e.g. "Venue". */
  category: string
  /** First URL segment, e.g. "venues" in /venues/hyderabad. */
  urlPrefix: string
  /** Singular and plural nouns used in generated copy. */
  noun: string
  nounPlural: string
  /** Flatten a vendor into a row. */
  toRow: (v: Vendor) => SeoRow
  /** The category's UI-only filters, in display order. */
  filters: FilterDef[]
  /** Rows to compare side by side, as spec label/value pairs. */
  compareRows: (r: SeoRow) => [string, string][]
  /** schema.org type for items in this category's ItemList. */
  schemaType: string
}

/* ------------------------------------------------------------------ *
 * Statistics — generic over facets, so FAQ copy can quote real numbers
 * for any category without the registry knowing the row shape.
 * ------------------------------------------------------------------ */

export interface NumericStat { min: number; max: number; avg: number; median: number }

export interface SeoStats {
  count: number
  minPrice: number | null
  maxPrice: number | null
  avgPrice: number | null
  /** Per numeric facet, e.g. num.capacityMax.max */
  num: Record<string, NumericStat>
  /** Per string/boolean facet: how many rows carry each value. */
  enumCounts: Record<string, Record<string, number>>
  /** Distinct areas present. */
  areas: string[]
}

export interface Faq { q: string; a: string }

export interface SeoPageDef {
  /** Vendor category this page draws from. */
  category: string
  /** URL segment after the city. Empty string = the category's city index. */
  slug: string
  /** Short label for breadcrumbs and related-link chips. */
  label: string
  h1: string
  title: string
  description: string
  intro: string
  /** The page's query. */
  match: (r: SeoRow) => boolean
  /** Seeds the filter bar so the UI agrees with the URL. */
  presetFilters?: FilterValues
  faqs: (s: SeoStats, city: string) => Faq[]
  /** Slugs of related pages in the same category. */
  related: string[]
  /**
   * Minimum results before this page may be indexed or enter the sitemap.
   * A curated architecture must not ship pages with nothing on them — below
   * this the page still resolves (so links and the UI work) but is noindex and
   * omitted from the sitemap. Defaults to MIN_INDEXABLE_RESULTS.
   */
  minResults?: number
}

/** Default floor for indexability. A page needs real stock to earn a place. */
export const MIN_INDEXABLE_RESULTS = 3

export function isIndexable(page: SeoPageDef, resultCount: number): boolean {
  return resultCount >= (page.minResults ?? MIN_INDEXABLE_RESULTS)
}

/* ------------------------------------------------------------------ *
 * Generic filtering + stats
 * ------------------------------------------------------------------ */

function facetNum(r: SeoRow, key: string): number | null {
  const v = r.facets[key]
  return typeof v === 'number' ? v : null
}

export function applyFilters(rows: SeoRow[], defs: FilterDef[], values: FilterValues): SeoRow[] {
  return rows.filter((r) =>
    defs.every((d) => {
      const val = values[d.key]
      if (val === undefined || val === '' || val === false) return true
      switch (d.kind) {
        case 'max': { const n = facetNum(r, d.key); return n != null && n <= Number(val) }
        case 'min': { const n = facetNum(r, d.key); return n != null && n >= Number(val) }
        case 'enum': return r.facets[d.key] === val
        case 'includes': {
          const arr = r.facets[d.key]
          return Array.isArray(arr) && arr.includes(String(val))
        }
        case 'bool': return r.facets[d.key] === true
      }
    }),
  )
}

function summarise(nums: number[]): NumericStat {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return {
    min: s[0],
    max: s[s.length - 1],
    avg: Math.round(s.reduce((a, b) => a + b, 0) / s.length),
    median: s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2),
  }
}

export function computeStats(rows: SeoRow[]): SeoStats {
  const prices = rows.map((r) => r.price).filter((n) => n > 0)
  const num: Record<string, NumericStat> = {}
  const enumCounts: Record<string, Record<string, number>> = {}

  // Collect numeric facet values, then summarise.
  const buckets: Record<string, number[]> = {}
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.facets)) {
      if (typeof v === 'number') (buckets[k] ??= []).push(v)
      else if (typeof v === 'string' && v) ((enumCounts[k] ??= {})[v] = (enumCounts[k][v] ?? 0) + 1)
      else if (typeof v === 'boolean') ((enumCounts[k] ??= {})[String(v)] = (enumCounts[k][String(v)] ?? 0) + 1)
      else if (Array.isArray(v)) for (const item of v) ((enumCounts[k] ??= {})[item] = (enumCounts[k][item] ?? 0) + 1)
    }
  }
  for (const [k, vals] of Object.entries(buckets)) if (vals.length) num[k] = summarise(vals)

  return {
    count: rows.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
    num,
    enumCounts,
    areas: [...new Set(rows.map((r) => r.area).filter(Boolean))].sort(),
  }
}

/**
 * Collapse fan-out rows back to one card per listing.
 *
 * The couple-side store fans a Photography listing into one pseudo-listing per
 * event package, and an Entertainer listing into one per priced event, so each
 * ritual board matches the right row. Those ids look like `<listingId>::evt::x`
 * and `<listingId>::ent::x`.
 *
 * That is wrong for a category landing page: one entertainer priced across five
 * events would appear five times and the hero would claim five vendors. This
 * regroups by the underlying listing, keeps the cheapest row as the "from"
 * price, and unions the array facets across the group so filters like Event
 * still see everything that vendor covers.
 */
export function collapseFanOut(rows: SeoRow[]): SeoRow[] {
  const groups = new Map<string, SeoRow[]>()
  for (const r of rows) {
    const baseId = r.id.split('::')[0]
    const g = groups.get(baseId)
    if (g) g.push(r)
    else groups.set(baseId, [r])
  }

  const out: SeoRow[] = []
  for (const [baseId, group] of groups) {
    if (group.length === 1) { out.push(group[0]); continue }

    const priced = group.filter((r) => r.price > 0)
    const rep = (priced.length ? priced : group).reduce((a, b) => (a.price <= b.price ? a : b))

    const facets: SeoRow['facets'] = { ...rep.facets }
    for (const [key, value] of Object.entries(rep.facets)) {
      if (!Array.isArray(value)) continue
      const merged = new Set<string>()
      for (const r of group) {
        const v = r.facets[key]
        if (Array.isArray(v)) v.forEach((x) => merged.add(String(x)))
      }
      facets[key] = [...merged]
    }
    out.push({ ...rep, id: baseId, facets })
  }
  return out
}

export type SeoSort = 'price-asc' | 'price-desc' | 'rating-desc'

export function sortRows(rows: SeoRow[], sort: SeoSort): SeoRow[] {
  const out = [...rows]
  switch (sort) {
    case 'price-desc': return out.sort((a, b) => b.price - a.price)
    case 'rating-desc': return out.sort((a, b) => b.rating - a.rating)
    default: return out.sort((a, b) => a.price - b.price)
  }
}
