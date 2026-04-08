import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR } from '@/lib/helpers'

export default function VendorListings() {
  const navigate = useNavigate()
  const { vendorListings, vendorProfile } = useVendorStore()

  return (
    <div className="min-h-dvh bg-white pb-20 page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <p className="text-[14px] font-bold text-dark">My Listings</p>
        <button
          onClick={() => navigate('/vendor/listings/new')}
          className="bg-mustard text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg active:scale-[0.97] transition-transform"
        >
          + Add listing
        </button>
      </div>

      <div className="px-4 mt-3">
        {vendorListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-mustard-light flex items-center justify-center mb-3">
              <span className="text-mustard text-2xl">+</span>
            </div>
            <p className="text-[13px] font-semibold text-dark">No listings yet</p>
            <p className="text-[11px] text-gray-400 mt-1 text-center max-w-[220px]">
              Add your first listing so couples can discover your services.
            </p>
            <button
              onClick={() => navigate('/vendor/listings/new')}
              className="mt-4 bg-mustard text-white text-[12px] font-semibold px-5 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
            >
              Create your first listing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {vendorListings.map((l) => (
              <div key={l.id} className="rounded-xl border border-card-border overflow-hidden bg-white">
                {l.photos.length > 0 ? (
                  <img src={l.photos[0]} alt={l.name} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-empty-bg flex items-center justify-center text-gray-400 text-xs">No photo</div>
                )}
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-dark">{l.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{l.style} · {l.category}</p>
                    </div>
                    <p className="text-[12px] font-bold text-mustard">{formatINR(l.price)}</p>
                  </div>
                  {l.includes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {l.includes.slice(0, 4).map((inc, i) => (
                        <span key={i} className="bg-empty-bg text-[8px] text-gray-500 px-1.5 py-0.5 rounded-full">{inc}</span>
                      ))}
                      {l.includes.length > 4 && <span className="text-[8px] text-gray-400">+{l.includes.length - 4} more</span>}
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/vendor/listings/edit/${l.id}`)}
                    className="mt-2 w-full py-1.5 rounded-lg border border-mustard text-mustard text-[10px] font-medium active:bg-mustard-light transition-colors"
                  >
                    Edit listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
