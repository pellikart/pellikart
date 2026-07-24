import type { Vendor, RitualBoard, ActivePackage } from './types'

/**
 * The bundle discount applied to an auto-generated package: this fraction is taken
 * off the price of the package's single cheapest member (not the whole bundle), so
 * the package price = summed "from" prices − discountPct × lowest member price.
 * Single knob — change it here to re-price every package.
 */
export const PACKAGE_DISCOUNT_PCT = 0.10

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

interface Tier {
  id: string
  name: string
  tagline: string
  /** How to rank a category's vendors — the first after sort is chosen. */
  pick: 'value' | 'balanced' | 'premium'
}

const TIERS: Tier[] = [
  { id: 'essentials', name: 'Essentials', tagline: 'Everything you need, budget-friendly', pick: 'value' },
  { id: 'signature', name: 'Signature', tagline: 'Our balanced crowd-favourite', pick: 'balanced' },
  { id: 'luxe', name: 'Luxe', tagline: 'Top-rated vendors, all premium', pick: 'premium' },
]

/** Stable-sort a category's vendors for a tier and return the top pick. */
function pickForTier(list: Vendor[], pick: Tier['pick']): Vendor | undefined {
  if (list.length === 0) return undefined
  const sorted = [...list]
  if (pick === 'value') {
    // Cheapest first; tie-break on higher rating.
    sorted.sort((a, b) => a.price - b.price || b.rating - a.rating)
  } else if (pick === 'premium') {
    // Highest rating first; tie-break on higher price (more premium).
    sorted.sort((a, b) => b.rating - a.rating || b.price - a.price)
  } else {
    // Balanced: best rating-per-rupee; tie-break on higher rating.
    sorted.sort((a, b) => (b.rating / Math.max(b.price, 1)) - (a.rating / Math.max(a.price, 1)) || b.rating - a.rating)
  }
  return sorted[0]
}

/**
 * Auto-generate multi-vendor packages for a board from the loaded vendors. Each
 * package spans the board's core categories (those present with ≥1 vendor) and
 * prices them at the summed "from" price minus {@link PACKAGE_DISCOUNT_PCT}.
 * Deterministic — same inputs always yield the same packages.
 */
export function generatePackages(
  vendors: Record<string, Vendor>,
  board: RitualBoard | undefined,
  discountPct = PACKAGE_DISCOUNT_PCT,
): PackageDeal[] {
  if (!board) return []

  // Category labels on this board (active or removed) we could fill.
  const boardLabels = new Set(board.categories.map((c) => c.label))
  const labels = CORE_CATEGORIES.filter((l) => boardLabels.has(l))

  // Group available vendors by their category label, keeping only board categories.
  const byCategory: Record<string, Vendor[]> = {}
  for (const v of Object.values(vendors)) {
    const cat = v.category
    if (!cat || !labels.includes(cat)) continue
    ;(byCategory[cat] ||= []).push(v)
  }

  // Categories that actually have a vendor to offer, in display order.
  const usable = labels.filter((l) => (byCategory[l]?.length ?? 0) > 0)
  // A package needs at least two vendors to be a meaningful bundle.
  if (usable.length < 2) return []

  const deals: PackageDeal[] = []
  for (const tier of TIERS) {
    const members: Vendor[] = []
    for (const label of usable) {
      const picked = pickForTier(byCategory[label], tier.pick)
      if (picked) members.push(picked)
    }
    if (members.length < 2) continue

    const memberListingIds = members.map((m) => m.id)
    const value = members.reduce((sum, m) => sum + (m.price || 0), 0)
    if (value <= 0) continue
    // The discount comes off the single cheapest member only, not the whole bundle.
    const lowest = Math.min(...members.map((m) => m.price || 0))
    const savings = Math.round(lowest * discountPct)
    const price = value - savings
    deals.push({
      id: `pkg-${tier.id}`,
      name: tier.name,
      tagline: tier.tagline,
      memberListingIds,
      value,
      price,
      savings,
      discountPct,
    })
  }

  // Drop duplicate packages (different tiers can pick the same members when a
  // category has only one vendor) — keep the first (cheapest-tier) occurrence.
  const seen = new Set<string>()
  return deals.filter((d) => {
    const key = [...d.memberListingIds].sort().join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
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
