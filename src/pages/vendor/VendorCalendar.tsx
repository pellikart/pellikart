import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'

export default function VendorCalendar() {
  const navigate = useNavigate()
  const { vendorAvailability, toggleDateBlock, vendorBookings, vendorListings } = useVendorStore()
  const [monthOffset, setMonthOffset] = useState(0)
  const [blockSheet, setBlockSheet] = useState<string | null>(null) // date string
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const [blockAll, setBlockAll] = useState(true)

  const today = new Date()
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = viewMonth.getDay()
  const monthName = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const todayStr = today.toISOString().split('T')[0]

  function handleDateTap(dateStr: string) {
    const current = vendorAvailability[dateStr]
    if (current?.status === 'booked') return
    if (current?.status === 'blocked') {
      // Unblock
      toggleDateBlock(dateStr, [])
    } else {
      // Open sheet to choose listings
      if (vendorListings.length === 0) {
        // No listings, just block all
        toggleDateBlock(dateStr, [])
      } else {
        setBlockSheet(dateStr)
        setSelectedListingIds([])
        setBlockAll(true)
      }
    }
  }

  function confirmBlock() {
    if (!blockSheet) return
    toggleDateBlock(blockSheet, blockAll ? [] : selectedListingIds)
    setBlockSheet(null)
  }

  function toggleListingSelect(id: string) {
    setSelectedListingIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <div className="min-h-dvh bg-white pb-20 page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border sticky top-0 z-20">
        <p className="text-[14px] font-bold text-dark">Availability Calendar</p>
      </div>

      <div className="px-4 mt-3">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthOffset((m) => Math.max(m - 1, 0))} disabled={monthOffset === 0} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${monthOffset === 0 ? 'text-gray-300' : 'text-dark active:bg-empty-bg'}`}>← Prev</button>
          <p className="text-[13px] font-semibold text-dark">{monthName}</p>
          <button onClick={() => setMonthOffset((m) => Math.min(m + 1, 5))} disabled={monthOffset >= 5} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${monthOffset >= 5 ? 'text-gray-300' : 'text-dark active:bg-empty-bg'}`}>Next →</button>
        </div>

        {/* Calendar */}
        <div className="bg-empty-bg rounded-2xl p-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-[8px] text-gray-400 font-medium py-1">{d}</span>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <span key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const entry = vendorAvailability[dateStr]
              const status = entry?.status || 'available'
              const isPast = dateStr < todayStr
              const isToday = dateStr === todayStr
              const isPartial = status === 'blocked' && entry?.listingIds && entry.listingIds.length > 0

              return (
                <button
                  key={d}
                  onClick={() => !isPast && handleDateTap(dateStr)}
                  disabled={isPast || status === 'booked'}
                  className={`py-2 rounded-lg text-[11px] font-medium transition-all relative ${
                    isPast ? 'text-gray-300' :
                    status === 'booked' ? 'bg-magenta text-white' :
                    status === 'blocked' ? (isPartial ? 'bg-amber-400 text-white' : 'bg-gray-400 text-white') :
                    isToday ? 'bg-white text-dark ring-2 ring-mustard' :
                    'bg-white text-dark active:bg-mustard-light'
                  }`}
                >
                  {d}
                  {status === 'booked' && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                  {isPartial && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-center flex-wrap">
          <span className="flex items-center gap-1.5 text-[9px] text-gray-500"><span className="w-3 h-3 rounded bg-white border border-card-border" /> Available</span>
          <span className="flex items-center gap-1.5 text-[9px] text-gray-500"><span className="w-3 h-3 rounded bg-gray-400" /> Blocked (all)</span>
          {vendorListings.length > 0 && (
            <span className="flex items-center gap-1.5 text-[9px] text-gray-500"><span className="w-3 h-3 rounded bg-amber-400" /> Blocked (some)</span>
          )}
          <span className="flex items-center gap-1.5 text-[9px] text-gray-500"><span className="w-3 h-3 rounded bg-magenta" /> Booked</span>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-3">Tap available dates to block. Tap blocked dates to unblock.</p>
      </div>

      {/* Block sheet — choose listings */}
      {blockSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setBlockSheet(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">Block {blockSheet}</p>
            <p className="text-[11px] text-gray-400 mb-4">Choose which listings to block for this date.</p>

            {/* All listings toggle */}
            <button
              onClick={() => { setBlockAll(true); setSelectedListingIds([]) }}
              className={`w-full py-2.5 rounded-xl text-[12px] font-medium mb-2 transition-all ${blockAll ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}
            >
              {blockAll && '✓ '}Block all listings
            </button>

            <button
              onClick={() => setBlockAll(false)}
              className={`w-full py-2.5 rounded-xl text-[12px] font-medium mb-3 transition-all ${!blockAll ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}
            >
              {!blockAll && '✓ '}Block specific listings only
            </button>

            {/* Listing selection */}
            {!blockAll && (
              <div className="space-y-1.5 mb-4">
                {vendorListings.map((l) => {
                  const selected = selectedListingIds.includes(l.id)
                  return (
                    <button
                      key={l.id}
                      onClick={() => toggleListingSelect(l.id)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${selected ? 'border-2 border-mustard bg-mustard-light/30' : 'border border-card-border'}`}
                    >
                      {l.photos.length > 0 ? (
                        <img src={l.photos[0]} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-empty-bg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-dark truncate">{l.name}</p>
                        <p className="text-[9px] text-gray-400">{l.style}</p>
                      </div>
                      {selected && <span className="text-mustard text-sm shrink-0">✓</span>}
                    </button>
                  )
                })}
                {vendorListings.length === 0 && (
                  <p className="text-[10px] text-gray-400 text-center py-3">No listings created yet</p>
                )}
              </div>
            )}

            <button
              onClick={confirmBlock}
              disabled={!blockAll && selectedListingIds.length === 0}
              className={`w-full py-2.5 rounded-xl font-semibold text-[13px] ${
                (blockAll || selectedListingIds.length > 0) ? 'bg-mustard text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              Block this date
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
