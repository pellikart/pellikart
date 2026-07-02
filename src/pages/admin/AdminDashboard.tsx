import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { fetchAdminVendors, createAdminVendor, deleteAdminVendor } from '@/lib/supabase-db'
import { CATEGORIES } from '@/pages/vendor/VendorOnboarding'

interface AdminVendorRow {
  id: string
  business_name: string
  category: string
  claim_code: string | null
  claim_phone: string | null
  is_live: boolean
  onboarding_complete: boolean
  claimed_at: string | null
  user_id: string | null
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [vendors, setVendors] = useState<AdminVendorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  // New-vendor form
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    const rows = await fetchAdminVendors()
    setVendors(rows as AdminVendorRow[])
    setLoading(false)
  }

  async function handleDelete(v: AdminVendorRow) {
    const claimed = v.claimed_at || v.user_id
    const warning = claimed
      ? `"${v.business_name}" has already been claimed by the vendor. Deleting removes their whole account data. Continue?`
      : `Delete "${v.business_name}"? This removes the vendor and all their listings. This can't be undone.`
    if (!window.confirm(warning)) return
    setDeletingId(v.id)
    const ok = await deleteAdminVendor(v.id)
    setDeletingId(null)
    if (ok) setVendors(prev => prev.filter(x => x.id !== v.id))
    else window.alert("Couldn't delete that vendor. Please try again.")
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!name.trim() || !category) {
      setError('Enter a business name and pick a category.')
      return
    }
    setCreating(true)
    setError(null)
    const row = await createAdminVendor(name.trim(), category, phone.trim() || null)
    setCreating(false)
    if (!row) {
      setError("Couldn't create the vendor. Check your connection and that you're an admin.")
      return
    }
    // Straight into the full onboarding flow, pre-seeded with what we just entered.
    navigate(`/admin/vendor/${row.id}`, {
      state: { seed: { businessName: name.trim(), category, phone: phone.trim() } },
    })
  }

  function status(v: AdminVendorRow): { label: string; cls: string } {
    if (v.claimed_at || v.user_id) return { label: 'Claimed', cls: 'bg-green-100 text-green-700' }
    if (v.is_live) return { label: 'Live · unclaimed', cls: 'bg-mustard-light text-mustard-dark' }
    return { label: 'Draft', cls: 'bg-gray-100 text-gray-500' }
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="bg-white border-b border-card-border px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Pellikart" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <h1 className="text-[16px] font-bold text-dark leading-none">Admin · Vendor onboarding</h1>
            <p className="text-[11px] text-gray-400 mt-1">Build vendor profiles from quotations</p>
          </div>
        </div>
        <button onClick={signOut} className="text-[12px] text-gray-400 hover:text-gray-600">Sign out</button>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] text-gray-500">
            {loading ? 'Loading…' : `${vendors.length} vendor${vendors.length === 1 ? '' : 's'} created`}
          </p>
          <button
            onClick={() => { setShowAdd(true); setError(null) }}
            className="px-4 py-2 rounded-xl bg-magenta text-white font-semibold text-[13px] active:scale-[0.99]"
          >
            + Add vendor
          </button>
        </div>

        {loading ? null : vendors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-card-border p-8 text-center">
            <p className="text-[14px] text-gray-500">No vendors yet.</p>
            <p className="text-[12px] text-gray-400 mt-1">Tap “Add vendor” to enter your first quotation.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {vendors.map(v => {
              const st = status(v)
              return (
                <li key={v.id} className="bg-white rounded-2xl border border-card-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-dark truncate">{v.business_name}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">{v.category}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {v.claim_code && !v.claimed_at && (
                      <button
                        onClick={() => { navigator.clipboard?.writeText(v.claim_code!) }}
                        className="text-[11px] font-mono bg-gray-50 border border-card-border rounded-lg px-2.5 py-1.5 text-dark active:bg-gray-100"
                        title="Copy claim code"
                      >
                        {v.claim_code} <span className="text-gray-400">copy</span>
                      </button>
                    )}
                    {v.claim_phone && (
                      <span className="text-[11px] text-gray-400">📞 {v.claim_phone}</span>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      <button
                        onClick={() => handleDelete(v)}
                        disabled={deletingId === v.id}
                        className="text-[12px] font-medium text-red-500 disabled:opacity-50"
                      >
                        {deletingId === v.id ? 'Deleting…' : 'Delete'}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/vendor/${v.id}`)}
                        className="text-[12px] font-semibold text-magenta"
                      >
                        {v.onboarding_complete ? 'Edit' : 'Continue setup →'}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-[17px] font-bold text-dark">Add a vendor</h2>
            <p className="text-[12px] text-gray-400 mt-1">Enter the basics, then fill in their full quotation.</p>

            <label className="block mt-5 text-[12px] font-semibold text-dark">Business name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Rajesh Photography"
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-card-border text-[14px] focus:border-magenta outline-none"
            />

            <label className="block mt-4 text-[12px] font-semibold text-dark">Category</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-card-border text-[14px] focus:border-magenta outline-none bg-white"
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label className="block mt-4 text-[12px] font-semibold text-dark">Vendor phone <span className="text-gray-400 font-normal">(used for claim)</span></label>
            <input
              value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+91…"
              inputMode="tel"
              className="w-full mt-1.5 px-3.5 py-3 rounded-xl border border-card-border text-[14px] focus:border-magenta outline-none"
            />

            {error && <p className="text-[12px] text-red-500 mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-card-border text-dark font-semibold text-[14px]">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 py-3 rounded-xl bg-magenta text-white font-semibold text-[14px] disabled:opacity-60">
                {creating ? 'Creating…' : 'Create & set up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
