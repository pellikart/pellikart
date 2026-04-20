import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR } from '@/lib/helpers'
import { getListingConfig, type SelectField } from '@/lib/vendor-category-config'

export default function VendorEditListing() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const { vendorListings, vendorProfile, updateListing } = useVendorStore()

  const listing = vendorListings.find((l) => l.id === listingId)
  const category = listing?.category || vendorProfile?.category || 'Photography'
  const config = getListingConfig(category)
  const pr = config.priceRange

  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState(pr.min)
  const [includes, setIncludes] = useState<string[]>([])
  const [categoryFields, setCategoryFields] = useState<Record<string, string | string[]>>({})

  useEffect(() => {
    if (listing) {
      setName(listing.name)
      setPhotos(listing.photos)
      setStyle(listing.style)
      setPrice(listing.price)
      setIncludes(listing.includes)
      setCategoryFields(listing.categoryFields || {})
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

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((f) => URL.createObjectURL(f))
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
    }
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

  function handleSave() {
    if (!listing) return
    updateListing({
      ...listing,
      name, photos, style, price, includes, categoryFields,
    })
    navigate('/vendor/listings')
  }

  const priceLabel = category === 'Catering' ? 'Price per plate' : category === 'Invitations' ? 'Price per invite' : 'Price'

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
            {config.styles.map((s) => (
              <button key={s} onClick={() => setStyle(s)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${style === s ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1">{priceLabel}</label>
          <p className="text-[20px] font-bold text-mustard mb-1">{formatINR(price)}{category === 'Catering' ? ' /plate' : category === 'Invitations' ? ' /invite' : ''}</p>
          <input type="range" min={pr.min} max={pr.max} step={pr.step} value={price} onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-mustard"
            style={{ background: `linear-gradient(to right, #D4A017 ${((price - pr.min) / (pr.max - pr.min)) * 100}%, #eee ${((price - pr.min) / (pr.max - pr.min)) * 100}%)` }}
          />
        </div>

        {/* Category-specific fields */}
        {config.steps.map((stepConfig) =>
          stepConfig.fields.map(field => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={categoryFields[field.key]}
              onChange={(val) => setCategoryField(field.key, val)}
              onToggleMulti={(val) => toggleMultiField(field.key, val)}
            />
          ))
        )}

        {/* Includes */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">What's included ({includes.length})</label>
          <div className="flex flex-wrap gap-2">
            {config.inclusions.map((item) => {
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
