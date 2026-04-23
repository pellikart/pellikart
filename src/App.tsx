import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/vendor-store'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import LandingPage from './pages/LandingPage'
import TryAppPage from './pages/TryAppPage'
import WhyUsPage from './pages/WhyUsPage'
import RoleSelectPage from './pages/RoleSelectPage'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import CategoryBoardPage from './pages/CategoryBoardPage'
import BookingPage from './pages/BookingPage'
import OnboardingPage from './pages/OnboardingPage'
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

export default function App({ isLiveApp = false }: { isLiveApp?: boolean }) {
  const { pathname, search } = useLocation()
  const isEmbed = new URLSearchParams(search).has('embed')

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

  // Apply pending role + initialize stores
  useEffect(() => {
    if (!user) return

    // Determine the effective role:
    // 1. Pending role from OAuth redirect (highest priority)
    // 2. Profile role from DB
    // 3. Default to 'couple'
    const pendingRole = localStorage.getItem('pellikart_pending_role')
    let effectiveRole: 'couple' | 'vendor' = (profile?.role as 'couple' | 'vendor') || 'couple'

    if (pendingRole && (pendingRole === 'couple' || pendingRole === 'vendor')) {
      effectiveRole = pendingRole
      if (profile && profile.role !== pendingRole) {
        updateRole(pendingRole)
      }
      localStorage.removeItem('pellikart_pending_role')
    }

    // Initialize stores with the correct role (don't wait for profile)
    console.log('[LiveApp] init stores — role:', effectiveRole, 'userId:', user.id, 'profile:', profile?.role || 'null')
    initStore(user.id, effectiveRole)
    if (effectiveRole === 'vendor') {
      initVendorStore(user.id)
    }
  }, [user, profile, updateRole, initStore, initVendorStore])

  if (loading) {
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
      <div className="app-container">
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
      </div>
    )
  }

  // User flow
  return (
    <div className="app-container">
      <Routes>
        <Route path="/onboarding" element={onboardingComplete ? <Navigate to="/?embed=1" /> : <OnboardingPage />} />
        <Route path="/" element={onboardingComplete ? <HomePage /> : <Navigate to="/onboarding" />} />
        <Route path="/category/:ritualId/:categoryId" element={onboardingComplete ? <CategoryBoardPage /> : <Navigate to="/onboarding" />} />
        <Route path="/booking/:ritualId" element={onboardingComplete ? <BookingPage /> : <Navigate to="/onboarding" />} />
        <Route path="*" element={<Navigate to="/?embed=1" />} />
      </Routes>
    </div>
  )
}
