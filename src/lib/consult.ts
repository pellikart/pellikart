/**
 * The handoff at the end of the couple's journey.
 *
 * Vendors aren't onboarded yet — we list on their behalf — so a couple who has
 * filled their board has nobody to transact with inside the app. Left alone
 * that's a dead end: they browse, they shortlist, and then the product goes
 * quiet. So the board hands off to us instead: once it's ready we offer a slot
 * with a Pellikart expert, freeze what they picked, and the lead lands in the
 * admin panel for a human to work.
 *
 * This module holds the parts that aren't React: when a board counts as ready,
 * what the expert sees, and the local memory of "I already asked" (which has to
 * survive an anonymous demo session with no row to read back).
 */
import type { RitualBoard, Vendor } from './types'
import { getCategorySelectionTotal, guestCountFor } from './helpers'

export type ConsultStatus = 'new' | 'contacted' | 'scheduled' | 'won' | 'lost'

/** Where the request came from — tells us what the lead was looking at.
 *  'paid_unlock' is the ₹300 door: same queue, but they've asked to pay rather
 *  than wait for a call, so the desk should reach them first. */
export type ConsultSource = 'board_ready' | 'help' | 'landing' | 'paid_unlock'

/** Call windows we staff. Kept coarse: this is a callback slot, not a booking
 *  system, and an expert confirms the exact time on the call. */
export const CONSULT_SLOTS = [
  '10:00 AM – 12:00 PM',
  '12:00 PM – 3:00 PM',
  '3:00 PM – 6:00 PM',
  '6:00 PM – 9:00 PM',
] as const

export const CONSULT_STATUS_LABELS: Record<ConsultStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  scheduled: 'Slot booked',
  won: 'Converted',
  lost: 'Lost',
}

/** One category's state, as the expert sees it on the lead. */
export interface ConsultSnapshotPick {
  category: string
  /** Real vendor name — the admin side is never paywalled. */
  vendor: string
  code?: string
  price: number
}

/** Frozen copy of a board at the moment the couple asked for the call. Frozen
 *  on purpose: they keep editing afterwards, and the expert needs to open the
 *  call knowing what was on screen when they raised their hand. */
export interface ConsultSnapshot {
  boardId: string
  boardName: string
  dateStart?: string
  dateEnd?: string
  guests?: number
  /** Sum of the picked categories, before any package discount. */
  total: number
  picked: ConsultSnapshotPick[]
  /** Categories with a shortlist but no decision yet — the real talking points. */
  deciding: { category: string; shortlisted: number }[]
  /** Categories still completely empty. */
  missing: string[]
  /** Every other board this couple has, so the expert sees the whole wedding. */
  otherBoards?: { name: string; filled: number; total: number }[]
}

export interface BoardReadiness {
  filled: number
  total: number
  /** Categories with a shortlist but nothing selected. */
  deciding: number
  /** Enough of the board is decided that a call is worth offering. */
  ready: boolean
  /** The next category worth acting on, when they aren't ready yet — so the
   *  nudge can say "pick your Venue" instead of "keep going". */
  nextCategory?: { id: string; label: string }
}

/**
 * When is a board "ready"?
 *
 * Two picks is the threshold. One pick is a browse; two means they've committed
 * to a direction and a human can add something — negotiate the pair, spot what's
 * missing, quote the rest. A fully decided board counts even if it's a
 * single-category one.
 */
export function boardReadiness(board: RitualBoard | undefined, vendors: Record<string, Vendor>): BoardReadiness {
  if (!board) return { filled: 0, total: 0, deciding: 0, ready: false }

  const active = board.categories.filter((c) => !c.removed)
  const filledCats = active.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId])
  const openCats = active.filter((c) => !(c.selectedVendorId && vendors[c.selectedVendorId]))
  const decidingCats = openCats.filter((c) => c.shortlistedVendorIds.length > 0)

  const filled = filledCats.length
  const total = active.length
  const ready = filled >= 2 || (filled >= 1 && filled === total)

  // Prefer a category they've already shortlisted into — they're closest to a
  // decision there — otherwise the first untouched one.
  const next = decidingCats[0] ?? openCats[0]

  return {
    filled,
    total,
    deciding: decidingCats.length,
    ready,
    nextCategory: next ? { id: next.id, label: next.label } : undefined,
  }
}

/** Build the frozen board copy the expert works from. */
export function buildConsultSnapshot(
  board: RitualBoard,
  vendors: Record<string, Vendor>,
  opts: { guestBucket?: string; allBoards?: RitualBoard[] } = {},
): ConsultSnapshot {
  const guests = guestCountFor(opts.guestBucket)
  const active = board.categories.filter((c) => !c.removed)

  const picked: ConsultSnapshotPick[] = []
  const deciding: ConsultSnapshot['deciding'] = []
  const missing: string[] = []
  let total = 0

  for (const cat of active) {
    const v = cat.selectedVendorId ? vendors[cat.selectedVendorId] : undefined
    if (v) {
      const sel = getCategorySelectionTotal(v, cat, guests)
      const price = sel != null ? sel : v.price
      total += price
      picked.push({
        category: cat.label,
        vendor: v.name || v.code,
        code: v.publicCode || v.code,
        price,
      })
    } else if (cat.shortlistedVendorIds.length > 0) {
      deciding.push({ category: cat.label, shortlisted: cat.shortlistedVendorIds.length })
    } else {
      missing.push(cat.label)
    }
  }

  const otherBoards = (opts.allBoards ?? [])
    .filter((b) => b.id !== board.id)
    .map((b) => {
      const cats = b.categories.filter((c) => !c.removed)
      return {
        name: b.name,
        filled: cats.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId]).length,
        total: cats.length,
      }
    })

  return {
    boardId: board.id,
    boardName: board.name,
    dateStart: board.dateStart,
    dateEnd: board.dateEnd,
    guests: guests || undefined,
    total,
    picked,
    deciding,
    missing,
    otherBoards: otherBoards.length > 0 ? otherBoards : undefined,
  }
}

// ─── local memory of "I already asked" ──────
// A request raised anonymously (public demo, landing page) has no row this
// browser can read back, and even a signed-in couple shouldn't wait on a fetch
// before the banner stops asking. So the ask is mirrored to localStorage, the
// same way pending-shortlist mirrors the pre-signup pick.

export interface LocalConsultRecord {
  boardId?: string
  phone: string
  preferredDate?: string
  preferredSlot?: string
  requestedAt: number
}

const KEY = 'pellikart_consult_request'

/** Long enough to cover the days it takes us to close the loop, short enough
 *  that a months-old call never suppresses a fresh ask. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function setLocalConsult(v: Omit<LocalConsultRecord, 'requestedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...v, requestedAt: Date.now() }))
  } catch {
    // Private mode / storage full. The lead is already saved server-side; the
    // banner just re-offers the call. Never break the submit on this.
  }
}

export function readLocalConsult(): LocalConsultRecord | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as LocalConsultRecord
    if (!v?.phone || typeof v.requestedAt !== 'number') return null
    if (Date.now() - v.requestedAt > MAX_AGE_MS) {
      clearLocalConsult()
      return null
    }
    return v
  } catch {
    return null
  }
}

export function clearLocalConsult(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* see setLocalConsult */ }
}
