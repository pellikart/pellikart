import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorListing } from '@/lib/vendor-types'
import { formatINR } from '@/lib/helpers'
import { getListingConfig, RITUALS, type SelectField } from '@/lib/vendor-category-config'
import { uploadPhotos } from '@/lib/supabase-db'

export default function VendorAddListing() {
  const navigate = useNavigate()
  const { vendorProfile, vendorListings, addListing, updateListing, _vendorDbId, _liveMode } = useVendorStore()
  const profileCategory = vendorProfile?.category || 'Photography'
  // Venue vendors can also create in-house Catering / Decor listings.
  const allowedCategories = useMemo(() =>
    profileCategory === 'Venue' ? ['Venue', 'Catering', 'Decor'] : [profileCategory],
  [profileCategory])

  const [category, setCategory] = useState(profileCategory)
  const config = getListingConfig(category)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState(config.priceRange.min + Math.floor((config.priceRange.max - config.priceRange.min) / 3))
  const [includes, setIncludes] = useState<string[]>([])
  const [rituals, setRituals] = useState<string[]>([])
  const [categoryFields, setCategoryFields] = useState<Record<string, string | string[]>>({})
  const [coverIndex, setCoverIndex] = useState(0)
  const [publishing, setPublishing] = useState(false)
  // Venue-only: bundle other listings with this one
  const [bundledListings, setBundledListings] = useState<string[]>([])
  const [bundleMandatory, setBundleMandatory] = useState(false)
  // Decor/Catering-only (for Venue vendors): link this listing back to existing venues
  const [linkedVenueIds, setLinkedVenueIds] = useState<string[]>([])
  const [linkedVenueMandatory, setLinkedVenueMandatory] = useState(false)
  // Venue-only: per-duration price tiers
  const [hourlyPricing, setHourlyPricing] = useState<{ hours: number; price: number }[]>([])

  // When category changes (Venue vendor switching listing type), reset category-dependent state
  function changeCategory(next: string) {
    if (next === category) return
    setCategory(next)
    const nextConfig = getListingConfig(next)
    setPrice(nextConfig.priceRange.min + Math.floor((nextConfig.priceRange.max - nextConfig.priceRange.min) / 3))
    setStyle('')
    setIncludes([])
    setCategoryFields({})
    setBundledListings([])
    setBundleMandatory(false)
    setLinkedVenueIds([])
    setLinkedVenueMandatory(false)
    setHourlyPricing([])
  }

  // Steps: 1=Photos & Name, 2=Rituals, 3..N=Category-specific steps, [N+1=Style & Price], N+2=Inclusions, N+3=Review
  // Venue listings skip the Style & Price step entirely (no style chips, price is per-tier on Review).
  const categoryStepCount = config.steps.length
  const hasStylePriceStep = category !== 'Venue'
  const stylePriceStep = hasStylePriceStep ? 3 + categoryStepCount : -1
  const inclusionsStep = hasStylePriceStep ? stylePriceStep + 1 : 3 + categoryStepCount
  const reviewStep = inclusionsStep + 1
  const totalSteps = reviewStep

  const pr = config.priceRange

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setPhotoFiles(prev => [...prev, ...files].slice(0, 10))
      const previews = files.map(f => URL.createObjectURL(f))
      setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10))
    }
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setVideoFiles(prev => [...prev, ...files].slice(0, 5))
      const previews = files.map(f => URL.createObjectURL(f))
      setVideoPreviews(prev => [...prev, ...previews].slice(0, 5))
    }
  }

  function removeVideo(index: number) {
    setVideoFiles(prev => prev.filter((_, i) => i !== index))
    setVideoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function toggleInclude(item: string) {
    setIncludes((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item])
  }

  function isFieldVisible(field: SelectField, values: Record<string, string | string[]>): boolean {
    if (!field.visibleWhen) return true
    const dep = values[field.visibleWhen.key]
    const excluded = field.visibleWhen.notEquals
    const excludedList = Array.isArray(excluded) ? excluded : [excluded]
    return typeof dep === 'string' ? !excludedList.includes(dep) : true
  }

  function setCategoryField(key: string, value: string | string[]) {
    setCategoryFields(prev => {
      const next = { ...prev, [key]: value }
      // Drop any fields whose visibility condition no longer holds
      for (const stepCfg of config.steps) {
        for (const f of stepCfg.fields) {
          if (f.visibleWhen && !isFieldVisible(f, next)) {
            delete next[f.key]
          }
        }
      }
      return next
    })
  }

  function toggleMultiField(key: string, value: string) {
    setCategoryFields(prev => {
      const current = (prev[key] as string[]) || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [key]: updated }
    })
  }

  function toggleRitual(r: string) {
    setRituals(prev => prev.includes(r) ? prev.filter(v => v !== r) : [...prev, r])
  }

  async function handlePublish() {
    setPublishing(true)

    // Upload photos to Supabase Storage if in live mode
    let photoUrls = photoPreviews
    if (_liveMode && _vendorDbId && photoFiles.length > 0) {
      const uploaded = await uploadPhotos(_vendorDbId, photoFiles, 'listing')
      if (uploaded.length > 0) photoUrls = uploaded
    }

    // Videos — same flow. Re-uses uploadPhotos (handles any File type).
    let videoUrls = videoPreviews
    if (_liveMode && _vendorDbId && videoFiles.length > 0) {
      const uploaded = await uploadPhotos(_vendorDbId, videoFiles, 'listing')
      if (uploaded.length > 0) videoUrls = uploaded
    }

    // For Venue with hourly pricing, the base price defaults to the 24 hr tier
    // (so couples see that by default). Fall back to first tier, else slider price.
    const effectivePrice = category === 'Venue' && hourlyPricing.length > 0
      ? (hourlyPricing.find(t => t.hours === 24)?.price || hourlyPricing[0].price || price)
      : price

    const listing: VendorListing = {
      id: `vl-${Date.now()}`,
      name: name || `${category} Listing`,
      photos: photoUrls,
      videos: videoUrls.length > 0 ? videoUrls : undefined,
      coverPhotoIndex: coverIndex,
      category,
      price: effectivePrice,
      style,
      rituals,
      categoryFields,
      includes,
      createdAt: new Date().toISOString().split('T')[0],
      bundledListings: category === 'Venue' ? bundledListings : undefined,
      bundleMandatory: category === 'Venue' ? bundleMandatory : undefined,
      hourlyPricing: category === 'Venue' && hourlyPricing.length > 0 ? hourlyPricing : undefined,
    }
    addListing(listing)

    // If this Decor/Catering listing was linked to any venues, append it to each
    // venue's bundle so the existing user-side mandatory-bundle popup picks it up.
    if (linkedVenueIds.length > 0 && (category === 'Decor' || category === 'Catering')) {
      for (const venueId of linkedVenueIds) {
        const venue = vendorListings.find(l => l.id === venueId)
        if (!venue) continue
        const existing = venue.bundledListings || []
        updateListing({
          ...venue,
          bundledListings: existing.includes(listing.id) ? existing : [...existing, listing.id],
          bundleMandatory: linkedVenueMandatory ? true : venue.bundleMandatory,
        })
      }
    }

    setPublishing(false)
    navigate('/vendor/listings')
  }

  // Placeholder names per category
  const namePlaceholders: Record<string, string> = {
    Venue: 'e.g. Royal Mughal Night',
    Catering: 'e.g. Grand Multi-Cuisine Feast',
    Photography: 'e.g. Cinematic Love Story Package',
    Decor: 'e.g. Floral Cascade Mandap',
    Makeup: 'e.g. HD Bridal Glam Package',
    Mehendi: 'e.g. Rajasthani Bridal Full Hands',
    'DJ / Music': 'e.g. Bollywood + EDM Night',
    Pandit: 'e.g. Complete Vedic Ceremony',
    Invitations: 'e.g. Luxury Gold Foil Box Invite',
    Banjantrilu: 'e.g. Traditional Nadaswaram Set',
    Reels: 'e.g. Cinematic Wedding Reels',
    'Hair Stylist': 'e.g. Bridal 3-Look Hair Package',
    'Saree Draping': 'e.g. Bridal 3-Drape Package',
    'Live Stalls': 'e.g. Live Bangle Stall · 3 hours',
    'Hosts / Entertainers': 'e.g. Sangeeth Anchor + Game Show · 2 hours',
    'Wedding Props': 'e.g. Pelli Butta + Aduthera Combo',
  }

  // Price label per category
  const priceLabel = category === 'Catering' ? 'Price per plate' : category === 'Invitations' ? 'Price per invite' : 'Price'

  return (
    <div className="min-h-dvh bg-white page-enter flex flex-col">
      {/* Header */}
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
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

            {/* Listing type picker (only for Venue vendors who offer more than just venues) */}
            {allowedCategories.length > 1 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium text-dark mb-1.5">Listing type</p>
                <div className="flex flex-wrap gap-1.5">
                  {allowedCategories.map(c => (
                    <button
                      key={c} onClick={() => changeCategory(c)}
                      className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${c === category ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo upload */}
            <p className="text-[10px] text-gray-400 mb-2">Tap any photo to set it as your listing cover.</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photoPreviews.map((p, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative cursor-pointer" onClick={() => setCoverIndex(i)}>
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  {i === coverIndex && <span className="absolute top-1 left-1 bg-mustard text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">COVER</span>}
                  {i !== coverIndex && <div className="absolute inset-0 bg-black/20" />}
                </div>
              ))}
              {photoPreviews.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-[8px] text-gray-400 mt-1">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>

            {/* Video upload */}
            <p className="text-[11px] font-medium text-dark mb-1.5">Videos <span className="text-[10px] text-gray-400 font-normal">(optional)</span></p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {videoPreviews.map((v, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group bg-black">
                  <video src={v} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <button
                    onClick={() => removeVideo(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              ))}
              {videoPreviews.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  <span className="text-[8px] text-gray-400 mt-1">Add video</span>
                  <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
                </label>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="text-[11px] font-medium text-dark block mb-1.5">Listing name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={namePlaceholders[category] || `e.g. ${category} Package`}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard"
              />
            </div>

            <button onClick={() => setStep(2)} className="mt-6 w-full py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">
              Next
            </button>
          </div>
        )}

        {/* Step 2: Rituals / Events */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Which events is this for?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Select all the rituals/events where couples can use this listing. This helps us match you with the right couples.</p>

            <div className="flex flex-wrap gap-2">
              {RITUALS.map((r) => {
                const selected = rituals.includes(r)
                return (
                  <button
                    key={r} onClick={() => toggleRitual(r)}
                    className={`py-2.5 px-4 rounded-xl text-[12px] font-medium transition-all ${selected ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-500'}`}
                  >
                    {selected && <span className="mr-1">✓</span>}{r}
                  </button>
                )
              })}
            </div>

            {rituals.length > 0 && <p className="text-[9px] text-gray-400 mt-3">{rituals.length} selected</p>}

            {/* Venue-only: bundle decor / catering listings */}
            {category === 'Venue' && (() => {
              const bundleCandidates = vendorListings.filter(l => l.category === 'Decor' || l.category === 'Catering')
              if (bundleCandidates.length === 0) return null
              return (
                <div className="mt-6 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                  <p className="text-[12px] font-semibold text-dark">Bundle with your other listings</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 mb-2">Couples picking this venue will be offered these too.</p>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {bundleCandidates.map(l => (
                      <label key={l.id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-mustard"
                          checked={bundledListings.includes(l.id)}
                          onChange={() => setBundledListings(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])} />
                        <span className="text-[11px] text-dark">{l.name}</span>
                        <span className="text-[10px] text-gray-400">· {l.category}</span>
                      </label>
                    ))}
                  </div>
                  {bundledListings.length > 0 && (
                    <label className="flex items-start gap-2 cursor-pointer pt-2 border-t border-mustard/20">
                      <input type="checkbox" className="accent-mustard mt-0.5"
                        checked={bundleMandatory} onChange={() => setBundleMandatory(v => !v)} />
                      <div>
                        <span className="text-[11px] text-dark font-medium">Bundle is mandatory</span>
                        <p className="text-[10px] text-gray-500">Couples must accept the bundle to book this venue.</p>
                      </div>
                    </label>
                  )}
                </div>
              )
            })()}

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Category-specific steps */}
        {config.steps.map((stepConfig, idx) => {
          const stepNum = 3 + idx
          if (step !== stepNum) return null
          return (
            <div key={stepNum} className="animate-fadeIn">
              <h1 className="text-[20px] font-bold text-dark">{stepConfig.title}</h1>
              <p className="text-[11px] text-gray-400 mt-1 mb-5">{stepConfig.subtitle}</p>

              <div className="space-y-5">
                {stepConfig.fields.filter(f => isFieldVisible(f, categoryFields)).map(field => (
                  <FieldRenderer
                    key={field.key}
                    field={field}
                    value={categoryFields[field.key]}
                    onChange={(val) => setCategoryField(field.key, val)}
                    onToggleMulti={(val) => toggleMultiField(field.key, val)}
                  />
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(stepNum - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
                <button onClick={() => setStep(stepNum + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
              </div>
            </div>
          )
        })}

        {/* Style & Price step */}
        {step === stylePriceStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">{category === 'Venue' ? 'Style' : 'Style & pricing'}</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">
              {category === 'Venue'
                ? "You'll set per-duration prices on the next page."
                : 'Pick a style and set your price.'}
            </p>

            {category !== 'Venue' && (
              <>
                <label className="text-[11px] font-medium text-dark block mb-2">Style</label>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {config.styles.map((s) => (
                    <button
                      key={s} onClick={() => setStyle(s)}
                      className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${style === s ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 active:bg-mustard-light'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {category !== 'Venue' && (
              <>
                <label className="text-[11px] font-medium text-dark block mb-1">{priceLabel}</label>
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
              </>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(stylePriceStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(inclusionsStep)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Inclusions step */}
        {step === inclusionsStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">What's included?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Tap everything that's part of this listing.</p>

            <div className="flex flex-wrap gap-2">
              {config.inclusions.map((item) => {
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
              <button onClick={() => setStep(inclusionsStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(reviewStep)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Review & Publish */}
        {step === reviewStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Review & publish</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Here's how your listing will look to couples.</p>

            {/* Preview card */}
            <div className="rounded-2xl border border-card-border overflow-hidden mb-4">
              {photoPreviews.length > 0 ? (
                <img src={photoPreviews[coverIndex] || photoPreviews[0]} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-empty-bg flex items-center justify-center text-gray-400 text-xs">No photo added</div>
              )}
              <div className="p-3">
                <p className="text-[14px] font-bold text-dark">{name || `${category} Listing`}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{category === 'Venue' ? vendorProfile?.area : `${style || 'No style selected'} · ${vendorProfile?.area}`}</p>
                {(() => {
                  if (category === 'Venue') {
                    const tier = hourlyPricing.find(t => t.hours === 24) || hourlyPricing[0]
                    if (!tier || !tier.price) return <p className="text-[12px] text-gray-400 italic mt-1">Price not set</p>
                    return <p className="text-[16px] font-bold text-mustard mt-1">{formatINR(tier.price)} <span className="text-[10px] font-normal text-gray-400">/ {tier.hours} hr</span></p>
                  }
                  return <p className="text-[16px] font-bold text-mustard mt-1">{formatINR(price)}{category === 'Catering' ? ' /plate' : category === 'Invitations' ? ' /invite' : ''}</p>
                })()}

                {/* Rituals */}
                {rituals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rituals.map((r, i) => (
                      <span key={i} className="bg-magenta-light text-magenta text-[8px] font-medium px-1.5 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                )}

                {/* Category-specific details */}
                {Object.entries(categoryFields).filter(([, v]) => v && (typeof v === 'string' ? v : v.length > 0)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Object.entries(categoryFields).map(([, v]) => {
                      const values = typeof v === 'string' ? [v] : v
                      return values.map((val, i) => (
                        <span key={`${val}-${i}`} className="bg-empty-bg text-[9px] text-gray-500 px-2 py-0.5 rounded-full">{val}</span>
                      ))
                    })}
                  </div>
                )}

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

            {/* Venue-only: per-duration hourly pricing tiers */}
            {category === 'Venue' && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Hourly pricing</p>
                <p className="text-[10px] text-gray-500 mb-2">Tap each duration you offer and set its price. Couples see the 24 hr price by default.</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[12, 24].map(h => {
                    const selected = hourlyPricing.some(t => t.hours === h)
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHourlyPricing(prev =>
                          selected ? prev.filter(t => t.hours !== h) : [...prev, { hours: h, price: 0 }]
                        )}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${selected ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 border border-card-border'}`}
                      >
                        {selected && <span className="mr-0.5">✓ </span>}{h} hr
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setHourlyPricing(prev => [...prev, { hours: 6, price: 0 }])}
                    className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-empty-bg text-dark border border-card-border active:bg-mustard-light/40"
                  >
                    + Custom
                  </button>
                </div>

                {hourlyPricing.length > 0 && (
                  <div className="space-y-2">
                    {hourlyPricing.map((tier, i) => {
                      const isPreset = tier.hours === 12 || tier.hours === 24
                      return (
                        <div key={i} className="flex items-center gap-2">
                          {isPreset ? (
                            <span className="px-2.5 py-2 rounded-lg bg-white border border-card-border text-[11px] font-medium text-dark min-w-[60px] text-center">
                              {tier.hours} hr
                            </span>
                          ) : (
                            <div className="relative">
                              <input
                                type="number"
                                min={1}
                                value={tier.hours || ''}
                                onChange={(e) => {
                                  const h = parseInt(e.target.value) || 0
                                  setHourlyPricing(prev => prev.map((t, idx) => idx === i ? { ...t, hours: h } : t))
                                }}
                                className="w-16 pl-2 pr-7 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
                                placeholder="6"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">hr</span>
                            </div>
                          )}
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={tier.price || ''}
                              onChange={(e) => {
                                const p = parseInt(e.target.value) || 0
                                setHourlyPricing(prev => prev.map((t, idx) => idx === i ? { ...t, price: p } : t))
                              }}
                              className="w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
                              placeholder="Price"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setHourlyPricing(prev => prev.filter((_, idx) => idx !== i))}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Link this Decor/Catering listing to one or more of the vendor's venue listings */}
            {(category === 'Decor' || category === 'Catering') && (() => {
              const venueOptions = vendorListings.filter(l => l.category === 'Venue')
              if (venueOptions.length === 0) return null
              return (
                <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                  <p className="text-[12px] font-semibold text-dark">Link to your venues</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 mb-2">Optional. Pick any venues — couples selecting them will be offered this listing too.</p>
                  <div className="flex flex-col gap-2 mb-2">
                    {venueOptions.map(v => {
                      const isSelected = linkedVenueIds.includes(v.id)
                      return (
                        <button
                          key={v.id}
                          onClick={() => setLinkedVenueIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id])}
                          className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-left transition-all ${isSelected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                        >
                          <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-mustard bg-mustard' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <span className="text-white text-[10px] leading-none">✓</span>}
                          </span>
                          <span className={`text-[12px] font-medium ${isSelected ? 'text-dark' : 'text-gray-700'}`}>{v.name}</span>
                        </button>
                      )
                    })}
                  </div>
                  {linkedVenueIds.length > 0 && (
                    <label className="flex items-start gap-2 cursor-pointer pt-2 border-t border-mustard/20">
                      <input type="checkbox" className="accent-mustard mt-0.5"
                        checked={linkedVenueMandatory} onChange={() => setLinkedVenueMandatory(v => !v)} />
                      <div>
                        <span className="text-[11px] text-dark font-medium">Mandatory with {linkedVenueIds.length === 1 ? 'this venue' : 'these venues'}</span>
                        <p className="text-[10px] text-gray-500">Couples booking {linkedVenueIds.length === 1 ? 'the venue' : 'any of these venues'} will be prompted to take this {category.toLowerCase()} too.</p>
                      </div>
                    </label>
                  )}
                </div>
              )
            })()}

            <div className="flex gap-2">
              <button onClick={() => setStep(inclusionsStep)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={handlePublish} disabled={publishing} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-50">
                {publishing ? 'Publishing...' : 'Publish listing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Reusable field renderer for category-specific selectable fields */
function FieldRenderer({ field, value, onChange, onToggleMulti }: {
  field: SelectField
  value: string | string[] | undefined
  onChange: (val: string | string[]) => void
  onToggleMulti: (val: string) => void
}) {
  if (field.type === 'slider') {
    const numVal = typeof value === 'string' ? parseInt(value) || field.sliderMin! : field.sliderMin!
    return (
      <div>
        <label className="text-[12px] font-medium text-dark block mb-1">{field.label}</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={field.sliderMin} max={field.sliderMax} step={field.sliderStep}
            value={numVal}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-mustard"
            style={{ background: `linear-gradient(to right, #D4A017 ${((numVal - field.sliderMin!) / (field.sliderMax! - field.sliderMin!)) * 100}%, #eee ${((numVal - field.sliderMin!) / (field.sliderMax! - field.sliderMin!)) * 100}%)` }}
          />
          <span className="text-[13px] font-bold text-dark w-20 text-right">{numVal} {field.sliderUnit}</span>
        </div>
      </div>
    )
  }

  if (field.type === 'single') {
    const selected = typeof value === 'string' ? value : ''
    return (
      <div>
        <label className="text-[12px] font-medium text-dark block mb-1.5">{field.label}</label>
        <div className="flex flex-wrap gap-1.5">
          {field.options!.map((opt) => (
            <button
              key={opt} onClick={() => onChange(opt)}
              className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${selected === opt ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 active:bg-mustard-light'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'multi') {
    const selected = Array.isArray(value) ? value : []
    return (
      <div>
        <label className="text-[12px] font-medium text-dark block mb-1.5">{field.label}</label>
        <div className="flex flex-wrap gap-1.5">
          {field.options!.map((opt) => {
            const isSelected = selected.includes(opt)
            return (
              <button
                key={opt} onClick={() => onToggleMulti(opt)}
                className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${isSelected ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 active:bg-mustard-light'}`}
              >
                {isSelected && <span className="mr-0.5">✓ </span>}{opt}
              </button>
            )
          })}
        </div>
        {selected.length > 0 && <p className="text-[9px] text-gray-400 mt-1">{selected.length} selected</p>}
      </div>
    )
  }

  return null
}
