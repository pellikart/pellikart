import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorListing } from '@/lib/vendor-types'
import { formatINR } from '@/lib/helpers'

const STYLE_OPTIONS: Record<string, string[]> = {
  Venue: ['Royal Heritage', 'Garden Party', 'Modern Rooftop', 'Rustic Farmhouse', 'Beachside', 'Palace', 'Boutique Hotel'],
  Decor: ['Floral Luxury', 'Modern Minimalist', 'Traditional', 'Rustic', 'Royal Heritage', 'Bohemian', 'Temple Traditional'],
  Photography: ['Candid + Cinematic', 'Traditional + Posed', 'Documentary', 'Fine Art', 'Photojournalistic'],
  Catering: ['North Indian', 'South Indian', 'Multi-Cuisine', 'Rajasthani', 'Mughlai', 'Continental', 'Fusion'],
  Makeup: ['HD Airbrush', 'Natural Glam', 'Traditional', 'Bridal Heavy', 'Minimalist'],
  Mehendi: ['Rajasthani Bridal', 'Arabic Fusion', 'Contemporary', 'Traditional', 'Indo-Arabic'],
  'DJ / Music': ['Bollywood + EDM', 'Sufi + Bollywood', 'Classical Fusion', 'Live Band', 'International'],
  Pandit: ['Vedic Rituals', 'South Indian', 'Bengali', 'Marwari', 'Multi-tradition'],
  Invitations: ['Luxury Boxed', 'Digital Only', 'Eco-Friendly', 'Traditional Print', 'Designer'],
}

const INCLUDE_OPTIONS: Record<string, string[]> = {
  Venue: ['AC Hall', 'Parking', 'Valet', 'Bridal Suite', 'Guest Rooms', 'Sound System', 'In-house Catering', 'Generator Backup', 'Lawn Area', 'Pool Access'],
  Decor: ['Stage Setup', 'Mandap', 'Flower Arrangements', 'LED Lighting', 'Drapes & Fabrics', 'Table Centerpieces', 'Entrance Decor', 'Photo Booth', 'Ceiling Decor', 'Aisle Decor'],
  Photography: ['Candid Photos', 'Traditional Photos', 'Drone Shots', 'Pre-Wedding Shoot', 'Album', 'Highlight Reel', 'Full Video', 'Photo Booth', 'Same-Day Edit', 'USB Drive'],
  Catering: ['Welcome Drinks', 'Starters', 'Main Course', 'Desserts', 'Live Counters', 'Chaat Station', 'Ice Cream Bar', 'Paan Counter', 'Crockery & Cutlery', 'Service Staff'],
  Makeup: ['Bridal Makeup', 'Engagement Look', 'Reception Look', 'Hair Styling', 'Draping', 'Touch-Up Kit', 'False Lashes', 'Nail Art', 'Family Makeup', 'Pre-Bridal Facial'],
  Mehendi: ['Bridal Full Hands', 'Bridal Full Feet', 'Guest Mehendi', 'Baby Shower Design', 'Groom Mehendi', 'Touch-Up', 'Glitter Add-On', 'White Mehendi'],
  'DJ / Music': ['Sound System', 'DJ Console', 'LED Lights', 'Fog Machine', 'Dance Floor', 'Emcee', 'Live Dhol', 'Karaoke', 'Wireless Mics', 'Subwoofer'],
  Pandit: ['Full Ceremony', 'Havan Setup', 'Muhurat Consultation', 'Ganesh Puja', 'Samagri Included', 'Multi-Language', 'Varmala Ceremony', 'Vidai Rituals'],
  Invitations: ['Design', 'Printing', 'Box Packaging', 'Digital Version', 'RSVP Tracking', 'Envelope', 'Wax Seal', 'Ribbon', 'Sweet Box', 'Delivery'],
}

export default function VendorAddListing() {
  const navigate = useNavigate()
  const { vendorProfile, addListing } = useVendorStore()
  const category = vendorProfile?.category || 'Photography'

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState(100000)
  const [capacity, setCapacity] = useState(500)
  const [coverageHours, setCoverageHours] = useState(8)
  const [guestCount, setGuestCount] = useState(200)
  const [includes, setIncludes] = useState<string[]>([])

  const styles = STYLE_OPTIONS[category] || STYLE_OPTIONS['Photography']
  const includeOptions = INCLUDE_OPTIONS[category] || INCLUDE_OPTIONS['Photography']

  const totalSteps = 4

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((f) => URL.createObjectURL(f))
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
    }
  }

  function toggleInclude(item: string) {
    setIncludes((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item])
  }

  function handlePublish() {
    const listing: VendorListing = {
      id: `vl-${Date.now()}`,
      name: name || `${category} Listing`,
      photos,
      category,
      price,
      style,
      capacity: ['Venue', 'Catering'].includes(category) ? capacity : undefined,
      coverageHours: ['Photography', 'DJ / Music'].includes(category) ? coverageHours : undefined,
      guestCount: ['Mehendi', 'Makeup'].includes(category) ? guestCount : undefined,
      includes,
      createdAt: new Date().toISOString().split('T')[0],
    }
    addListing(listing)
    navigate('/vendor/listings')
  }

  // Price range per category
  const priceRange: Record<string, { min: number; max: number; step: number }> = {
    Venue: { min: 100000, max: 2000000, step: 50000 },
    Catering: { min: 50000, max: 1000000, step: 25000 },
    Photography: { min: 30000, max: 500000, step: 10000 },
    Decor: { min: 50000, max: 800000, step: 25000 },
    Makeup: { min: 10000, max: 200000, step: 5000 },
    Mehendi: { min: 5000, max: 100000, step: 2500 },
    'DJ / Music': { min: 20000, max: 300000, step: 5000 },
    Pandit: { min: 5000, max: 100000, step: 2500 },
    Invitations: { min: 10000, max: 300000, step: 5000 },
  }
  const pr = priceRange[category] || priceRange['Photography']

  return (
    <div className="min-h-dvh bg-white page-enter flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendor/listings')} className="text-sm">←</button>
          <p className="text-[14px] font-bold text-dark">New Listing</p>
        </div>
        <span className="text-[10px] text-gray-400">Step {step}/{totalSteps}</span>
      </div>

      {/* Progress */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-mustard transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto">

        {/* Step 1: Photos & Name */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">What do you want to list?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Add photos and a name for your {category.toLowerCase()} listing.</p>

            {/* Photo upload */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((p, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-mustard text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">COVER</span>}
                </div>
              ))}
              {photos.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-[8px] text-gray-400 mt-1">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="text-[11px] font-medium text-dark block mb-1.5">Listing name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={category === 'Venue' ? 'e.g. Royal Mughal Night' : category === 'Decor' ? 'e.g. Floral Cascade Mandap' : `e.g. ${category} Package`}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard"
              />
            </div>

            <button onClick={() => setStep(2)} className="mt-6 w-full py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">
              Next
            </button>
          </div>
        )}

        {/* Step 2: Style & Price */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Style & pricing</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Pick a style and set your price.</p>

            {/* Style selector */}
            <label className="text-[11px] font-medium text-dark block mb-2">Style</label>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {styles.map((s) => (
                <button
                  key={s} onClick={() => setStyle(s)}
                  className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${style === s ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 active:bg-mustard-light'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Price slider */}
            <label className="text-[11px] font-medium text-dark block mb-1">Price</label>
            <p className="text-[24px] font-bold text-mustard mb-2">{formatINR(price)}</p>
            <input
              type="range" min={pr.min} max={pr.max} step={pr.step}
              value={price} onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-mustard"
              style={{ background: `linear-gradient(to right, #D4A017 ${((price - pr.min) / (pr.max - pr.min)) * 100}%, #eee ${((price - pr.min) / (pr.max - pr.min)) * 100}%)` }}
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
              <span>{formatINR(pr.min)}</span><span>{formatINR(pr.max)}</span>
            </div>

            {/* Category-specific sliders */}
            {['Venue', 'Catering'].includes(category) && (
              <div className="mt-5">
                <label className="text-[11px] font-medium text-dark block mb-1">Guest capacity</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={50} max={2000} step={50}
                    value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-mustard"
                    style={{ background: `linear-gradient(to right, #D4A017 ${((capacity - 50) / 1950) * 100}%, #eee ${((capacity - 50) / 1950) * 100}%)` }}
                  />
                  <span className="text-[13px] font-bold text-dark w-16 text-right">{capacity}</span>
                </div>
              </div>
            )}

            {['Photography', 'DJ / Music'].includes(category) && (
              <div className="mt-5">
                <label className="text-[11px] font-medium text-dark block mb-1">Coverage hours</label>
                <div className="flex gap-2">
                  {[4, 6, 8, 10, 12].map((h) => (
                    <button key={h} onClick={() => setCoverageHours(h)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${coverageHours === h ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {['Mehendi', 'Makeup'].includes(category) && (
              <div className="mt-5">
                <label className="text-[11px] font-medium text-dark block mb-1">Covers how many people?</label>
                <div className="flex gap-2">
                  {[1, 5, 10, 15, 20, 30].map((g) => (
                    <button key={g} onClick={() => setGuestCount(g)} className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${guestCount === g ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>
                      {g === 1 ? 'Bride' : g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Step 3: What's included */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">What's included?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Tap everything that's part of this listing.</p>

            <div className="flex flex-wrap gap-2">
              {includeOptions.map((item) => {
                const selected = includes.includes(item)
                return (
                  <button
                    key={item} onClick={() => toggleInclude(item)}
                    className={`py-2 px-3 rounded-xl text-[11px] font-medium transition-all ${selected ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-500'}`}
                  >
                    {selected && <span className="mr-1">✓</span>}{item}
                  </button>
                )
              })}
            </div>

            <p className="text-[9px] text-gray-400 mt-3">{includes.length} selected</p>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Publish */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Review & publish</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Here's how your listing will look to couples.</p>

            {/* Preview card */}
            <div className="rounded-2xl border border-card-border overflow-hidden mb-4">
              {photos.length > 0 ? (
                <img src={photos[0]} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-empty-bg flex items-center justify-center text-gray-400 text-xs">No photo added</div>
              )}
              <div className="p-3">
                <p className="text-[14px] font-bold text-dark">{name || `${category} Listing`}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{style || 'No style selected'} · {vendorProfile?.area}</p>
                <p className="text-[16px] font-bold text-mustard mt-1">{formatINR(price)}</p>

                {/* Details */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Venue', 'Catering'].includes(category) && (
                    <span className="bg-empty-bg text-[9px] text-gray-500 px-2 py-0.5 rounded-full">{capacity} guests</span>
                  )}
                  {['Photography', 'DJ / Music'].includes(category) && (
                    <span className="bg-empty-bg text-[9px] text-gray-500 px-2 py-0.5 rounded-full">{coverageHours}h coverage</span>
                  )}
                  {['Mehendi', 'Makeup'].includes(category) && (
                    <span className="bg-empty-bg text-[9px] text-gray-500 px-2 py-0.5 rounded-full">{guestCount === 1 ? 'Bride only' : `${guestCount} people`}</span>
                  )}
                </div>

                {includes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[9px] font-semibold text-gray-500 mb-1">INCLUDES</p>
                    <div className="flex flex-wrap gap-1">
                      {includes.map((inc, i) => (
                        <span key={i} className="bg-mustard-light text-mustard text-[8px] font-medium px-1.5 py-0.5 rounded-full">{inc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={handlePublish} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">
                Publish listing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
