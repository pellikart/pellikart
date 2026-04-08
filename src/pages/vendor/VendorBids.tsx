import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR } from '@/lib/helpers'

export default function VendorBids() {
  const navigate = useNavigate()
  const { vendorBidRequests, submitBid } = useVendorStore()
  const [bidId, setBidId] = useState<string | null>(null)
  const [bidPrice, setBidPrice] = useState('')
  const [bidNote, setBidNote] = useState('')

  const pending = vendorBidRequests.filter((b) => b.status === 'pending')
  const submitted = vendorBidRequests.filter((b) => b.status === 'submitted')
  const resolved = vendorBidRequests.filter((b) => b.status === 'selected' || b.status === 'not_selected')

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <p className="text-[14px] font-bold text-dark">Custom Design Bids</p>
      </div>

      <div className="px-4 mt-3">
        {pending.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-magenta uppercase tracking-wider mb-2">New Requests ({pending.length})</p>
            {pending.map((b) => (
              <div key={b.id} className="rounded-xl border-2 border-magenta/20 bg-magenta-light/10 mb-2 overflow-hidden">
                <img src={b.uploadedImage} alt="Custom design" className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="text-[12px] font-semibold text-dark">{b.coupleNames}</p>
                  <p className="text-[10px] text-gray-500">{b.eventName} · {b.category}</p>
                  <button onClick={() => { setBidId(b.id); setBidPrice(''); setBidNote('') }} className="mt-2 w-full py-2 rounded-lg bg-mustard text-white text-[10px] font-semibold active:scale-[0.97] transition-transform">
                    Submit a bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {submitted.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-mustard uppercase tracking-wider mb-2">Bids Submitted ({submitted.length})</p>
            {submitted.map((b) => (
              <div key={b.id} className="p-3 rounded-xl border border-card-border mb-2">
                <div className="flex gap-3">
                  <img src={b.uploadedImage} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-dark">{b.coupleNames}</p>
                    <p className="text-[10px] text-gray-500">{b.eventName} · {b.category}</p>
                    <p className="text-[11px] font-bold text-mustard mt-1">{formatINR(b.bidPrice!)}</p>
                    <p className="text-[9px] text-gray-400">{b.bidNote}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {resolved.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Resolved ({resolved.length})</p>
            {resolved.map((b) => (
              <div key={b.id} className="p-3 rounded-xl border border-card-border mb-2 opacity-60">
                <p className="text-[11px] text-dark">{b.coupleNames} · {b.eventName}</p>
                <span className={`inline-block mt-1 text-[9px] font-medium px-2 py-0.5 rounded-full ${b.status === 'selected' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {b.status === 'selected' ? 'You were selected!' : 'Not selected'}
                </span>
              </div>
            ))}
          </div>
        )}

        {vendorBidRequests.length === 0 && (
          <p className="text-center text-gray-400 text-xs py-12">No custom design requests yet</p>
        )}
      </div>

      {/* Bid form modal */}
      {bidId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setBidId(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-3">Submit your bid</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Your price (₹)</label>
                <input type="number" value={bidPrice} onChange={(e) => setBidPrice(e.target.value)} placeholder="e.g. 280000" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Feasibility note</label>
                <textarea value={bidNote} onChange={(e) => setBidNote(e.target.value)} placeholder="e.g. Can do this exact design, Can create similar with premium materials..." rows={3} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard resize-none" />
              </div>
            </div>
            <button
              onClick={() => { if (bidPrice) { submitBid(bidId, parseInt(bidPrice), bidNote); setBidId(null) } }}
              disabled={!bidPrice}
              className={`mt-4 w-full py-2.5 rounded-xl font-semibold text-[13px] ${bidPrice ? 'bg-mustard text-white' : 'bg-gray-200 text-gray-400'}`}
            >
              Submit bid
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
