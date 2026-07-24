import type { Vendor, RitualBoard, ActivePackage } from './types'

/**
 * The bundle discount applied to an auto-generated package: this fraction is taken
 * off the whole bundle total, so the package price = summed "from" prices ×
 * (1 − discountPct). Single knob — change it here to re-price every package.
 */
export const PACKAGE_DISCOUNT_PCT = 0.05

/** A package offer computed from the currently-loaded vendors (not persisted). */
export interface PackageDeal {
  id: string
  name: string
  tagline: string
  /** Listing ids of the member vendors — one per category the package spans. */
  memberListingIds: string[]
  /** Summed individual "from" price of the members. */
  value: number
  /** Discounted package price. */
  price: number
  /** value − price. */
  savings: number
  /** The bundle discount fraction applied. */
  discountPct: number
}

/**
 * The categories a package tries to span, in display order. Only those present on
 * the couple's board (with at least one available vendor) are actually used — so a
 * package never references a category the couple can't see.
 */
const CORE_CATEGORIES = ['Venue', 'Catering', 'Decor', 'Photography', 'Makeup']

type SortKey = 'priceAsc' | 'priceDesc' | 'ratingDesc' | 'value'

interface Recipe {
  id: string
  name: string
  tagline: string
  /** How to rank each category's vendors. */
  sort: SortKey
  /** Which rank to pick from the sorted list (clamped to the last vendor). */
  offset?: number
  /** Pick the middle-ranked vendor instead of an offset. */
  mid?: boolean
}

// A spread of "recipes" so a board with a decent vendor pool yields up to 10
// visibly different packages. Order here is the display order in the carousel.
const RECIPES: Recipe[] = [
  { id: 'saver', name: 'Smart Saver', tagline: 'Lowest price in every category', sort: 'priceAsc', offset: 0 },
  { id: 'value', name: 'Best Value', tagline: 'The most for your money', sort: 'value', offset: 0 },
  { id: 'toprated', name: 'Top Rated', tagline: 'Highest-rated vendors all round', sort: 'ratingDesc', offset: 0 },
  { id: 'classic', name: 'Classic', tagline: 'A balanced, safe choice', sort: 'priceAsc', mid: true },
  { id: 'crowd', name: 'Crowd Favourite', tagline: 'Loved by other couples', sort: 'ratingDesc', offset: 1 },
  { id: 'budget', name: 'Budget Plus', tagline: 'Smart picks, easy on the wallet', sort: 'priceAsc', offset: 1 },
  { id: 'editors', name: "Editor's Pick", tagline: 'Our hand-balanced favourite', sort: 'value', offset: 1 },
  { id: 'luxe', name: 'Luxe', tagline: 'A touch of premium throughout', sort: 'priceDesc', offset: 1 },
  { id: 'platinum', name: 'Platinum', tagline: 'All-premium, no compromises', sort: 'priceDesc', offset: 0 },
  { id: 'essentials', name: 'Essentials', tagline: 'Everything you need, sorted', sort: 'priceAsc', offset: 2 },
]

/**
 * A member's contribution to a package total. For a per-plate venue (perPlate
 * pricing and not rent) with a known guest count, that's the per-plate rate ×
 * guests — matching the "from total" shown on the venue card; otherwise the flat
 * price. Mirrors the perPlateOnly logic in CategoryCard.
 */
export function memberEffectivePrice(v: Vendor, guests = 0): number {
  const perPlate =
    v.category === 'Venue' &&
    !!v.venuePricingModels?.includes('perPlate') &&
    !v.venuePricingModels?.includes('rent')
  return perPlate && guests > 0 ? v.price * guests : v.price
}

function sortVendors(list: Vendor[], key: SortKey, guests = 0): Vendor[] {
  // Rank by each vendor's effective total (per-plate venues = rate × guests), so
  // "cheapest"/"best value" reflect the real bundle cost, not a per-plate rate.
  const p = (v: Vendor) => memberEffectivePrice(v, guests)
  const s = [...list]
  if (key === 'priceAsc') s.sort((a, b) => p(a) - p(b) || b.rating - a.rating)
  else if (key === 'priceDesc') s.sort((a, b) => p(b) - p(a) || b.rating - a.rating)
  else if (key === 'ratingDesc') s.sort((a, b) => b.rating - a.rating || p(a) - p(b))
  else s.sort((a, b) => (b.rating / Math.max(p(b), 1)) - (a.rating / Math.max(p(a), 1)) || b.rating - a.rating)
  return s
}

function pickFrom(sorted: Vendor[], offset = 0, mid = false): Vendor | undefined {
  if (sorted.length === 0) return undefined
  const idx = mid ? Math.floor((sorted.length - 1) / 2) : Math.min(offset, sorted.length - 1)
  return sorted[idx]
}

/**
 * Auto-generate multi-vendor packages for a board from the loaded vendors. Each
 * package spans the board's core categories (those present with a priced vendor).
 * Only vendors with a price > 0 are eligible. The package price is the summed
 * "from" prices minus {@link PACKAGE_DISCOUNT_PCT} of that bundle total.
 * Deterministic — same inputs always yield the same packages (up to 10).
 */
export function generatePackages(
  vendors: Record<string, Vendor>,
  board: RitualBoard | undefined,
  guests = 0,
  discountPct = PACKAGE_DISCOUNT_PCT,
): PackageDeal[] {
  if (!board) return []

  // Category labels on this board (active or removed) we could fill.
  const boardLabels = new Set(board.categories.map((c) => c.label))
  const labels = CORE_CATEGORIES.filter((l) => boardLabels.has(l))

  // Group available vendors by category label — only priced vendors (price > 0)
  // are eligible for a package.
  const byCategory: Record<string, Vendor[]> = {}
  for (const v of Object.values(vendors)) {
    const cat = v.category
    if (!cat || !labels.includes(cat) || !(v.price > 0)) continue
    ;(byCategory[cat] ||= []).push(v)
  }

  // Categories that actually have a priced vendor to offer, in display order.
  const usable = labels.filter((l) => (byCategory[l]?.length ?? 0) > 0)
  // A package needs at least two vendors to be a meaningful bundle.
  if (usable.length < 2) return []

  // Pre-sort each usable category once per sort key.
  const sortedCache: Record<string, Partial<Record<SortKey, Vendor[]>>> = {}
  const sortedFor = (label: string, key: SortKey) => {
    const c = (sortedCache[label] ||= {})
    return (c[key] ||= sortVendors(byCategory[label], key, guests))
  }

  const deals: PackageDeal[] = []
  for (const recipe of RECIPES) {
    const members: Vendor[] = []
    for (const label of usable) {
      const picked = pickFrom(sortedFor(label, recipe.sort), recipe.offset, recipe.mid)
      if (picked) members.push(picked)
    }
    if (members.length < 2) continue

    const memberListingIds = members.map((m) => m.id)
    // Per-plate venues contribute rate × guests (not the bare per-plate rate).
    const value = members.reduce((sum, m) => sum + memberEffectivePrice(m, guests), 0)
    if (value <= 0) continue
    // The discount comes off the whole bundle total.
    const savings = Math.round(value * discountPct)
    const price = value - savings
    deals.push({
      id: `pkg-${recipe.id}`,
      name: recipe.name,
      tagline: recipe.tagline,
      memberListingIds,
      value,
      price,
      savings,
      discountPct,
    })
  }

  // Drop duplicate packages (different recipes can pick the same members when a
  // category has few vendors) — keep the first occurrence — then cap at 10.
  const seen = new Set<string>()
  return deals
    .filter((d) => {
      const key = [...d.memberListingIds].sort().join('|')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 10)
}

/**
 * True when every member of an active package is still the selected vendor of a
 * non-removed category on the board. The discount only applies while intact — pull
 * one vendor out and the bundle breaks. Guards the total defensively against
 * removals that bypass the explicit break prompt (e.g. the date editor).
 */
export function isPackageIntact(pkg: ActivePackage, board: RitualBoard | undefined): boolean {
  if (!board) return false
  const selected = new Set(
    board.categories.filter((c) => !c.removed && c.selectedVendorId).map((c) => c.selectedVendorId as string),
  )
  return pkg.memberListingIds.length > 0 && pkg.memberListingIds.every((id) => selected.has(id))
}

/** The active package (if any) that a given selected listing belongs to and that
 *  is still intact — used to badge member cards and gate the discount. */
export function intactPackageForListing(
  listingId: string | null,
  board: RitualBoard | undefined,
): ActivePackage | undefined {
  if (!listingId || !board?.activePackages) return undefined
  return board.activePackages.find(
    (p) => p.memberListingIds.includes(listingId) && isPackageIntact(p, board),
  )
}
