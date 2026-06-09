import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Category, Vendor } from '@/lib/types'
import { formatINR, bgStyle, getCategorySelectionTotal } from '@/lib/helpers'
import ListingDetailSheet from './ListingDetailSheet'

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
          {(() => {
            const photoSel = getCategorySelectionTotal(vendor, category)
            if (photoSel != null) return <p className="text-white font-bold text-xs">{formatINR(photoSel)}</p>
            return <p className="text-white font-bold text-xs">{formatINR(vendor.price)}{vendor.rateCard ? <span className="font-normal text-[10px]">/hr</span> : ''}</p>
          })()}
        </button>
      </div>

      {/* Vendor Detail Sheet — shared with the Category Board so couples see the same rich data */}
      {showDetail && (
        <ListingDetailSheet
          vendor={vendor}
          unlocked={unlocked}
          onClose={() => setShowDetail(false)}
          ritualId={ritualId}
          categoryId={category.id}
          selectedTierHours={category.selectedTierHours}
        />
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

