export interface BlockedTimeRange {
  from: string  // e.g. '09:00'
  to: string    // e.g. '14:00'
}

/** Catering-only: one section of the curated menu. */
export interface MenuSection {
  /** Section name, matches one of MENU_SECTIONS from dish-bank.ts */
  section: string
  /** Dish IDs (from DISH_BANK) the caterer offers in this section */
  dishIds: number[]
  /** How many dishes the couple can pick from this section (0 = section disabled) */
  pickLimit: number
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
  profileCompleteness: number
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
  /** Venue-only: per-duration price tiers, e.g. [{ hours: 12, price: 500000 }, ...] */
  hourlyPricing?: { hours: number; price: number }[]
  /** Venue-only: paid lodging rooms the venue offers, grouped by sharing capacity. */
  paidRooms?: PaidRoom[]
  /** Catering-only: curated menu sections (dish bank picks + per-section pick limits). */
  menu?: MenuSection[]
  /** Whether transport & logistics is bundled into the listing price. */
  transportIncluded?: boolean
  /** Extra transport & logistics charge in ₹ (only meaningful when transportIncluded === false). */
  transportExtra?: number
  /** Index of the photo to use as listing cover (defaults to 0 / first photo) */
  coverPhotoIndex?: number
  category: string
  price: number
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
  vendorNotifications: VendorNotification[]
  vendorReviews: VendorReview[]
  vendorEarnings: EarningsTransaction[]
  vendorAnalytics: VendorAnalytics

  // Actions
  completeVendorOnboarding: (profile: VendorProfile, packages: VendorPackage[]) => void | Promise<void>
  toggleDateBlock: (date: string, listingIds: string[], blockedRanges: BlockedTimeRange[]) => void
  submitBid: (bidId: string, price: number, note: string) => void
  scheduleTrial: (trialId: string, date: string) => void
  proposeTrialNewTime: (trialId: string, newDate: string, newTime: string) => void
  declineTrial: (trialId: string, reason: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addListing: (listing: VendorListing) => void
  updateListing: (listing: VendorListing) => void
  deleteListing: (listingId: string) => void
  updateVendorProfile: (profile: Partial<VendorProfile>) => void
  addPackage: (pkg: VendorPackage) => void
  updatePackage: (pkg: VendorPackage) => void
  deletePackage: (packageId: string) => void
  completeBookingMilestone: (bookingId: string) => void
  respondToReview: (reviewId: string, response: string) => void
}
