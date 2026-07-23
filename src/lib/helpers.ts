import type { Vendor, Category } from './types'
import { PHOTOGRAPHY_EVENT_SERVICES, type PhotographyEventPackage, type PhotographyPricingModel, type MehendiPricing, type MakeupPricing, type SareeDrapingPricing, type HairStylingPricing } from './vendor-category-config'

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
 * Returns the total price the couple should expect to pay. Transport/logistics is
 * an informational yes/no flag only (it varies by distance), so it's never added.
 */
export function getListingTotal(vendor: Vendor | undefined, tierHours?: number): number {
  if (!vendor) return 0
  return getEffectivePrice(vendor, tierHours)
}

/**
 * The "from" price for a Photography event-based listing — the cheapest single
 * priced service across every pricing card. Returns 0 when nothing is priced.
 */
export function getPhotographyEventFromPrice(packages?: PhotographyEventPackage[]): number {
  if (!packages || packages.length === 0) return 0
  // The headline "from" price is Traditional Photography (the base service), not the
  // cheapest add-on. Fall back to the cheapest non-album service, then album (priced
  // per sheet — a different unit) only if that's all the vendor priced.
  let minTrad = Infinity
  let minNonAlbum = Infinity
  let minAny = Infinity
  for (const card of packages) {
    for (const [key, price] of Object.entries(card.prices || {})) {
      if (!price || price <= 0) continue
      if (price < minAny) minAny = price
      if (key !== 'album' && price < minNonAlbum) minNonAlbum = price
      if (key === 'traditionalPhotography' && price < minTrad) minTrad = price
    }
  }
  const chosen = minTrad !== Infinity ? minTrad : minNonAlbum !== Infinity ? minNonAlbum : minAny
  return chosen === Infinity ? 0 : chosen
}

/**
 * The couple's selected total for a Photography event-based listing — the sum of
 * the flat prices of the services they ticked, from the listing's (single) event
 * package. Returns null when nothing priced is selected.
 *
 * On the couple side each event package is surfaced as its own listing (see the
 * store's event-package expansion), so a couple-facing vendor carries exactly one
 * package in `eventPackages`.
 */
export function getPhotographyEventSelectionTotal(
  vendor: Vendor | undefined,
  sel: { services: string[] } | undefined,
): number | null {
  const pkg = vendor?.eventPackages?.[0]
  if (!pkg || !sel?.services?.length) return null
  let total = 0
  let any = false
  for (const key of sel.services) {
    const price = pkg.prices[key as keyof typeof pkg.prices]
    if (price && price > 0) { total += price; any = true }
  }
  return any ? total : null
}

/** The services a Photography event package actually prices (offered = price > 0). */
export function getOfferedEventServices(pkg: PhotographyEventPackage | undefined) {
  if (!pkg) return []
  return PHOTOGRAPHY_EVENT_SERVICES.filter(s => (pkg.prices[s.key] ?? 0) > 0)
}

/**
 * Which pricing model(s) a photographer offers. Photography is event-based only:
 * returns ['eventBased'] when the vendor has at least one event package, else [].
 */
export function getPhotographyModels(vendor: Vendor | undefined): PhotographyPricingModel[] {
  if (!vendor) return []
  return (vendor.eventPackages?.length ?? 0) > 0 ? ['eventBased'] : []
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
 * The "from" price for a Makeup listing — cheapest per-look bridal event price,
 * falling back to the guest per-head price, then groom price.
 */
export function getMakeupFromPrice(p?: MakeupPricing): number {
  if (!p) return 0
  const prices = Object.values(p.bridalByEvent || {}).filter(v => v > 0)
  if (prices.length) return Math.min(...prices)
  if (p.guestPricePerPerson && p.guestPricePerPerson > 0) return p.guestPricePerPerson
  if (p.groomPrice && p.groomPrice > 0) return p.groomPrice
  return 0
}

/**
 * The couple's selected total for a Makeup listing (selected bridal events ×
 * their per-look price + optional groom + guests × per-head). Null when nothing
 * meaningful is picked.
 */
export function getMakeupSelectionTotal(
  vendor: Vendor | undefined,
  sel: { eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] } | undefined,
): number | null {
  const p = vendor?.makeupPricing
  if (!p || !sel) return null
  let total = 0
  let any = false
  for (const [e, looks] of Object.entries(sel.eventLooks || {})) {
    const v = p.bridalByEvent?.[e]
    if (v && v > 0 && looks > 0) { total += v * looks; any = true }
  }
  for (const a of sel.addons || []) {
    const v = p.addons?.[a]
    if (v && v > 0) { total += v; any = true }
  }
  if (sel.groom && p.groomPrice && p.groomPrice > 0) { total += p.groomPrice; any = true }
  if (sel.guests && sel.guests > 0 && p.guestPricePerPerson && p.guestPricePerPerson > 0) {
    total += sel.guests * p.guestPricePerPerson; any = true
  }
  return any ? total : null
}

/**
 * The "from" price for a Saree Draping listing — cheapest of the bridal per-look,
 * groom per-look, and guest per-head prices.
 */
export function getSareeDrapingFromPrice(p?: SareeDrapingPricing): number {
  if (!p) return 0
  const prices = [p.bridalPricePerLook, p.groomPricePerLook, p.guestPricePerPerson, p.prePleatingPricePerSaree].filter((v): v is number => !!v && v > 0)
  return prices.length ? Math.min(...prices) : 0
}

/**
 * The couple's selected total for a Saree Draping listing (bridal looks ×
 * per-look + groom looks × per-look + guests × per-head). Null when nothing
 * meaningful is picked.
 */
export function getSareeSelectionTotal(
  vendor: Vendor | undefined,
  sel: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number } | undefined,
): number | null {
  const p = vendor?.sareeDrapingPricing
  if (!p || !sel) return null
  let total = 0
  let any = false
  if (sel.bridalLooks && sel.bridalLooks > 0 && p.bridalPricePerLook && p.bridalPricePerLook > 0) {
    total += sel.bridalLooks * p.bridalPricePerLook; any = true
  }
  if (sel.groomLooks && sel.groomLooks > 0 && p.groomPricePerLook && p.groomPricePerLook > 0) {
    total += sel.groomLooks * p.groomPricePerLook; any = true
  }
  if (sel.guests && sel.guests > 0 && p.guestPricePerPerson && p.guestPricePerPerson > 0) {
    total += sel.guests * p.guestPricePerPerson; any = true
  }
  if (sel.prePleatingSarees && sel.prePleatingSarees > 0 && p.prePleatingPricePerSaree && p.prePleatingPricePerSaree > 0) {
    total += sel.prePleatingSarees * p.prePleatingPricePerSaree; any = true
  }
  return any ? total : null
}

/** The "from" price for a Hair Styling listing — cheapest of bridal/groom per-look and guest per-head. */
export function getHairStylingFromPrice(p?: HairStylingPricing): number {
  if (!p) return 0
  const prices = [p.bridalPricePerLook, p.groomPricePerLook, p.guestPricePerPerson].filter((v): v is number => !!v && v > 0)
  return prices.length ? Math.min(...prices) : 0
}

/** The couple's selected total for a Hair Styling listing (bridal/groom looks × per-look + guests × per-head). */
export function getHairSelectionTotal(
  vendor: Vendor | undefined,
  sel: { bridalLooks?: number; groomLooks?: number; guests?: number } | undefined,
): number | null {
  const p = vendor?.hairStylingPricing
  if (!p || !sel) return null
  let total = 0
  let any = false
  if (sel.bridalLooks && sel.bridalLooks > 0 && p.bridalPricePerLook && p.bridalPricePerLook > 0) {
    total += sel.bridalLooks * p.bridalPricePerLook; any = true
  }
  if (sel.groomLooks && sel.groomLooks > 0 && p.groomPricePerLook && p.groomPricePerLook > 0) {
    total += sel.groomLooks * p.groomPricePerLook; any = true
  }
  if (sel.guests && sel.guests > 0 && p.guestPricePerPerson && p.guestPricePerPerson > 0) {
    total += sel.guests * p.guestPricePerPerson; any = true
  }
  return any ? total : null
}

/**
 * The couple's configured total for a board category's selected vendor, across
 * the categories that support per-selection pricing (Photography rate card,
 * Mehendi, Makeup, Saree Draping, Hair Styling). Returns null when nothing is
 * configured, so the card/total falls back to the vendor's `price`.
 */
export function getCategorySelectionTotal(vendor: Vendor | undefined, category: Category | undefined): number | null {
  if (!vendor || !category) return null
  // Most categories are exclusive, but a Makeup artist can also offer Saree
  // Draping and Hair Styling as add-ons — sum whatever the couple configured.
  // Venue per-plate: reflect the couple's chosen package's per-plate price
  // (falls back to the venue's "from" price via getListingTotal when unset).
  const venuePlate = (() => {
    if (!category.selectedPlatePackageId || !vendor.platePackages?.length) return null
    const pkg = vendor.platePackages.find(p => p.id === category.selectedPlatePackageId)
    return pkg ? pkg.pricePerPlate : null
  })()
  const parts = [
    venuePlate,
    // Photography is event-based only — the couple's ticked services drive the total.
    getPhotographyEventSelectionTotal(vendor, category.photographyEventSelection),
    getMehendiSelectionTotal(vendor, category.mehendiSelection),
    getMakeupSelectionTotal(vendor, category.makeupSelection),
    getSareeSelectionTotal(vendor, category.sareeSelection),
    getHairSelectionTotal(vendor, category.hairSelection),
  ].filter((v): v is number => v != null)
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null
}

/**
 * The "from" price for a venue's per-plate model — the cheapest plate package.
 * Returns 0 when the venue has no plate packages.
 */
export function getVenuePlateFromPrice(packages?: import('./vendor-types').PlatePackage[]): number {
  if (!packages || packages.length === 0) return 0
  const prices = packages.map(p => p.pricePerPlate).filter(v => v > 0)
  return prices.length ? Math.min(...prices) : 0
}

/**
 * The board price to show for a venue: the per-plate price of the plate package
 * the couple picked for THIS venue (via category.platePackageByVendor), falling
 * back to the venue's own `price` (its "from" price) when no package is chosen.
 * Used so the Compare table lines venues up on their picked packages.
 */
export function getVenueBoardPrice(vendor: Vendor, category?: Category): number {
  const pkgId = category?.platePackageByVendor?.[vendor.id]
  if (pkgId && vendor.platePackages?.length) {
    const pkg = vendor.platePackages.find(p => p.id === pkgId)
    if (pkg) return pkg.pricePerPlate
  }
  return vendor.price
}

export function bgStyle(photo: string): { background: string } {
  if (!photo) return { background: '#f3f4f6' }
  const val = photo.startsWith('url(') ? photo : `url("${photo}")`
  return { background: `${val} center/cover no-repeat` };
}

/** Short category codes used in the anonymous public listing code. */
const CATEGORY_CODE: Record<string, string> = {
  Venue: 'VEN', Catering: 'CAT', Photography: 'PHO', Decor: 'DEC', Makeup: 'MUA',
  Mehendi: 'MEH', 'DJ / Music': 'DJ', Pandit: 'PAN', Invitations: 'INV',
  Banjantrilu: 'BAN', Reels: 'REL', 'Saree Draping': 'SAR',
  'Live Stalls': 'STL', 'Hosts / Entertainers': 'HOST', 'Wedding Props': 'PRP',
}

/**
 * Anonymous, paywall-safe public code for a listing — shown to couples before
 * they unlock, so the vendor's name is never revealed. Format:
 *   PK-<categoryCode>-<vendorNumber>-<listingNumber>   e.g. "PK-PHO-0042-1"
 * The vendor number is a stable 4-digit hash of the vendor's id (same vendor →
 * same number), so it's anonymous but consistent.
 */
export function makePublicCode(category: string, vendorSeed: string, listingNum = 1): string {
  const cc = CATEGORY_CODE[category] || (category || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN'
  let h = 0
  for (let i = 0; i < vendorSeed.length; i++) h = (h * 31 + vendorSeed.charCodeAt(i)) >>> 0
  const vnum = String(h % 10000).padStart(4, '0')
  return `PK-${cc}-${vnum}-${listingNum}`
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

// ─── Venue guest-capacity matching ──────────────────────────────────────────
// A couple picks a guest-count bucket per event (e.g. "200-500", "1000+"); a
// venue listing stores its served capacity as a [min, max] range. These let the
// couple-side UI softly flag venues whose capacity covers the couple's count.

/** Parse a couple's guest bucket ("200-500", "1000+") into [min, max]. */
export function parseGuestBucket(bucket: string | undefined): [number, number] | null {
  if (!bucket) return null;
  if (bucket.trim().endsWith("+")) {
    const n = parseInt(bucket, 10);
    return Number.isFinite(n) ? [n, Infinity] : null;
  }
  const m = bucket.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const n = parseInt(bucket, 10);
  return Number.isFinite(n) ? [n, n] : null;
}

/** Parse a venue listing's stored capacity into [min, max]. New listings store
 *  [min, max]; a legacy single value ("800") is read as "up to 800". */
export function parseCapacityRange(capacity: string | string[] | undefined): [number, number] | null {
  if (capacity === undefined || capacity === null) return null;
  if (Array.isArray(capacity)) {
    if (capacity.length === 0) return null;
    const lo = parseInt(capacity[0], 10);
    const hi = parseInt(capacity[1] ?? capacity[0], 10);
    if (!Number.isFinite(lo) && !Number.isFinite(hi)) return null;
    return [Number.isFinite(lo) ? lo : 0, Number.isFinite(hi) ? hi : Infinity];
  }
  const n = parseInt(capacity, 10);
  return Number.isFinite(n) ? [0, n] : null;
}

/** True when the venue's capacity range overlaps the couple's guest bucket. */
export function venueFitsGuestBucket(
  capacity: string | string[] | undefined,
  bucket: string | undefined,
): boolean {
  const v = parseCapacityRange(capacity);
  const c = parseGuestBucket(bucket);
  if (!v || !c) return false;
  return v[0] <= c[1] && v[1] >= c[0];
}
