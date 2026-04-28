import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Category, Vendor } from '@/lib/types'
import { formatINR, bgStyle } from '@/lib/helpers'

interface Props {
  category: Category
  ritualId: string
  vendor: Vendor
  spanTwo: boolean
  unlocked: boolean
  onRemove: () => void
}

export default function CategoryCard({ category, ritualId, vendor, spanTwo, unlocked, onRemove }: Props) {
  const [showDetail, setShowDetail] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const navigate = useNavigate()
  const wrapperClass = `rounded-xl overflow-hidden relative ${spanTwo ? 'span-2' : ''} min-h-[90px]`

  const likeNames = vendor.likes.map((l) => l.name)

  return (
    <>
      <div className={wrapperClass} style={bgStyle(vendor.photo)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {vendor.booked && (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full z-10">
            Booked ✓
          </div>
        )}

        {/* Tap card → open vendor detail */}
        <button
          onClick={() => setShowDetail(true)}
          className="relative z-10 h-full w-full flex flex-col justify-between p-2 min-h-[90px] text-left"
        >
          <div className="flex items-start justify-between">
            <span className="bg-white/90 text-dark text-[10px] font-medium px-1.5 py-0.5 rounded-full">
              {category.label}
            </span>
            <div className="flex items-center gap-1">
              {/* Swap button → category board */}
              <div
                onClick={(e) => { e.stopPropagation(); navigate(`/category/${ritualId}/${category.id}`) }}
                className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm cursor-pointer"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              {/* Remove button */}
              <div
                onClick={(e) => { e.stopPropagation(); setShowRemoveConfirm(true) }}
                className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm cursor-pointer"
              >
                <span className="text-white text-[10px] leading-none">✕</span>
              </div>
            </div>
          </div>
          <p className="text-white font-bold text-xs">{formatINR(vendor.price)}</p>
        </button>
      </div>

      {/* Vendor Detail Sheet */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Hero gradient */}
            <div className="h-40 relative" style={bgStyle(vendor.photo)}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={() => setShowDetail(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-sm">✕</span>
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="bg-white/90 text-dark text-[9px] font-medium px-1.5 py-0.5 rounded-full">{category.label}</span>
                <p className="text-white font-bold text-lg mt-1">{unlocked ? vendor.name : vendor.code}</p>
              </div>
            </div>

            <div className="p-4">
              {/* Rating + Likes row */}
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-dark/10 text-dark text-[11px] font-medium px-2 py-1 rounded-full">★ {vendor.rating}</span>
                {likeNames.length > 0 && (
                  <span className="bg-magenta-light text-magenta text-[11px] px-2 py-1 rounded-full">♥ {vendor.likes.length} · {likeNames.join(', ')}</span>
                )}
                {vendor.booked && (
                  <span className="bg-green-100 text-green-600 text-[10px] font-semibold px-2 py-1 rounded-full">Booked ✓</span>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <DetailRow label="Style" value={vendor.style} />
                <DetailRow label="Area" value={vendor.area} />
                <DetailRow label="Package" value={vendor.packageTier} />
                {vendor.capacity && <DetailRow label="Capacity" value={`${vendor.capacity} guests`} />}
                <DetailRow label="Price" value={formatINR(vendor.price)} highlight />
                {vendor.booked && <DetailRow label="Paid" value={formatINR(vendor.amountPaid)} />}
              </div>

              {/* Photo gallery */}
              {(vendor.listingPhotos?.length || vendor.portfolioPhotos?.length) ? (
                <>
                  <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Gallery</p>
                  <div className="grid grid-cols-3 gap-1.5 mb-4">
                    {[...(vendor.listingPhotos || []), ...(vendor.portfolioPhotos || [])].filter(Boolean).slice(0, 9).map((src, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mb-4 py-4 text-center rounded-xl bg-empty-bg">
                  <p className="text-[10px] text-gray-400">No photos uploaded yet</p>
                </div>
              )}

              {/* Package details */}
              <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Package Details</p>
              <div className="bg-empty-bg rounded-xl p-3 mb-4">
                <p className="text-[12px] font-medium text-dark mb-1">{vendor.packageTier}</p>
                <ul className="space-y-1">
                  <PackageItem text={`${vendor.style} setup & execution`} />
                  <PackageItem text={`Covers ${vendor.area} region`} />
                  {vendor.capacity && <PackageItem text={`Up to ${vendor.capacity} guest capacity`} />}
                  <PackageItem text="Dedicated coordinator on event day" />
                  <PackageItem text="Includes setup & teardown" />
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDetail(false); navigate(`/category/${ritualId}/${category.id}`) }}
                  className="flex-1 py-2.5 rounded-xl border border-magenta text-magenta text-[11px] font-semibold active:bg-magenta-light transition-colors"
                >
                  Swap vendor
                </button>
                {unlocked && !vendor.booked && (
                  <button className="flex-1 py-2.5 rounded-xl bg-magenta text-white text-[11px] font-semibold active:opacity-90 transition-opacity">
                    Book this vendor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-4 max-w-[300px] w-full">
            <p className="text-[13px] font-semibold text-dark mb-1">Remove {category.label}?</p>
            <p className="text-[11px] text-gray-500 mb-4">
              This will remove the category and delete its entire board for this ritual, including all shortlisted vendors.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowRemoveConfirm(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 text-[11px] font-medium">
                Cancel
              </button>
              <button onClick={() => { setShowRemoveConfirm(false); onRemove() }} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-[11px] font-medium">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-[12px] font-medium mt-0.5 ${highlight ? 'text-magenta font-bold' : 'text-dark'}`}>{value}</p>
    </div>
  )
}

function PackageItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-1.5 text-[10px] text-gray-600">
      <span className="text-magenta mt-px">✓</span>
      <span>{text}</span>
    </li>
  )
}
