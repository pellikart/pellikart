import type { Vendor } from './types'

/**
 * Returns the effective price for a vendor given the couple's selected hourly tier.
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
