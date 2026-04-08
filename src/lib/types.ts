export type SubscriptionTier = 'free' | 'silver' | 'gold';

export interface OnboardingData {
  partner1: string;
  partner2: string;
  events: string[];
  customEvents: string[];
  eventDates: Record<string, { start: string; end: string } | null>;
  eventGuests: Record<string, string>;
  budget: number;
  style: string | null;
}

export interface Vendor {
  id: string;
  code: string;
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

export interface Category {
  id: string;
  label: string;
  selectedVendorId: string | null;
  shortlistedVendorIds: string[];
  suggestedVendors: SuggestedVendor[];
  removed: boolean;
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
  addToShortlist: (ritualId: string, categoryId: string, vendorId: string) => void;
  removeFromShortlist: (ritualId: string, categoryId: string, vendorId: string) => void;
  toggleLike: (vendorId: string, userName: string, userId: string) => void;
  removeCategory: (ritualId: string, categoryId: string) => void;
  bookVendor: (vendorId: string, amount: number) => void;
  bookAllVendors: (ritualId: string) => void;
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
}

// Re-export vendor types for convenience
export type { VendorState, VendorProfile, VendorPackage } from './vendor-types'
