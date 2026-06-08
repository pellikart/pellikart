import type { Vendor } from './types'
import { PHOTOGRAPHY_RATE_ROLES, type PhotographyRateCard } from './vendor-category-config'

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
