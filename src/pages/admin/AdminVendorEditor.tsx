import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { fetchVendorById } from '@/lib/supabase-db'
import VendorOnboarding from '@/pages/vendor/VendorOnboarding'

interface SeedState { seed?: { businessName: string; category: string; phone?: string } }

/** Hosts the real vendor onboarding flow, re-targeted (via the store's admin
 *  edit mode) at a pre-created vendor row. Full 16-category parity by reuse. */
export default function AdminVendorEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const seed = (location.state as SeedState | null)?.seed

  const initAdminEditMode = useVendorStore(s => s.initAdminEditMode)
  const [ready, setReady] = useState(false)
  const [alreadyComplete, setAlreadyComplete] = useState(false)
  const [reopen, setReopen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  // Falls back to the vendor row so the "Continue setup" path (no nav state)
  // still prefills the identity fields captured at creation.
  const [rowSeed, setRowSeed] = useState<{ businessName: string; category: string; phone?: string } | undefined>()

  // Isolate this vendor's resume-draft so building vendor B never inherits
  // vendor A's half-finished draft (the real onboarding auto-saves to sessionStorage).
  const draftKey = `pellikart:admin-vendor-draft:${id}`

  useEffect(() => {
    if (!id) return
    // Clear the shared self-serve draft key so no stale draft (from before the
    // per-vendor keys existed, or from a real vendor's own onboarding) bleeds in.
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

  // Guard against accidentally overwriting a vendor that's already set up.
  if (alreadyComplete && !reopen) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <img src="/logo.png" alt="Pellikart" className="w-14 h-14 rounded-xl object-cover mb-5" />
        <h1 className="text-[18px] font-bold text-dark">{businessName || 'This vendor'} is already set up</h1>
        <p className="text-[13px] text-gray-500 mt-2 max-w-xs">
          Re-running setup overwrites their profile and adds another listing. Granular edits are best done by the vendor after they claim the account.
        </p>
        <div className="w-full max-w-xs mt-7 space-y-3">
          <button onClick={() => navigate('/admin')} className="w-full py-3 rounded-xl bg-magenta text-white font-semibold text-[14px]">
            Back to dashboard
          </button>
          <button onClick={() => setReopen(true)} className="w-full py-3 rounded-xl border border-card-border text-dark font-semibold text-[14px]">
            Re-run setup anyway
          </button>
        </div>
      </div>
    )
  }

  // The store is already in admin edit mode for this vendor id; the onboarding
  // flow's writes are re-keyed by id. On finish it returns to the dashboard.
  return (
    <div className="app-container">
      <VendorOnboarding returnPath="/admin" adminSeed={seed ?? rowSeed} draftKey={draftKey} />
    </div>
  )
}
