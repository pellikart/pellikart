// Dev-only demo mode — lets you browse the app fully populated without a
// Supabase backend or Google sign-in.
//
// This mirrors the web app's demo mode: the shared stores already load mock
// vendors and mock ritual boards as their DEFAULT state (see store.ts /
// vendor-store.ts), so entering demo is just a matter of flipping the role and
// onboarding flags — no network, no auth. It is gated to __DEV__ at the call
// site so it can never ship in a release build.

import { useStore } from '@shared/store'
import { useVendorStore } from '@shared/vendor-store'
import {
  getMockListingsForCategory,
  mockVendorBookings,
  mockVendorTrials,
  mockVendorLeads,
  mockVendorReviews,
  mockVendorEarnings,
  mockVendorNotifications,
  generateMockAvailability,
} from '@shared/vendor-mock-data'
import type { OnboardingData } from '@shared/types'
import type { VendorProfile } from '@shared/vendor-types'

const DEMO_ONBOARDING: OnboardingData = {
  partner1: 'Aisha',
  partner2: 'Rohan',
  events: ['Haldi', 'Pelli (Wedding)', 'Reception'],
  customEvents: [],
  eventDates: {},
  eventGuests: { 'Pelli (Wedding)': '500-1000', Reception: '500-1000', Haldi: '100-200' },
  budget: 1800000,
  style: null,
  location: 'Jubilee Hills, Hyderabad',
  locationLat: 17.4239,
  locationLng: 78.4108,
}

/**
 * Enter the couple app with mock boards and vendors.
 * @param unlocked when true, seeds a paid subscription so vendor names show;
 *   when false (default), names stay locked so the paywall behaviour is visible.
 */
export function enterCoupleDemo(unlocked = false) {
  useStore.setState({
    role: 'user',
    onboardingComplete: true,
    onboardingData: DEMO_ONBOARDING,
    subscription: unlocked ? 'gold' : 'free',
  })
}

const DEMO_VENDOR_PROFILE: VendorProfile = {
  businessName: 'Muhurtham Films',
  category: 'Photography',
  city: 'Hyderabad',
  area: 'Jubilee Hills',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  email: 'hello@muhurthamfilms.in',
  instagram: '@muhurthamfilms',
  description: 'Candid & cinematic wedding photography across Telangana and AP.',
  experience: 8,
  teamSize: '4-6',
  portfolioPhotos: [],
  rating: 4.7,
}

/** Enter the vendor app with a seeded profile, listings and pipeline data. */
export function enterVendorDemo() {
  useVendorStore.setState({
    vendorOnboardingComplete: true,
    vendorProfile: DEMO_VENDOR_PROFILE,
    vendorListings: getMockListingsForCategory('Photography'),
    vendorAvailability: generateMockAvailability(),
    vendorBookings: mockVendorBookings,
    vendorTrials: mockVendorTrials,
    vendorLeads: mockVendorLeads,
    vendorReviews: mockVendorReviews,
    vendorEarnings: mockVendorEarnings,
    vendorNotifications: mockVendorNotifications,
  })
  useStore.setState({ role: 'vendor' })
}
