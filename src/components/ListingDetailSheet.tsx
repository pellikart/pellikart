import { useState } from 'react'
import { Vendor } from '@/lib/types'
import { useStore } from '@/lib/store'
import { mockVendors, mockDesigns } from '@/lib/mock-data'
import { formatINR, bgStyle, getEffectivePrice } from '@/lib/helpers'
import { getListingConfig } from '@/lib/vendor-category-config'
import { buildBundleEntries } from '@/lib/bundle'
import VendorPortfolioSheet from './VendorPortfolioSheet'
import MenuPicker from './MenuPicker'

interface Props {
  vendor: Vendor
  onClose: () => void
  unlocked: boolean
  onSwitchListing?: (id: string) => void
  ritualId?: string
  categoryId?: string
  selectedTierHours?: number
}


export default function ListingDetailSheet({ vendor, onClose, unlocked, onSwitchListing, ritualId, categoryId, selectedTierHours }: Props) {
  const [showPortfolio, setShowPortfolio] = useState(false)
  const { _liveMode, _listingVendorMap, vendors: allVendors, selectVendorTier } = useStore()
  // Local mock-up state: how many of each paid room the couple is interested in.
  // Not persisted — only here to visualize the inventory cap + a separate subtotal.
  const [roomSelections, setRoomSelections] = useState<Record<string, number>>({})
  const [roomsExpanded, setRoomsExpanded] = useState(false)

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
  const videos = (vendor.listingVideos || []).filter(Boolean)

  const likeNames = vendor.likes.map((l) => l.name)

  // Category-specific fields to display, paired with proper labels from the listing config.
  const categoryFields = vendor.categoryFields || {}
  // Fall back to parsing the category from vendor.code ("Decor 001" → "Decor") for mock
  // data entries that don't carry an explicit category field.
  const derivedCategory = vendor.category || vendor.code?.split(' ')[0]
  const labeledFields: { label: string; value: string }[] = (() => {
    const config = derivedCategory ? getListingConfig(derivedCategory) : null
    if (!config) return []
    const out: { label: string; value: string }[] = []
    for (const step of config.steps) {
      for (const field of step.fields) {
        const raw = categoryFields[field.key]
        if (raw === undefined || raw === null || raw === '') continue
        if (Array.isArray(raw) && raw.length === 0) continue
        let display: string
        if (Array.isArray(raw)) {
          display = raw.join(', ')
        } else if (field.type === 'slider' && field.sliderUnit) {
          display = `${raw} ${field.sliderUnit}`
        } else if (field.type === 'number' && field.numberUnit) {
          display = `${raw} ${field.numberUnit}`
        } else {
          display = raw
        }
        out.push({ label: field.label, value: display })
      }
    }
    return out
  })()

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
            <p className="text-[20px] font-bold text-magenta">{formatINR(getEffectivePrice(vendor, selectedTierHours))}</p>
            {vendor.hourlyPricing && vendor.hourlyPricing.length > 0 && (
              <p className="text-[10px] text-gray-400 mb-3">
                {selectedTierHours ? `For ${selectedTierHours} hr rental` : `Default rate`}
              </p>
            )}
            {!vendor.hourlyPricing?.length && <div className="mb-3" />}

            {/* Hourly tier picker — only when vendor has tiers */}
            {vendor.hourlyPricing && vendor.hourlyPricing.length > 0 && ritualId && categoryId && (
              <div className="mb-4 p-2.5 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Pick rental duration</p>
                <div className="flex flex-col gap-1.5">
                  {vendor.hourlyPricing.map((tier) => {
                    const isSelected = selectedTierHours === tier.hours
                    return (
                      <button
                        key={tier.hours}
                        onClick={() => selectVendorTier(ritualId, categoryId, tier.hours)}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${isSelected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-mustard' : 'border-gray-300'}`}>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-mustard" />}
                          </span>
                          <span className="text-[12px] font-medium text-dark">{tier.hours} hr rental</span>
                        </span>
                        <span className="text-[12px] font-semibold text-magenta">{formatINR(tier.price)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

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

            {/* Mandatory bundle prices — for venues that require in-house catering/decor */}
            {vendor.category === 'Venue' && vendor.bundleMandatory && vendor.bundledListings && vendor.bundledListings.length > 0 && (() => {
              const bundles = buildBundleEntries(vendor.bundledListings, allVendors)
              if (bundles.length === 0) return null
              const venuePrice = getEffectivePrice(vendor, selectedTierHours)
              const bundleTotal = bundles.reduce((s, b) => s + b.price, 0)
              return (
                <div className="mb-4 p-3 rounded-xl bg-magenta-light/40 border border-magenta/20">
                  <p className="text-[11px] font-semibold text-dark">Required add-ons</p>
                  <p className="text-[10px] text-gray-600 mb-2">This venue mandates the following in-house services. They're added automatically when you select the venue.</p>
                  <div className="space-y-1.5 mb-2">
                    {bundles.map(b => (
                      <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-dark truncate">{b.name}</p>
                          <p className="text-[9px] text-gray-400">{b.category}</p>
                        </div>
                        <p className="text-[11px] font-semibold text-magenta shrink-0">{formatINR(b.price)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-magenta/20 space-y-0.5">
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Venue</span><span>{formatINR(venuePrice)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Required add-ons</span><span>{formatINR(bundleTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[12px] font-bold text-dark pt-1">
                      <span>Total commitment</span><span className="text-magenta">{formatINR(venuePrice + bundleTotal)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Rituals / events this listing is suitable for */}
            {vendor.rituals && vendor.rituals.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Good for</p>
                <div className="flex flex-wrap gap-1.5">
                  {vendor.rituals.map((r, i) => (
                    <span key={i} className="bg-magenta-light text-magenta text-[9px] font-medium px-2 py-1 rounded-full">{r}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Category-Specific Details — labeled */}
            {labeledFields.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Details</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-card-border p-3">
                  {labeledFields.map((f, i) => (
                    <div key={i}>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{f.label}</p>
                      <p className="text-[11px] font-medium text-dark mt-0.5">{f.value}</p>
                    </div>
                  ))}
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

            {/* Videos */}
            {videos.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Videos</p>
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {videos.slice(0, 6).map((src, i) => (
                    <video
                      key={i}
                      src={src}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full aspect-video rounded-lg bg-black object-cover"
                    />
                  ))}
                </div>
              </>
            )}

            {/* Catering menu — interactive picker per section */}
            {vendor.menu && vendor.menu.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Menu</p>
                <MenuPicker menu={vendor.menu} />
              </div>
            )}

            {/* Paid rooms (Venue) — collapsible interactive mock-up */}
            {vendor.paidRooms && vendor.paidRooms.length > 0 && (() => {
              const roomsSubtotal = vendor.paidRooms.reduce((sum, r) => sum + (roomSelections[r.id] || 0) * r.price, 0)
              const totalRoomCount = vendor.paidRooms.reduce((sum, r) => sum + r.count, 0)
              const pickedCount = Object.values(roomSelections).reduce((s, n) => s + n, 0)
              return (
                <div className="mb-4 rounded-xl border border-card-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRoomsExpanded(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 active:bg-empty-bg"
                  >
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-dark">Rooms available</p>
                      <p className="text-[10px] text-gray-500">
                        {vendor.paidRooms.length} {vendor.paidRooms.length === 1 ? 'option' : 'options'} · {totalRoomCount} total {totalRoomCount === 1 ? 'room' : 'rooms'}
                        {pickedCount > 0 && <span className="text-magenta font-medium"> · {pickedCount} picked</span>}
                      </p>
                    </div>
                    <span className={`text-dark text-[12px] transition-transform ${roomsExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {roomsExpanded && (<>
                  <p className="text-[9px] text-gray-400 italic px-3 pb-2">Charged separately — not included in venue price.</p>
                  <div className="space-y-2 px-3 pb-3 border-t border-card-border pt-2">
                    {vendor.paidRooms.map((room) => {
                      const picked = roomSelections[room.id] || 0
                      const atMax = picked >= room.count
                      const atMin = picked <= 0
                      return (
                        <div key={room.id} className="rounded-xl border border-card-border overflow-hidden">
                          {room.photos.length > 0 && (
                            <div className="flex gap-1 overflow-x-auto">
                              {room.photos.slice(0, 6).map((p, i) => (
                                <img key={i} src={p} alt="" className="h-20 w-28 object-cover flex-shrink-0" />
                              ))}
                            </div>
                          )}
                          <div className="p-2.5">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="text-[12px] font-semibold text-dark">{room.sharing} sharing</p>
                                <p className="text-[10px] text-gray-500">{room.count} {room.count === 1 ? 'room' : 'rooms'} available</p>
                              </div>
                              <p className="text-[12px] font-bold text-magenta">{formatINR(room.price)}</p>
                            </div>
                            {room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {room.amenities.map((a, i) => (
                                  <span key={i} className="bg-empty-bg text-[9px] text-gray-600 px-1.5 py-0.5 rounded-full">{a}</span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-card-border/50">
                              <span className="text-[10px] text-gray-500">How many?</span>
                              <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => setRoomSelections(prev => ({ ...prev, [room.id]: Math.max(0, picked - 1) }))}
                                  disabled={atMin}
                                  className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                                >−</button>
                                <span className="w-10 flex items-center justify-center text-[12px] font-semibold text-dark">{picked}</span>
                                <button
                                  type="button"
                                  onClick={() => setRoomSelections(prev => ({ ...prev, [room.id]: Math.min(room.count, picked + 1) }))}
                                  disabled={atMax}
                                  className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                                >+</button>
                              </div>
                            </div>
                            {atMax && <p className="text-[9px] text-mustard mt-1 text-right">Max available</p>}
                            {picked > 0 && (
                              <p className="text-[10px] text-gray-500 mt-1 text-right">
                                {formatINR(room.price)} × {picked} = <span className="font-semibold text-dark">{formatINR(room.price * picked)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {roomsSubtotal > 0 && (
                    <div className="mx-3 mb-3 p-2.5 rounded-xl bg-mustard-light/40 border border-mustard/30 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-dark">Rooms subtotal</span>
                      <span className="text-[14px] font-bold text-magenta">{formatINR(roomsSubtotal)}</span>
                    </div>
                  )}
                  </>)}
                </div>
              )
            })()}

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
