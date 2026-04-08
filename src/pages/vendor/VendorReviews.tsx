import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'

export default function VendorReviews() {
  const navigate = useNavigate()
  const { vendorReviews, vendorProfile } = useVendorStore()

  const avgRating = vendorReviews.length > 0
    ? (vendorReviews.reduce((s, r) => s + r.rating, 0) / vendorReviews.length).toFixed(1)
    : '0'

  return (
    <div className="min-h-dvh bg-white page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
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
          </div>
        ))}

        {vendorReviews.length === 0 && (
          <p className="text-center text-gray-400 text-xs py-12">No reviews yet</p>
        )}
      </div>
    </div>
  )
}
