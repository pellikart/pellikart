import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR, formatDate } from '@/lib/helpers'
import { getMilestones } from '@/lib/milestones'
import { VendorBooking } from '@/lib/vendor-types'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { vendorProfile, vendorBookings, vendorTrials, vendorBidRequests, vendorEarnings, vendorNotifications, vendorAnalytics } = useVendorStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bookingTab, setBookingTab] = useState<'active' | 'completed' | 'cancelled'>('active')

  const totalEarnings = vendorEarnings.reduce((s, e) => s + e.amount, 0)
  const thisMonth = vendorEarnings.filter((e) => e.date.startsWith('2026-04')).reduce((s, e) => s + e.amount, 0) || vendorEarnings.filter((e) => e.date.startsWith('2026-03')).reduce((s, e) => s + e.amount, 0)
  const pending = vendorBookings.filter((b) => b.status === 'active').reduce((s, b) => s + b.remainingBalance, 0)
  const upcoming = vendorBookings.filter((b) => b.status === 'active').sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  const completed = vendorBookings.filter((b) => b.status === 'completed')
  const cancelled = vendorBookings.filter((b) => b.status === 'cancelled')
  const pendingTrials = vendorTrials.filter((t) => t.status === 'pending').length
  const pendingBids = vendorBidRequests.filter((b) => b.status === 'pending').length
  const unreadNotifs = vendorNotifications.filter((n) => !n.read).length

  return (
    <div className="pb-20 page-enter">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Dashboard</p>
          <p className="text-[14px] font-bold text-dark">{vendorProfile?.businessName}</p>
        </div>
        <button onClick={() => navigate('/vendor/notifications')} className="relative w-9 h-9 rounded-full bg-empty-bg flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadNotifs > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-magenta text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unreadNotifs}</span>
          )}
        </button>
      </div>

      <div className="px-4 mt-3">
        {/* Earnings Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={() => navigate('/vendor/earnings')} className="p-3 rounded-xl bg-mustard-light border border-mustard/20 text-left">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-[14px] font-bold text-dark mt-0.5">{formatINR(totalEarnings)}</p>
          </button>
          <button onClick={() => navigate('/vendor/earnings')} className="p-3 rounded-xl bg-empty-bg border border-card-border text-left">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider">This month</p>
            <p className="text-[14px] font-bold text-dark mt-0.5">{formatINR(thisMonth)}</p>
          </button>
          <button onClick={() => navigate('/vendor/earnings')} className="p-3 rounded-xl bg-empty-bg border border-card-border text-left">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-[14px] font-bold text-mustard mt-0.5">{formatINR(pending)}</p>
          </button>
        </div>

        {/* Pending Actions */}
        {(pendingTrials > 0 || pendingBids > 0) && (
          <div className="mb-4 p-3 rounded-xl bg-magenta-light border border-magenta/20">
            <p className="text-[10px] font-semibold text-dark mb-2">Pending Actions</p>
            <div className="flex gap-2">
              {pendingTrials > 0 && (
                <button onClick={() => navigate('/vendor/trials')} className="flex-1 py-2 rounded-lg bg-white text-[10px] font-medium text-dark text-center">
                  {pendingTrials} trial request{pendingTrials > 1 ? 's' : ''}
                </button>
              )}
              {pendingBids > 0 && (
                <button onClick={() => navigate('/vendor/bids')} className="flex-1 py-2 rounded-lg bg-white text-[10px] font-medium text-dark text-center">
                  {pendingBids} bid request{pendingBids > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bookings */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-dark mb-2">Bookings</p>
          <div className="flex gap-2 mb-3">
            {(['active', 'completed', 'cancelled'] as const).map((t) => {
              const count = vendorBookings.filter((b) => b.status === t).length
              return (
                <button
                  key={t} onClick={() => setBookingTab(t)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${bookingTab === t ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-500'}`}
                >
                  {t === 'active' ? 'Upcoming' : t === 'completed' ? 'Completed' : 'Cancelled'} ({count})
                </button>
              )
            })}
          </div>
          {vendorBookings.filter((b) => b.status === bookingTab).length === 0 ? (
            <p className="text-center text-gray-400 text-xs py-6">No {bookingTab} bookings</p>
          ) : (
            vendorBookings.filter((b) => b.status === bookingTab).map((b) => (
              <DashboardBookingCard
                key={b.id}
                booking={b}
                expanded={expandedId === b.id}
                onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
              />
            ))
          )}
        </div>

        {/* Quick Stats */}
        <div>
          <p className="text-[11px] font-semibold text-dark mb-2">This Week</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-empty-bg text-center">
              <p className="text-[16px] font-bold text-dark">{vendorAnalytics.profileViews}</p>
              <p className="text-[8px] text-gray-400 mt-0.5">Profile views</p>
            </div>
            <div className="p-2.5 rounded-xl bg-empty-bg text-center">
              <p className="text-[16px] font-bold text-dark">{vendorAnalytics.shortlistCount}</p>
              <p className="text-[8px] text-gray-400 mt-0.5">Shortlists</p>
            </div>
            <div className="p-2.5 rounded-xl bg-empty-bg text-center">
              <p className="text-[16px] font-bold text-dark">{vendorAnalytics.conversionRate}%</p>
              <p className="text-[8px] text-gray-400 mt-0.5">Conversion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardBookingCard({ booking: b, expanded, onToggle }: { booking: VendorBooking; expanded: boolean; onToggle: () => void }) {
  const milestones = getMilestones(b.category)

  return (
    <div className="mb-2 rounded-xl border border-card-border bg-white overflow-hidden">
      <button onClick={onToggle} className="w-full p-3 text-left">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-dark">{b.coupleNames}</p>
          <span className="text-[9px] text-gray-400">{new Date(b.eventDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
        </div>
        <p className="text-[10px] text-gray-500">{b.eventName} · {b.packageTier}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-bold text-dark">{formatINR(b.totalValue)}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-mustard rounded-full" style={{ width: `${(b.milestoneProgress / b.totalMilestones) * 100}%` }} />
            </div>
            <span className="text-[8px] text-gray-400">{b.milestoneProgress}/{b.totalMilestones}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-card-border/50 pt-2">
          {/* Contact */}
          <div className="flex gap-2 mb-3">
            <a href={`tel:${b.phone}`} className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-center text-[10px] text-green-600 font-medium">
              Call couple
            </a>
            <a href={`https://wa.me/${b.whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-center text-[10px] text-green-600 font-medium">
              WhatsApp
            </a>
          </div>

          {/* Payment */}
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

          {/* Milestones */}
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
        </div>
      )}
    </div>
  )
}
