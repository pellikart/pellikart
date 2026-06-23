export type SubscriptionTier = 'free' | 'silver' | 'gold';

export interface OnboardingData {
  partner1: string;
  partner2: string;
  events: string[];
  customEvents: string[];
  eventDates: Record<string, { start: string; end: string } | null>;
  eventGuests: Record<string, string>;
  budget: number;
  eventBudgets?: Record<string, number>;
  style: string | null;
}

export interface Vendor {
  id: string;
  code: string;
  /** Anonymous public code shown to couples before unlock (e.g. "PK-PHO-0042-1"). */
  publicCode?: string;
  name: string;
  photo: string;
  style: string;
  area: string;
  capacity?: number;
  price: number;
  rating: number;
  packageTier: string;
  likes: Like[];
  booked: boolean;
  amountPaid: number;
  // Extended fields (populated in live mode from Supabase)
  description?: string;
  portfolioPhotos?: string[];
  portfolioVideos?: string[];
  listingPhotos?: string[];
  listingVideos?: string[];
  /** Venue-only: the venue's physical location. */
  venueLocation?: import('./vendor-types').VenueLocation;
  /** Venue-only: which pricing model(s) this venue offers (rent and/or per-plate). */
  venuePricingModels?: import('./vendor-types').VenuePricingModel[];
  hourlyPricing?: { hours: number; price: number }[];
  /** Venue-only: per-plate food packages (the rent-free / per-plate model). */
  platePackages?: import('./vendor-types').PlatePackage[];
  /** Decor-only: per-size price variants. When set, `price` is the min (starting price). */
  sizes?: import('./vendor-types').SizePrice[];
  paidRooms?: import('./vendor-types').PaidRoom[];
  /** Venue-only: in-house decor offering (compulsory flag + details/designs). */
  inHouseDecor?: import('./vendor-types').InHouseDecor;
  menu?: import('./vendor-types').MenuSection[];
  /** Photography-only: per-hour rate card keyed by role. When set, `price` is the
   *  per-hour total for 1 of each offered role (the "₹X/hr" board figure). */
  rateCard?: import('./vendor-category-config').PhotographyRateCard;
  /** Photography-only: hour blocks the vendor is willing to work (e.g. [4, 6, 8, 10]). */
  availableHours?: number[];
  /** Mehendi-only: bridal coverage×design matrix + groom/guest pricing. */
  mehendiPricing?: import('./vendor-category-config').MehendiPricing;
  /** Makeup-only: bridal per-event per-look pricing + groom/guest. */
  makeupPricing?: import('./vendor-category-config').MakeupPricing;
  /** Saree Draping-only: bridal/groom per-look + guest pricing. */
  sareeDrapingPricing?: import('./vendor-category-config').SareeDrapingPricing;
  /** Hair Stylist-only (or a Makeup add-on): bridal/groom per-look + guest pricing. */
  hairStylingPricing?: import('./vendor-category-config').HairStylingPricing;
  rituals?: string[];
  transportIncluded?: boolean;
  transportExtra?: number;
  categoryFields?: Record<string, string | string[]>;
  includes?: string[];
  phone?: string;
  secondaryPhone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  experience?: number;
  teamSize?: string;
  availableDates?: string[];  // dates that are NOT blocked/booked
  blockedDates?: string[];
  /** Category label this listing belongs to (e.g. 'Venue', 'Decor'). Populated in live mode. */
  category?: string;
  /** For venue listings: IDs of bundled decor/catering listings */
  bundledListings?: string[];
  /** If true, selecting this venue requires accepting the bundle */
  bundleMandatory?: boolean;
}

export interface Like {
  userId: string;
  name: string;
}

export interface Design {
  id: string;
  vendorId: string;
  name: string;
  photo: string;
  style: string;
  price: number;
  rating: number;
  description: string;
}

export type SizeUnit = 'ft' | 'm' | 'cm';

/** Brief a couple fills out for the Decor category so vendors can quote accurately.
 *  Persisted on board_categories.decor_brief (jsonb). */
export interface DecorBrief {
  setting: string;
  coverage: string;
  size: { width: string; height: string; unit: SizeUnit };
  flowers: string;
  referenceImage?: string;
  notes: string;
}

export interface Category {
  id: string;
  label: string;
  selectedVendorId: string | null;
  shortlistedVendorIds: string[];
  suggestedVendors: SuggestedVendor[];
  removed: boolean;
  /** Decor brief — only meaningful when label === 'Decor' */
  decorBrief?: DecorBrief | null;
  /** Venue-only: which hourly tier (by hours) the couple picked for the selected vendor */
  selectedTierHours?: number;
  /** Photography-only: the couple's rate-card selection for the selected vendor —
   *  how many people per role + shared coverage hours. Drives the live total. */
  photographyTeam?: { counts: Record<string, number>; hours: number };
  /** Mehendi-only: the couple's selection — bridal coverage + design, groom, guests. */
  mehendiSelection?: { coverage?: string; design?: string; groom?: boolean; guests?: number };
  /** Makeup-only: the couple's selection — bridal looks per category, groom, guests, add-ons. */
  makeupSelection?: { eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] };
  /** Saree Draping-only: the couple's selection — bridal looks, groom looks, guests, pre-pleated sarees. */
  sareeSelection?: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number };
  /** Hair Stylist-only (or Makeup add-on): the couple's selection — bridal looks, groom looks, guests. */
  hairSelection?: { bridalLooks?: number; groomLooks?: number; guests?: number };
}

export interface SuggestedVendor {
  vendorId: string;
  suggestedBy: string;
}

export interface RitualBoard {
  id: string;
  name: string;
  dateStart?: string;
  dateEnd?: string;
  categories: Category[];
}

export interface TrialInfo {
  status: 'requested' | 'accepted' | 'rescheduled' | 'confirmed' | 'done';
  requestedDate: string;
  requestedTime: string;
  scheduledDate: string;
  scheduledTime: string;
  vendorId: string;
  categoryLabel: string;
  ritualName: string;
  vendorProposedDate?: string;
  vendorProposedTime?: string;
}

export type AppRole = 'none' | 'user' | 'vendor';

export interface AppState {
  role: AppRole;
  onboardingComplete: boolean;
  onboardingData: OnboardingData | null;
  subscription: SubscriptionTier;
  ritualBoards: RitualBoard[];
  // The event board currently in focus (shared between the desktop sidebar and HomePage).
  activeBoardId: string | null;
  vendors: Record<string, Vendor>;
  milestoneProgress: Record<string, number>;
  // Trial sessions: keyed by "ritualId-categoryId-vendorId"
  trialSessions: Record<string, TrialInfo>;
  // Trials used per category: keyed by "ritualId-categoryId"
  trialsUsed: Record<string, number>;

  // Actions
  setRole: (role: AppRole) => void;
  completeOnboarding: (data: OnboardingData) => void;
  subscribe: (tier: SubscriptionTier) => void;
  selectVendor: (ritualId: string, categoryId: string, vendorId: string) => void;
  selectVendorTier: (ritualId: string, categoryId: string, tierHours: number | undefined) => void;
  selectPhotographyTeam: (ritualId: string, categoryId: string, counts: Record<string, number>, hours: number) => void;
  selectMehendiOptions: (ritualId: string, categoryId: string, selection: { coverage?: string; design?: string; groom?: boolean; guests?: number }) => void;
  selectMakeupOptions: (ritualId: string, categoryId: string, selection: { eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] }) => void;
  selectSareeOptions: (ritualId: string, categoryId: string, selection: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number }) => void;
  selectHairOptions: (ritualId: string, categoryId: string, selection: { bridalLooks?: number; groomLooks?: number; guests?: number }) => void;
  addToShortlist: (ritualId: string, categoryId: string, vendorId: string) => void;
  removeFromShortlist: (ritualId: string, categoryId: string, vendorId: string) => void;
  toggleLike: (vendorId: string, userName: string, userId: string) => void;
  removeCategory: (ritualId: string, categoryId: string) => void;
  restoreCategory: (ritualId: string, categoryId: string) => void;
  addBoardCategory: (ritualId: string, label: string) => void;
  bookVendor: (vendorId: string, amount: number) => void;
  bookAllVendors: (ritualId: string) => void;
  cancelBooking: (vendorId: string) => void;
  setDecorBrief: (ritualId: string, categoryId: string, brief: DecorBrief | null) => void;
  swapVendor: (ritualId: string, categoryId: string, newVendorId: string) => void;
  completeMilestone: (vendorId: string, totalMilestones: number) => void;
  updateBoardDates: (ritualId: string, dateStart: string, dateEnd: string, removeVendorIds: string[]) => void;
  requestTrial: (ritualId: string, categoryId: string, vendorId: string, date: string, time: string) => void;
  acceptTrial: (ritualId: string, categoryId: string, vendorId: string) => void;
  proposeNewTrialTime: (ritualId: string, categoryId: string, vendorId: string, newDate: string, newTime: string) => void;
  confirmReschedule: (ritualId: string, categoryId: string, vendorId: string) => void;
  markTrialDone: (ritualId: string, categoryId: string, vendorId: string) => void;
  getMaxTrials: () => number;
  addDesignAsVendor: (design: Design) => void;
  addRitualBoard: (name: string, dateStart?: string, dateEnd?: string) => void;
  setActiveBoardId: (id: string | null) => void;
}

// Re-export vendor types for convenience
export type { VendorState, VendorProfile, VendorPackage } from './vendor-types'
