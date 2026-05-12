import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { RitualBoard as RitualBoardType } from '@/lib/types'
import { formatINR, formatDateRange, bgStyle } from '@/lib/helpers'
import { getUnavailableVendors } from '@/lib/availability'
import { ONBOARDING_CONFIG } from '@/lib/vendor-category-config'
import CategoryCard from './CategoryCard'

interface Props {
  board: RitualBoardType
}

export default function RitualBoard({ board }: Props) {
  const { vendors, subscription, removeCategory, restoreCategory, subscribe, addBoardCategory } = useStore()
  const unlocked = subscription !== 'free'
  const navigate = useNavigate()
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showTierPicker, setShowTierPicker] = useState(false)
  const [showDateEditor, setShowDateEditor] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newDateStart, setNewDateStart] = useState(board.dateStart || '')
  const [newDateEnd, setNewDateEnd] = useState(board.dateEnd || board.dateStart || '')
  const { updateBoardDates } = useStore()

  const activeCategories = board.categories.filter((c) => !c.removed)
  const filledCategories = activeCategories.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId])
  const emptyCategories = activeCategories.filter((c) => !c.selectedVendorId || !vendors[c.selectedVendorId])
  const removedCategories = board.categories.filter((c) => c.removed)
  // Categories available to add from the master list that aren't on the board yet
  const existingLabels = new Set(board.categories.map(c => c.label))
  const moreAvailableCount = Object.keys(ONBOARDING_CONFIG).filter(label => !existingLabels.has(label)).length
  const addableCount = emptyCategories.length + removedCategories.length + moreAvailableCount

  const filledCount = filledCategories.length
  const totalCount = activeCategories.length

  let ritualTotal = 0
  for (const cat of filledCategories) {
    if (cat.selectedVendorId && vendors[cat.selectedVendorId]) {
      ritualTotal += vendors[cat.selectedVendorId].price
    }
  }

  const dateStr = formatDateRange(board.dateStart, board.dateEnd)

  // Build a human-readable share message summarizing this board
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${encodeURIComponent(board.id)}`
    : ''
  const shareTitle = `${board.name} — our wedding plan on Pellikart`
  const shareText = (() => {
    const lines: string[] = []
    lines.push(`💐 ${board.name} — our plan on Pellikart`)
    if (dateStr) lines.push(`📅 ${dateStr}`)
    lines.push('')
    for (const cat of filledCategories) {
      const v = vendors[cat.selectedVendorId!]
      if (!v) continue
      const name = unlocked ? v.name : v.code
      lines.push(`✅ ${cat.label}: ${name} — ${formatINR(v.price)}`)
    }
    if (emptyCategories.length > 0) {
      lines.push('')
      lines.push(`Still picking: ${emptyCategories.map(c => c.label).join(', ')}`)
    }
    lines.push('')
    lines.push(`Total so far: ${formatINR(ritualTotal)}`)
    return lines.join('\n')
  })()

  async function handleShareClick() {
    // Try the native share sheet first (mobile, modern browsers)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        return
      } catch (err) {
        // User dismissed (AbortError) — don't fall back, just stop
        if ((err as DOMException)?.name === 'AbortError') return
        // Other errors (NotAllowedError etc.) — fall through to custom sheet
      }
    }
    setShowShareSheet(true)
  }

  async function copyShareLink() {
    const body = `${shareText}\n\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

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

        {addableCount > 0 && (
          <div className="relative rounded-xl overflow-hidden min-h-[90px]">
            <button
              onClick={() => setShowCategoryPicker(true)}
              className="w-full h-full min-h-[90px] bg-empty-bg flex flex-col items-center justify-center gap-1 cursor-pointer active:bg-gray-200 transition-colors rounded-xl"
            >
              <div className="w-8 h-8 rounded-full border-[1.5px] border-dashed border-magenta flex items-center justify-center">
                <span className="text-magenta text-base leading-none">+</span>
              </div>
              <span className="text-[10px] text-gray-500">{addableCount} more</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <button onClick={handleShareClick} className="py-2 px-3 rounded-lg border border-magenta text-magenta text-[11px] font-medium active:bg-magenta-light transition-colors">
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

              {removedCategories.length > 0 && (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-3 mb-1">Recently removed</p>
                  {removedCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-empty-bg">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <span className="text-gray-500 text-xs font-semibold">{cat.label.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-dark">{cat.label}</p>
                        <p className="text-[10px] text-gray-400">Removed — tap restore to bring it back</p>
                      </div>
                      <button
                        onClick={() => {
                          restoreCategory(board.id, cat.id)
                          setShowCategoryPicker(false)
                        }}
                        className="px-3 py-1.5 rounded-lg border border-magenta text-magenta text-[11px] font-medium active:bg-magenta-light transition-colors shrink-0"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </>
              )}

              {(() => {
                // Show every vendor category that isn't already on this board (active or removed)
                const existingLabels = new Set(board.categories.map(c => c.label))
                const moreCategories = Object.keys(ONBOARDING_CONFIG).filter(label => !existingLabels.has(label))
                if (moreCategories.length === 0) return null
                return (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-3 mb-1">Browse more categories</p>
                    {moreCategories.map((label) => (
                      <button
                        key={label}
                        onClick={() => {
                          addBoardCategory(board.id, label)
                          setShowCategoryPicker(false)
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-magenta/30 bg-magenta-light/10 active:bg-magenta-light/30 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-magenta-light flex items-center justify-center shrink-0">
                          <span className="text-magenta text-xs font-semibold">+</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-dark">{label}</p>
                          <p className="text-[10px] text-gray-400">Not on your board yet — tap to add</p>
                        </div>
                      </button>
                    ))}
                  </>
                )
              })()}
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

      {/* Share Sheet (fallback when navigator.share is unavailable) */}
      {showShareSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowShareSheet(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-dark mb-1">Share {board.name}</p>
            <p className="text-[10px] text-gray-400 mb-4">Send your plan to family or your partner.</p>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                target="_blank" rel="noopener noreferrer"
                onClick={() => setShowShareSheet(false)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#16a34a">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 0 1-4.243-1.214l-.252-.149-2.868.852.852-2.868-.168-.268A8 8 0 1 1 12 20z" />
                  </svg>
                </div>
                <span className="text-[9px] text-gray-600">WhatsApp</span>
              </a>

              <a
                href={`sms:?&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                onClick={() => setShowShareSheet(false)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="text-[9px] text-gray-600">Messages</span>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
                onClick={() => setShowShareSheet(false)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-12 rounded-full bg-mustard-light border border-mustard/30 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span className="text-[9px] text-gray-600">Email</span>
              </a>

              <button onClick={copyShareLink} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-empty-bg border border-card-border flex items-center justify-center">
                  {copied ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </div>
                <span className="text-[9px] text-gray-600">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-empty-bg">
              <p className="text-[10px] text-gray-500 whitespace-pre-line">{shareText}</p>
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
