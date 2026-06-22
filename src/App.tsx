import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/vendor-store'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { fetchVendor } from '@/lib/supabase-db'
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
  const { user, profile, loading, updateRole } = useAuth()
  const initStore = useStore(s => s.initLiveMode)
  const initVendorStore = useVendorStore(s => s.initLiveMode)

  // Track the pending role across re-renders so it doesn't get lost
  // when profile loads from DB with the old role ('couple')
  const pendingRoleRef = useRef<string | null>(localStorage.getItem('pellikart_pending_role'))

  // Whether this user already has a completed vendor record.
  // null = not yet checked; we block store init until this resolves so a
  // returning vendor never sees the role-select / couple flow flicker.
  const [hasCompletedVendor, setHasCompletedVendor] = useState<boolean | null>(null)

  // One-shot lookup: does this auth user already own a completed vendor row?
  useEffect(() => {
    if (!user) {
      setHasCompletedVendor(null)
      return
    }
    let cancelled = false
    fetchVendor(user.id).then(v => {
      if (cancelled) return
      setHasCompletedVendor(!!(v && v.onboarding_complete))
    })
    return () => { cancelled = true }
  }, [user])

  // Apply effective role + initialize stores
  useEffect(() => {
    if (!user || hasCompletedVendor === null) return

    const picked = pendingRoleRef.current as 'couple' | 'vendor' | null
    const dbRole = profile?.role as 'couple' | 'vendor' | undefined

    // Determine the effective role for this session.
    //  1. A user with a completed vendor record is always 'vendor' —
    //     prevents a returning vendor from clobbering their role by
    //     accidentally tapping "couple" on the AuthPage role-select.
    //  2. Otherwise use the picked role (new signup flow).
    //  3. Fall back to the DB role, then 'couple' default.
    let effectiveRole: 'couple' | 'vendor'
    if (hasCompletedVendor) {
      effectiveRole = 'vendor'
    } else if (picked === 'couple' || picked === 'vendor') {
      effectiveRole = picked
    } else {
      effectiveRole = dbRole || 'couple'
    }

    // Sync DB profile.role if it disagrees with the effective role.
    if (profile && profile.role !== effectiveRole) {
      updateRole(effectiveRole)
    }

    // Clear pending role once the DB has caught up (or there's no profile
    // yet to reconcile against — happens when the auth trigger hasn't run).
    if (!profile || profile.role === effectiveRole) {
      pendingRoleRef.current = null
      localStorage.removeItem('pellikart_pending_role')
    }

    // Initialize stores with the correct role
    console.log('[LiveApp] init stores — role:', effectiveRole, 'userId:', user.id, 'hasCompletedVendor:', hasCompletedVendor, 'profile:', profile?.role || 'null', 'picked:', picked)
    initStore(user.id, effectiveRole)
    if (effectiveRole === 'vendor') {
      initVendorStore(user.id)
    }
  }, [user, profile, hasCompletedVendor, updateRole, initStore, initVendorStore])

  // Keep showing the splash while we resolve who this user is — both auth
  // load AND the vendor lookup must finish, otherwise AppRoutes briefly
  // renders RoleSelectPage before the stores initialize.
  if (loading || (user && hasCompletedVendor === null)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Pellikart" className="w-14 h-14 rounded-xl object-cover animate-pulse" />
          <p className="text-[13px] text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in — show auth screen
  if (!user) {
    return <AuthPage />
  }

  // Logged in — stores are in live mode, connected to Supabase
  return <AppRoutes />
}

/** Demo app routes — mock data, no auth required */
const DemoAppRoutes = AppRoutes

/** Shared app routes (used by both demo and live app for now) */
function AppRoutes() {
  const { role, onboardingComplete } = useStore()
  const { vendorOnboardingComplete } = useVendorStore()

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
