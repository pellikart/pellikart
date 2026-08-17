import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── The single paywall: a ₹300 refundable deposit ───────────────────────────
// Silver (₹999) and Gold (₹1,999) are retired. What matters here is that
// nobody who already paid loses access, that the deposit reads as refundable,
// and that the unlock door raises a lead rather than granting itself — there's
// no payment gateway, so access is only ever flipped by us once money lands.

const requestConsult = vi.fn().mockResolvedValue('lead-1')

vi.mock('@/lib/supabase-db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase-db')>('@/lib/supabase-db')
  return {
    ...actual,
    requestConsult: (...args: unknown[]) => requestConsult(...args),
    fetchMyConsultRequests: vi.fn().mockResolvedValue([]),
  }
})

import { normalizeTier } from '@/lib/supabase-db'
import { maxTrialsForTier, useStore } from '@/lib/store'
import { UNLOCK_PRICE } from '@/lib/types'
import UnlockBanner from '@/components/UnlockBanner'
import type { RitualBoard } from '@/lib/types'

describe('tier normalisation', () => {
  it('keeps anyone who paid under the old tiers unlocked', () => {
    expect(normalizeTier('silver')).toBe('unlocked')
    expect(normalizeTier('gold')).toBe('unlocked')
  })

  it('passes the new value through', () => {
    expect(normalizeTier('unlocked')).toBe('unlocked')
  })

  it('treats anything else as locked', () => {
    expect(normalizeTier('free')).toBe('free')
    expect(normalizeTier(null)).toBe('free')
    expect(normalizeTier(undefined)).toBe('free')
    expect(normalizeTier('platinum')).toBe('free')
  })

  it('gives trials only once unlocked', () => {
    expect(maxTrialsForTier('free')).toBe(0)
    expect(maxTrialsForTier('unlocked')).toBe(3)
  })
})

const board: RitualBoard = {
  id: 'b1', name: 'Pelli (Wedding)',
  categories: [{
    id: 'c-venue', label: 'Venue', selectedVendorId: null,
    shortlistedVendorIds: [], suggestedVendors: [], removed: false,
  }],
}

function renderBanner() {
  return render(<MemoryRouter><UnlockBanner /></MemoryRouter>)
}

describe('the ₹300 wall', () => {
  beforeEach(() => {
    localStorage.clear()
    requestConsult.mockClear()
    useStore.setState({
      subscription: 'free', vendors: {}, onboardingData: null,
      ritualBoards: [board], activeBoardId: 'b1',
    })
  })

  it('offers the deposit, and says it comes back', () => {
    renderBanner()
    expect(screen.getByText(/Vendor names are hidden/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: new RegExp(`Unlock for ₹${UNLOCK_PRICE}`) })).toBeInTheDocument()
    expect(screen.getByText(/refundable, and it comes off your booking/i)).toBeInTheDocument()
  })

  it('keeps the free door open next to it', () => {
    renderBanner()
    expect(screen.getByRole('button', { name: /talk to an expert, free/i })).toBeInTheDocument()
  })

  it('disappears once the account is unlocked', () => {
    useStore.setState({ subscription: 'unlocked' })
    const { container } = renderBanner()
    expect(container).toBeEmptyDOMElement()
  })

  it('raises a paid_unlock lead instead of granting access itself', async () => {
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Unlock for ₹${UNLOCK_PRICE}`) }))

    expect(screen.getByText(/Unlock your shortlist/i)).toBeInTheDocument()
    expect(screen.getByText(/Fully refundable/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '9876543210' } })
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Send me the ₹${UNLOCK_PRICE} link`) }))

    await waitFor(() => expect(requestConsult).toHaveBeenCalledTimes(1))
    const arg = requestConsult.mock.calls[0][0] as { source: string; preferredSlot?: string; preferredDate?: string }
    expect(arg.source).toBe('paid_unlock')
    // Not booking a call — the desk shouldn't see a slot we never agreed to.
    expect(arg.preferredSlot).toBeUndefined()
    expect(arg.preferredDate).toBeUndefined()

    // Crucially: still locked. Only we flip that, once the money lands.
    expect(useStore.getState().subscription).toBe('free')
    await waitFor(() => expect(screen.getByText(/sending your payment link/i)).toBeInTheDocument())
  })
})
