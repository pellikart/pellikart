import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { formatINR, getRateCardBaseHourly, getPhotographyGuestFromPrice, getMehendiFromPrice, getMakeupFromPrice, getSareeDrapingFromPrice, getHairStylingFromPrice } from '@/lib/helpers'
import { getListingConfig, RITUALS, PHOTOGRAPHY_RATE_ROLES, PHOTOGRAPHY_HOUR_OPTIONS, emptyMehendiPricing, emptyMakeupPricing, emptySareeDrapingPricing, emptyHairStylingPricing, emptyPhotographyGuestPackages, isSingleListingCategory, type SelectField, type PhotographyRateCard, type PhotographyPricingModel, type PhotographyGuestPackages, type MehendiPricing, type MakeupPricing, type SareeDrapingPricing, type HairStylingPricing } from '@/lib/vendor-category-config'
import PhotographyGuestPackagesEditor from '@/components/PhotographyGuestPackagesEditor'
import MehendiPricingEditor from '@/components/MehendiPricingEditor'
import MakeupPricingEditor from '@/components/MakeupPricingEditor'
import MakeupAddonsEditor from '@/components/MakeupAddonsEditor'
import SareeDrapingPricingEditor from '@/components/SareeDrapingPricingEditor'
import HairStylingPricingEditor from '@/components/HairStylingPricingEditor'

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
  const [rateCard, setRateCard] = useState<PhotographyRateCard>({})
  const [availableHours, setAvailableHours] = useState<number[]>([])
  const [photographyPricingModels, setPhotographyPricingModels] = useState<PhotographyPricingModel[]>(['hourly'])
  const [guestPackages, setGuestPackages] = useState<PhotographyGuestPackages>(emptyPhotographyGuestPackages())
  const [guestPackagePhotographers, setGuestPackagePhotographers] = useState<Record<string, number>>({})
  const [guestPackageVideographers, setGuestPackageVideographers] = useState<Record<string, number>>({})
  const [mehendiPricing, setMehendiPricing] = useState<MehendiPricing>(emptyMehendiPricing())
  const [makeupPricing, setMakeupPricing] = useState<MakeupPricing>(emptyMakeupPricing())
  const [makeupAddons, setMakeupAddons] = useState<Record<string, number>>({})
  const [sareePricing, setSareePricing] = useState<SareeDrapingPricing>(emptySareeDrapingPricing())
  // Makeup-only: whether this makeup artist also offers mehendi / saree draping / hairstyling as add-ons.
  const [sareeAddon, setSareeAddon] = useState(false)
  const [hairPricing, setHairPricing] = useState<HairStylingPricing>(emptyHairStylingPricing())
  const [hairAddon, setHairAddon] = useState(false)
  const [mehendiAddon, setMehendiAddon] = useState(false)
  const [includes, setIncludes] = useState<string[]>([])
  const [rituals, setRituals] = useState<string[]>([])
  const [transportIncluded, setTransportIncluded] = useState<boolean | null>(null)
  const [coverIndex, setCoverIndex] = useState(0)
  const [categoryFields, setCategoryFields] = useState<Record<string, string | string[]>>({})
  const [bundledListings, setBundledListings] = useState<string[]>([])
  const [bundleMandatory, setBundleMandatory] = useState(false)

  useEffect(() => {
    if (listing) {
      setName(listing.name)
      setPhotos(listing.photos)
      setCoverIndex(listing.coverPhotoIndex ?? 0)
      setStyle(listing.style)
      setPrice(listing.price)
      setRateCard(listing.rateCard || {})
      setAvailableHours(listing.availableHours || [])
      setGuestPackages(listing.guestPackages || emptyPhotographyGuestPackages())
      setGuestPackagePhotographers(listing.guestPackagePhotographers || {})
      setGuestPackageVideographers(listing.guestPackageVideographers || {})
      setPhotographyPricingModels(
        listing.photographyPricingModels && listing.photographyPricingModels.length > 0
          ? listing.photographyPricingModels
          : (() => {
              const models: PhotographyPricingModel[] = []
              if (listing.rateCard && Object.keys(listing.rateCard).length > 0) models.push('hourly')
              if (listing.guestPackages && Object.keys(listing.guestPackages).length > 0) models.push('guestBased')
              return models.length > 0 ? models : ['hourly']
            })()
      )
      setMehendiPricing(listing.mehendiPricing || emptyMehendiPricing())
      setMehendiAddon(listing.category === 'Makeup' && !!listing.mehendiPricing)
      setMakeupPricing(listing.makeupPricing || emptyMakeupPricing())
      setMakeupAddons(listing.makeupPricing?.addons || {})
      setSareePricing(listing.sareeDrapingPricing || emptySareeDrapingPricing())
      setSareeAddon(listing.category === 'Makeup' && !!listing.sareeDrapingPricing)
      setHairPricing(listing.hairStylingPricing || emptyHairStylingPricing())
      setHairAddon(listing.category === 'Makeup' && !!listing.hairStylingPricing)
      setIncludes(listing.includes)
      setRituals(listing.rituals || [])
      setTransportIncluded(listing.transportIncluded ?? null)
      setCategoryFields(listing.categoryFields || {})
      setBundledListings(listing.bundledListings || [])
      setBundleMandatory(listing.bundleMandatory || false)
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

  function isFieldVisible(field: SelectField, values: Record<string, string | string[]>): boolean {
    if (!field.visibleWhen) return true
    const dep = values[field.visibleWhen.key]
    const { notEquals, equals } = field.visibleWhen
    if (equals !== undefined) {
      const list = Array.isArray(equals) ? equals : [equals]
      return typeof dep === 'string' && list.includes(dep)
    }
    if (notEquals !== undefined) {
      const list = Array.isArray(notEquals) ? notEquals : [notEquals]
      return typeof dep === 'string' ? !list.includes(dep) : true
    }
    return true
  }

  function setCategoryField(key: string, value: string | string[]) {
    setCategoryFields(prev => {
      const next = { ...prev, [key]: value }
      // Drop values for fields that are no longer visible, and seed newly-visible
      // number fields with their min so the displayed value is the stored value.
      for (const stepCfg of config.steps) {
        for (const f of stepCfg.fields) {
          if (!f.visibleWhen) continue
          if (!isFieldVisible(f, next)) {
            delete next[f.key]
          } else if (f.type === 'number' && next[f.key] === undefined) {
            next[f.key] = String(f.numberMin ?? 0)
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

  const photoOffersHourly = photographyPricingModels.includes('hourly')
  const photoOffersGuest = photographyPricingModels.includes('guestBased')
  const photoHourlyBase = getRateCardBaseHourly(rateCard)
  const photoGuestFrom = getPhotographyGuestFromPrice(guestPackages)

  function handleSave() {
    if (!listing) return
    // Photography: prefer the hourly "₹X/hr" board figure; fall back to the cheapest
    // guest-package cell when only guest-based pricing is offered.
    const effectivePrice = category === 'Photography'
      ? (photoOffersHourly && photoHourlyBase > 0 ? photoHourlyBase : photoGuestFrom)
      : category === 'Mehendi' ? getMehendiFromPrice(mehendiPricing)
      : category === 'Makeup' ? getMakeupFromPrice(makeupPricing)
      : category === 'Saree Draping' ? getSareeDrapingFromPrice(sareePricing)
      : category === 'Hair Stylist' ? getHairStylingFromPrice(hairPricing)
      : price
    updateListing({
      ...listing,
      name, photos, coverPhotoIndex: coverIndex, style, price: effectivePrice, rituals, includes, categoryFields,
      rateCard: category === 'Photography' && photoOffersHourly ? rateCard : undefined,
      availableHours: category === 'Photography' && photoOffersHourly && availableHours.length > 0 ? [...availableHours].sort((a, b) => a - b) : undefined,
      photographyPricingModels: category === 'Photography' && photographyPricingModels.length > 0 ? photographyPricingModels : undefined,
      guestPackages: category === 'Photography' && photoOffersGuest && photoGuestFrom > 0 ? guestPackages : undefined,
      guestPackagePhotographers: category === 'Photography' && photoOffersGuest && Object.keys(guestPackagePhotographers).length > 0 ? guestPackagePhotographers : undefined,
      guestPackageVideographers: category === 'Photography' && photoOffersGuest && Object.keys(guestPackageVideographers).length > 0 ? guestPackageVideographers : undefined,
      mehendiPricing: category === 'Mehendi' ? mehendiPricing
        : category === 'Makeup' && mehendiAddon ? mehendiPricing
        : undefined,
      makeupPricing: category === 'Makeup' ? { ...makeupPricing, addons: makeupAddons } : undefined,
      sareeDrapingPricing: category === 'Saree Draping' ? sareePricing
        : category === 'Makeup' && sareeAddon ? sareePricing
        : undefined,
      hairStylingPricing: category === 'Hair Stylist' ? hairPricing
        : category === 'Makeup' && hairAddon ? hairPricing
        : undefined,
      transportIncluded: transportIncluded === null ? undefined : transportIncluded,
      bundledListings: category === 'Venue' ? bundledListings : undefined,
      bundleMandatory: category === 'Venue' ? bundleMandatory : undefined,
    })
    navigate('/vendor/listings')
  }

  const priceLabel = category === 'Catering' ? 'Price per plate' : category === 'Invitations' ? 'Price per invite' : 'Price'

  return (
    <div className="min-h-dvh bg-white page-enter flex flex-col">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
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

        {/* Rituals */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">Events this listing is for</label>
          <div className="flex flex-wrap gap-1.5">
            {RITUALS.map((r) => {
              const selected = rituals.includes(r)
              return (
                <button key={r} onClick={() => toggleRitual(r)}
                  className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${selected ? 'bg-magenta text-white' : 'bg-empty-bg text-gray-600'}`}
                >{selected && '✓ '}{r}</button>
              )
            })}
          </div>
        </div>

        {/* Venue-only: bundle decor / catering listings */}
        {category === 'Venue' && (() => {
          const bundleCandidates = vendorListings.filter(l => l.id !== listing.id && (l.category === 'Decor' || l.category === 'Catering'))
          if (bundleCandidates.length === 0) return null
          return (
            <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
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

        {/* Photos */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1">Photos</label>
          <p className="text-[10px] text-gray-400 mb-1.5">Tap any photo to set it as your listing cover.</p>
          <div className="grid grid-cols-4 gap-1.5">
            {photos.map((p, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => setCoverIndex(i)}>
                <img src={p} alt="" className="w-full h-full object-cover" />
                {i === coverIndex && <span className="absolute top-0.5 left-0.5 bg-mustard text-white text-[6px] font-bold px-1 py-0.5 rounded">COVER</span>}
                {i !== coverIndex && <div className="absolute inset-0 bg-black/20" />}
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

        {/* Style (not used for single-listing pricing-only categories) */}
        {!isSingleListingCategory(category) && (
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">Style</label>
          <div className="flex flex-wrap gap-1.5">
            {config.styles.map((s) => (
              <button key={s} onClick={() => setStyle(s)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${style === s ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>{s}</button>
            ))}
          </div>
        </div>
        )}

        {/* Pricing — Photography offers hourly and/or guest-based; everything else a single price */}
        {category === 'Photography' ? (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1">How do you price?</label>
            <p className="text-[10px] text-gray-400 mb-2">Pick one or both. Couples will choose whichever works for them.</p>

            {/* Model selector */}
            <div className="flex flex-col gap-2.5 mb-4">
              {([
                { key: 'hourly' as const, title: 'Hourly rates', desc: 'Couples build a team (per role) and pick coverage hours.' },
                { key: 'guestBased' as const, title: 'Guest-based packages', desc: 'Flat all-inclusive prices by guest count and coverage hours.' },
              ]).map(m => {
                const selected = photographyPricingModels.includes(m.key)
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPhotographyPricingModels(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-4 h-4 mt-0.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-mustard bg-mustard' : 'border-gray-300 bg-white'}`}>
                        {selected && <span className="text-white text-[10px] leading-none">✓</span>}
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-dark">{m.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Hourly model */}
            {photoOffersHourly && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Hourly rates</p>
                <p className="text-[10px] text-gray-400 mb-2">Price per hour for each role you offer. Leave a role blank if you don't provide it.</p>
                <div className="space-y-2.5">
                  {PHOTOGRAPHY_RATE_ROLES.map(role => {
                    const val = rateCard[role.key] ?? 0
                    return (
                      <div key={role.key} className="flex items-center justify-between gap-3">
                        <span className="text-[12px] font-medium text-dark">{role.label}</span>
                        <div className="relative w-[140px] shrink-0">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                          <input
                            type="number" min={0} step={500}
                            value={val || ''}
                            onChange={(e) => {
                              const n = Math.max(0, parseInt(e.target.value) || 0)
                              setRateCard(prev => ({ ...prev, [role.key]: n }))
                            }}
                            placeholder="0"
                            className="w-full pl-6 pr-9 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">/hr</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4">
                  <label className="text-[12px] font-medium text-dark block mb-1">Hours you're willing to work</label>
                  <p className="text-[10px] text-gray-400 mb-2">Couples choose their coverage from these blocks.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PHOTOGRAPHY_HOUR_OPTIONS.map(h => {
                      const selected = availableHours.includes(h)
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setAvailableHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                          className={`py-1.5 px-3.5 rounded-full text-[11px] font-medium transition-all ${selected ? 'bg-mustard text-white' : 'bg-white border border-card-border text-gray-600 active:bg-mustard-light'}`}
                        >
                          {selected && <span className="mr-0.5">✓ </span>}{h} hrs
                        </button>
                      )
                    })}
                  </div>
                </div>
                {photoHourlyBase > 0 && (
                  <p className="text-[11px] text-gray-600 mt-3">Board card shows <span className="font-bold text-mustard">{formatINR(photoHourlyBase)}/hr</span> (1 of each offered role).</p>
                )}
              </div>
            )}

            {/* Guest-based model */}
            {photoOffersGuest && (
              <div className="mb-1">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Guest-based packages</p>
                <p className="text-[10px] text-gray-400 mb-2">Set a flat price for each guest count and coverage-hours combination you offer.</p>
                <PhotographyGuestPackagesEditor value={guestPackages} onChange={setGuestPackages} photographers={guestPackagePhotographers} onPhotographersChange={setGuestPackagePhotographers} videographers={guestPackageVideographers} onVideographersChange={setGuestPackageVideographers} />
                {photoGuestFrom > 0 && (
                  <p className="text-[11px] text-gray-600 mt-3">Board card shows <span className="font-bold text-mustard">from {formatINR(photoGuestFrom)}</span> when guest-based is your only model.</p>
                )}
              </div>
            )}
          </div>
        ) : category === 'Mehendi' ? (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-2">Mehendi pricing</label>
            <MehendiPricingEditor value={mehendiPricing} onChange={setMehendiPricing} />
          </div>
        ) : category === 'Makeup' ? (
          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-medium text-dark block mb-2">Makeup pricing</label>
              <MakeupPricingEditor value={makeupPricing} onChange={setMakeupPricing} />
            </div>
            <div className="pt-2 border-t border-card-border">
              <label className="text-[13px] font-semibold text-dark block mb-1">Add-ons</label>
              <p className="text-[10px] text-gray-400 mb-2">Price any extras you offer. Leave blank for ones you don't.</p>
              <MakeupAddonsEditor value={makeupAddons} onChange={setMakeupAddons} />
            </div>
            <div className="pt-2 border-t border-card-border">
              <label className="text-[13px] font-semibold text-dark block mb-2">Do you also offer Saree Draping?</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setSareeAddon(true)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${sareeAddon ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>Yes</button>
                <button type="button" onClick={() => setSareeAddon(false)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${!sareeAddon ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>No</button>
              </div>
              {sareeAddon && <SareeDrapingPricingEditor value={sareePricing} onChange={setSareePricing} />}
            </div>
            <div className="pt-2 border-t border-card-border">
              <label className="text-[13px] font-semibold text-dark block mb-2">Do you also offer Hairstyling?</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setHairAddon(true)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${hairAddon ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>Yes</button>
                <button type="button" onClick={() => setHairAddon(false)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${!hairAddon ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>No</button>
              </div>
              {hairAddon && <HairStylingPricingEditor value={hairPricing} onChange={setHairPricing} />}
            </div>
            <div className="pt-2 border-t border-card-border">
              <label className="text-[13px] font-semibold text-dark block mb-2">Do you also offer Mehendi?</label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setMehendiAddon(true)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${mehendiAddon ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>Yes</button>
                <button type="button" onClick={() => setMehendiAddon(false)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${!mehendiAddon ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>No</button>
              </div>
              {mehendiAddon && <MehendiPricingEditor value={mehendiPricing} onChange={setMehendiPricing} />}
            </div>
          </div>
        ) : category === 'Saree Draping' ? (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-2">Saree draping pricing</label>
            <SareeDrapingPricingEditor value={sareePricing} onChange={setSareePricing} />
          </div>
        ) : category === 'Hair Stylist' ? (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-2">Hair styling pricing</label>
            <HairStylingPricingEditor value={hairPricing} onChange={setHairPricing} />
          </div>
        ) : (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1">{priceLabel}</label>
            <p className="text-[20px] font-bold text-mustard mb-1">{formatINR(price)}{category === 'Catering' ? ' /plate' : category === 'Invitations' ? ' /invite' : ''}</p>
            <input type="range" min={pr.min} max={pr.max} step={pr.step} value={price} onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-mustard"
              style={{ background: `linear-gradient(to right, #D4A017 ${((price - pr.min) / (pr.max - pr.min)) * 100}%, #eee ${((price - pr.min) / (pr.max - pr.min)) * 100}%)` }}
            />
          </div>
        )}

        {/* Transport & logistics — for single-listing categories (their only edit surface) */}
        {isSingleListingCategory(category) && (
          <div className="p-3 rounded-xl bg-empty-bg border border-card-border">
            <p className="text-[12px] font-semibold text-dark mb-1.5">Transport &amp; logistics included?</p>
            <div className="flex gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setTransportIncluded(true)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${transportIncluded === true ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >Yes</button>
              <button
                type="button"
                onClick={() => setTransportIncluded(false)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${transportIncluded === false ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >No</button>
            </div>
            <p className="text-[9px] text-gray-400">Just lets couples know if travel is bundled — no amount, since it varies by distance.</p>
          </div>
        )}

        {/* Category-specific fields (Mehendi/Makeup pricing fully replaces these) */}
        {!isSingleListingCategory(category) && config.steps.map((stepConfig) =>
          stepConfig.fields.filter(field => isFieldVisible(field, categoryFields)).map(field => (
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
        {!isSingleListingCategory(category) && (
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
