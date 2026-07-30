import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchAllListings, fetchAllLiveVendors, fetchAllAvailability } from '@/lib/supabase-db'
import { buildLiveVendorMap, useStore } from '@/lib/store'
import { formatINR, bgStyle, listingDisplayName } from '@/lib/helpers'
import type { Vendor } from '@/lib/types'
import ListingDetailSheet from '@/components/ListingDetailSheet'
import { CATEGORIES } from '@/pages/vendor/VendorOnboarding'

/** Slug used in the public catalog URL, e.g. "Live Stalls" → "live-stalls". */
export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Public, admin-shared catalog of every live vendor in a category, with FULL
 * details visible (names, contact, pricing) — for sharing with clients running
 * offline events. Lives at /catalog/:category, bypassing auth like /share.
 */
export default function CategoryCatalogPage() {
  const { category: slug } = useParams<{ category: string }>()
  const category = useMemo(() => CATEGORIES.find(c => categorySlug(c) === slug) || '', [slug])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!category) { setLoading(false); return }
    let cancelled = false
    ;(async () => {
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
      // Not live mode — no DB writes happen (add-to-board is gated on ritual/category ids).
      useStore.setState({ vendors: vendorMap, _listingVendorMap: lvMap, _liveMode: false })
      const list = Object.values(vendorMap)
        .filter(v => v.category === category)
        .sort((a, b) => a.price - b.price)
      setVendors(list)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [category])

  const detailVendor = detailId ? vendors.find(v => v.id === detailId) : null

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!category) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-[15px] font-semibold text-dark">Catalog not found</p>
          <p className="text-[12px] text-gray-500 mt-1">This category link isn't valid.</p>
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
            <p className="text-[16px] font-bold text-dark truncate">{category}</p>
            <p className="text-[11px] text-gray-500">
              {loading ? 'Loading…' : `${vendors.length} ${vendors.length === 1 ? 'vendor' : 'vendors'} · full details`}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="shrink-0 py-2 px-3 rounded-xl bg-mustard text-white text-[12px] font-semibold active:scale-[0.98] transition-transform"
          >
            {copied ? '✓ Link copied' : 'Copy share link'}
          </button>
        </div>
      </div>

      <div className="max-w-[820px] mx-auto p-4">
        {loading ? (
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
