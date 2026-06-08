import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListingDetailSheet from '@/components/ListingDetailSheet'
import { mockVendors } from '@/lib/mock-data'
import type { Vendor } from '@/lib/types'

describe('Photography rate-card render', () => {
  it('mock photographer has a rateCard', () => {
    expect(mockVendors['v-photo-1'].rateCard).toBeDefined()
    expect(Object.keys(mockVendors['v-photo-1'].rateCard || {}).length).toBeGreaterThan(0)
  })

  it('renders the Build your team box for a rate-card vendor', () => {
    const vendor = mockVendors['v-photo-1'] as Vendor
    render(
      <MemoryRouter>
        <ListingDetailSheet vendor={vendor} unlocked onClose={() => {}} />
      </MemoryRouter>
    )
    expect(screen.getAllByText(/Build your team/i).length).toBeGreaterThan(0)
  })
})
