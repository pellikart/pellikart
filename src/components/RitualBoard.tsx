import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { RitualBoard as RitualBoardType } from '@/lib/types'
import { formatINR, formatDateRange, bgStyle } from '@/lib/helpers'
import { getUnavailableVendors } from '@/lib/availability'
import CategoryCard from './CategoryCard'

interface Props {
  board: RitualBoardType
}

export default function RitualBoard({ board }: Props) {
  const { vendors, subscription, removeCategory, subscribe } = useStore()
  const unlocked = subscription !== 'free'
  const navigate = useNavigate()
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showTierPicker, setShowTierPicker] = useState(false)
  const [showDateEditor, setShowDateEditor] = useState(false)
  const [newDateStart, setNewDateStart] = useState(board.dateStart || '')
  const [newDateEnd, setNewDateEnd] = useState(board.dateEnd || board.dateStart || '')
  const { updateBoardDates } = useStore()

  const activeCategories = board.categories.filter((c) => !c.removed)
  const filledCategories = activeCategories.filter((c) => c.selectedVendorId)
  const emptyCategories = activeCategories.filter((c) => !c.selectedVendorId)

  const filledCount = filledCategories.length
  const totalCount = activeCategories.length

  let ritualTotal = 0
  for (const cat of filledCategories) {
    if (cat.selectedVendorId && vendors[cat.selectedVendorId]) {
      ritualTotal += vendors[cat.selectedVendorId].price
    }
  }

  const dateStr = formatDateRange(board.dateStart, board.dateEnd)

  return (
    <div className="mx-4 mb-4 border border-card-border rounded-2xl bg-white p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-bold text-dark">{board.name}</h2>
          <span className="text-[11px] text-gray-400">{filledCount}/{totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          {dateStr ? (
            <button onClick={() => setShowDateEditor(true)} className="text-[10px] text-gray-500 flex items-center gap-1 active:text-magenta">
              {dateStr}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          ) : (
            <button onClick={() => setShowDateEditor(true)} className="text-[10px] text-magenta font-medium">
              + Add date
            </button>
          )}
          <span className="text-xs font-semibold text-magenta">{formatINR(ritualTotal)}</span>
        </div>
      </div>

      {/* Masonry Grid */}
      <div className="masonry-grid">
        {filledCategories.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            ritualId={board.id}
            vendor={vendors[cat.selectedVendorId!]}
            spanTwo={index === 0 && (filledCategories.length + (emptyCategories.length > 0 ? 1 : 0)) > 2}
            unlocked={unlocked}
            onRemove={() => removeCategory(board.id, cat.id)}
          />
        ))}

        {emptyCategories.length > 0 && (
          <div className="relative rounded-xl overflow-hidden min-h-[90px]">
            <button
              onClick={() => setShowCategoryPicker(true)}
              className="w-full h-full min-h-[90px] bg-empty-bg flex flex-col items-center justify-center gap-1 cursor-pointer active:bg-gray-200 transition-colors rounded-xl"
            >
              <div className="w-8 h-8 rounded-full border-[1.5px] border-dashed border-magenta flex items-center justify-center">
                <span className="text-magenta text-base leading-none">+</span>
              </div>
              <span className="text-[10px] text-gray-500">{emptyCategories.length} more</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <button className="py-2 px-3 rounded-lg border border-magenta text-magenta text-[11px] font-medium active:bg-magenta-light transition-colors">
          Share board
        </button>
        {unlocked ? (
          <Link
            to={`/booking/${board.id}`}
            className="w-8 h-8 rounded-full bg-magenta flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ) : (
          <button
            onClick={() => setShowTierPicker(true)}
            className="py-1.5 px-3 rounded-lg bg-gray-400 text-white text-[10px] font-medium"
          >
            Unlock to book
          </button>
        )}
      </div>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowCategoryPicker(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-dark mb-3">Add a category</p>
            <div className="flex flex-col gap-1.5">
              {emptyCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setShowCategoryPicker(false)
                    navigate(`/category/${board.id}/${cat.id}`)
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-empty-bg active:bg-gray-200 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-magenta-light flex items-center justify-center shrink-0">
                    <span className="text-magenta text-xs font-semibold">{cat.label.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-dark">{cat.label}</p>
                    <p className="text-[10px] text-gray-400">
                      {cat.shortlistedVendorIds.length > 0
                        ? `${cat.shortlistedVendorIds.length} shortlisted`
                        : 'Tap to explore vendors'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tier Picker Modal */}
      {showTierPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowTierPicker(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">Choose your plan</p>
            <p className="text-[11px] text-gray-500 mb-4">Unlock vendor names, trial sessions & booking</p>
            <div className="flex gap-3">
              <button onClick={() => { subscribe('silver'); setShowTierPicker(false) }} className="flex-1 rounded-xl border-2 border-card-border p-3 text-left">
                <p className="text-[13px] font-bold text-dark">Silver</p>
                <p className="text-lg font-bold text-magenta mt-0.5">₹999</p>
                <p className="text-[9px] text-gray-500 mt-1">1 trial per category</p>
              </button>
              <button onClick={() => { subscribe('gold'); setShowTierPicker(false) }} className="flex-1 rounded-xl border-2 border-magenta bg-magenta-light/30 p-3 text-left relative">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-magenta text-white text-[7px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>
                <p className="text-[13px] font-bold text-dark">Gold</p>
                <p className="text-lg font-bold text-magenta mt-0.5">₹1,999</p>
                <p className="text-[9px] text-gray-500 mt-1">3 trials per category</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Editor Modal */}
      {showDateEditor && (
        <DateEditorModal
          board={board}
          vendors={vendors}
          newDateStart={newDateStart}
          newDateEnd={newDateEnd}
          onDateStartChange={setNewDateStart}
          onDateEndChange={setNewDateEnd}
          onClose={() => setShowDateEditor(false)}
          onConfirm={(removeIds) => {
            updateBoardDates(board.id, newDateStart, newDateEnd, removeIds)
            setShowDateEditor(false)
          }}
        />
      )}
    </div>
  )
}

function DateEditorModal({
  board, vendors, newDateStart, newDateEnd,
  onDateStartChange, onDateEndChange, onClose, onConfirm,
}: {
  board: RitualBoardType
  vendors: Record<string, { id: string; name: string; code: string; photo: string }>
  newDateStart: string
  newDateEnd: string
  onDateStartChange: (v: string) => void
  onDateEndChange: (v: string) => void
  onClose: () => void
  onConfirm: (removeIds: string[]) => void
}) {
  // Find selected vendor IDs on this board
  const selectedVendorIds = board.categories
    .filter((c) => !c.removed && c.selectedVendorId)
    .map((c) => c.selectedVendorId!)

  // Check which vendors would be unavailable on the new dates
  const unavailable = newDateStart
    ? getUnavailableVendors(selectedVendorIds, newDateStart, newDateEnd || newDateStart)
    : []

  const hasChanges = newDateStart !== (board.dateStart || '') || newDateEnd !== (board.dateEnd || board.dateStart || '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
        <p className="text-[14px] font-bold text-dark mb-1">Edit dates — {board.name}</p>

        <div className="flex gap-3 mt-4">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 block mb-1">Start date</label>
            <input
              type="date" value={newDateStart}
              onChange={(e) => { onDateStartChange(e.target.value); if (!newDateEnd || e.target.value > newDateEnd) onDateEndChange(e.target.value) }}
              className="w-full text-[12px] text-dark border border-card-border rounded-lg px-2.5 py-2 outline-none focus:border-magenta"
            />
          </div>
          <span className="self-end pb-2.5 text-gray-300">→</span>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 block mb-1">End date</label>
            <input
              type="date" value={newDateEnd} min={newDateStart}
              onChange={(e) => onDateEndChange(e.target.value)}
              className="w-full text-[12px] text-dark border border-card-border rounded-lg px-2.5 py-2 outline-none focus:border-magenta"
            />
          </div>
        </div>

        {/* Availability warning */}
        {unavailable.length > 0 && hasChanges && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-[11px] font-semibold text-red-600 mb-2">
              {unavailable.length} vendor{unavailable.length > 1 ? 's' : ''} unavailable on these dates:
            </p>
            {unavailable.map((vId) => {
              const v = vendors[vId]
              if (!v) return null
              const cat = board.categories.find((c) => c.selectedVendorId === vId)
              return (
                <div key={vId} className="flex items-center gap-2 py-1.5">
                  <div className="w-7 h-7 rounded-md shrink-0" style={bgStyle(v.photo)} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-dark">{v.name || v.code}</span>
                    {cat && <span className="text-[9px] text-gray-400 ml-1">({cat.label})</span>}
                  </div>
                </div>
              )
            })}
            <p className="text-[9px] text-red-400 mt-2">These vendors will be removed from the board if you confirm.</p>
          </div>
        )}

        {hasChanges && unavailable.length === 0 && newDateStart && (
          <p className="mt-4 text-[11px] text-green-600 font-medium">All vendors are available on these dates!</p>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-[11px] font-medium">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(unavailable)}
            disabled={!newDateStart}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-medium ${
              newDateStart ? 'bg-magenta text-white active:opacity-90' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {unavailable.length > 0 ? `Confirm & remove ${unavailable.length}` : 'Save dates'}
          </button>
        </div>
      </div>
    </div>
  )
}
