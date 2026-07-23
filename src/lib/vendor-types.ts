export interface BlockedTimeRange {
  from: string  // e.g. '09:00'
  to: string    // e.g. '14:00'
}

/** Decor-only: a size variant for a design, with a per-size price. */
export interface SizePrice {
  /** Width in feet */
  widthFt: number
  /** Height in feet */
  heightFt: number
  /** Price for this size variant in ₹ */
  price: number
}

/** A single design entry (used by the Decor designs flow and venue in-house decor). */
export interface DesignDraft {
  id: string
  name: string
  photos: string[]   // blob URLs in demo, public URLs in live mode after upload
  videos: string[]
  price: number
  /** Optional per-size price variants. When non-empty, the "from" price is min(sizes.price). */
  sizes?: SizePrice[]
}

/** Venue-only: in-house decor offering attached to a venue listing. */
export interface InHouseDecor {
  /** Whether couples booking this venue must take the in-house decor.
   *  Kept in sync with outsideDecorPolicy (true ⇔ 'notAllowed') for back-compat. */
  compulsory: boolean
  /** Outside-decorator policy: 'notAllowed' (in-house compulsory), 'royalty'
   *  (allowed for a fee), or 'allowedFree' (allowed, no charge). */
  outsideDecorPolicy?: 'notAllowed' | 'royalty' | 'allowedFree'
  /** True when compulsory but the vendor skipped adding details (reminder pending). */
  pending?: boolean
  /** Decor detail field values (reuses the Decor listing's detail fields). */
  fields?: Record<string, string | string[]>
  /** Per-design entries, each separately priced. */
  designs?: DesignDraft[]
  /** Direct contact number for the venue's dedicated decor person. */
  decoratorPhone?: string
  /** Starting ("from") price of the in-house decor — useful when designs are
   *  added later so couples still see a price. */
  startingPrice?: number
  /** Royalty/fee (₹) charged when a couple brings an outside decorator instead. */
  outsideDecorRoyalty?: number
}

/** How a catering / plate-package menu is presented to couples:
 *  'items' = the interactive dish-bank builder; 'photos' = uploaded menu images. */
export type MenuMode = 'items' | 'photos'

/** Catering-only: one section of the curated menu. */
export interface MenuSection {
  /** Section name, matches one of MENU_SECTIONS from dish-bank.ts */
  section: string
  /** Dish IDs (from DISH_BANK) the caterer offers in this section */
  dishIds: number[]
  /** Free-form dish names the caterer typed in themselves (not in DISH_BANK) */
  customDishes?: string[]
  /** How many dishes the couple can pick from this section (0 = section disabled) */
  pickLimit: number
  /** A vendor-named category not in the dish bank — no bank dish list; every
   *  dish is added manually via customDishes. */
  custom?: boolean
}

/** Venue-only: the venue's physical location. */
export interface VenueLocation {
  /** Full street address of the venue. */
  address: string
  /** Locality / area. */
  area?: string
  /** City. */
  city?: string
  /** Optional Google Maps link/pin the vendor pastes. */
  mapsLink?: string
  /** Coordinates resolved from mapsLink (see resolveVenueGeo). Used to measure
   *  how far the venue is from the couple. Ride along inside the venue_location
   *  jsonb — no separate column. */
  lat?: number
  lng?: number
}

/** Venue-only: which pricing model(s) a venue offers. */
export type VenuePricingModel = 'rent' | 'perPlate'

/** Venue-only: a named service time slot offered by the venue (e.g. "Morning · 9 AM–1 PM").
 *  Defined once at the venue (listing) level and shared across all plate packages. */
export interface PlateSlot {
  /** Stable per-slot id. */
  id: string
  /** Slot name the vendor chooses, e.g. "Morning", "Evening". */
  name: string
  /** Start time, 'HH:MM' (24h). */
  from: string
  /** End time, 'HH:MM' (24h). */
  to: string
}

/**
 * Resolve a venue's service slots for display/edit. Prefers the venue-level
 * `plate_slots` column; falls back to legacy per-package slots (deduped by
 * name+from+to) so venues created before slots moved up keep showing them.
 */
export function resolveVenueSlots(rawSlots: unknown, platePackages: unknown): PlateSlot[] | undefined {
  if (Array.isArray(rawSlots) && rawSlots.length > 0) return rawSlots as PlateSlot[]
  const pkgs = Array.isArray(platePackages) ? (platePackages as Array<{ slots?: PlateSlot[] }>) : []
  const seen = new Set<string>()
  const out: PlateSlot[] = []
  for (const p of pkgs) {
    for (const s of p?.slots || []) {
      const key = `${s.name}|${s.from}|${s.to}`
      if (!seen.has(key)) { seen.add(key); out.push(s) }
    }
  }
  return out.length > 0 ? out : undefined
}

/** Venue-only: a per-plate food package/tier for the rent-free (per-plate) model. */
export interface PlatePackage {
  /** Stable per-package id (so we can edit/remove individual tiers). */
  id: string
  /** Tier name, e.g. "Veg Silver", "Non-veg Gold". */
  name: string
  /** Price charged per plate in ₹. */
  pricePerPlate: number
  /** Optional minimum plate count for this tier. */
  minPlates?: number
  /** Menu the couple gets in this package — same structure as a Catering menu
   *  (sections of dish-bank picks + custom dishes + per-section pick limits). */
  menu?: MenuSection[]
  /** Uploaded menu photos for this package (used when menuMode is 'photos'). */
  menuPhotos?: string[]
  /** Whether this package's menu is built item-by-item or shown as photos. Defaults to 'items'. */
  menuMode?: MenuMode
}

export interface PaidRoom {
  /** Stable per-room id (so we can edit/remove individual rooms). */
  id: string
  /** Number of people the room is sized for (2, 4, 6, etc.). */
  sharing: number
  /** Inventory: how many rooms of this exact configuration are available. */
  count: number
  /** Price per night/room — vendor decides the unit context. */
  price: number
  /** Selected amenities from the predefined list. */
  amenities: string[]
  /** Photo URLs (blob in demo, public Supabase URLs in live mode). */
  photos: string[]
}

export const ROOM_AMENITIES = [
  'AC',
  'Attached bathroom',
  'Hot water 24x7',
  'TV',
  'Wi-Fi',
  'Mini fridge',
  'Tea/coffee maker',
  'Wardrobe',
  'Balcony',
  'Room service',
  'Daily housekeeping',
  'Breakfast included',
] as const

export interface VendorProfile {
  businessName: string
  category: string
  city: string
  area: string
  phone: string
  secondaryPhone?: string
  whatsapp: string
  email: string
  instagram?: string
  description: string
  experience: number
  teamSize: string
  portfolioPhotos: string[]
  portfolioVideos?: string[]
  rating: number
  /** Category-specific onboarding field values (key → selected value(s)) */
  categoryFields?: Record<string, string | string[]>
}

export interface VendorPackage {
  id: string
  name: string
  price: number
  features: string[]
  capacity: string
}

export interface VendorDesignListing {
  id: string
  name: string
  photos: string[]
  style: string
  price: number
  description: string
  views: number
  shortlists: number
  bookings: number
}

export interface VendorListing {
  id: string
  name: string
  photos: string[]
  videos?: string[]
  /** Venue-only: the venue's physical location. */
  venueLocation?: VenueLocation
  /** Venue-only: which pricing model(s) this venue offers (rent and/or per-plate). */
  venuePricingModels?: VenuePricingModel[]
  /** Venue-only: per-duration price tiers, e.g. [{ hours: 12, price: 500000 }, ...] */
  hourlyPricing?: { hours: number; price: number }[]
  /** Venue-only: per-plate food packages (the rent-free / per-plate model). */
  platePackages?: PlatePackage[]
  /** Venue-only: service time slots offered by the venue (shared across all plate packages). */
  slots?: PlateSlot[]
  /** Venue-only: paid lodging rooms the venue offers, grouped by sharing capacity. */
  paidRooms?: PaidRoom[]
  /** Venue-only: in-house decor offering (whether compulsory + its details/designs). */
  inHouseDecor?: InHouseDecor
  /** Catering-only: curated menu sections (dish bank picks + per-section pick limits). */
  menu?: MenuSection[]
  /** Catering-only: uploaded menu photos (used when menuMode is 'photos'). */
  menuPhotos?: string[]
  /** Catering-only: whether the menu is built item-by-item or shown as photos. Defaults to 'items'. */
  menuMode?: MenuMode
  /** Photography-only: which pricing model(s) this photographer offers. Photography
   *  is event-based only now, so this is always ['eventBased']; kept for back-compat. */
  photographyPricingModels?: import('./vendor-category-config').PhotographyPricingModel[]
  /** Photography event-based: one or more pricing cards — each covers a set of
   *  events with a flat per-service price for the whole event. */
  eventPackages?: import('./vendor-category-config').PhotographyEventPackage[]
  /** Hosts/Entertainers-only: flat price per event + shared duration/hour/languages. */
  entertainerPricing?: import('./vendor-category-config').EntertainerPricing
  /** Mehendi-only: bridal coverage×design matrix + groom/guest pricing.
   *  Authored in onboarding; `price` holds the cheapest bridal "from" price. */
  mehendiPricing?: import('./vendor-category-config').MehendiPricing
  /** Makeup-only: bridal per-event per-look pricing + groom/guest. Authored in
   *  onboarding; `price` holds the cheapest "from" price. */
  makeupPricing?: import('./vendor-category-config').MakeupPricing
  /** Saree Draping-only: bridal/groom per-look + guest pricing. Authored in
   *  onboarding; `price` holds the cheapest "from" price. */
  sareeDrapingPricing?: import('./vendor-category-config').SareeDrapingPricing
  /** Makeup add-on only: bridal/groom per-look + guest hair-styling pricing. */
  hairStylingPricing?: import('./vendor-category-config').HairStylingPricing
  /** Whether transport & logistics is bundled into the listing price. */
  transportIncluded?: boolean
  /** Extra transport & logistics charge in ₹ (only meaningful when transportIncluded === false). */
  transportExtra?: number
  /** Index of the photo to use as listing cover (defaults to 0 / first photo) */
  coverPhotoIndex?: number
  category: string
  price: number
  /** Decor-only: per-size price variants. If present, `price` should equal min(sizes.price). */
  sizes?: SizePrice[]
  style: string
  /** Which rituals/events this listing is suitable for */
  rituals?: string[]
  /** Category-specific selectable field values (key → selected value(s)) */
  categoryFields?: Record<string, string | string[]>
  includes: string[]
  createdAt: string
  /** For Venue listings: IDs of decor/catering listings (by the same vendor) that
   *  come bundled when a couple selects this venue. */
  bundledListings?: string[]
  /** If true, accepting this venue means the couple must accept the bundle too. */
  bundleMandatory?: boolean
  // Legacy fields (kept for backward compat with mock data)
  capacity?: number
  coverageHours?: number
  cuisineTypes?: string[]
  editedPhotos?: number
  guestCount?: number
}

export interface VendorBooking {
  id: string
  coupleNames: string
  eventName: string
  eventDate: string
  category: string
  packageTier: string
  totalValue: number
  slotAmountPaid: number
  totalPaid: number
  remainingBalance: number
  milestoneProgress: number
  totalMilestones: number
  status: 'active' | 'completed' | 'cancelled'
  phone: string
  whatsapp: string
}

export interface VendorTrial {
  id: string
  coupleNames: string
  eventName: string
  category: string
  status: 'pending' | 'scheduled' | 'completed' | 'declined'
  requestedDate: string
  scheduledDate?: string
  declineReason?: string
  vendorProposedDate?: string
  vendorProposedTime?: string
}

export interface VendorBidRequest {
  id: string
  coupleNames: string
  eventName: string
  category: string
  uploadedImage: string
  status: 'pending' | 'submitted' | 'selected' | 'not_selected'
  bidPrice?: number
  bidNote?: string
  /** Decor brief snapshot — only present for Decor category bids */
  decorBrief?: import('./types').DecorBrief | null
}

/**
 * A lead: a couple who added one of this vendor's listings to their board (a
 * "picked" signal). For a per-plate venue it records which plate package they
 * chose. No couple contact — couples stay anonymous until a trial/booking.
 */
export interface VendorLead {
  /** board_category id (stable per lead). */
  id: string
  /** The vendor listing the couple selected. */
  listingId: string
  listingName: string
  /** Listing category (e.g. 'Venue'). */
  category: string
  /** The couple's ritual/board name (e.g. 'Wedding') and event date, if set. */
  boardName: string
  eventDate?: string
  /** The board category label the listing was selected under. */
  categoryLabel: string
  /** Venue per-plate: the plate package the couple picked. */
  packageName?: string
  packagePrice?: number
  /** Venue rent: the rental duration (hours) the couple picked. */
  tierHours?: number
}

export interface VendorNotification {
  id: string
  type: string
  title: string
  body: string
  timestamp: string
  read: boolean
  link?: string
}

export interface VendorReview {
  id: string
  coupleNames: string
  eventName: string
  eventDate: string
  rating: number
  text: string
  datePosted: string
  vendorResponse?: string
  vendorRespondedAt?: string
}

export interface EarningsTransaction {
  id: string
  bookingId: string
  coupleNames: string
  eventName: string
  amount: number
  type: 'slot' | 'milestone' | 'final'
  date: string
}

export interface VendorAnalytics {
  profileViews: number
  exploreAppearances: number
  shortlistCount: number
  likeCount: number
  suggestionCount: number
  compareAppearances: number
  trialRequests: number
  trialsConverted: number
  directBookings: number
  totalBookings: number
  conversionRate: number
}

export interface VendorState {
  vendorOnboardingComplete: boolean
  vendorProfile: VendorProfile | null
  vendorPackages: VendorPackage[]
  vendorDesigns: VendorDesignListing[]
  vendorListings: VendorListing[]
  // key: date string, value: { status, listingIds (which listings are blocked, empty = all), blockedRanges (specific time ranges blocked, empty = full day) }
  vendorAvailability: Record<string, { status: 'available' | 'blocked' | 'booked'; listingIds: string[]; blockedRanges: BlockedTimeRange[] }>

  vendorBookings: VendorBooking[]
  vendorTrials: VendorTrial[]
  vendorBidRequests: VendorBidRequest[]
  vendorLeads: VendorLead[]
  vendorNotifications: VendorNotification[]
  vendorReviews: VendorReview[]
  vendorEarnings: EarningsTransaction[]
  vendorAnalytics: VendorAnalytics

  // Actions
  completeVendorOnboarding: (profile: VendorProfile, packages: VendorPackage[], markComplete?: boolean) => Promise<string | null>
  toggleDateBlock: (date: string, listingIds: string[], blockedRanges: BlockedTimeRange[]) => void
  submitBid: (bidId: string, price: number, note: string) => void
  scheduleTrial: (trialId: string, date: string) => void
  proposeTrialNewTime: (trialId: string, newDate: string, newTime: string) => void
  declineTrial: (trialId: string, reason: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: VendorNotification) => void
  addListing: (listing: VendorListing, vendorId?: string) => Promise<boolean>
  updateListing: (listing: VendorListing) => void
  deleteListing: (listingId: string) => void
  updateVendorProfile: (profile: Partial<VendorProfile>) => void
  addPackage: (pkg: VendorPackage) => void
  updatePackage: (pkg: VendorPackage) => void
  deletePackage: (packageId: string) => void
  completeBookingMilestone: (bookingId: string) => void
  respondToReview: (reviewId: string, response: string) => void
}
