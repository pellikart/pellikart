import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListingDetailSheet from '@/components/ListingDetailSheet'
import { mockVendors } from '@/lib/mock-data'
import type { Vendor } from '@/lib/types'

// A couple-facing event-package listing carries exactly one package (the store
// fans each package out into its own listing). Build one off a mock photographer.
function eventVendor(): Vendor {
  return {
    ...(mockVendors['v-photo-1'] as Vendor),
    id: 'v-photo-1::evt::p1',
    photographyPricingModels: ['eventBased'],
    eventPackages: [
      { id: 'p1', events: ['Haldi', 'Mehendi'], prices: { candidPhotography: 40000, drone: 15000, album: 10000 } },
    ],
  }
}

describe('Photography event-package render (couple side)', () => {
  it('renders the covered events, offered services with prices, and a live total', () => {
    render(
      <MemoryRouter>
        <ListingDetailSheet vendor={eventVendor()} unlocked onClose={() => {}} />
      </MemoryRouter>
    )
    // Covered-event chips + service rows.
    expect(screen.getAllByText('Haldi').length).toBeGreaterThan(0)
    expect(screen.getByText('Candid Photography')).toBeTruthy()
    expect(screen.getByText('Drone')).toBeTruthy()
    expect(screen.getByText('Album per sheet')).toBeTruthy()
    // Services with no price are not shown.
    expect(screen.queryByText('LED Screens')).toBeNull()
    // All services default-selected → total = 40000 + 15000 + 10000 = 65000.
    expect(screen.getAllByText(/₹65,000/).length).toBeGreaterThan(0)
  })

  it('deselecting a service lowers the total', () => {
    render(
      <MemoryRouter>
        <ListingDetailSheet vendor={eventVendor()} unlocked onClose={() => {}} />
      </MemoryRouter>
    )
    // Untick "Candid Photography" (₹40,000) → 65000 - 40000 = 25000.
    fireEvent.click(screen.getByText('Candid Photography'))
    expect(screen.getAllByText(/₹25,000/).length).toBeGreaterThan(0)
  })

  it('vendor preview (multiple packages) shows every package read-only', () => {
    // The vendor's own preview carries the whole authored listing — all packages.
    const previewVendor = {
      ...(mockVendors['v-photo-1'] as Vendor),
      id: 'v-photo-1',
      photographyPricingModels: ['eventBased'],
      eventPackages: [
        { id: 'p1', events: ['Pelli (Wedding)', 'Reception'], prices: { traditionalPhotography: 55000, drone: 25000 } },
        { id: 'p2', events: ['Haldi', 'Mehendi'], prices: { candidPhotography: 45000, album: 20000 } },
      ],
    } as Vendor
    render(
      <MemoryRouter>
        <ListingDetailSheet vendor={previewVendor} unlocked onClose={() => {}} />
      </MemoryRouter>
    )
    // Both packages' events + their services are shown.
    expect(screen.getByText('2 event packages · flat per-service pricing, per event')).toBeTruthy()
    expect(screen.getAllByText('Reception').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mehendi').length).toBeGreaterThan(0)
    expect(screen.getByText('Traditional Photography')).toBeTruthy()
    expect(screen.getByText('Album per sheet')).toBeTruthy()
    // Read-only: no per-service checkboxes/"Add to my board" total flow.
    expect(screen.queryByText(/Estimated total/)).toBeNull()
  })
})
