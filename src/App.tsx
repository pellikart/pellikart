import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useVendorStore } from '@/lib/vendor-store'
import LandingPage from './pages/LandingPage'
import TryAppPage from './pages/TryAppPage'
import WhyUsPage from './pages/WhyUsPage'
import RoleSelectPage from './pages/RoleSelectPage'
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

export default function App() {
  const { pathname, search } = useLocation()
  const isEmbed = new URLSearchParams(search).has('embed')

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

  return <AppRoutes />
}

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
