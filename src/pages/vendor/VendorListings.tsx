import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { useVendorBase } from '@/lib/vendor-nav'
import { formatINR } from '@/lib/helpers'
import { isSingleListingCategory } from '@/lib/vendor-category-config'
import { vendorListingToPreviewVendor } from '@/lib/vendor-preview'
import ListingDetailSheet from '@/components/ListingDetailSheet'
import type { VendorListing } from '@/lib/vendor-types'

export default function VendorListings() {
  const navigate = useNavigate()
  const base = useVendorBase()
  const { vendorListings, vendorProfile, deleteListing, _adminMode } = useVendorStore()
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [previewListing, setPreviewListing] = useState<VendorListing | null>(null)
  // Single-listing categories (Mehendi, Makeup, Saree Draping) have no
  // Listings page — they author + edit their one listing from onboarding + the dashboard.
  // (In admin mode there's no dashboard, so we keep the list visible.)
  const singleListing = isSingleListingCategory(vendorProfile?.category)
  useEffect(() => {
    if (singleListing && !_adminMode) navigate('/vendor', { replace: true })
  }, [singleListing, _adminMode, navigate])

  return (
    <div className="min-h-dvh bg-white pb-20 page-enter">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <p className="text-[14px] font-bold text-dark">{singleListing ? 'My Listing' : 'My Listings'}</p>
        {!singleListing && (
          <button
            onClick={() => navigate(`${base}/listings/new`)}
            className="bg-mustard text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg active:scale-[0.97] transition-transform"
          >
            + Add listing
          </button>
        )}
      </div>

      <div className="px-4 mt-3">
        {vendorListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-mustard-light flex items-center justify-center mb-3">
              <span className="text-mustard text-2xl">+</span>
            </div>
            <p className="text-[13px] font-semibold text-dark">No listings yet</p>
            <p className="text-[11px] text-gray-400 mt-1 text-center max-w-[220px]">
              Add your first listing so couples can discover your services.
            </p>
            <button
              onClick={() => navigate(`${base}/listings/new`)}
              className="mt-4 bg-mustard text-white text-[12px] font-semibold px-5 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
            >
              Create your first listing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorListings.map((l) => (
              <div key={l.id} className="rounded-xl border border-card-border overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setPreviewListing(l)}
                  className="block w-full relative group"
                  aria-label={`Preview ${l.name} as a couple sees it`}
                >
                  {l.photos.length > 0 ? (
                    <img src={l.photos[0]} alt={l.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-empty-bg flex items-center justify-center text-gray-400 text-xs">No photo</div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/55 text-white text-[9px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                    👁 Preview
                  </span>
                </button>
                <div className="p-3">
                  {l.inHouseDecor?.pending && (
                    <button
                      onClick={() => navigate(`${base}/listings/edit/${l.id}`)}
                      className="w-full mb-2 flex items-center gap-2 text-left px-2.5 py-2 rounded-lg bg-mustard-light/60 border border-mustard/30 active:scale-[0.99] transition-transform"
                    >
                      <span className="text-[13px]">🎨</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[10px] font-semibold text-dark">Add your in-house decor details</span>
                        <span className="block text-[9px] text-gray-500">This venue requires in-house decor — add the designs so couples can see them.</span>
                      </span>
                      <span className="text-mustard text-[12px]">›</span>
                    </button>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-dark">{l.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{l.style} · {l.category}</p>
                    </div>
                    <p className="text-[12px] font-bold text-mustard">{formatINR(l.price)}</p>
                  </div>
                  {l.includes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {l.includes.slice(0, 4).map((inc, i) => (
                        <span key={i} className="bg-empty-bg text-[8px] text-gray-500 px-1.5 py-0.5 rounded-full">{inc}</span>
                      ))}
                      {l.includes.length > 4 && <span className="text-[8px] text-gray-400">+{l.includes.length - 4} more</span>}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setPreviewListing(l)}
                      className="flex-1 py-1.5 rounded-lg border border-card-border text-dark text-[10px] font-medium active:bg-empty-bg transition-colors"
                    >
                      👁 Preview
                    </button>
                    <button
                      onClick={() => navigate(`${base}/listings/edit/${l.id}`)}
                      className="flex-1 py-1.5 rounded-lg border border-mustard text-mustard text-[10px] font-medium active:bg-mustard-light transition-colors"
                    >
                      {singleListing ? 'Edit pricing' : 'Edit listing'}
                    </button>
                    {!singleListing && (
                      <button
                        onClick={() => setDeleteTarget({ id: l.id, name: l.name })}
                        aria-label="Delete listing"
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[10px] font-medium active:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Couple's-eye preview of the listing */}
      {previewListing && (
        <ListingDetailSheet
          vendor={vendorListingToPreviewVendor(previewListing, vendorProfile)}
          unlocked
          preview
          onClose={() => setPreviewListing(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <p className="text-[14px] font-bold text-dark mb-2">Delete this listing?</p>
            <p className="text-xs text-gray-600 mb-4">
              <span className="font-semibold">{deleteTarget.name}</span> will be removed permanently. Couples with existing bookings will keep their booking, but new couples won't see this listing.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium">Cancel</button>
              <button
                onClick={() => { deleteListing(deleteTarget.id); setDeleteTarget(null) }}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-xs font-semibold active:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
