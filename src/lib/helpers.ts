import type { Vendor, Category } from './types'
import { PHOTOGRAPHY_RATE_ROLES, type PhotographyRateCard, type PhotographyGuestPackages, type PhotographyPricingModel, type MehendiPricing, type MakeupPricing, type SareeDrapingPricing, type HairStylingPricing } from './vendor-category-config'

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
 * Returns the total price the couple should expect to pay. Transport/logistics is
 * an informational yes/no flag only (it varies by distance), so it's never added.
 */
export function getListingTotal(vendor: Vendor | undefined, tierHours?: number): number {
  if (!vendor) return 0
  return getEffectivePrice(vendor, tierHours)
}

/**
 * The couple's selected total for a Photography rate-card listing (pure — transport
 * is added once by getCategorySelectionTotal / the detail block). Returns null when
 * there's no rate card or nothing is picked yet.
 */
export function getPhotographySelectionTotal(
  vendor: Vendor | undefined,
  team: { counts: Record<string, number>; hours: number } | undefined,
): number | null {
  if (!vendor?.rateCard || !team) return null
  const picked = Object.values(team.counts).reduce((s, n) => s + Math.max(0, n || 0), 0)
  if (picked <= 0) return null
  return getRateCardTotal(vendor.rateCard, team.counts, team.hours)
}

/**
 * The "from" price for a Photography guest-based listing — the cheapest filled cell
 * across all guest buckets × hours. Returns 0 when no cells are priced.
 */
export function getPhotographyGuestFromPrice(packages?: PhotographyGuestPackages): number {
  if (!packages) return 0
  let min = Infinity
  for (const byHours of Object.values(packages)) {
    for (const price of Object.values(byHours)) {
      if (price > 0 && price < min) min = price
    }
  }
  return min === Infinity ? 0 : min
}

/** The flat price for a specific guest bucket × hours cell (0 when not offered). */
export function getPhotographyPackagePrice(
  packages: PhotographyGuestPackages | undefined,
  bucket: string,
  hours: number,
): number {
  if (!packages) return 0
  return packages[bucket]?.[String(hours)] ?? 0
}

/**
 * The couple's selected total for a Photography guest-based package. Returns null
 * when the vendor has no guest packages or the picked cell isn't priced.
 */
export function getPhotographyPackageSelectionTotal(
  vendor: Vendor | undefined,
  sel: { bucket: string; hours: number } | undefined,
): number | null {
  if (!vendor?.guestPackages || !sel) return null
  const price = getPhotographyPackagePrice(vendor.guestPackages, sel.bucket, sel.hours)
  return price > 0 ? price : null
}

/**
 * Which pricing model(s) a photographer offers. Prefers the explicit
 * `photographyPricingModels` field, but falls back to inferring from the presence
 * of a rate card / guest packages for back-compat with listings authored before
 * the model selector existed.
 */
export function getPhotographyModels(vendor: Vendor | undefined): PhotographyPricingModel[] {
  if (!vendor) return []
  if (vendor.photographyPricingModels && vendor.photographyPricingModels.length > 0) {
    return vendor.photographyPricingModels
  }
  const models: PhotographyPricingModel[] = []
  if (getRateCardBaseHourly(vendor.rateCard) > 0) models.push('hourly')
  if (getPhotographyGuestFromPrice(vendor.guestPackages) > 0) models.push('guestBased')
  return models
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
    // Photography is one model at a time: a guest-based package (if picked) takes
    // precedence over the hourly rate-card team so the two never double-count.
    getPhotographyPackageSelectionTotal(vendor, category.photographyPackage)
      ?? getPhotographySelectionTotal(vendor, category.photographyTeam),
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
  Banjantrilu: 'BAN', Reels: 'REL', 'Hair Stylist': 'HAR', 'Saree Draping': 'SAR',
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
