import { useState } from 'react'
import { Vendor } from '@/lib/types'
import { mockVendors } from '@/lib/mock-data'
import { mockDesigns } from '@/lib/mock-data'
import { formatINR, bgStyle } from '@/lib/helpers'
import VendorPortfolioSheet from './VendorPortfolioSheet'

interface Props {
  vendor: Vendor
  onClose: () => void
  unlocked: boolean
  onSwitchListing?: (id: string) => void
}

// Map vendor ID to gallery folder
const galleryMap: Record<string, { folder: string; count: number }> = {
  venue: { folder: 'venue', count: 8 },
  catering: { folder: 'catering', count: 7 },
  decor: { folder: 'decor', count: 9 },
  photo: { folder: 'photo', count: 8 },
  mehendi: { folder: 'mehendi', count: 8 },
  makeup: { folder: 'makeup', count: 9 },
  dj: { folder: 'dj', count: 9 },
}

function getGalleryImages(vendorId: string): string[] {
  // Determine category from vendor/design ID
  let key = ''
  if (vendorId.includes('venue')) key = 'venue'
  else if (vendorId.includes('catering')) key = 'catering'
  else if (vendorId.includes('decor')) key = 'decor'
  else if (vendorId.includes('photo')) key = 'photo'
  else if (vendorId.includes('mehendi')) key = 'mehendi'
  else if (vendorId.includes('makeup')) key = 'makeup'
  else if (vendorId.includes('dj')) key = 'dj'
  else if (vendorId.includes('pandit')) key = 'decor'
  else if (vendorId.includes('invite')) key = 'decor'

  const info = galleryMap[key]
  if (!info) return []
  return Array.from({ length: Math.min(info.count, 6) }, (_, i) => `/images/gallery/${info.folder}/${i + 1}.jpg`)
}

function getParentVendor(vendorId: string): Vendor | null {
  // If this is a design listing (d-*), find the parent vendor
  const design = mockDesigns.find((d) => d.id === vendorId)
  if (design) {
    return mockVendors[design.vendorId] || null
  }
  return null
}

export default function ListingDetailSheet({ vendor, onClose, unlocked, onSwitchListing }: Props) {
  const [showPortfolio, setShowPortfolio] = useState(false)
  const parentVendor = getParentVendor(vendor.id)
  const gallery = getGalleryImages(vendor.id)
  const likeNames = vendor.likes.map((l) => l.name)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
        <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Hero */}
          <div className="h-44 relative" style={bgStyle(vendor.photo)}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-sm">✕</span>
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white font-bold text-lg">{unlocked ? vendor.name : vendor.code}</p>
              {parentVendor && (
                <p className="text-white/70 text-[10px] mt-0.5">by {unlocked ? parentVendor.name : parentVendor.code}</p>
              )}
            </div>
          </div>

          <div className="p-4">
            {/* Rating + Likes */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="bg-dark/10 text-dark text-[11px] font-medium px-2 py-1 rounded-full">★ {vendor.rating}</span>
              <span className="bg-empty-bg text-gray-500 text-[10px] px-2 py-1 rounded-full">{vendor.style}</span>
              {likeNames.length > 0 && (
                <span className="bg-magenta-light text-magenta text-[10px] px-2 py-1 rounded-full">♥ {vendor.likes.length}</span>
              )}
              {vendor.booked && (
                <span className="bg-green-100 text-green-600 text-[10px] font-semibold px-2 py-1 rounded-full">Booked ✓</span>
              )}
            </div>

            {/* Price */}
            <p className="text-[20px] font-bold text-magenta mb-3">{formatINR(vendor.price)}</p>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Style</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.style}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Area</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.area}</p>
              </div>
              {vendor.capacity && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Capacity</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.capacity} guests</p>
                </div>
              )}
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Package</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.packageTier}</p>
              </div>
            </div>

            {/* Gallery */}
            {gallery.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Gallery</p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {gallery.map((src, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Liked by */}
            {likeNames.length > 0 && (
              <p className="text-[10px] text-gray-400 mb-4">Liked by {likeNames.join(', ')}</p>
            )}

            {/* Vendor Portfolio Button */}
            {parentVendor && (
              <button
                onClick={() => setShowPortfolio(true)}
                className="w-full py-2.5 rounded-xl border border-mustard text-mustard text-[11px] font-semibold mb-3 active:bg-mustard-light transition-colors"
              >
                View Vendor Portfolio
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Portfolio Sheet */}
      {showPortfolio && parentVendor && (
        <VendorPortfolioSheet
          vendor={parentVendor}
          unlocked={unlocked}
          onClose={() => setShowPortfolio(false)}
          onViewListing={(id) => {
            setShowPortfolio(false)
            if (onSwitchListing) onSwitchListing(id)
          }}
        />
      )}
    </>
  )
}
