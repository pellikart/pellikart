/**
 * Which listings belong to a category's explore feed.
 *
 * Lives on its own so the rule has one home: the category explorer filters with
 * it, and anything else that needs to reason about "what else is in this
 * category" can use the same predicate rather than re-deriving it.
 */
import type { Vendor } from './types'

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
