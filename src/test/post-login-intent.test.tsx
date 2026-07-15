import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Post-login claim/admin routing ──────────────────────────────────────────
// OAuth can only reliably return to /app (the allowlisted callback), so the
// claim/admin buttons stamp `pellikart_post_login` and the app must route a
// logged-in user from /app to the right screen instead of the normal
// couple/vendor onboarding flow. This is the regression that made the claim
// code screen never appear.

// A logged-in user with no vendor row and no committed role — the exact state
// an invited vendor is in the instant they return from Google to /app.
vi.mock('@/lib/auth-context', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth-context')>('@/lib/auth-context')
  return {
    ...actual,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
      user: { id: 'user-1', email: 'vendor@x.com' },
      profile: null,
      session: {},
      loading: false,
      signOut: vi.fn(),
      updateRole: vi.fn(),
    }),
  }
})

// No vendor row, no saved role → without the intent this account would be sent
// to the role chooser / onboarding.
vi.mock('@/lib/supabase-db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase-db')>('@/lib/supabase-db')
  return {
    ...actual,
    fetchVendor: vi.fn().mockResolvedValue(null),
    fetchProfileRole: vi.fn().mockResolvedValue(null),
    isAdminUser: vi.fn().mockResolvedValue(true),
  }
})

import App from '@/App'

function renderAppAt(path: string) {
  // basename '/app' mirrors main.tsx so pathname resolves to '/claim' etc.
  // MemoryRouter entries must include the basename prefix.
  return render(
    <MemoryRouter basename="/app" initialEntries={['/app' + path]}>
      <App isLiveApp />
    </MemoryRouter>,
  )
}

describe('post-login intent routing', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('routes a freshly-logged-in invited vendor from /app to the claim screen', async () => {
    localStorage.setItem('pellikart_post_login', 'claim')

    renderAppAt('/')

    // The claim screen (code entry), NOT the role chooser / vendor onboarding.
    await waitFor(() => expect(screen.getByText(/Claim your vendor profile/i)).toBeInTheDocument())
    expect(screen.getByText(/Claim code/i)).toBeInTheDocument()
    // Intent is consumed so it can't loop or hijack the next navigation.
    expect(localStorage.getItem('pellikart_post_login')).toBeNull()
  })

  it('does not divert a normal login (no intent stamped)', async () => {
    renderAppAt('/')

    // With no intent and no role, the account lands on the role chooser — the
    // normal flow — never the claim screen.
    await waitFor(() =>
      expect(screen.queryByText(/Claim your vendor profile/i)).not.toBeInTheDocument(),
    )
  })
})
