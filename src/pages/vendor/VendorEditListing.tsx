import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

export default function VendorEditListing() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const { vendorListings, vendorProfile, updateListing } = useVendorStore()

  const listing = vendorListings.find((l) => l.id === listingId)
  const category = listing?.category || vendorProfile?.category || 'Photography'

  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState(100000)
  const [capacity, setCapacity] = useState(500)
  const [coverageHours, setCoverageHours] = useState(8)
  const [guestCount, setGuestCount] = useState(10)
  const [includes, setIncludes] = useState<string[]>([])

  useEffect(() => {
    if (listing) {
      setName(listing.name)
      setPhotos(listing.photos)
      setStyle(listing.style)
      setPrice(listing.price)
      setCapacity(listing.capacity || 500)
      setCoverageHours(listing.coverageHours || 8)
      setGuestCount(listing.guestCount || 10)
      setIncludes(listing.includes)
    }
  }, [listing])

  if (!listing) {
    return (
      <div className="p-8 text-center text-gray-500">
        Listing not found.
        <button onClick={() => navigate('/vendor/listings')} className="block mx-auto mt-4 text-mustard">← Go back</button>
      </div>
    )
  }

  const styles = STYLE_OPTIONS[category] || STYLE_OPTIONS['Photography']
  const includeOptions = INCLUDE_OPTIONS[category] || INCLUDE_OPTIONS['Photography']
  const priceRange: Record<string, { min: number; max: number; step: number }> = {
    Venue: { min: 100000, max: 2000000, step: 50000 }, Catering: { min: 50000, max: 1000000, step: 25000 },
    Photography: { min: 30000, max: 500000, step: 10000 }, Decor: { min: 50000, max: 800000, step: 25000 },
    Makeup: { min: 10000, max: 200000, step: 5000 }, Mehendi: { min: 5000, max: 100000, step: 2500 },
    'DJ / Music': { min: 20000, max: 300000, step: 5000 }, Pandit: { min: 5000, max: 100000, step: 2500 },
    Invitations: { min: 10000, max: 300000, step: 5000 },
  }
  const pr = priceRange[category] || priceRange['Photography']

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((f) => URL.createObjectURL(f))
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
    }
  }

  function handleSave() {
    if (!listing) return
    updateListing({
      ...listing,
      name, photos, style, price, includes,
      capacity: ['Venue', 'Catering'].includes(category) ? capacity : undefined,
      coverageHours: ['Photography', 'DJ / Music'].includes(category) ? coverageHours : undefined,
      guestCount: ['Mehendi', 'Makeup'].includes(category) ? guestCount : undefined,
    })
    navigate('/vendor/listings')
  }

  return (
    <div className="min-h-dvh bg-white page-enter flex flex-col">
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendor/listings')} className="text-sm">←</button>
          <p className="text-[14px] font-bold text-dark">Edit Listing</p>
        </div>
        <button onClick={handleSave} className="bg-mustard text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg">Save</button>
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto space-y-5">
        {/* Name */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1">Listing name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
        </div>

        {/* Photos */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">Photos</label>
          <div className="grid grid-cols-4 gap-1.5">
            {photos.map((p, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden relative">
                <img src={p} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-0.5 left-0.5 bg-mustard text-white text-[6px] font-bold px-1 py-0.5 rounded">COVER</span>}
              </div>
            ))}
            {photos.length < 10 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-mustard/30 flex items-center justify-center cursor-pointer">
                <span className="text-mustard text-lg">+</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">Style</label>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => (
              <button key={s} onClick={() => setStyle(s)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${style === s ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1">Price</label>
          <p className="text-[20px] font-bold text-mustard mb-1">{formatINR(price)}</p>
          <input type="range" min={pr.min} max={pr.max} step={pr.step} value={price} onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-mustard"
            style={{ background: `linear-gradient(to right, #D4A017 ${((price - pr.min) / (pr.max - pr.min)) * 100}%, #eee ${((price - pr.min) / (pr.max - pr.min)) * 100}%)` }}
          />
        </div>

        {/* Category-specific */}
        {['Venue', 'Catering'].includes(category) && (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1">Guest capacity: {capacity}</label>
            <input type="range" min={50} max={2000} step={50} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-mustard"
              style={{ background: `linear-gradient(to right, #D4A017 ${((capacity - 50) / 1950) * 100}%, #eee ${((capacity - 50) / 1950) * 100}%)` }}
            />
          </div>
        )}
        {['Photography', 'DJ / Music'].includes(category) && (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1">Coverage hours</label>
            <div className="flex gap-2">
              {[4, 6, 8, 10, 12].map((h) => (
                <button key={h} onClick={() => setCoverageHours(h)} className={`flex-1 py-2 rounded-xl text-[12px] font-medium ${coverageHours === h ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>{h}h</button>
              ))}
            </div>
          </div>
        )}
        {['Mehendi', 'Makeup'].includes(category) && (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1">Covers how many people?</label>
            <div className="flex gap-2">
              {[1, 5, 10, 15, 20, 30].map((g) => (
                <button key={g} onClick={() => setGuestCount(g)} className={`flex-1 py-2 rounded-xl text-[11px] font-medium ${guestCount === g ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>{g === 1 ? 'Bride' : g}</button>
              ))}
            </div>
          </div>
        )}

        {/* Includes */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">What's included ({includes.length})</label>
          <div className="flex flex-wrap gap-2">
            {includeOptions.map((item) => {
              const selected = includes.includes(item)
              return (
                <button key={item} onClick={() => setIncludes(selected ? includes.filter((i) => i !== item) : [...includes, item])}
                  className={`py-1.5 px-3 rounded-xl text-[10px] font-medium ${selected ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-500'}`}
                >{selected && '✓ '}{item}</button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
