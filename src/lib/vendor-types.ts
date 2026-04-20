export interface BlockedTimeRange {
  from: string  // e.g. '09:00'
  to: string    // e.g. '14:00'
}

export interface VendorProfile {
  businessName: string
  category: string
  city: string
  area: string
  phone: string
  whatsapp: string
  email: string
  description: string
  experience: number
  teamSize: string
  portfolioPhotos: string[]
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
  category: string
  price: number
  style: string
  /** Which rituals/events this listing is suitable for */
  rituals?: string[]
  /** Category-specific selectable field values (key → selected value(s)) */
  categoryFields?: Record<string, string | string[]>
  includes: string[]
  createdAt: string
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
  completeVendorOnboarding: (profile: VendorProfile, packages: VendorPackage[]) => void
  toggleDateBlock: (date: string, listingIds: string[], blockedRanges: BlockedTimeRange[]) => void
  submitBid: (bidId: string, price: number, note: string) => void
  scheduleTrial: (trialId: string, date: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  addListing: (listing: VendorListing) => void
  updateListing: (listing: VendorListing) => void
  updateVendorProfile: (profile: Partial<VendorProfile>) => void
}
