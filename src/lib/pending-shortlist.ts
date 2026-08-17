/**
 * A listing a visitor shortlisted from the public landing page, held until
 * they have an account and a board to put it on.
 *
 * Sign-in is Google OAuth, which is a top-level redirect — the landing page is
 * torn down and the app boots fresh at /app. So the intent can't live in React
 * state; it goes to localStorage, the same way the claim and admin entries
 * stamp `pellikart_post_login`.
 *
 * It is consumed in one of two places depending on who came back:
 *  - a new couple finishes onboarding → `completeOnboarding` seeds the pick
 *    while it builds the boards, so the shortlisted vendor lands alongside the
 *    recommendations for every other category;
 *  - a couple who already has boards → `applyPendingShortlist` selects it into
 *    the first ritual carrying that category.
 */
export interface PendingShortlist {
  /** Vendor-map key, i.e. the expanded listing id (may carry a `::evt::` suffix). */
  listingId: string
  /** The listing's parent vendor, so we can still honour it if that exact
   *  listing isn't offered for a given ritual. */
  vendorId?: string
  /** Vendor category, e.g. "Venue" — matches the board's category label. */
  category: string
  savedAt: number
}

const KEY = 'pellikart_pending_shortlist'

/** Long enough to survive signup in another sitting, short enough that a
 *  months-old click doesn't silently steer a board. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function setPendingShortlist(v: Omit<PendingShortlist, 'savedAt'>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...v, savedAt: Date.now() }))
  } catch {
    // Private mode / storage full — the flow still works, it just won't
    // remember the pick. Never break the signup on this.
  }
}

export function readPendingShortlist(): PendingShortlist | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as PendingShortlist
    if (!v?.listingId || !v?.category) return null
    if (typeof v.savedAt === 'number' && Date.now() - v.savedAt > MAX_AGE_MS) {
      clearPendingShortlist()
      return null
    }
    return v
  } catch {
    return null
  }
}

export function clearPendingShortlist(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* see setPendingShortlist */ }
}
