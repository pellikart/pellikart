import { describe, it, expect } from 'vitest'
import { buildLiveVendorMap } from '@/lib/store'

// Simulate Supabase data as it would come from the DB
const mockLiveVendors = [
  {
    id: 'vendor-uuid-1',
    user_id: 'user-uuid-1',
    business_name: 'Lens & Light Studio',
    category: 'Photography',
    area: 'Jubilee Hills',
    phone: '+919876543210',
    whatsapp: '+919876543211',
    email: 'lens@studio.com',
    description: 'Award-winning wedding photography in Hyderabad',
    years_experience: '8',
    team_size: '5-10',
    portfolio_photos: ['/portfolio/p1.jpg', '/portfolio/p2.jpg', '/portfolio/p3.jpg'],
    rating: 4.7,
    is_live: true,
  },
  {
    id: 'vendor-uuid-2',
    user_id: 'user-uuid-2',
    business_name: 'Royal Venues',
    category: 'Venue',
    area: 'Banjara Hills',
    phone: '+919123456789',
    whatsapp: '+919123456789',
    email: 'info@royalvenues.com',
    description: 'Premium wedding venues in Hyderabad',
    years_experience: '15',
    team_size: '10+',
    portfolio_photos: ['/portfolio/v1.jpg'],
    rating: 4.5,
    is_live: true,
  },
]

const mockListings = [
  {
    id: 'listing-uuid-1',
    vendor_id: 'vendor-uuid-1',
    name: 'Cinematic Wedding Package',
    category: 'Photography',
    price: 200000,
    style: 'Candid + Cinematic',
    photos: ['/photos/l1a.jpg', '/photos/l1b.jpg'],
    rituals: ['Pelli (Wedding)', 'Reception'],
    category_fields: { coverageType: 'Photo + Video', droneShots: 'Included', editedPhotos: '1000' },
    includes: ['Candid Photos', 'Drone Shots', 'Album', 'Highlight Reel'],
    created_at: '2026-04-20T00:00:00Z',
  },
  {
    id: 'listing-uuid-2',
    vendor_id: 'vendor-uuid-1',
    name: 'Pre-Wedding Shoot',
    category: 'Photography',
    price: 80000,
    style: 'Fine Art',
    photos: ['/photos/l2a.jpg'],
    rituals: ['Nischitartham'],
    category_fields: { coverageType: 'Photo only', editedPhotos: '200' },
    includes: ['Candid Photos', 'Pre-Wedding Shoot'],
    created_at: '2026-04-19T00:00:00Z',
  },
  {
    id: 'listing-uuid-3',
    vendor_id: 'vendor-uuid-2',
    name: 'Royal Banquet Hall',
    category: 'Venue',
    price: 800000,
    style: 'Royal Heritage',
    photos: ['/photos/v1a.jpg', '/photos/v1b.jpg', '/photos/v1c.jpg'],
    rituals: ['Pelli (Wedding)', 'Reception', 'Nischitartham'],
    category_fields: { venueType: 'Banquet Hall', setting: 'Indoor', capacity: '1000' },
    includes: ['AC Hall', 'Parking', 'Bridal Suite', 'Generator Backup'],
    created_at: '2026-04-18T00:00:00Z',
  },
]

const mockAvailability = [
  { vendor_id: 'vendor-uuid-1', date: '2026-12-10', status: 'blocked' },
  { vendor_id: 'vendor-uuid-1', date: '2026-12-15', status: 'booked' },
  { vendor_id: 'vendor-uuid-2', date: '2026-12-12', status: 'blocked' },
]

describe('Vendor → Couple Data Linkage', () => {
  const { vendorMap, lvMap } = buildLiveVendorMap(mockLiveVendors, mockListings, mockAvailability)

  describe('Vendor Map Structure', () => {
    it('creates one entry per listing (not per vendor)', () => {
      expect(Object.keys(vendorMap)).toHaveLength(3)
    })

    it('entries are keyed by listing UUID', () => {
      expect(vendorMap['listing-uuid-1']).toBeDefined()
      expect(vendorMap['listing-uuid-2']).toBeDefined()
      expect(vendorMap['listing-uuid-3']).toBeDefined()
    })
  })

  describe('Listing → Vendor ID Map', () => {
    it('maps listing IDs to vendor IDs', () => {
      expect(lvMap['listing-uuid-1']).toBe('vendor-uuid-1')
      expect(lvMap['listing-uuid-2']).toBe('vendor-uuid-1')
      expect(lvMap['listing-uuid-3']).toBe('vendor-uuid-2')
    })
  })

  describe('Basic Fields (from listing)', () => {
    it('id is the listing UUID', () => {
      expect(vendorMap['listing-uuid-1'].id).toBe('listing-uuid-1')
    })

    it('price comes from listing', () => {
      expect(vendorMap['listing-uuid-1'].price).toBe(200000)
      expect(vendorMap['listing-uuid-2'].price).toBe(80000)
      expect(vendorMap['listing-uuid-3'].price).toBe(800000)
    })

    it('style comes from listing', () => {
      expect(vendorMap['listing-uuid-1'].style).toBe('Candid + Cinematic')
      expect(vendorMap['listing-uuid-3'].style).toBe('Royal Heritage')
    })

    it('photo is first listing photo', () => {
      expect(vendorMap['listing-uuid-1'].photo).toBe('/photos/l1a.jpg')
      expect(vendorMap['listing-uuid-3'].photo).toBe('/photos/v1a.jpg')
    })

    it('listingPhotos has all listing photos', () => {
      expect(vendorMap['listing-uuid-1'].listingPhotos).toEqual(['/photos/l1a.jpg', '/photos/l1b.jpg'])
      expect(vendorMap['listing-uuid-3'].listingPhotos).toHaveLength(3)
    })
  })

  describe('Vendor Profile Fields (from parent vendor)', () => {
    it('name comes from parent vendor business_name', () => {
      expect(vendorMap['listing-uuid-1'].name).toBe('Lens & Light Studio')
      expect(vendorMap['listing-uuid-3'].name).toBe('Royal Venues')
    })

    it('area comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].area).toBe('Jubilee Hills')
      expect(vendorMap['listing-uuid-3'].area).toBe('Banjara Hills')
    })

    it('rating comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].rating).toBe(4.7)
      expect(vendorMap['listing-uuid-3'].rating).toBe(4.5)
    })

    it('description comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].description).toBe('Award-winning wedding photography in Hyderabad')
    })

    it('experience is parsed from parent vendor years_experience', () => {
      expect(vendorMap['listing-uuid-1'].experience).toBe(8)
      expect(vendorMap['listing-uuid-3'].experience).toBe(15)
    })

    it('teamSize comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].teamSize).toBe('5-10')
      expect(vendorMap['listing-uuid-3'].teamSize).toBe('10+')
    })

    it('portfolioPhotos comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].portfolioPhotos).toHaveLength(3)
      expect(vendorMap['listing-uuid-3'].portfolioPhotos).toHaveLength(1)
    })
  })

  describe('Contact Details (paywall fields)', () => {
    it('phone comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].phone).toBe('+919876543210')
    })

    it('whatsapp comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].whatsapp).toBe('+919876543211')
    })

    it('email comes from parent vendor', () => {
      expect(vendorMap['listing-uuid-1'].email).toBe('lens@studio.com')
    })
  })

  describe('Category-Specific Fields (from listing)', () => {
    it('categoryFields from listing are passed through', () => {
      expect(vendorMap['listing-uuid-1'].categoryFields?.coverageType).toBe('Photo + Video')
      expect(vendorMap['listing-uuid-1'].categoryFields?.droneShots).toBe('Included')
      expect(vendorMap['listing-uuid-3'].categoryFields?.venueType).toBe('Banquet Hall')
    })

    it('includes from listing are passed through', () => {
      expect(vendorMap['listing-uuid-1'].includes).toContain('Candid Photos')
      expect(vendorMap['listing-uuid-1'].includes).toContain('Drone Shots')
      expect(vendorMap['listing-uuid-3'].includes).toContain('AC Hall')
    })
  })

  describe('Package Tier (derived from includes)', () => {
    it('packageTier is first 4 includes joined', () => {
      // listing-uuid-1 has: Candid Photos, Drone Shots, Album, Highlight Reel
      expect(vendorMap['listing-uuid-1'].packageTier).toBe('Candid Photos · Drone Shots · Album · Highlight Reel')
    })

    it('packageTier truncates to 4 items', () => {
      // listing-uuid-3 has 4 items exactly
      expect(vendorMap['listing-uuid-3'].packageTier).toBe('AC Hall · Parking · Bridal Suite · Generator Backup')
    })
  })

  describe('Auto-Generated Vendor Codes', () => {
    it('generates sequential codes per category', () => {
      expect(vendorMap['listing-uuid-1'].code).toBe('Photography 001')
      expect(vendorMap['listing-uuid-2'].code).toBe('Photography 002')
      expect(vendorMap['listing-uuid-3'].code).toBe('Venue 001')
    })
  })

  describe('Availability / Blocked Dates', () => {
    it('blocked dates come from availability data', () => {
      // vendor-uuid-1 has 2 blocked/booked dates
      expect(vendorMap['listing-uuid-1'].blockedDates).toContain('2026-12-10')
      expect(vendorMap['listing-uuid-1'].blockedDates).toContain('2026-12-15')
      expect(vendorMap['listing-uuid-1'].blockedDates).toHaveLength(2)
    })

    it('both listings from same vendor share blocked dates', () => {
      expect(vendorMap['listing-uuid-2'].blockedDates).toEqual(vendorMap['listing-uuid-1'].blockedDates)
    })

    it('different vendor has different blocked dates', () => {
      expect(vendorMap['listing-uuid-3'].blockedDates).toContain('2026-12-12')
      expect(vendorMap['listing-uuid-3'].blockedDates).toHaveLength(1)
    })
  })

  describe('Default Values', () => {
    it('likes starts empty', () => {
      expect(vendorMap['listing-uuid-1'].likes).toEqual([])
    })

    it('booked starts as false', () => {
      expect(vendorMap['listing-uuid-1'].booked).toBe(false)
    })

    it('amountPaid starts at 0', () => {
      expect(vendorMap['listing-uuid-1'].amountPaid).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles listing with no photos', () => {
      const { vendorMap: vm } = buildLiveVendorMap(mockLiveVendors, [
        { ...mockListings[0], id: 'no-photo', photos: [] },
      ], [])
      expect(vm['no-photo'].photo).toBe('')
      expect(vm['no-photo'].listingPhotos).toEqual([])
    })

    it('handles listing with missing parent vendor', () => {
      const { vendorMap: vm } = buildLiveVendorMap([], [mockListings[0]], [])
      // Should fall back to listing name
      expect(vm['listing-uuid-1'].name).toBe('Cinematic Wedding Package')
      expect(vm['listing-uuid-1'].area).toBe('')
      expect(vm['listing-uuid-1'].rating).toBe(0)
    })

    it('handles empty inputs', () => {
      const { vendorMap: vm, lvMap: lv } = buildLiveVendorMap([], [], [])
      expect(Object.keys(vm)).toHaveLength(0)
      expect(Object.keys(lv)).toHaveLength(0)
    })

    it('handles listing with null category_fields', () => {
      const { vendorMap: vm } = buildLiveVendorMap(mockLiveVendors, [
        { ...mockListings[0], id: 'null-fields', category_fields: null },
      ], [])
      expect(vm['null-fields'].categoryFields).toEqual({})
    })

    it('handles listing with null includes', () => {
      const { vendorMap: vm } = buildLiveVendorMap(mockLiveVendors, [
        { ...mockListings[0], id: 'null-inc', includes: null },
      ], [])
      expect(vm['null-inc'].includes).toEqual([])
      expect(vm['null-inc'].packageTier).toBe('')
    })
  })
})
