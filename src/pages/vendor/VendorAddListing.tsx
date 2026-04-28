import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorListing } from '@/lib/vendor-types'
import { formatINR } from '@/lib/helpers'
import { getListingConfig, RITUALS, type SelectField } from '@/lib/vendor-category-config'
import { uploadPhotos } from '@/lib/supabase-db'

export default function VendorAddListing() {
  const navigate = useNavigate()
  const { vendorProfile, addListing, _vendorDbId, _liveMode } = useVendorStore()
  const category = vendorProfile?.category || 'Photography'
  const config = getListingConfig(category)

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState(config.priceRange.min + Math.floor((config.priceRange.max - config.priceRange.min) / 3))
  const [includes, setIncludes] = useState<string[]>([])
  const [rituals, setRituals] = useState<string[]>([])
  const [categoryFields, setCategoryFields] = useState<Record<string, string | string[]>>({})
  const [coverIndex, setCoverIndex] = useState(0)
  const [publishing, setPublishing] = useState(false)

  // Steps: 1=Photos & Name, 2=Rituals, 3..N=Category-specific steps, N+1=Style & Price, N+2=Inclusions, N+3=Review
  const categoryStepCount = config.steps.length
  const stylePriceStep = 3 + categoryStepCount
  const inclusionsStep = stylePriceStep + 1
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

  function toggleInclude(item: string) {
    setIncludes((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item])
  }

  function setCategoryField(key: string, value: string | string[]) {
    setCategoryFields(prev => ({ ...prev, [key]: value }))
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

    const listing: VendorListing = {
      id: `vl-${Date.now()}`,
      name: name || `${category} Listing`,
      photos: photoUrls,
      coverPhotoIndex: coverIndex,
      category,
      price,
      style,
      rituals,
      categoryFields,
      includes,
      createdAt: new Date().toISOString().split('T')[0],
    }
    addListing(listing)
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
  }

  // Price label per category
  const priceLabel = category === 'Catering' ? 'Price per plate' : category === 'Invitations' ? 'Price per invite' : 'Price'

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
                {stepConfig.fields.map(field => (
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
            <h1 className="text-[20px] font-bold text-dark">Style & pricing</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Pick a style and set your price.</p>

            {/* Style selector */}
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

            {/* Price slider */}
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
              <button onClick={() => setStep(stylePriceStep)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
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
                <p className="text-[10px] text-gray-400 mt-0.5">{style || 'No style selected'} · {vendorProfile?.area}</p>
                <p className="text-[16px] font-bold text-mustard mt-1">{formatINR(price)}{category === 'Catering' ? ' /plate' : category === 'Invitations' ? ' /invite' : ''}</p>

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
