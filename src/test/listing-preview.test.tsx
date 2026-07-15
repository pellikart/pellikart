import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import VendorListings from '@/pages/vendor/VendorListings'
import VendorDashboard from '@/pages/vendor/VendorDashboard'
import { useVendorStore } from '@/lib/vendor-store'
import { vendorListingToPreviewVendor } from '@/lib/vendor-preview'
import type { VendorProfile, VendorListing } from '@/lib/vendor-types'

const profile: VendorProfile = {
  businessName: 'Lens & Light Studio',
  category: 'Photography',
  city: 'Hyderabad',
  area: 'Jubilee Hills',
  phone: '+919876543210',
  whatsapp: '+919876543210',
  email: 'lens@studio.com',
  description: 'Award-winning wedding photography',
  experience: 8,
  teamSize: '5-10',
  portfolioPhotos: ['/pf1.jpg'],
  rating: 4.7,
  categoryFields: {},
}

const listing: VendorListing = {
  id: 'vl-1',
  name: 'Signature Wedding Film',
  photos: ['/cover.jpg', '/g2.jpg'],
  coverPhotoIndex: 0,
  category: 'Photography',
  price: 150000,
  style: 'Candid + Cinematic',
  includes: ['Candid Photos', 'Drone', 'Album', 'Teaser', 'Full Film'],
  createdAt: '2026-07-15',
}

describe('vendorListingToPreviewVendor', () => {
  it('maps listing + profile into the couple-facing Vendor shape', () => {
    const v = vendorListingToPreviewVendor(listing, profile)
    expect(v.id).toBe('vl-1')
    // Vendor identity comes from the profile, not the listing.
    expect(v.name).toBe('Lens & Light Studio')
    expect(v.area).toBe('Jubilee Hills')
    expect(v.phone).toBe('+919876543210')
    // Listing content is carried through.
    expect(v.price).toBe(150000)
    expect(v.style).toBe('Candid + Cinematic')
    expect(v.listingPhotos).toEqual(['/cover.jpg', '/g2.jpg'])
    expect(v.photo).toBe('/cover.jpg')
    expect(v.includes).toContain('Drone')
    expect(v.category).toBe('Photography')
  })

  it('honors coverPhotoIndex and tolerates a missing profile', () => {
    const v = vendorListingToPreviewVendor({ ...listing, coverPhotoIndex: 1 }, null)
    expect(v.photo).toBe('/g2.jpg')
    expect(v.name).toBe('Signature Wedding Film') // falls back to listing name
  })
})

describe('VendorListings preview', () => {
  beforeEach(() => {
    useVendorStore.setState({
      vendorListings: [listing],
      vendorProfile: profile,
      _adminMode: false,
    })
  })

  it('opens the couple-view preview sheet when Preview is clicked', () => {
    render(
      <MemoryRouter>
        <VendorListings />
      </MemoryRouter>,
    )

    // Preview sheet is not shown until asked for.
    expect(screen.queryByText(/this is how couples see your listing/i)).not.toBeInTheDocument()

    // Click the Preview action (the labeled button in the card's action row).
    fireEvent.click(screen.getByRole('button', { name: /^👁 Preview$/ }))

    // The couple-facing sheet opens with the preview banner and the vendor's
    // business name (as a couple would see it).
    expect(screen.getByText(/this is how couples see your listing/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Lens & Light Studio/).length).toBeGreaterThan(0)
  })
})

describe('VendorDashboard preview (single-listing categories)', () => {
  const mehendiProfile: VendorProfile = {
    ...profile,
    businessName: 'Henna by Asha',
    category: 'Mehendi',
  }
  const mehendiListing: VendorListing = {
    id: 'vl-mehendi-1',
    name: 'Bridal Mehendi',
    photos: ['/mehendi.jpg'],
    category: 'Mehendi',
    price: 12000,
    style: 'Rajasthani',
    includes: ['Bridal', 'Family'],
    createdAt: '2026-07-15',
  }

  beforeEach(() => {
    useVendorStore.setState({
      vendorListings: [mehendiListing],
      vendorProfile: mehendiProfile,
      _adminMode: false,
    })
  })

  it('opens the couple-view preview from the single-listing shortcut', () => {
    render(
      <MemoryRouter>
        <VendorDashboard />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/this is how couples see your listing/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Preview how couples see your listing/i }))

    expect(screen.getByText(/this is how couples see your listing/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Henna by Asha/).length).toBeGreaterThan(0)
  })
})
