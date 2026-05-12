import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'

export default function VendorReviews() {
  const navigate = useNavigate()
  const { vendorReviews, vendorProfile, respondToReview } = useVendorStore()
  const [respondId, setRespondId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  const avgRating = vendorReviews.length > 0
    ? (vendorReviews.reduce((s, r) => s + r.rating, 0) / vendorReviews.length).toFixed(1)
    : '0'

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <p className="text-[14px] font-bold text-dark">Reviews</p>
      </div>

      <div className="px-4 mt-3">
        {/* Rating summary */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-mustard-light border border-mustard/20 mb-4">
          <div className="text-center">
            <p className="text-[28px] font-bold text-dark">{avgRating}</p>
            <p className="text-[10px] text-gray-500">out of 5</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`text-[14px] ${s <= Math.round(Number(avgRating)) ? 'text-mustard' : 'text-gray-300'}`}>★</span>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5">{vendorReviews.length} verified reviews</p>
          </div>
        </div>

        {/* Review list */}
        {vendorReviews.map((r) => (
          <div key={r.id} className="py-3 border-b border-card-border/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[12px] font-semibold text-dark">{r.coupleNames}</p>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-[10px] ${s <= r.rating ? 'text-mustard' : 'text-gray-300'}`}>★</span>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-gray-400">{r.eventName} · {new Date(r.eventDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
            <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">{r.text}</p>
            <p className="text-[9px] text-gray-400 mt-1.5">Posted {new Date(r.datePosted + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>

            {r.vendorResponse ? (
              <div className="mt-2 pl-3 border-l-2 border-mustard/40 bg-mustard-light/20 py-2 pr-2 rounded-r-lg">
                <p className="text-[10px] font-semibold text-mustard mb-0.5">Your response</p>
                <p className="text-[11px] text-gray-700">{r.vendorResponse}</p>
                <button
                  onClick={() => { setRespondId(r.id); setResponseText(r.vendorResponse || '') }}
                  className="text-[9px] text-mustard font-medium mt-1 active:opacity-70"
                >
                  Edit response
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setRespondId(r.id); setResponseText('') }}
                className="mt-2 text-[10px] text-mustard font-medium active:opacity-70"
              >
                + Add response
              </button>
            )}
          </div>
        ))}

        {vendorReviews.length === 0 && (
          <p className="text-center text-gray-400 text-xs py-12">No reviews yet</p>
        )}
      </div>

      {/* Respond modal */}
      {respondId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setRespondId(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-1">Respond to review</p>
            <p className="text-[11px] text-gray-400 mb-4">Your response will be visible publicly under the review.</p>

            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank you for your kind words..."
              rows={4} maxLength={500}
              className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard resize-none"
            />
            <p className="text-[9px] text-gray-400 mt-1 text-right">{responseText.length}/500</p>

            <div className="flex gap-2 mt-3">
              <button onClick={() => setRespondId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-[12px] font-medium">Cancel</button>
              <button
                onClick={() => { respondToReview(respondId, responseText.trim()); setRespondId(null) }}
                disabled={!responseText.trim()}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold ${responseText.trim() ? 'bg-mustard text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                Post response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
