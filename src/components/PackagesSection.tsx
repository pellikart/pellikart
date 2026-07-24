import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import type { RitualBoard } from '@/lib/types'
import { generatePackages, type PackageDeal } from '@/lib/packages'
import { formatINR, bgStyle } from '@/lib/helpers'

interface Props {
  board: RitualBoard
}

export default function PackagesSection({ board }: Props) {
  const { vendors, subscription, applyPackage, removePackage } = useStore()
  const unlocked = subscription !== 'free'
  const [openDeal, setOpenDeal] = useState<PackageDeal | null>(null)

  const deals = useMemo(() => generatePackages(vendors, board), [vendors, board])
  const activeIds = new Set((board.activePackages || []).map((p) => p.id))

  if (deals.length === 0) return null

  const vendorName = (id: string) => {
    const v = vendors[id]
    if (!v) return ''
    return unlocked ? v.name : (v.publicCode || v.code)
  }

  return (
    <div className="px-4 mt-6 md:px-6 md:mt-8">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-[14px] font-bold text-dark">Packages</h2>
        <span className="text-[10px] text-gray-400">Book together &amp; save</span>
      </div>
      <p className="text-[11px] text-gray-500 mb-3">Ready-made vendor bundles at a discounted price.</p>

      {/* Horizontal scroll on mobile; wraps to a grid on desktop */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible">
        {deals.map((deal) => {
          const isActive = activeIds.has(deal.id)
          return (
            <button
              key={deal.id}
              onClick={() => setOpenDeal(deal)}
              className="shrink-0 w-[240px] md:w-auto text-left rounded-2xl border border-card-border bg-white p-3 active:bg-empty-bg transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[13px] font-bold text-dark">{deal.name}</p>
                  <p className="text-[10px] text-gray-400">{deal.tagline}</p>
                </div>
                {isActive && (
                  <span className="bg-green-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">Added ✓</span>
                )}
              </div>

              {/* Member vendor thumbnails */}
              <div className="flex items-center gap-1.5 mb-3">
                {deal.memberListingIds.slice(0, 5).map((id) => {
                  const v = vendors[id]
                  return (
                    <div key={id} className="flex flex-col items-center gap-0.5 w-9">
                      <div className="w-9 h-9 rounded-lg shrink-0" style={bgStyle(v?.photo || '')} />
                      <span className="text-[7px] text-gray-400 truncate w-full text-center">{v?.category}</span>
                    </div>
                  )
                })}
                <span className="text-[9px] text-gray-400 ml-0.5">{deal.memberListingIds.length} vendors</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 line-through">{formatINR(deal.value)}</p>
                  <p className="text-[16px] font-bold text-magenta leading-tight">{formatINR(deal.price)}</p>
                </div>
                <span className="bg-mustard-light text-mustard text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                  Save {formatINR(deal.savings)}
                </span>
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
              <span className="bg-mustard-light text-mustard text-[10px] font-semibold px-2 py-1 rounded-full shrink-0">
                Save {formatINR(openDeal.savings)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {openDeal.memberListingIds.map((id) => {
                const v = vendors[id]
                if (!v) return null
                return (
                  <div key={id} className="flex items-center gap-3 p-2 rounded-xl bg-empty-bg">
                    <div className="w-11 h-11 rounded-lg shrink-0" style={bgStyle(v.photo)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] uppercase tracking-wide text-gray-400">{v.category}</p>
                      <p className="text-[12px] font-medium text-dark truncate">{vendorName(id)}</p>
                    </div>
                    <span className="text-[11px] text-gray-500 shrink-0">{formatINR(v.price)}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 p-3 rounded-xl border border-card-border">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Individual total</span>
                <span className="line-through">{formatINR(openDeal.value)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-green-600 mt-1">
                <span>Package discount</span>
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
              Adds all {openDeal.memberListingIds.length} vendors to your event board. The discount holds while all stay selected.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
