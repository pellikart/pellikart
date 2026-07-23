import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListingDetailSheet from '@/components/ListingDetailSheet'
import { useStore } from '@/lib/store'
import type { OnboardingData } from '@/lib/types'

describe('Add-to-board button in the event-package box', () => {
  it('shows "Add to my board" for a non-selected photographer and selects it on click', () => {
    const data: OnboardingData = {
      partner1: 'A', partner2: 'B', events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {}, budget: 2000000, style: null,
    }
    useStore.getState().completeOnboarding(data)

    // Find a Photography category with at least 2 shortlisted (event-based) photographers.
    const boards = useStore.getState().ritualBoards
    let ritualId = '', categoryId = '', selected = '', candidate = ''
    for (const b of boards) {
      const cat = b.categories.find(c => c.label === 'Photography' && c.shortlistedVendorIds.length >= 2)
      if (cat) {
        ritualId = b.id; categoryId = cat.id; selected = cat.selectedVendorId || ''
        candidate = cat.shortlistedVendorIds.find(id => id !== selected) || ''
        break
      }
    }
    expect(candidate).toBeTruthy()
    expect(candidate).not.toBe(selected)

    const vendor = useStore.getState().vendors[candidate]
    expect(vendor.eventPackages?.length).toBeGreaterThan(0)

    render(
      <MemoryRouter>
        <ListingDetailSheet vendor={vendor} unlocked onClose={() => {}} ritualId={ritualId} categoryId={categoryId} />
      </MemoryRouter>
    )

    // Non-selected vendor → button reads "Add to my board"
    const addBtn = screen.getByRole('button', { name: /Add to my board/i })
    expect(addBtn).toBeTruthy()

    fireEvent.click(addBtn)

    // Store now has this vendor selected for the category
    const after = useStore.getState().ritualBoards
      .find(b => b.id === ritualId)!.categories.find(c => c.id === categoryId)!
    expect(after.selectedVendorId).toBe(candidate)
  })
})
