import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchAllListings, fetchAllLiveVendors, fetchAllAvailability, resolveCatalogShare } from '@/lib/supabase-db'
import { buildLiveVendorMap, useStore } from '@/lib/store'
import { formatINR, bgStyle, listingDisplayName } from '@/lib/helpers'
import type { Vendor } from '@/lib/types'
import ListingDetailSheet from '@/components/ListingDetailSheet'

/**
 * Public, admin-shared catalog of every live vendor in a category, with FULL
 * details visible (names, contact, pricing) — for sharing with clients running
 * offline events. Reached via a revocable token link /catalog/:token (resolved
 * server-side); bypasses auth like /share. Content is live (current vendors);
 * the admin controls access by revoking / expiring the token.
 */
export default function CategoryCatalogPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<'loading' | 'invalid' | 'ok'>('loading')
  const [category, setCategory] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    let cancelled = false
    ;(async () => {
      const cat = await resolveCatalogShare(token)
      if (cancelled) return
      if (!cat) { setStatus('invalid'); return }
      setCategory(cat)
      const [liveVendors, listings, availability] = await Promise.all([
        fetchAllLiveVendors(),
        fetchAllListings(),
        fetchAllAvailability(),
      ])
      if (cancelled) return
      const { vendorMap, lvMap } = buildLiveVendorMap(
        liveVendors as Record<string, unknown>[],
        listings as Record<string, unknown>[],
        availability as Record<string, unknown>[],
      )
      // Make the vendor map available to ListingDetailSheet's internal lookups.
      // Not live mode — no DB writes (add-to-board is gated on ritual/category ids).
      useStore.setState({ vendors: vendorMap, _listingVendorMap: lvMap, _liveMode: false })
      setVendors(
        Object.values(vendorMap).filter(v => v.category === cat).sort((a, b) => a.price - b.price),
      )
      setStatus('ok')
    })()
    return () => { cancelled = true }
  }, [token])

  const detailVendor = detailId ? vendors.find(v => v.id === detailId) : null

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-dark">This link isn't available</p>
          <p className="text-[12px] text-gray-500 mt-1 max-w-[260px]">It may have been revoked or expired. Please ask for a fresh link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-empty-bg">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-card-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="max-w-[820px] mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-dark truncate">{category || 'Vendor catalog'}</p>
            <p className="text-[11px] text-gray-500">
              {status === 'loading' ? 'Loading…' : `${vendors.length} ${vendors.length === 1 ? 'vendor' : 'vendors'} · full details`}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 py-2 px-3 rounded-xl bg-mustard text-white text-[12px] font-semibold active:scale-[0.98] transition-transform"
          >
            {copied ? '✓ Link copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto p-4">
        {status === 'loading' ? (
          <p className="text-center text-gray-400 text-xs py-12">Loading vendors…</p>
        ) : vendors.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-12">No live {category} vendors yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => setDetailId(v.id)}
                className="text-left rounded-2xl overflow-hidden bg-white border border-card-border active:scale-[0.99] transition-transform"
              >
                <div className="aspect-[4/3] w-full" style={bgStyle(v.photo)} />
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold text-dark truncate">{listingDisplayName(v, true)}</p>
                  {v.area && <p className="text-[10px] text-gray-500 truncate">{v.area}</p>}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[12px] font-bold text-magenta">
                      {v.price > 0 ? formatINR(v.price) : 'On request'}
                    </span>
                    {v.phone && <span className="text-[9px] text-gray-400">{v.phone}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full read-only details (unlocked) — no add-to-board (no ritual/category). */}
      {detailVendor && (
        <ListingDetailSheet
          vendor={detailVendor}
          unlocked
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}
