import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR } from '@/lib/helpers'

export default function VendorEarnings() {
  const navigate = useNavigate()
  const { vendorEarnings, vendorBookings } = useVendorStore()

  const totalEarnings = vendorEarnings.reduce((s, e) => s + e.amount, 0)
  const pending = vendorBookings.filter((b) => b.status === 'active').reduce((s, b) => s + b.remainingBalance, 0)
  const sorted = [...vendorEarnings].sort((a, b) => b.date.localeCompare(a.date))

  const typeLabel: Record<string, string> = { slot: 'Slot booking', milestone: 'Milestone payment', final: 'Final payment' }

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <p className="text-[14px] font-bold text-dark">Earnings</p>
      </div>

      <div className="px-4 mt-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-mustard-light border border-mustard/20">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total received</p>
            <p className="text-[18px] font-bold text-dark mt-0.5">{formatINR(totalEarnings)}</p>
          </div>
          <div className="p-3 rounded-xl bg-empty-bg border border-card-border">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">Pending</p>
            <p className="text-[18px] font-bold text-mustard mt-0.5">{formatINR(pending)}</p>
          </div>
        </div>

        {/* Transaction history */}
        <p className="text-[11px] font-semibold text-dark mb-2">Transaction History</p>
        {sorted.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-card-border/50">
            <div>
              <p className="text-[11px] font-medium text-dark">{t.coupleNames}</p>
              <p className="text-[9px] text-gray-400">{t.eventName} · {typeLabel[t.type]}</p>
              <p className="text-[9px] text-gray-400">{new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <span className="text-[12px] font-bold text-green-600">+{formatINR(t.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
