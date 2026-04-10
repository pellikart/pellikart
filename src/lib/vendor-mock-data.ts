import { VendorBooking, VendorTrial, VendorBidRequest, VendorNotification, VendorReview, EarningsTransaction, VendorAnalytics, VendorListing } from './vendor-types'

const mockListingsData: Record<string, VendorListing[]> = {
  Photography: [
    { id: 'ml-1', name: 'Cinematic Love Story', photos: ['/images/gallery/photo/1.jpg', '/images/gallery/photo/2.jpg'], category: 'Photography', price: 200000, style: 'Candid + Cinematic', coverageHours: 10, includes: ['Candid Photos', 'Drone Shots', 'Pre-Wedding Shoot', 'Highlight Reel', 'Album', 'Full Video'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Classic Wedding Album', photos: ['/images/gallery/photo/3.jpg', '/images/gallery/photo/4.jpg'], category: 'Photography', price: 120000, style: 'Traditional + Posed', coverageHours: 8, includes: ['Traditional Photos', 'Candid Photos', 'Album', 'USB Drive'], createdAt: '2026-03-10' },
    { id: 'ml-3', name: 'Pre-Wedding Dreamshoot', photos: ['/images/gallery/photo/5.jpg', '/images/gallery/photo/6.jpg'], category: 'Photography', price: 80000, style: 'Fine Art', coverageHours: 4, includes: ['Candid Photos', 'Pre-Wedding Shoot', 'Same-Day Edit'], createdAt: '2026-03-01' },
  ],
  Venue: [
    { id: 'ml-1', name: 'Royal Mughal Night', photos: ['/images/gallery/venue/1.jpg', '/images/gallery/venue/2.jpg'], category: 'Venue', price: 950000, style: 'Royal Heritage', capacity: 1500, includes: ['AC Hall', 'Parking', 'Valet', 'Bridal Suite', 'Sound System', 'Generator Backup'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Garden Soirée', photos: ['/images/gallery/venue/3.jpg', '/images/gallery/venue/4.jpg'], category: 'Venue', price: 680000, style: 'Garden Party', capacity: 800, includes: ['Lawn Area', 'Parking', 'Guest Rooms', 'In-house Catering'], createdAt: '2026-03-10' },
  ],
  Decor: [
    { id: 'ml-1', name: 'Floral Cascade Mandap', photos: ['/images/gallery/decor/1.jpg', '/images/gallery/decor/2.jpg'], category: 'Decor', price: 320000, style: 'Floral Luxury', includes: ['Stage Setup', 'Mandap', 'Flower Arrangements', 'LED Lighting', 'Entrance Decor', 'Ceiling Decor'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Neon Modern Night', photos: ['/images/gallery/decor/3.jpg', '/images/gallery/decor/4.jpg'], category: 'Decor', price: 200000, style: 'Modern Minimalist', includes: ['Stage Setup', 'LED Lighting', 'Photo Booth', 'Table Centerpieces'], createdAt: '2026-03-10' },
    { id: 'ml-3', name: 'Traditional Gold Mandap', photos: ['/images/gallery/decor/5.jpg', '/images/gallery/decor/6.jpg'], category: 'Decor', price: 240000, style: 'Traditional', includes: ['Mandap', 'Flower Arrangements', 'Drapes & Fabrics', 'Entrance Decor'], createdAt: '2026-03-01' },
  ],
  Catering: [
    { id: 'ml-1', name: 'Royal North Indian Feast', photos: ['/images/gallery/catering/1.jpg', '/images/gallery/catering/2.jpg'], category: 'Catering', price: 350000, style: 'North Indian', capacity: 800, includes: ['Welcome Drinks', 'Starters', 'Main Course', 'Desserts', 'Live Counters', 'Service Staff'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'South Indian Sadya', photos: ['/images/gallery/catering/3.jpg', '/images/gallery/catering/4.jpg'], category: 'Catering', price: 220000, style: 'South Indian', capacity: 500, includes: ['Main Course', 'Desserts', 'Crockery & Cutlery', 'Service Staff'], createdAt: '2026-03-10' },
  ],
  Makeup: [
    { id: 'ml-1', name: 'HD Bridal 3-Look Package', photos: ['/images/gallery/makeup/1.jpg', '/images/gallery/makeup/2.jpg'], category: 'Makeup', price: 85000, style: 'HD Airbrush', guestCount: 1, includes: ['Bridal Makeup', 'Engagement Look', 'Reception Look', 'Hair Styling', 'Draping'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Family Makeup Package', photos: ['/images/gallery/makeup/3.jpg', '/images/gallery/makeup/4.jpg'], category: 'Makeup', price: 45000, style: 'Natural Glam', guestCount: 5, includes: ['Bridal Makeup', 'Family Makeup', 'Hair Styling'], createdAt: '2026-03-10' },
  ],
  Mehendi: [
    { id: 'ml-1', name: 'Bridal Rajasthani Full', photos: ['/images/gallery/mehendi/1.jpg', '/images/gallery/mehendi/2.jpg'], category: 'Mehendi', price: 40000, style: 'Rajasthani Bridal', guestCount: 1, includes: ['Bridal Full Hands', 'Bridal Full Feet'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Bride + 20 Guests', photos: ['/images/gallery/mehendi/3.jpg', '/images/gallery/mehendi/4.jpg'], category: 'Mehendi', price: 65000, style: 'Traditional', guestCount: 20, includes: ['Bridal Full Hands', 'Bridal Full Feet', 'Guest Mehendi'], createdAt: '2026-03-10' },
  ],
  'DJ / Music': [
    { id: 'ml-1', name: 'Bollywood + EDM Night', photos: ['/images/gallery/dj/1.jpg', '/images/gallery/dj/2.jpg'], category: 'DJ / Music', price: 95000, style: 'Bollywood + EDM', coverageHours: 8, includes: ['Sound System', 'DJ Console', 'LED Lights', 'Fog Machine', 'Dance Floor', 'Live Dhol'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Sufi Night Experience', photos: ['/images/gallery/dj/3.jpg', '/images/gallery/dj/4.jpg'], category: 'DJ / Music', price: 70000, style: 'Sufi + Bollywood', coverageHours: 6, includes: ['Sound System', 'Wireless Mics', 'Emcee'], createdAt: '2026-03-10' },
  ],
  Pandit: [
    { id: 'ml-1', name: 'Full Vedic Ceremony', photos: ['/images/gallery/decor/4.jpg'], category: 'Pandit', price: 25000, style: 'Vedic Rituals', includes: ['Full Ceremony', 'Havan Setup', 'Samagri Included', 'Ganesh Puja', 'Varmala Ceremony'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Quick Muhurat', photos: ['/images/gallery/decor/7.jpg'], category: 'Pandit', price: 11000, style: 'South Indian', includes: ['Full Ceremony', 'Muhurat Consultation', 'Samagri Included'], createdAt: '2026-03-10' },
  ],
  Invitations: [
    { id: 'ml-1', name: 'Luxury Box Set', photos: ['/images/gallery/decor/5.jpg'], category: 'Invitations', price: 110000, style: 'Luxury Boxed', includes: ['Design', 'Printing', 'Box Packaging', 'Digital Version', 'Envelope', 'Sweet Box'], createdAt: '2026-03-15' },
    { id: 'ml-2', name: 'Full Digital Suite', photos: ['/images/gallery/decor/6.jpg'], category: 'Invitations', price: 25000, style: 'Digital Only', includes: ['Design', 'Digital Version', 'RSVP Tracking'], createdAt: '2026-03-10' },
  ],
}

export function getMockListingsForCategory(category: string): VendorListing[] {
  return mockListingsData[category] || mockListingsData['Photography']
}

export const mockVendorBookings: VendorBooking[] = [
  {
    id: 'vb-1', coupleNames: 'Harsha & Poojitha', eventName: 'Wedding', eventDate: '2026-12-12',
    category: 'Photography', packageTier: 'Premium (2 days)', totalValue: 180000,
    slotAmountPaid: 9000, totalPaid: 9000, remainingBalance: 171000,
    milestoneProgress: 2, totalMilestones: 6, status: 'active',
    phone: '+919876543210', whatsapp: '+919876543210',
  },
  {
    id: 'vb-2', coupleNames: 'Rahul & Sneha', eventName: 'Engagement', eventDate: '2026-11-15',
    category: 'Photography', packageTier: 'Standard (1 day)', totalValue: 120000,
    slotAmountPaid: 6000, totalPaid: 6000, remainingBalance: 114000,
    milestoneProgress: 1, totalMilestones: 6, status: 'active',
    phone: '+919876543211', whatsapp: '+919876543211',
  },
  {
    id: 'vb-3', coupleNames: 'Arun & Meera', eventName: 'Reception', eventDate: '2026-08-20',
    category: 'Photography', packageTier: 'Premium (2 days)', totalValue: 180000,
    slotAmountPaid: 9000, totalPaid: 180000, remainingBalance: 0,
    milestoneProgress: 6, totalMilestones: 6, status: 'completed',
    phone: '+919876543212', whatsapp: '+919876543212',
  },
  {
    id: 'vb-4', coupleNames: 'Vikram & Priya', eventName: 'Wedding', eventDate: '2026-10-05',
    category: 'Photography', packageTier: 'Gold Package', totalValue: 150000,
    slotAmountPaid: 7500, totalPaid: 7500, remainingBalance: 0,
    milestoneProgress: 0, totalMilestones: 6, status: 'cancelled',
    phone: '+919876543213', whatsapp: '+919876543213',
  },
]

export const mockVendorTrials: VendorTrial[] = [
  {
    id: 'vt-1', coupleNames: 'Karthik & Divya', eventName: 'Wedding',
    category: 'Photography', status: 'pending', requestedDate: '2026-04-10',
  },
  {
    id: 'vt-2', coupleNames: 'Harsha & Poojitha', eventName: 'Wedding',
    category: 'Photography', status: 'scheduled', requestedDate: '2026-04-05', scheduledDate: '2026-04-08',
  },
  {
    id: 'vt-3', coupleNames: 'Rahul & Sneha', eventName: 'Engagement',
    category: 'Photography', status: 'completed', requestedDate: '2026-03-20', scheduledDate: '2026-03-25',
  },
]

export const mockVendorBidRequests: VendorBidRequest[] = [
  {
    id: 'vbr-1', coupleNames: 'Nisha & Arjun', eventName: 'Reception',
    category: 'Decor', uploadedImage: '/images/gallery/decor/1.jpg', status: 'pending',
  },
  {
    id: 'vbr-2', coupleNames: 'Ravi & Anjali', eventName: 'Wedding',
    category: 'Decor', uploadedImage: '/images/gallery/decor/3.jpg', status: 'submitted',
    bidPrice: 280000, bidNote: 'Can do this exact design with premium flowers',
  },
]

export const mockVendorNotifications: VendorNotification[] = [
  { id: 'vn-1', type: 'booking', title: 'New booking!', body: 'Harsha & Poojitha booked your Premium (2 days) for Wedding on Dec 12, 2026', timestamp: '2026-04-01T10:30:00', read: false, link: '/vendor/bookings' },
  { id: 'vn-2', type: 'trial', title: 'Trial request', body: 'Karthik & Divya requested a Photography trial', timestamp: '2026-04-01T09:15:00', read: false, link: '/vendor/trials' },
  { id: 'vn-3', type: 'bid', title: 'Custom design request', body: 'New custom design request in Decor — submit your bid', timestamp: '2026-03-31T16:00:00', read: false, link: '/vendor/bids' },
  { id: 'vn-4', type: 'milestone', title: 'Milestone completed', body: 'Harsha & Poojitha marked Pre-Wedding Shoot as complete for Wedding', timestamp: '2026-03-30T14:20:00', read: true },
  { id: 'vn-5', type: 'payment', title: 'Payment received', body: 'Payment received: ₹9,000 from Harsha & Poojitha for Wedding', timestamp: '2026-03-28T11:00:00', read: true },
  { id: 'vn-6', type: 'booking', title: 'New booking!', body: 'Rahul & Sneha booked your Standard (1 day) for Engagement on Nov 15, 2026', timestamp: '2026-03-25T09:30:00', read: true },
  { id: 'vn-7', type: 'review', title: 'New review', body: 'Arun & Meera left you a 5-star review for Reception', timestamp: '2026-03-20T17:45:00', read: true },
  { id: 'vn-8', type: 'trial', title: 'Trial completed', body: 'Rahul & Sneha marked their Photography trial as complete', timestamp: '2026-03-25T16:00:00', read: true },
  { id: 'vn-9', type: 'cancelled', title: 'Booking cancelled', body: 'Vikram & Priya swapped you from their Wedding — slot amount forfeited to you', timestamp: '2026-03-15T12:00:00', read: true },
  { id: 'vn-10', type: 'bid', title: 'Bid not selected', body: 'Another vendor was selected for Ravi & Anjali\'s custom design request', timestamp: '2026-03-10T10:00:00', read: true },
]

export const mockVendorReviews: VendorReview[] = [
  {
    id: 'vr-1', coupleNames: 'Arun & Meera', eventName: 'Reception', eventDate: '2026-08-20',
    rating: 5, text: 'Absolutely stunning photos! They captured every moment perfectly. The candid shots were our favorites.',
    datePosted: '2026-09-01',
  },
  {
    id: 'vr-2', coupleNames: 'Deepak & Swathi', eventName: 'Wedding', eventDate: '2026-06-15',
    rating: 4, text: 'Great work overall. The team was professional and punctual. Would have loved a few more traditional shots.',
    datePosted: '2026-07-02',
  },
  {
    id: 'vr-3', coupleNames: 'Suresh & Lakshmi', eventName: 'Engagement', eventDate: '2026-05-10',
    rating: 5, text: 'Made our engagement look like a fairy tale. The pre-wedding shoot was the highlight. Highly recommend!',
    datePosted: '2026-05-25',
  },
]

export const mockVendorEarnings: EarningsTransaction[] = [
  { id: 've-1', bookingId: 'vb-1', coupleNames: 'Harsha & Poojitha', eventName: 'Wedding', amount: 9000, type: 'slot', date: '2026-03-28' },
  { id: 've-2', bookingId: 'vb-2', coupleNames: 'Rahul & Sneha', eventName: 'Engagement', amount: 6000, type: 'slot', date: '2026-03-25' },
  { id: 've-3', bookingId: 'vb-3', coupleNames: 'Arun & Meera', eventName: 'Reception', amount: 9000, type: 'slot', date: '2026-02-15' },
  { id: 've-4', bookingId: 'vb-3', coupleNames: 'Arun & Meera', eventName: 'Reception', amount: 90000, type: 'milestone', date: '2026-06-20' },
  { id: 've-5', bookingId: 'vb-3', coupleNames: 'Arun & Meera', eventName: 'Reception', amount: 81000, type: 'final', date: '2026-08-25' },
  { id: 've-6', bookingId: 'vb-4', coupleNames: 'Vikram & Priya', eventName: 'Wedding', amount: 7500, type: 'slot', date: '2026-03-01' },
]

export const mockVendorAnalytics: VendorAnalytics = {
  profileViews: 342,
  exploreAppearances: 1850,
  shortlistCount: 89,
  likeCount: 45,
  suggestionCount: 12,
  compareAppearances: 67,
  trialRequests: 8,
  trialsConverted: 3,
  directBookings: 5,
  totalBookings: 8,
  conversionRate: 9.0,
}

// Generate mock availability for 6 months
export function generateMockAvailability(): Record<string, { status: 'available' | 'blocked' | 'booked'; listingIds: string[]; blockedRanges: import('./vendor-types').BlockedTimeRange[] }> {
  const avail: Record<string, { status: 'available' | 'blocked' | 'booked'; listingIds: string[]; blockedRanges: import('./vendor-types').BlockedTimeRange[] }> = {}
  const today = new Date()
  for (let m = 0; m < 6; m++) {
    const month = new Date(today.getFullYear(), today.getMonth() + m, 1)
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d)
      const key = date.toISOString().split('T')[0]
      avail[key] = { status: 'available', listingIds: [], blockedRanges: [] }
    }
  }
  avail['2026-04-15'] = { status: 'blocked', listingIds: [], blockedRanges: [] } // full day
  avail['2026-04-16'] = { status: 'blocked', listingIds: [], blockedRanges: [{ from: '09:00', to: '14:00' }] } // partial
  avail['2026-05-01'] = { status: 'blocked', listingIds: [], blockedRanges: [] }
  avail['2026-05-20'] = { status: 'blocked', listingIds: [], blockedRanges: [{ from: '17:00', to: '22:00' }] } // evening
  avail['2026-11-15'] = { status: 'booked', listingIds: [], blockedRanges: [] }
  avail['2026-12-12'] = { status: 'booked', listingIds: [], blockedRanges: [] }
  avail['2026-12-13'] = { status: 'booked', listingIds: [], blockedRanges: [] }
  return avail
}
