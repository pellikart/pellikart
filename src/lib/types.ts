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
  /** Optional: couple's home locality or address. Used to surface vendors near them. */
  location?: string | null;
  /** Optional: couple's home coordinates (from the "use current location" button).
   *  Paired with venue coordinates to show "X km away" on explore cards. */
  locationLat?: number | null;
  locationLng?: number | null;
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
  /** Venue-only: service time slots offered by the venue (shared across all plate packages). */
  slots?: import('./vendor-types').PlateSlot[];
  /** Decor-only: per-size price variants. When set, `price` is the min (starting price). */
  sizes?: import('./vendor-types').SizePrice[];
  paidRooms?: import('./vendor-types').PaidRoom[];
  /** Venue-only: in-house decor offering (compulsory flag + details/designs). */
  inHouseDecor?: import('./vendor-types').InHouseDecor;
  menu?: import('./vendor-types').MenuSection[];
  /** Catering-only: uploaded menu photos (shown when menuMode is 'photos'). */
  menuPhotos?: string[];
  /** Catering-only: whether the menu is item-by-item or photo-based. */
  menuMode?: import('./vendor-types').MenuMode;
  /** Photography-only: per-hour rate card keyed by role. When set, `price` is the
   *  per-hour total for 1 of each offered role (the "₹X/hr" board figure). */
  rateCard?: import('./vendor-category-config').PhotographyRateCard;
  /** Photography-only: hour blocks the vendor is willing to work (e.g. [4, 6, 8, 10]). */
  availableHours?: number[];
  /** Photography-only: which pricing model(s) this photographer offers (hourly rate
   *  card and/or guest-based packages). Mirrors venue's venuePricingModels. */
  photographyPricingModels?: import('./vendor-category-config').PhotographyPricingModel[];
  /** Photography-only: guest-based packages — guest bucket × hours → flat price. */
  guestPackages?: import('./vendor-category-config').PhotographyGuestPackages;
  /** Photography guest-based: photographers present per guest bucket (informational —
   *  shown to couples, doesn't change the flat package price). */
  guestPackagePhotographers?: Record<string, number>;
  /** Photography guest-based: videographers present per guest bucket (informational). */
  guestPackageVideographers?: Record<string, number>;
  /** Mehendi-only: bridal coverage×design matrix + groom/guest pricing. */
  mehendiPricing?: import('./vendor-category-config').MehendiPricing;
  /** Makeup-only: bridal per-event per-look pricing + groom/guest. */
  makeupPricing?: import('./vendor-category-config').MakeupPricing;
  /** Saree Draping-only: bridal/groom per-look + guest pricing. */
  sareeDrapingPricing?: import('./vendor-category-config').SareeDrapingPricing;
  /** Makeup add-on only: bridal/groom per-look + guest hair-styling pricing. */
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
  /** Venue per-plate-only: which plate package (by id) the couple picked for the selected venue. */
  selectedPlatePackageId?: string;
  /** Venue per-plate-only: the plate package the couple picked for EACH board venue
   *  (vendorId → packageId), chosen when the venue is added so Compare lines them up
   *  package-vs-package. The selected venue's entry mirrors selectedPlatePackageId. */
  platePackageByVendor?: Record<string, string>;
  /** Photography-only: the couple's rate-card selection for the selected vendor —
   *  how many people per role + shared coverage hours. Drives the live total. */
  photographyTeam?: { counts: Record<string, number>; hours: number };
  /** Photography guest-based model: the couple's picked guest bucket + coverage hours.
   *  Mutually exclusive with photographyTeam (the hourly model). */
  photographyPackage?: { bucket: string; hours: number };
  /** Mehendi-only: the couple's selection — bridal coverage + design, groom, guests. */
  mehendiSelection?: { coverage?: string; design?: string; groom?: boolean; guests?: number };
  /** Makeup-only: the couple's selection — bridal looks per category, groom, guests, add-ons. */
  makeupSelection?: { eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] };
  /** Saree Draping-only: the couple's selection — bridal looks, groom looks, guests, pre-pleated sarees. */
  sareeSelection?: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number };
  /** Makeup add-on only: the couple's hair-styling selection — bridal looks, groom looks, guests. */
  hairSelection?: { bridalLooks?: number; groomLooks?: number; guests?: number };
  /** Catering/Venue menu picks. Keyed by vendor/listing id → package id (or
   *  'listing' for a package-less catering menu) → section name → picked dish
   *  keys (bank dish id number, or custom dish name string). */
  menuSelection?: MenuSelection;
}

/** vendorId → packageId → section → picked dish keys (number bank id | string custom name). */
export type MenuSelection = Record<string, Record<string, Record<string, (number | string)[]>>>;

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
  /** Venue per-plate: select this venue for the category with one specific plate package. */
  selectVenuePackage: (ritualId: string, categoryId: string, vendorId: string, packageId: string) => void;
  /** Venue per-plate: add a venue to the board (shortlist) with a chosen plate package,
   *  without making it the selected winner. */
  addVenueToBoard: (ritualId: string, categoryId: string, vendorId: string, packageId: string) => void;
  selectPhotographyTeam: (ritualId: string, categoryId: string, counts: Record<string, number>, hours: number) => void;
  selectPhotographyPackage: (ritualId: string, categoryId: string, bucket: string, hours: number) => void;
  selectMehendiOptions: (ritualId: string, categoryId: string, selection: { coverage?: string; design?: string; groom?: boolean; guests?: number }) => void;
  selectMakeupOptions: (ritualId: string, categoryId: string, selection: { eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] }) => void;
  selectSareeOptions: (ritualId: string, categoryId: string, selection: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number }) => void;
  selectHairOptions: (ritualId: string, categoryId: string, selection: { bridalLooks?: number; groomLooks?: number; guests?: number }) => void;
  /** Save the couple's menu dish picks for a vendor's package (or 'listing' for
   *  a package-less catering menu), keyed per section. */
  selectMenuOptions: (ritualId: string, categoryId: string, vendorId: string, packageKey: string, sectionPicks: Record<string, (number | string)[]>) => void;
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
