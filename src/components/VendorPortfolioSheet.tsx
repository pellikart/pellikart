import { Vendor } from '@/lib/types'
import { mockDesigns } from '@/lib/mock-data'
import { formatINR, bgStyle } from '@/lib/helpers'

interface Props {
  vendor: Vendor
  unlocked: boolean
  onClose: () => void
  onViewListing?: (designId: string) => void
  /** In live mode, pass sibling listings directly */
  liveListings?: Vendor[]
}

export default function VendorPortfolioSheet({ vendor, unlocked, onClose, onViewListing, liveListings }: Props) {
  // Find all listings by this vendor
  const vendorListings = liveListings
    ? liveListings.map(v => ({ id: v.id, vendorId: v.id, name: v.name, photo: v.photo, style: v.style, price: v.price, rating: v.rating, description: v.description || '' }))
    : mockDesigns.filter((d) => d.vendorId === vendor.id)

  // Use real data if available, fallback to derived mock values
  const experience = vendor.experience || (5 + Math.floor(vendor.rating * 2) % 8)
  const teamSize = vendor.teamSize || (vendor.price > 200000 ? '5-10' : vendor.price > 100000 ? '2-5' : 'Solo')
  const totalBookings = 20 + Math.floor(vendor.rating * 15)

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-card-border px-4 py-3 flex items-center justify-between z-10">
          <div>
            <p className="text-[14px] font-bold text-dark">{unlocked ? vendor.name : vendor.code}</p>
            <p className="text-[10px] text-gray-400">{vendor.style} · {vendor.area}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-empty-bg flex items-center justify-center">
            <span className="text-gray-500 text-sm">✕</span>
          </button>
        </div>

        <div className="p-4">
          {/* Vendor stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 rounded-xl bg-mustard-light">
              <p className="text-[16px] font-bold text-dark">★ {vendor.rating}</p>
              <p className="text-[8px] text-gray-500">Rating</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-empty-bg">
              <p className="text-[16px] font-bold text-dark">{experience}</p>
              <p className="text-[8px] text-gray-500">Yrs Exp</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-empty-bg">
              <p className="text-[16px] font-bold text-dark">{teamSize}</p>
              <p className="text-[8px] text-gray-500">Team</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-empty-bg">
              <p className="text-[16px] font-bold text-dark">{totalBookings}</p>
              <p className="text-[8px] text-gray-500">Bookings</p>
            </div>
          </div>

          {/* About */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">About</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {vendor.description || (
                `${unlocked ? vendor.name : 'This vendor'} specializes in ${vendor.style.toLowerCase()} wedding services in ${vendor.area}. With ${experience} years of experience and a team of ${teamSize}, they've successfully delivered ${totalBookings}+ events. Known for attention to detail and personalized service.`
              )}
            </p>
          </div>

          {/* Portfolio photos (live mode) */}
          {vendor.portfolioPhotos && vendor.portfolioPhotos.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Portfolio</p>
              <div className="grid grid-cols-3 gap-1.5">
                {vendor.portfolioPhotos.slice(0, 9).map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listings by this vendor */}
          {vendorListings.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">
                Listings ({vendorListings.length})
              </p>
              <div className="space-y-2">
                {vendorListings.map((listing) => (
                  <div key={listing.id} onClick={() => { if (onViewListing) { onClose(); onViewListing(listing.id) } }} className="flex gap-3 p-2.5 rounded-xl border border-card-border cursor-pointer active:bg-empty-bg transition-colors">
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={bgStyle(listing.photo)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-dark truncate">{listing.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{listing.style}</p>
                      <p className="text-[11px] font-bold text-magenta mt-0.5">{formatINR(listing.price)}</p>
                      <p className="text-[9px] text-gray-400">★ {listing.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact info hint */}
          <div className="p-3 rounded-xl bg-empty-bg text-center">
            {unlocked && (vendor.phone || vendor.whatsapp) ? (
              <div className="flex gap-2">
                {vendor.phone && <a href={`tel:${vendor.phone}`} className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-[10px] text-green-600 font-medium">Call</a>}
                {vendor.whatsapp && <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-[10px] text-green-600 font-medium">WhatsApp</a>}
              </div>
            ) : unlocked ? (
              <div className="flex gap-2">
                <a href="tel:+919876543210" className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-[10px] text-green-600 font-medium">Call</a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-lg bg-green-50 border border-green-200 text-[10px] text-green-600 font-medium">WhatsApp</a>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">Subscribe to view contact details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
