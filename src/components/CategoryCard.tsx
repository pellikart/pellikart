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
  /** Guest count for this event — used to show a per-plate venue's total
   *  (price/plate × guests) below the rate. */
  guests?: number
  /** When set, this card is part of an active package — shows a bundle badge and
   *  routes removal straight to onRemove (the parent shows the package break prompt)
   *  instead of the generic remove confirmation. */
  packageName?: string
}

export default function CategoryCard({ category, ritualId, vendor, spanTwo, unlocked, onRemove, guests, packageName }: Props) {
  const [showDetail, setShowDetail] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const navigate = useNavigate()
  const wrapperClass = `rounded-xl overflow-hidden relative ${spanTwo ? 'span-2' : ''} min-h-[90px] md:min-h-[200px]`

  const openExplorer = () => navigate(`/category/${ritualId}/${category.id}`)

  // The way into the rest of the category, in words. The bare swap glyph that
  // used to sit here read as nothing at all — people didn't know a whole
  // category of vendors was behind it.
  const exploreLabel = `See more ${category.label} options`

  return (
    <>
      <div className={wrapperClass} style={bgStyle(vendor.photo)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {vendor.booked && (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full z-10">
            Booked ✓
          </div>
        )}

        {/* Tapping the photo opens this vendor's details. It's a bare overlay
            button so the controls layered above can be real buttons — they used
            to be divs nested inside this one, which no keyboard could reach. */}
        <button
          onClick={() => setShowDetail(true)}
          aria-label={`View ${category.label} details`}
          className="absolute inset-0 z-10"
        />

        {/* Content layer: transparent to taps except its own controls. */}
        <div className="relative z-20 h-full w-full flex flex-col justify-between p-2 md:p-4 min-h-[90px] md:min-h-[200px] text-left pointer-events-none">
          <div className="flex items-start justify-between">
            <span className="bg-white/90 text-dark text-[10px] md:text-[13px] font-medium px-1.5 md:px-2 py-0.5 rounded-full">
              {category.label}
            </span>
            {/* Remove — package members defer to the parent's break prompt */}
            <button
              onClick={() => { if (packageName) { onRemove() } else { setShowRemoveConfirm(true) } }}
              aria-label={`Remove ${category.label} from this event`}
              className="pointer-events-auto w-5 h-5 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm"
            >
              <span className="text-white text-[10px] leading-none">✕</span>
            </button>
          </div>

          <div className="space-y-1 md:space-y-1.5">
          {packageName && (
            <div className="w-fit bg-magenta text-white text-[8px] md:text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <span>📦</span>
              <span className="max-w-[64px] truncate">{packageName}</span>
            </div>
          )}
          {(() => {
            const photoSel = getCategorySelectionTotal(vendor, category)
            const perPlateSel = (vendor.category === 'Venue' || vendor.category === 'Catering') && !!category.selectedPlatePackageId
            // For a per-plate venue, show the per-plate rate AND, below it, the
            // total for the event's guest count (price/plate × guests).
            const plateTotal = perPlateSel && photoSel != null && guests && guests > 0 ? photoSel * guests : null
            if (photoSel != null) return (
              <div>
                <p className="text-white font-bold text-xs md:text-lg">{formatINR(photoSel)}{perPlateSel ? <span className="font-normal text-[10px] md:text-[13px]">/plate</span> : ''}</p>
                {plateTotal != null && <p className="text-white/85 font-semibold text-[10px] md:text-[13px] leading-tight">{formatINR(plateTotal)} <span className="font-normal text-white/70">· {guests} plates</span></p>}
              </div>
            )
            // Fallback: no package picked yet. A per-plate-only venue shows its
            // "from" per-plate rate; add the "from" total for the guest count.
            const perPlateOnly = (vendor.category === 'Venue' && vendor.venuePricingModels?.includes('perPlate') && !vendor.venuePricingModels?.includes('rent')) || (vendor.category === 'Catering' && (vendor.platePackages?.length ?? 0) > 0)
            const fromTotal = perPlateOnly && guests && guests > 0 ? vendor.price * guests : null
            return (
              <div>
                <p className="text-white font-bold text-xs md:text-lg">{vendor.eventPackages?.length ? <span className="font-normal text-[10px] md:text-[13px]">from </span> : ''}{formatINR(vendor.price)}{perPlateOnly ? <span className="font-normal text-[10px] md:text-[13px]">/plate</span> : ''}</p>
                {fromTotal != null && <p className="text-white/85 font-semibold text-[10px] md:text-[13px] leading-tight"><span className="font-normal text-white/70">from </span>{formatINR(fromTotal)} <span className="font-normal text-white/70">· {guests} plates</span></p>}
              </div>
            )
          })()}

          {/* The way into the rest of the category. */}
          <button
            onClick={openExplorer}
            aria-label={exploreLabel}
            className="pointer-events-auto w-full flex items-center justify-center gap-1 md:gap-1.5 rounded-lg bg-white/90 text-dark text-[9px] md:text-[12px] font-semibold py-1 md:py-1.5 active:bg-white transition-colors"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-3 md:h-3 shrink-0">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span className="truncate">{exploreLabel}</span>
          </button>
          </div>
        </div>
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

