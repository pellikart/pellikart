import { useState } from 'react'
import { Vendor } from '@/lib/types'
import { useStore } from '@/lib/store'
import { mockVendors, mockDesigns } from '@/lib/mock-data'
import { formatINR, bgStyle } from '@/lib/helpers'
import VendorPortfolioSheet from './VendorPortfolioSheet'

interface Props {
  vendor: Vendor
  onClose: () => void
  unlocked: boolean
  onSwitchListing?: (id: string) => void
}


export default function ListingDetailSheet({ vendor, onClose, unlocked, onSwitchListing }: Props) {
  const [showPortfolio, setShowPortfolio] = useState(false)
  const { _liveMode, _listingVendorMap, vendors: allVendors } = useStore()

  // In live mode, the vendor object has all the data. In demo mode, look up parent vendor.
  const parentVendor = _liveMode ? null : (() => {
    const design = mockDesigns.find((d) => d.id === vendor.id)
    return design ? mockVendors[design.vendorId] || null : null
  })()

  // In live mode, find sibling listings from the same vendor
  const vendorDbId = _liveMode ? _listingVendorMap[vendor.id] : null
  const siblingListings = _liveMode && vendorDbId
    ? Object.values(allVendors).filter(v => _listingVendorMap[v.id] === vendorDbId)
    : []
  const hasVendorProfile = parentVendor || siblingListings.length > 0

  // Gallery: use only listing photos
  const gallery = (vendor.listingPhotos || []).filter(Boolean)

  const likeNames = vendor.likes.map((l) => l.name)

  // Category-specific fields to display
  const categoryFields = vendor.categoryFields || {}
  const fieldEntries = Object.entries(categoryFields).filter(([, v]) =>
    v && (typeof v === 'string' ? v : v.length > 0)
  )

  // Availability check for couple's event dates
  const { onboardingData } = useStore()
  const eventDates = onboardingData?.eventDates || {}
  const allDates = Object.values(eventDates).filter(Boolean).map(d => d!.start)
  const blockedDates = vendor.blockedDates || []
  const conflictDates = allDates.filter(d => blockedDates.includes(d))
  const isAvailable = conflictDates.length === 0

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
            {/* Rating + Likes + Availability */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="bg-dark/10 text-dark text-[11px] font-medium px-2 py-1 rounded-full">★ {vendor.rating}</span>
              <span className="bg-empty-bg text-gray-500 text-[10px] px-2 py-1 rounded-full">{vendor.style}</span>
              {likeNames.length > 0 && (
                <span className="bg-magenta-light text-magenta text-[10px] px-2 py-1 rounded-full">♥ {vendor.likes.length}</span>
              )}
              {vendor.booked && (
                <span className="bg-green-100 text-green-600 text-[10px] font-semibold px-2 py-1 rounded-full">Booked ✓</span>
              )}
              {_liveMode && allDates.length > 0 && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                  {isAvailable ? 'Available on your dates' : 'Not available'}
                </span>
              )}
            </div>

            {/* Price */}
            <p className="text-[20px] font-bold text-magenta mb-3">{formatINR(vendor.price)}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Style</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.style}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Area</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.area || 'Hyderabad'}</p>
              </div>
              {vendor.capacity && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Capacity</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.capacity} guests</p>
                </div>
              )}
              {vendor.experience && vendor.experience > 0 && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Experience</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.experience} years</p>
                </div>
              )}
              {vendor.teamSize && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Team Size</p>
                  <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.teamSize}</p>
                </div>
              )}
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">Package</p>
                <p className="text-[12px] font-medium text-dark mt-0.5">{vendor.packageTier || '—'}</p>
              </div>
            </div>

            {/* Description */}
            {vendor.description && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1">About</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{vendor.description}</p>
              </div>
            )}

            {/* Category-Specific Details */}
            {fieldEntries.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Details</p>
                <div className="flex flex-wrap gap-1.5">
                  {fieldEntries.map(([key, val]) => {
                    const values = typeof val === 'string' ? [val] : val
                    return values.map((v, i) => (
                      <span key={`${key}-${i}`} className="bg-mustard-light text-mustard text-[9px] font-medium px-2 py-1 rounded-full">{v}</span>
                    ))
                  })}
                </div>
              </div>
            )}

            {/* Includes */}
            {vendor.includes && vendor.includes.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">What's Included</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.includes.map((item, i) => (
                    <span key={i} className="bg-empty-bg text-gray-600 text-[9px] px-2 py-1 rounded-full">{item}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Details (behind paywall) */}
            {unlocked && (vendor.phone || vendor.whatsapp || vendor.email) && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Contact</p>
                {vendor.phone && <p className="text-[11px] text-gray-700">Phone: {vendor.phone}</p>}
                {vendor.whatsapp && <p className="text-[11px] text-gray-700">WhatsApp: {vendor.whatsapp}</p>}
                {vendor.email && <p className="text-[11px] text-gray-700">Email: {vendor.email}</p>}
              </div>
            )}
            {!unlocked && _liveMode && (
              <div className="mb-4 p-3 rounded-xl bg-magenta-light border border-magenta/10 text-center">
                <p className="text-[10px] text-magenta font-medium">Subscribe to see contact details and vendor name</p>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Gallery</p>
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {gallery.slice(0, 9).map((src, i) => (
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

            {/* View Vendor Portfolio — shows all listings by this vendor */}
            {hasVendorProfile && (
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
      {showPortfolio && (parentVendor || siblingListings.length > 0) && (
        <VendorPortfolioSheet
          vendor={parentVendor || vendor}
          unlocked={unlocked}
          onClose={() => setShowPortfolio(false)}
          onViewListing={(id) => {
            setShowPortfolio(false)
            if (onSwitchListing) onSwitchListing(id)
          }}
          liveListings={siblingListings.length > 0 ? siblingListings : undefined}
        />
      )}
    </>
  )
}
