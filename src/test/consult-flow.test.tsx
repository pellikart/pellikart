import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── The board → expert-call handoff, end to end in the DOM ──────────────────
// The regression this exists for: the consult sheet used to be rendered inside
// the banner's "ready" branch, so a successful submit — which flips the banner
// to "requested" — unmounted the sheet mid-flow. The request reached the
// database and the couple saw the form vanish with no confirmation.

const requestConsult = vi.fn().mockResolvedValue('lead-1')

vi.mock('@/lib/supabase-db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase-db')>('@/lib/supabase-db')
  return {
    ...actual,
    requestConsult: (...args: unknown[]) => requestConsult(...args),
    fetchMyConsultRequests: vi.fn().mockResolvedValue([]),
  }
})

import BoardReadyBanner from '@/components/BoardReadyBanner'
import { useStore } from '@/lib/store'
import type { Category, RitualBoard, Vendor } from '@/lib/types'

function cat(label: string, over: Partial<Category> = {}): Category {
  return {
    id: `c-${label.toLowerCase()}`, label,
    selectedVendorId: null, shortlistedVendorIds: [], suggestedVendors: [], removed: false,
    ...over,
  }
}

const vendors: Record<string, Vendor> = {
  v1: { id: 'v1', code: 'PK-1', name: 'Sri Convention', price: 200000 } as Vendor,
  v2: { id: 'v2', code: 'PK-2', name: 'Rajesh Photography', price: 50000 } as Vendor,
}

const readyBoard: RitualBoard = {
  id: 'b1', name: 'Pelli (Wedding)',
  categories: [
    cat('Venue', { selectedVendorId: 'v1' }),
    cat('Photographer', { selectedVendorId: 'v2' }),
    cat('Decor', { shortlistedVendorIds: ['v1'] }),
  ],
}

const thinBoard: RitualBoard = {
  id: 'b2', name: 'Haldi',
  categories: [cat('Venue', { selectedVendorId: 'v1' }), cat('Decor')],
}

function renderBanner(board: RitualBoard) {
  return render(<MemoryRouter><BoardReadyBanner board={board} /></MemoryRouter>)
}

describe('board → expert call', () => {
  beforeEach(() => {
    localStorage.clear()
    requestConsult.mockClear()
    useStore.setState({ vendors, onboardingData: null, ritualBoards: [readyBoard, thinBoard] })
  })

  it('offers the call once the board is decided', () => {
    renderBanner(readyBoard)
    expect(screen.getByText(/board is ready/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Book a free slot with a Pellikart expert/i })).toBeInTheDocument()
  })

  it('points at the next category while the board is still thin', () => {
    renderBanner(thinBoard)
    expect(screen.getByRole('button', { name: /Explore Decor/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Book a free slot/i })).not.toBeInTheDocument()
  })

  it('keeps the confirmation on screen after a successful submit', async () => {
    renderBanner(readyBoard)

    fireEvent.click(screen.getByRole('button', { name: /Book a free slot with a Pellikart expert/i }))
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '9876543210' } })
    fireEvent.click(screen.getByRole('button', { name: /Request my call/i }))

    // The sheet must survive the banner flipping to "requested" behind it.
    await waitFor(() => expect(screen.getByText(/Your slot is requested/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Back to my board/i })).toBeInTheDocument()
    // And the board underneath already reflects the ask.
    expect(screen.getByText(/Expert call requested/i)).toBeInTheDocument()
  })

  it('sends the board snapshot with the lead, not just the phone number', async () => {
    renderBanner(readyBoard)

    fireEvent.click(screen.getByRole('button', { name: /Book a free slot with a Pellikart expert/i }))
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: '9876543210' } })
    fireEvent.click(screen.getByRole('button', { name: /Request my call/i }))

    await waitFor(() => expect(requestConsult).toHaveBeenCalledTimes(1))
    const arg = requestConsult.mock.calls[0][0] as { phone: string; boardName?: string; snapshot?: { total: number; picked: unknown[]; deciding: unknown[] } }
    expect(arg.phone).toBe('9876543210')
    expect(arg.boardName).toBe('Pelli (Wedding)')
    expect(arg.snapshot?.total).toBe(250000)
    expect(arg.snapshot?.picked).toHaveLength(2)
    expect(arg.snapshot?.deciding).toHaveLength(1)
  })

  it('does not re-ask a couple who already requested a call for this board', () => {
    localStorage.setItem('pellikart_consult_request', JSON.stringify({
      boardId: 'b1', phone: '9876543210', requestedAt: Date.now(),
    }))
    renderBanner(readyBoard)

    expect(screen.getByText(/Expert call requested/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Book a free slot/i })).not.toBeInTheDocument()
  })

  it('still offers the call on a different event board', () => {
    localStorage.setItem('pellikart_consult_request', JSON.stringify({
      boardId: 'b1', phone: '9876543210', requestedAt: Date.now(),
    }))
    renderBanner(thinBoard)

    expect(screen.queryByText(/Expert call requested/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Or talk to an expert/i })).toBeInTheDocument()
  })
})
