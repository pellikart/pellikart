import type { Vendor, Category } from './types'
import { PHOTOGRAPHY_RATE_ROLES, type PhotographyRateCard, type MehendiPricing } from './vendor-category-config'

/**
 * Per-hour total for a Photography rate card assuming 1 person in every offered
 * role. This is the "₹X/hr" figure shown on browse/board cards and stored as the
 * listing's `price`.
 */
export function getRateCardBaseHourly(rateCard?: PhotographyRateCard): number {
  if (!rateCard) return 0
  return PHOTOGRAPHY_RATE_ROLES.reduce((sum, r) => sum + Math.max(0, rateCard[r.key] ?? 0), 0)
}

/**
 * Live booking total for a Photography rate card given how many people the couple
 * picked per role and one shared number of hours:
 *   total = hours × Σ(role rate/hr × people)
 */
export function getRateCardTotal(
  rateCard: PhotographyRateCard | undefined,
  counts: Record<string, number>,
  hours: number,
): number {
  if (!rateCard) return 0
  const perHour = PHOTOGRAPHY_RATE_ROLES.reduce(
    (sum, r) => sum + Math.max(0, rateCard[r.key] ?? 0) * Math.max(0, counts[r.key] ?? 0),
    0,
  )
  return perHour * Math.max(0, hours)
}

/**
 * Returns the base price for a vendor given the couple's selected hourly tier.
 * Falls back to vendor.price (which the vendor side sets to the 24 hr tier by default).
 */
export function getEffectivePrice(vendor: Vendor | undefined, tierHours?: number): number {
  if (!vendor) return 0
  if (tierHours && vendor.hourlyPricing) {
    const tier = vendor.hourlyPricing.find(t => t.hours === tierHours)
    if (tier) return tier.price
  }
  return vendor.price
}

/**
 * Returns the total price the couple should expect to pay, including
 * transport/logistics extras when the vendor doesn't bundle them.
 */
export function getListingTotal(vendor: Vendor | undefined, tierHours?: number): number {
  if (!vendor) return 0
  const base = getEffectivePrice(vendor, tierHours)
  const extra = vendor.transportIncluded === false ? (vendor.transportExtra || 0) : 0
  return base + extra
}

/**
 * The couple's selected total for a Photography rate-card listing, including
 * transport extras. Returns null when there's no rate card or nothing is picked
 * yet — callers then fall back to the per-hour "from" price.
 */
export function getPhotographySelectionTotal(
  vendor: Vendor | undefined,
  team: { counts: Record<string, number>; hours: number } | undefined,
): number | null {
  if (!vendor?.rateCard || !team) return null
  const picked = Object.values(team.counts).reduce((s, n) => s + Math.max(0, n || 0), 0)
  if (picked <= 0) return null
  const transport = vendor.transportIncluded === false ? (vendor.transportExtra || 0) : 0
  return getRateCardTotal(vendor.rateCard, team.counts, team.hours) + transport
}

/**
 * The "from" price for a Mehendi listing — the cheapest filled bridal price,
 * falling back to the guest per-head price, then groom price. Used as the
 * listing's board figure.
 */
export function getMehendiFromPrice(p?: MehendiPricing): number {
  if (!p) return 0
  const prices: number[] = []
  if (p.bridalOffered) {
    for (const cov of Object.values(p.bridal || {})) {
      for (const v of Object.values(cov || {})) if (v > 0) prices.push(v)
    }
  }
  if (prices.length) return Math.min(...prices)
  if (p.guestPricePerPerson && p.guestPricePerPerson > 0) return p.guestPricePerPerson
  if (p.groomPrice && p.groomPrice > 0) return p.groomPrice
  return 0
}

/**
 * The couple's selected total for a Mehendi listing (bridal coverage+design +
 * optional groom + guests × per-head). Returns null when nothing meaningful is
 * picked yet, so callers fall back to the "from" price.
 */
export function getMehendiSelectionTotal(
  vendor: Vendor | undefined,
  sel: { coverage?: string; design?: string; groom?: boolean; guests?: number } | undefined,
): number | null {
  const p = vendor?.mehendiPricing
  if (!p || !sel) return null
  let total = 0
  let any = false
  if (p.bridalOffered && sel.coverage && sel.design) {
    const v = p.bridal?.[sel.coverage]?.[sel.design]
    if (v && v > 0) { total += v; any = true }
  }
  if (sel.groom && p.groomPrice && p.groomPrice > 0) { total += p.groomPrice; any = true }
  if (sel.guests && sel.guests > 0 && p.guestPricePerPerson && p.guestPricePerPerson > 0) {
    total += sel.guests * p.guestPricePerPerson; any = true
  }
  return any ? total : null
}

/**
 * The couple's configured total for a board category's selected vendor, across
 * the categories that support per-selection pricing (Photography rate card,
 * Mehendi). Returns null when nothing is configured, so the card/total falls
 * back to the vendor's `price`.
 */
export function getCategorySelectionTotal(vendor: Vendor | undefined, category: Category | undefined): number | null {
  if (!vendor || !category) return null
  return getPhotographySelectionTotal(vendor, category.photographyTeam)
    ?? getMehendiSelectionTotal(vendor, category.mehendiSelection)
}

export function bgStyle(photo: string): { background: string } {
  if (!photo) return { background: '#f3f4f6' }
  const val = photo.startsWith('url(') ? photo : `url(${photo})`
  return { background: `${val} center/cover no-repeat` };
}

export function formatINR(amount: number): string {
  // Indian number format: ₹12,34,567
  const str = amount.toString();
  let result = "";
  const len = str.length;
  let count = 0;
  for (let i = len - 1; i >= 0; i--) {
    result = str[i] + result;
    count++;
    if (i > 0) {
      if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
        result = "," + result;
      }
    }
  }
  return "₹" + result;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateRange(start?: string, end?: string): string {
  if (!start) return "";
  if (!end || start === end) return formatDate(start);
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString("en-IN", { month: "short" })} ${s.getDate()}-${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${formatDate(start)} - ${formatDate(end)}`;
}
