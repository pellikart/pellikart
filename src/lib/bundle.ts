import type { Vendor, RitualBoard } from './types'

/** True when selecting this vendor should fire the mandatory-bundle popup. */
export function shouldShowBundlePopup(next: Vendor | undefined): boolean {
  return !!(
    next &&
    next.category === 'Venue' &&
    next.bundleMandatory &&
    next.bundledListings &&
    next.bundledListings.length > 0
  )
}

export interface BundleEntry {
  id: string
  name: string
  category: string
  price: number
}

/** Bundle payload for the popup. Listings not in the vendor map are dropped. */
export function buildBundleEntries(
  bundledListingIds: string[],
  vendors: Record<string, Vendor>
): BundleEntry[] {
  return bundledListingIds
    .map((id) => vendors[id])
    .filter(Boolean)
    .map((v) => ({ id: v.id, name: v.name || v.code, category: v.category || '', price: v.price }))
}

export interface BundlePlanStep {
  categoryId: string
  listingId: string
  needsRestore: boolean
}

/**
 * Plans the state updates needed to accept a bundle:
 * for each bundle whose category exists on the board, pick the listing
 * in that category (and restore the category first if it was removed).
 * Bundles whose category is not on the board are skipped.
 */
export function planBundleApplication(
  board: RitualBoard,
  bundles: BundleEntry[]
): BundlePlanStep[] {
  const plan: BundlePlanStep[] = []
  for (const b of bundles) {
    const targetCat = board.categories.find((c) => c.label === b.category)
    if (!targetCat) continue
    plan.push({ categoryId: targetCat.id, listingId: b.id, needsRestore: targetCat.removed })
  }
  return plan
}
