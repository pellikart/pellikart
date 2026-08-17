/**
 * What's waiting for a couple inside a category.
 *
 * The board card advertises how many other vendors they could look at ("See 12
 * more Venue options"), and the category explorer lists them. Those two numbers
 * have to agree — a card promising twelve and a page showing four is worse than
 * no number at all — so both sides share the predicate below rather than each
 * filtering the vendor map their own way.
 */
import type { Vendor } from './types'
import { getDesignsForCategory } from './mock-data'

/**
 * Is this listing part of `categoryLabel`'s explore feed on `boardName`?
 *
 * Live mode only: the vendor map is keyed by listing id, and the `code` field
 * carries "Category NNN", so the category match is a code prefix. Per-event
 * fan-out rows (Entertainers `::ent::`, Photography `::evt::`) each carry a
 * single ritual tag and must only appear on that event's board, or every fanned
 * row shows up everywhere. Banjantrilu and Pandit aren't fanned but are still
 * event-scoped — their rituals are the union of the events they price.
 */
export function isExploreCandidate(v: Vendor, categoryLabel: string, boardName: string): boolean {
  if (!v.code.toLowerCase().startsWith(categoryLabel.toLowerCase())) return false
  const isFanned = v.id.includes('::ent::') || v.id.includes('::evt::')
  const isEventScoped = isFanned || v.category === 'Banjantrilu' || v.category === 'Pandit'
  if (isEventScoped && !(v.rituals || []).includes(boardName)) return false
  return true
}

/**
 * How many listings the couple could still look at in this category — the
 * number on the board card's "see more" bar.
 *
 * `excludeId` drops the listing already sitting on the board, so the count is
 * genuinely "other" ones. Returns 0 when there's nothing to explore, which the
 * card treats as "don't promise anything".
 */
export function countExploreOptions(args: {
  liveMode: boolean
  vendors: Record<string, Vendor>
  categoryLabel: string
  boardName: string
  excludeId?: string | null
}): number {
  const { liveMode, vendors, categoryLabel, boardName, excludeId } = args

  const ids = liveMode
    ? Object.values(vendors).filter((v) => isExploreCandidate(v, categoryLabel, boardName)).map((v) => v.id)
    : getDesignsForCategory(categoryLabel).map((d) => d.id)

  return ids.filter((id) => id !== excludeId).length
}
