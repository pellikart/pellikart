import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { fetchVendorById } from '@/lib/supabase-db'
import VendorOnboarding from '@/pages/vendor/VendorOnboarding'
import VendorProfile from '@/pages/vendor/VendorProfile'
import VendorListings from '@/pages/vendor/VendorListings'
import VendorEditListing from '@/pages/vendor/VendorEditListing'
import VendorAddListing from '@/pages/vendor/VendorAddListing'

interface SeedState { seed?: { businessName: string; category: string; phone?: string } }

/**
 * Admin vendor editor. Two modes:
 *  - Not yet set up → the real onboarding flow (create), re-keyed by vendor id.
 *  - Already set up → an in-place editor (Profile + Listings tabs) that reuses
 *    the vendor's own screens, so every field can be edited without overwriting
 *    or duplicating anything.
 * Hosted at /admin/vendor/:id/* so it stays mounted across the sub-tabs and the
 * store's admin edit mode isn't torn down between them.
 */
export default function AdminVendorEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const seed = (location.state as SeedState | null)?.seed
  const base = `/admin/vendor/${id}`

  const initAdminEditMode = useVendorStore(s => s.initAdminEditMode)
  const [ready, setReady] = useState(false)
  const [alreadyComplete, setAlreadyComplete] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [rowSeed, setRowSeed] = useState<{ businessName: string; category: string; phone?: string } | undefined>()

  // Isolate this vendor's onboarding resume-draft so building vendor B never
  // inherits vendor A's half-finished draft.
  const draftKey = `pellikart:admin-vendor-draft:${id}`

  useEffect(() => {
    if (!id) return
    try { sessionStorage.removeItem('pellikart:vendor-onboarding-draft') } catch { /* ignore */ }
    let cancelled = false
    ;(async () => {
      const v = await fetchVendorById(id)
      if (cancelled) return
      setAlreadyComplete(!!(v && v.onboarding_complete))
      setBusinessName((v?.business_name as string) || seed?.businessName || '')
      if (v) {
        setRowSeed({
          businessName: (v.business_name as string) || '',
          category: (v.category as string) || '',
          phone: (v.phone as string) || (v.claim_phone as string) || '',
        })
      }
      await initAdminEditMode(id)
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
      // Leave admin edit mode so a later screen doesn't inherit this target.
      useVendorStore.setState({ _adminMode: false, _liveMode: false, _vendorDbId: null })
    }
  }, [id, initAdminEditMode, seed?.businessName])

  if (!id) { navigate('/admin'); return null }

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-[13px] text-gray-400">Loading…</p>
      </div>
    )
  }

  // Not set up yet → run the create flow.
  if (!alreadyComplete) {
    return (
      <div className="app-container">
        <VendorOnboarding returnPath="/admin" adminSeed={seed ?? rowSeed} draftKey={draftKey} />
      </div>
    )
  }

  // Already set up → in-place editor. The nested screens read/write the store,
  // which is in admin edit mode for this vendor, so edits save in place.
  const onListings = location.pathname.startsWith(`${base}/listings`)
  const tabCls = (active: boolean) =>
    `flex-1 py-2 text-[12px] font-semibold rounded-lg ${active ? 'bg-magenta text-white' : 'text-gray-500'}`

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="bg-white border-b border-card-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-[12px] text-gray-400 hover:text-gray-600">← Dashboard</button>
          <p className="text-[13px] font-bold text-dark truncate">{businessName}</p>
        </div>
        <div className="flex gap-1.5 mt-2.5 bg-gray-100 rounded-lg p-1">
          <button onClick={() => navigate(base)} className={tabCls(!onListings)}>Profile</button>
          <button onClick={() => navigate(`${base}/listings`)} className={tabCls(onListings)}>Listings</button>
        </div>
      </header>

      <div className="app-container">
        <Routes>
          <Route index element={<VendorProfile />} />
          <Route path="listings" element={<VendorListings />} />
          <Route path="listings/new" element={<VendorAddListing />} />
          <Route path="listings/edit/:listingId" element={<VendorEditListing />} />
          <Route path="*" element={<Navigate to={base} replace />} />
        </Routes>
      </div>
    </div>
  )
}
