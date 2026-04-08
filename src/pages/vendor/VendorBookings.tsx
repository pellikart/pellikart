import { useState } from 'react'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR, formatDate } from '@/lib/helpers'
import { getMilestones } from '@/lib/milestones'
import { VendorBooking } from '@/lib/vendor-types'

export default function VendorBookings() {
  const { vendorBookings } = useVendorStore()
  const [tab, setTab] = useState<'active' | 'completed' | 'cancelled'>('active')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = vendorBookings.filter((b) => b.status === tab)

  return (
    <div className="pb-20 page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border sticky top-0 z-20">
        <p className="text-[14px] font-bold text-dark">Bookings</p>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-3 flex gap-2">
        {(['active', 'completed', 'cancelled'] as const).map((t) => {
          const count = vendorBookings.filter((b) => b.status === t).length
          return (
            <button
              key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${tab === t ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-500'}`}
            >
              {t === 'active' ? 'Upcoming' : t === 'completed' ? 'Completed' : 'Cancelled'} ({count})
            </button>
          )
        })}
      </div>

      {/* Booking List */}
      <div className="px-4 mt-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-12">No {tab} bookings</p>
        ) : (
          filtered.map((b) => (
            <BookingCard
              key={b.id} booking={b}
              expanded={expandedId === b.id}
              onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function BookingCard({ booking: b, expanded, onToggle }: { booking: VendorBooking; expanded: boolean; onToggle: () => void }) {
  const milestones = getMilestones(b.category)

  return (
    <div className="mb-3 rounded-xl border border-card-border bg-white overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 text-left">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-dark">{b.coupleNames}</p>
          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
            b.status === 'active' ? 'bg-mustard-light text-mustard' :
            b.status === 'completed' ? 'bg-green-100 text-green-600' :
            'bg-red-100 text-red-500'
          }`}>
            {b.status === 'active' ? 'Upcoming' : b.status === 'completed' ? 'Completed' : 'Cancelled'}
          </span>
        </div>
        <p className="text-[10px] text-gray-500">{b.eventName} · {formatDate(b.eventDate)} · {b.packageTier}</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-[11px] font-bold text-dark">{formatINR(b.totalValue)}</span>
            <span className="text-[9px] text-gray-400 ml-1.5">{formatINR(b.totalPaid)} paid</span>
          </div>
          {b.status === 'active' && (
            <div className="flex items-center gap-1.5">
              <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-mustard rounded-full" style={{ width: `${(b.milestoneProgress / b.totalMilestones) * 100}%` }} />
              </div>
              <span className="text-[8px] text-gray-400">{b.milestoneProgress}/{b.totalMilestones}</span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-card-border/50 pt-2">
          {/* Contact */}
          {b.status === 'active' && (
            <div className="flex gap-2 mb-3">
              <a href={`tel:${b.phone}`} className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-center text-[10px] text-green-600 font-medium">
                Call couple
              </a>
              <a href={`https://wa.me/${b.whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-center text-[10px] text-green-600 font-medium">
                WhatsApp
              </a>
            </div>
          )}

          {/* Payment breakdown */}
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment</p>
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-500">Slot amount</span>
            <span className="text-dark font-medium">{formatINR(b.slotAmountPaid)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-500">Total paid</span>
            <span className="text-dark font-medium">{formatINR(b.totalPaid)}</span>
          </div>
          {b.remainingBalance > 0 && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gray-500">Remaining</span>
              <span className="text-mustard font-bold">{formatINR(b.remainingBalance)}</span>
            </div>
          )}

          {/* Milestone timeline */}
          {b.status !== 'cancelled' && (
            <div className="mt-3">
              <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Milestones</p>
              {milestones.map((m, i) => {
                const isDone = i < b.milestoneProgress
                const isCurrent = i === b.milestoneProgress
                return (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${isDone ? 'bg-mustard' : isCurrent ? 'border-2 border-mustard' : 'border border-gray-200'}`} />
                    <p className={`text-[10px] ${isDone ? 'text-mustard font-medium' : isCurrent ? 'text-dark font-medium' : 'text-gray-300'}`}>{m.label}</p>
                  </div>
                )
              })}
            </div>
          )}

          {b.status === 'cancelled' && (
            <p className="mt-2 text-[10px] text-red-400">Slot amount of {formatINR(b.slotAmountPaid)} forfeited to you.</p>
          )}
        </div>
      )}
    </div>
  )
}
