import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import type { RitualBoard, Vendor } from '@/lib/types'
import { generatePackages, type PackageDeal } from '@/lib/packages'
import { formatINR, bgStyle, guestCountFor, listingDisplayName } from '@/lib/helpers'
import ListingDetailSheet from './ListingDetailSheet'

interface Props {
  board: RitualBoard
}

/** A small emoji marker per core category — used to label package inclusions. */
const CATEGORY_ICON: Record<string, string> = {
  Venue: '🏛️',
  Catering: '🍽️',
  Decor: '🎀',
  Photography: '📸',
  Makeup: '💄',
}

export default function PackagesSection({ board }: Props) {
  const { vendors, subscription, onboardingData, applyPackage, removePackage } = useStore()
  const unlocked = subscription !== 'free'
  const [openDeal, setOpenDeal] = useState<PackageDeal | null>(null)
  // A package member the couple tapped → opens the same rich vendor detail sheet
  // they'd get from the board (with the matching board category for context).
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null)

  const guests = guestCountFor(onboardingData?.eventGuests?.[board.name])
  const deals = useMemo(() => generatePackages(vendors, board, guests), [vendors, board, guests])
  const activeIds = new Set((board.activePackages || []).map((p) => p.id))

  if (deals.length === 0) return null

  const vendorName = (id: string) => {
    const v = vendors[id]
    if (!v) return ''
    return listingDisplayName(v, unlocked)
  }

  const offPct = (d: PackageDeal) => Math.round(d.discountPct * 100)

  // Average member rating — shown as an MMT-style rating pill.
  const avgRating = (d: PackageDeal) => {
    const rs = d.memberListingIds.map((id) => vendors[id]?.rating || 0).filter((r) => r > 0)
    if (rs.length === 0) return 0
    return rs.reduce((s, r) => s + r, 0) / rs.length
  }

  // The (non-removed) board category matching a member's category label, so the
  // detail sheet opens with the same board context as tapping from the board.
  const categoryIdFor = (v: Vendor) =>
    board.categories.find((c) => !c.removed && c.label === v.category)?.id

  return (
    <div className="h-full min-h-0 flex flex-col pt-3 pb-2">
      <div className="px-4 md:px-6 flex items-end justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-[15px] font-bold text-dark">Wedding Packages</h2>
          <p className="text-[11px] text-gray-500">Book multiple vendors together &amp; save {offPct(deals[0])}%</p>
        </div>
        <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
          Swipe
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </span>
      </div>

      {/* Swipeable snap carousel — fills the half; a sliver of the next card peeks */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-px-4 px-4 md:px-6 pb-1 items-stretch">
        {deals.map((deal) => {
          const isActive = activeIds.has(deal.id)
          const cats = deal.memberListingIds.map((id) => vendors[id]?.category).filter(Boolean) as string[]
          const rating = avgRating(deal)
          return (
            <button
              key={deal.id}
              onClick={() => setOpenDeal(deal)}
              className={`snap-start shrink-0 w-[300px] md:w-[330px] h-full text-left rounded-2xl overflow-hidden bg-white border transition-all active:scale-[0.98] flex flex-col ${
                isActive ? 'border-green-400 ring-1 ring-green-300' : 'border-card-border'
              }`}
            >
              {/* Photo strip header (half the card) with an MMT-style % OFF ribbon */}
              <div className="relative h-1/2 shrink-0 flex">
                {deal.memberListingIds.slice(0, 3).map((id) => (
                  <div key={id} className="flex-1" style={bgStyle(vendors[id]?.photo || '')} />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                {!isActive && (
                  <span className="absolute top-0 left-0 bg-green-600 text-white text-[11px] font-bold px-3 py-1 rounded-br-xl shadow-sm">
                    {offPct(deal)}% OFF
                  </span>
                )}
                {isActive && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">Added ✓</span>
                )}
                {rating > 0 && (
                  <span className="absolute bottom-2 right-2 bg-white/95 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                    {rating.toFixed(1)}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col min-h-0">
                <p className="text-[17px] font-bold text-dark truncate shrink-0">{deal.name}</p>
                <p className="text-[11px] text-gray-400 truncate shrink-0">{deal.tagline}</p>

                {/* Inclusions — MMT-style labelled list of what's bundled */}
                <div className="flex-1 flex flex-col justify-center gap-1 min-h-0 py-2 overflow-hidden">
                  {cats.map((cat, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600 truncate">
                      <span className="shrink-0">{CATEGORY_ICON[cat] || '•'}</span>
                      <span className="truncate">{cat}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-card-border shrink-0">
                  <div>
                    <p className="text-[11px] text-gray-400 leading-none mb-1">
                      <span className="line-through">{formatINR(deal.value)}</span>
                    </p>
                    <p className="text-[22px] font-bold text-dark leading-none">{formatINR(deal.price)}</p>
                    <p className="text-[11px] text-green-600 font-semibold leading-none mt-1">You save {formatINR(deal.savings)}</p>
                  </div>
                  <span className={`text-[13px] font-semibold px-4 py-2.5 rounded-xl shrink-0 ${isActive ? 'bg-empty-bg text-gray-600' : 'bg-magenta text-white'}`}>
                    {isActive ? 'View' : 'Add +'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail sheet */}
      {openDeal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center md:items-center" onClick={() => setOpenDeal(null)}>
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-[480px] p-4 pb-8 md:p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3 md:hidden" />
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[15px] font-bold text-dark">{openDeal.name} package</p>
                <p className="text-[11px] text-gray-500">{openDeal.tagline}</p>
              </div>
              <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shrink-0">
                {offPct(openDeal)}% OFF
              </span>
            </div>

            {/* All member vendors as the same photo-tile cards used on the board —
                tap any to open its full detail sheet (identical to the board). */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {openDeal.memberListingIds.map((id) => {
                const v = vendors[id]
                if (!v) return null
                const perPlateOnly = v.category === 'Venue' && v.venuePricingModels?.includes('perPlate') && !v.venuePricingModels?.includes('rent')
                const fromTotal = perPlateOnly && guests > 0 ? v.price * guests : null
                return (
                  <button
                    key={id}
                    onClick={() => setDetailVendor(v)}
                    className="relative rounded-xl overflow-hidden min-h-[128px] text-left active:scale-[0.98] transition-transform"
                    style={bgStyle(v.photo)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    <div className="relative z-10 h-full w-full flex flex-col justify-between p-2.5 min-h-[128px]">
                      <span className="self-start bg-white/90 text-dark text-[10px] font-medium px-2 py-0.5 rounded-full">{v.category}</span>
                      <div>
                        <p className="text-white font-semibold text-[12px] truncate leading-tight mb-0.5">{vendorName(id)}</p>
                        <p className="text-white font-bold text-[13px] leading-none">
                          {v.eventPackages?.length ? <span className="font-normal text-[10px]">from </span> : ''}
                          {formatINR(v.price)}
                          {perPlateOnly ? <span className="font-normal text-[10px]">/plate</span> : ''}
                        </p>
                        {fromTotal != null && (
                          <p className="text-white/85 font-semibold text-[10px] leading-tight mt-0.5">
                            <span className="font-normal text-white/70">from </span>{formatINR(fromTotal)} <span className="font-normal text-white/70">· {guests} plates</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 p-3 rounded-xl border border-card-border">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Individual total</span>
                <span className="line-through">{formatINR(openDeal.value)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-green-600 mt-1">
                <span>Package discount ({offPct(openDeal)}%)</span>
                <span>−{formatINR(openDeal.savings)}</span>
              </div>
              <div className="flex items-center justify-between text-[14px] font-bold text-dark mt-2 pt-2 border-t border-card-border">
                <span>Package price</span>
                <span className="text-magenta">{formatINR(openDeal.price)}</span>
              </div>
            </div>

            {activeIds.has(openDeal.id) ? (
              <div className="mt-5 space-y-2">
                <p className="text-[11px] text-green-600 text-center font-medium">This package is on your board.</p>
                <button
                  onClick={() => { removePackage(board.id, openDeal.id, true); setOpenDeal(null) }}
                  className="w-full py-2.5 rounded-xl border border-red-300 text-red-500 text-[12px] font-medium active:bg-red-50 transition-colors"
                >
                  Remove package
                </button>
              </div>
            ) : (
              <button
                onClick={() => { applyPackage(board.id, openDeal); setOpenDeal(null) }}
                className="w-full mt-5 py-2.5 rounded-xl bg-magenta text-white text-[13px] font-semibold active:scale-[0.98] transition-transform"
              >
                Add package to board
              </button>
            )}
            <p className="text-[9px] text-gray-400 text-center mt-2">
              Adds all {openDeal.memberListingIds.length} vendors to your event board. The {offPct(openDeal)}% discount holds while all stay selected.
            </p>
          </div>
        </div>
      )}

      {/* Full vendor detail — the same sheet couples get from the board */}
      {detailVendor && (
        <ListingDetailSheet
          vendor={detailVendor}
          unlocked={unlocked}
          onClose={() => setDetailVendor(null)}
          ritualId={board.id}
          categoryId={categoryIdFor(detailVendor)}
        />
      )}
    </div>
  )
}
