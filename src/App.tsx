import { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/vendor-store'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { fetchVendor, isAdminUser, fetchProfileRole } from '@/lib/supabase-db'
import ClaimPage from './pages/ClaimPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVendorEditor from './pages/admin/AdminVendorEditor'
import LandingPage from './pages/LandingPage'
import ShowcasePage from './pages/ShowcasePage'
import TryAppPage from './pages/TryAppPage'
import WhyUsPage from './pages/WhyUsPage'
import RoleSelectPage from './pages/RoleSelectPage'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import CategoryBoardPage from './pages/CategoryBoardPage'
import BookingPage from './pages/BookingPage'
import OnboardingPage from './pages/OnboardingPage'
import SharedBoardPage from './pages/SharedBoardPage'
import VendorOnboarding from './pages/vendor/VendorOnboarding'
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorProfile from './pages/vendor/VendorProfile'
import VendorTrials from './pages/vendor/VendorTrials'
import VendorBids from './pages/vendor/VendorBids'
import VendorNotifications from './pages/vendor/VendorNotifications'
import VendorEarnings from './pages/vendor/VendorEarnings'
import VendorCalendar from './pages/vendor/VendorCalendar'
import VendorAnalytics from './pages/vendor/VendorAnalytics'
import VendorReviews from './pages/vendor/VendorReviews'
import VendorListings from './pages/vendor/VendorListings'
import VendorAddListing from './pages/vendor/VendorAddListing'
import VendorEditListing from './pages/vendor/VendorEditListing'
import VendorBottomNav from './components/VendorBottomNav'
import CoupleShell from './components/CoupleShell'
import VendorShell from './components/VendorShell'

export default function App({ isLiveApp = false }: { isLiveApp?: boolean }) {
  const { pathname, search } = useLocation()
  const isEmbed = new URLSearchParams(search).has('embed')

  // Public shared board viewer — bypasses auth and live/demo branching.
  // Lives at top-level /share/:boardId, so anyone with the link can open it.
  if (pathname.startsWith('/share/')) {
    return (
      <div className="app-container">
        <Routes>
          <Route path="/share/:boardId" element={<SharedBoardPage />} />
        </Routes>
      </div>
    )
  }

  // Marketing showcase route — public, no auth. /showcase is the index;
  // /showcase/:category renders a single detailed carousel slide.
  if (pathname === '/showcase' || pathname.startsWith('/showcase/')) {
    return (
      <Routes>
        <Route path="/showcase" element={<ShowcasePage />} />
        <Route path="/showcase/:slug" element={<ShowcasePage />} />
      </Routes>
    )
  }

  // Live app mode (/app/*) — wrap in auth, gate access
  if (isLiveApp) {
    return (
      <AuthProvider>
        <LiveApp />
      </AuthProvider>
    )
  }

  // Landing page at root, unless embedded in iframe
  if (pathname === '/' && !isEmbed) {
    return <LandingPage />
  }

  // Try the app page (full-page embedded preview)
  if (pathname === '/try' && !isEmbed) {
    return <TryAppPage />
  }

  // Why us page
  if (pathname === '/why' && !isEmbed) {
    return <WhyUsPage />
  }

  // Demo mode — uses mock data, no auth
  return <DemoAppRoutes />
}

/** Live app: requires authentication, will use real Supabase data */
function LiveApp() {
  const { user, loading, updateRole } = useAuth()
  const { pathname } = useLocation()
  const initStore = useStore(s => s.initLiveMode)
  const initVendorStore = useVendorStore(s => s.initLiveMode)

  // The account's committed role, fetched directly so we have a definite loaded
  // signal: undefined = not fetched yet, null = fetched but undecided (new
  // account), 'couple' | 'vendor' = a real saved choice.
  const [dbRole, setDbRole] = useState<'couple' | 'vendor' | null | undefined>(undefined)

  // The role hint stamped by the "Create account → pick role" flow. Read once.
  const pendingRoleRef = useRef<string | null>(localStorage.getItem('pellikart_pending_role'))

  // Once we commit a role for this session it's locked — later re-renders (e.g.
  // the profile finishing loading) must never flip it. This is the core fix for
  // "the vendor's pick got wiped and they became a couple".
  const committedRoleRef = useRef<'couple' | 'vendor' | null>(null)

  // Whether this user already has a completed vendor record.
  // null = not yet checked; we block store init until this resolves so a
  // returning vendor never sees the role-select / couple flow flicker.
  const [hasCompletedVendor, setHasCompletedVendor] = useState<boolean | null>(null)
  // True once stores are initialized in live mode for a committed role.
  const [initialized, setInitialized] = useState(false)
  // True when the account has no role yet and must pick before continuing.
  const [needsRoleChoice, setNeedsRoleChoice] = useState(false)

  // One-shot lookup per user: vendor ownership and the committed DB role. Admin
  // status isn't needed here — /admin is gated independently by AdminGate.
  useEffect(() => {
    setInitialized(false)
    setNeedsRoleChoice(false)
    committedRoleRef.current = null
    if (!user) {
      setHasCompletedVendor(null)
      setDbRole(undefined)
      return
    }
    let cancelled = false
    fetchVendor(user.id).then(v => {
      if (!cancelled) setHasCompletedVendor(!!(v && v.onboarding_complete))
    })
    fetchProfileRole(user.id).then(r => {
      if (!cancelled) setDbRole(r)
    })
    return () => { cancelled = true }
  }, [user])

  // Commit a role for this session: lock it, persist it, init the live stores.
  // Shared by the auto-resolution below and the role chooser's onSelect.
  const commitRole = useCallback((role: 'couple' | 'vendor', persist = true) => {
    if (!user) return
    committedRoleRef.current = role
    setDbRole(role)
    setNeedsRoleChoice(false)
    // Persist the choice so every future login uses it. Skipped when the DB
    // already matches, to avoid a needless write on every returning-user login.
    if (persist) updateRole(role)
    // The pending hint has served its purpose and is now safely persisted.
    pendingRoleRef.current = null
    localStorage.removeItem('pellikart_pending_role')
    initStore(user.id, role)
    if (role === 'vendor') initVendorStore(user.id)
    setInitialized(true)
  }, [user, updateRole, initStore, initVendorStore])

  // Resolve the session role once everything we need has loaded.
  useEffect(() => {
    if (!user || hasCompletedVendor === null || dbRole === undefined) return
    if (committedRoleRef.current) return

    const picked = pendingRoleRef.current as 'couple' | 'vendor' | null

    // Priority:
    //  1. A role just picked this login (new signup).
    //  2. The saved DB role — authoritative, since we now always persist the
    //     user's choice (including deliberate role switches).
    //  3. A completed vendor record — safety net if the DB role is somehow unset.
    //  4. Otherwise the account is undecided → show the chooser.
    let role: 'couple' | 'vendor' | null
    if (picked === 'couple' || picked === 'vendor') role = picked
    else if (dbRole === 'couple' || dbRole === 'vendor') role = dbRole
    else if (hasCompletedVendor) role = 'vendor'
    else role = null

    if (!role) {
      setNeedsRoleChoice(true)
      return
    }
    // Only write to the DB if the stored role differs from what we resolved.
    commitRole(role, dbRole !== role)
  }, [user, hasCompletedVendor, dbRole, commitRole])

  const splash = (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <img src="/logo.png" alt="Pellikart" className="w-14 h-14 rounded-xl object-cover animate-pulse" />
        <p className="text-[13px] text-gray-400">Loading...</p>
      </div>
    </div>
  )

  // Hold the splash until auth AND the per-user lookups (vendor / role) have
  // resolved, so we never flash the wrong flow before we know where to go.
  if (loading || (user && (hasCompletedVendor === null || dbRole === undefined))) {
    return splash
  }

  // Not logged in — show auth screen
  if (!user) {
    return <AuthPage />
  }

  // These routes don't depend on a chosen couple/vendor role: the admin panel
  // is gated independently (AdminGate), and claim is for pre-onboarded vendors.
  // Render them before the chooser so an undecided user can still reach them.
  if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/claim') {
    return <AppRoutes />
  }

  // Brand-new account with no role yet — make them choose. The pick is persisted
  // and used on every future login, so nobody gets silently stuck as a couple.
  if (needsRoleChoice) {
    return <div className="app-container"><RoleSelectPage onSelect={commitRole} /></div>
  }

  // Committed role, stores still initializing — brief splash.
  if (!initialized) {
    return splash
  }

  // Logged in — stores are in live mode, connected to Supabase
  return <AppRoutes />
}

/** Demo app routes — mock data, no auth required */
const DemoAppRoutes = AppRoutes

/** Admin panel — gated to allowlisted emails, routed independently of the
 *  couple/vendor role flows so staff can build vendors regardless of their own
 *  account role. */
function AdminGate() {
  const [state, setState] = useState<'checking' | 'ok' | 'denied'>('checking')
  useEffect(() => {
    let cancelled = false
    isAdminUser().then(ok => { if (!cancelled) setState(ok ? 'ok' : 'denied') })
    return () => { cancelled = true }
  }, [])

  if (state === 'checking') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-[13px] text-gray-400">Loading…</p>
      </div>
    )
  }
  if (state === 'denied') return <Navigate to="/" replace />
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/vendor/:id/*" element={<AdminVendorEditor />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

/** Shared app routes (used by both demo and live app for now) */
function AppRoutes() {
  const { role, onboardingComplete } = useStore()
  const { vendorOnboardingComplete } = useVendorStore()
  const { pathname } = useLocation()

  // DEV-only quick entry, stripped from production builds:
  //   ?skip         → couple app, past role-select + onboarding
  //   ?skip=vendor  → vendor flow at role 'vendor' (lands on vendor onboarding)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const skip = new URLSearchParams(window.location.search).get('skip')
    if (skip === null) return
    const s = useStore.getState()
    if (skip === 'vendor') {
      if (s.role !== 'vendor') useStore.setState({ role: 'vendor' })
    } else if (s.role !== 'user' || !s.onboardingComplete) {
      useStore.setState({ role: 'user', onboardingComplete: true })
    }
  }, [])

  // Claim flow — available to any signed-in user, before role branching, so a
  // pre-onboarded vendor can take ownership regardless of their current role.
  if (pathname === '/claim') {
    return <div className="app-container"><ClaimPage /></div>
  }

  // Admin panel — bypasses the couple/vendor role routing entirely.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminGate />
  }

  // No role selected
  if (role === 'none') {
    return (
      <div className="app-container">
        <Routes><Route path="*" element={<RoleSelectPage />} /></Routes>
      </div>
    )
  }

  // Vendor flow
  if (role === 'vendor') {
    if (!vendorOnboardingComplete) {
      return (
        <div className="app-container">
          <Routes><Route path="*" element={<VendorOnboarding />} /></Routes>
        </div>
      )
    }
    return (
      <VendorShell>
        <Routes>
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />
          <Route path="/vendor/trials" element={<VendorTrials />} />
          <Route path="/vendor/bids" element={<VendorBids />} />
          <Route path="/vendor/notifications" element={<VendorNotifications />} />
          <Route path="/vendor/earnings" element={<VendorEarnings />} />
          <Route path="/vendor/calendar" element={<VendorCalendar />} />
          <Route path="/vendor/analytics" element={<VendorAnalytics />} />
          <Route path="/vendor/reviews" element={<VendorReviews />} />
          <Route path="/vendor/listings" element={<VendorListings />} />
          <Route path="/vendor/listings/new" element={<VendorAddListing />} />
          <Route path="/vendor/listings/edit/:listingId" element={<VendorEditListing />} />
          <Route path="*" element={<Navigate to="/vendor" />} />
        </Routes>
        <VendorBottomNav />
      </VendorShell>
    )
  }

  // User flow
  return (
    <CoupleShell>
      <Routes>
        <Route path="/onboarding" element={onboardingComplete ? <Navigate to="/?embed=1" /> : <OnboardingPage />} />
        <Route path="/" element={onboardingComplete ? <HomePage /> : <Navigate to="/onboarding" />} />
        <Route path="/category/:ritualId/:categoryId" element={onboardingComplete ? <CategoryBoardPage /> : <Navigate to="/onboarding" />} />
        <Route path="/booking/:ritualId" element={onboardingComplete ? <BookingPage /> : <Navigate to="/onboarding" />} />
        <Route path="*" element={<Navigate to="/?embed=1" />} />
      </Routes>
    </CoupleShell>
  )
}
