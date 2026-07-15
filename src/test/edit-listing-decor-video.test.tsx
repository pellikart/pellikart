import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import VendorEditListing from '@/pages/vendor/VendorEditListing'
import { useVendorStore } from '@/lib/vendor-store'
import type { VendorProfile, VendorListing } from '@/lib/vendor-types'

const venueProfile: VendorProfile = {
  businessName: 'Grand Palace',
  category: 'Venue',
  city: 'Hyderabad',
  area: 'Banjara Hills',
  phone: '+919000000000',
  whatsapp: '+919000000000',
  email: 'grand@palace.com',
  description: 'A grand wedding venue',
  experience: 10,
  teamSize: '20+',
  portfolioPhotos: [],
  rating: 4.5,
  categoryFields: {},
}

const venueListing: VendorListing = {
  id: 'vl-venue-1',
  name: 'Grand Hall',
  photos: ['/hall.jpg'],
  category: 'Venue',
  price: 500000,
  style: 'Palace',
  includes: [],
  createdAt: '2026-07-15',
  // Complimentary rooms answered "Yes" so the "How many?" count field must render.
  categoryFields: { complimentaryRooms: 'Yes', complimentaryRoomsCount: '10' },
  inHouseDecor: {
    compulsory: true,
    decoratorPhone: '+919812345678',
    designs: [],
  },
}

function renderEdit(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/vendor/listings/edit/${id}`]}>
      <Routes>
        <Route path="/vendor/listings/edit/:listingId" element={<VendorEditListing />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VendorEditListing — videos + in-house decor', () => {
  beforeEach(() => {
    useVendorStore.setState({
      vendorListings: [venueListing],
      vendorProfile: venueProfile,
      _liveMode: false,
      _adminMode: false,
      _vendorDbId: null,
    })
  })

  it('exposes a Videos uploader even when the listing has no videos', () => {
    renderEdit('vl-venue-1')
    expect(screen.getByText(/^Videos$/)).toBeInTheDocument()
  })

  it('shows the in-house decor editor with the dedicated decorator number', () => {
    renderEdit('vl-venue-1')

    // The decor block is toggled on because the listing already offers decor.
    expect(screen.getByText(/Offer in-house decor/i)).toBeInTheDocument()

    // The new dedicated-decorator field is present and pre-filled from the listing.
    const decoratorInput = screen.getByPlaceholderText('+91…') as HTMLInputElement
    expect(decoratorInput.value).toBe('+919812345678')

    // The vendor can update it.
    fireEvent.change(decoratorInput, { target: { value: '+919999999999' } })
    expect(decoratorInput.value).toBe('+919999999999')
  })

  it('renders the "add rooms" (paid rooms) section', () => {
    renderEdit('vl-venue-1')
    // The section's own description is unique to the paid-rooms block.
    expect(screen.getByText(/Rooms you rent out for guests/i)).toBeInTheDocument()
  })

  it('renders the complimentary-rooms count field when rooms are offered', () => {
    renderEdit('vl-venue-1')
    // The "How many?" count follow-up must appear because complimentaryRooms = Yes.
    expect(screen.getByText(/How many\?/i)).toBeInTheDocument()
  })
})
