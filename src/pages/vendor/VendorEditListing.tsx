import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useVendorBase } from '@/lib/vendor-nav'
import { useVendorStore } from '@/lib/vendor-store'
import { uploadPhotos } from '@/lib/supabase-db'
import { formatINR, getRateCardBaseHourly, getPhotographyGuestFromPrice, getMehendiFromPrice, getMakeupFromPrice, getSareeDrapingFromPrice, getHairStylingFromPrice } from '@/lib/helpers'
import { getListingConfig, RITUALS, PHOTOGRAPHY_RATE_ROLES, PHOTOGRAPHY_HOUR_OPTIONS, emptyMehendiPricing, emptyMakeupPricing, emptySareeDrapingPricing, emptyHairStylingPricing, emptyPhotographyGuestPackages, isSingleListingCategory, type SelectField, type PhotographyRateCard, type PhotographyPricingModel, type PhotographyGuestPackages, type MehendiPricing, type MakeupPricing, type SareeDrapingPricing, type HairStylingPricing } from '@/lib/vendor-category-config'
import type { MenuSection, PlatePackage } from '@/lib/vendor-types'
import PhotographyGuestPackagesEditor from '@/components/PhotographyGuestPackagesEditor'
import MenuBuilder from '@/components/MenuBuilder'
import MehendiPricingEditor from '@/components/MehendiPricingEditor'
import MakeupPricingEditor from '@/components/MakeupPricingEditor'
import MakeupAddonsEditor from '@/components/MakeupAddonsEditor'
import SareeDrapingPricingEditor from '@/components/SareeDrapingPricingEditor'
import HairStylingPricingEditor from '@/components/HairStylingPricingEditor'

export default function VendorEditListing() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const base = useVendorBase()
  const { vendorListings, vendorProfile, updateListing, _liveMode, _vendorDbId } = useVendorStore()

  const listing = vendorListings.find((l) => l.id === listingId)
  const category = listing?.category || vendorProfile?.category || 'Photography'
  const config = getListingConfig(category)
  const pr = config.priceRange

  const [name, setName] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  // Newly-added photos are blob: previews; keep their File so we can upload them
  // on save (otherwise the un-loadable blob URL gets persisted).
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({})
  const [saving, setSaving] = useState(false)
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
  // Catering menu, and venue plate-package menus.
  const [menu, setMenu] = useState<MenuSection[]>([])
  const [platePackages, setPlatePackages] = useState<PlatePackage[]>([])

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
      setMenu(listing.menu || [])
      setPlatePackages(listing.platePackages || [])
    }
  }, [listing])

  if (!listing) {
    return (
      <div className="p-8 text-center text-gray-500">
        Listing not found.
        <button onClick={() => navigate(`${base}/listings`)} className="block mx-auto mt-4 text-mustard">← Go back</button>
      </div>
    )
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const fileMap: Record<string, File> = {}
      const newPhotos = Array.from(e.target.files).map((f) => {
        const url = URL.createObjectURL(f)
        fileMap[url] = f
        return url
      })
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
      setPhotoFiles((prev) => ({ ...prev, ...fileMap }))
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

  // Copy another package's menu into this one as a starting point (deep-cloned so
  // later edits don't affect the source). Confirms before replacing a non-empty menu.
  function importPackageMenu(targetIdx: number, sourceId: string) {
    const source = platePackages.find(p => p.id === sourceId)
    if (!source || menuItemCount(source.menu) === 0) return
    if (menuItemCount(platePackages[targetIdx]?.menu) > 0 &&
        !window.confirm("Replace this package's menu with a copy from the selected package?")) return
    const copy = JSON.parse(JSON.stringify(source.menu)) as MenuSection[]
    setPlatePackages(prev => prev.map((p, i) => i === targetIdx ? { ...p, menu: copy } : p))
  }

  const photoOffersHourly = photographyPricingModels.includes('hourly')
  const photoOffersGuest = photographyPricingModels.includes('guestBased')
  const photoHourlyBase = getRateCardBaseHourly(rateCard)
  const photoGuestFrom = getPhotographyGuestFromPrice(guestPackages)

  async function handleSave() {
    if (!listing || saving) return
    setSaving(true)
    // Upload any newly-added photos (blob: previews) to storage and swap in the
    // real public URLs. Without this the listing persists un-loadable blob URLs
    // that break on the vendor side AND for couples.
    let finalPhotos = photos
    if (_liveMode && _vendorDbId) {
      const existing = photos.filter((p) => !p.startsWith('blob:'))
      const newFiles = photos.filter((p) => p.startsWith('blob:')).map((p) => photoFiles[p]).filter(Boolean)
      const uploaded = newFiles.length > 0 ? await uploadPhotos(_vendorDbId, newFiles, 'listing') : []
      // Drop any leftover blobs (e.g. a failed upload) so we never save them.
      finalPhotos = [...existing, ...uploaded]
    }
    const safeCover = Math.min(coverIndex, Math.max(0, finalPhotos.length - 1))
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
      name, photos: finalPhotos, coverPhotoIndex: safeCover, style, price: effectivePrice, rituals, includes, categoryFields,
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
      // Menu edits: catering menu, or per-package venue menus. Left as-is for
      // other categories (they carry over via the ...listing spread above).
      menu: category === 'Catering' ? menu : listing.menu,
      platePackages: category === 'Venue' ? platePackages : listing.platePackages,
    })
    navigate(`${base}/listings`)
  }

  const priceLabel = category === 'Catering' ? 'Price per plate' : category === 'Invitations' ? 'Price per invite' : 'Price'

  return (
    <div className="min-h-dvh bg-white page-enter flex flex-col">
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`${base}/listings`)} className="text-sm">←</button>
          <p className="text-[14px] font-bold text-dark">Edit Listing</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-mustard text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
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

        {/* Catering menu */}
        {category === 'Catering' && (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1.5">Menu</label>
            <MenuBuilder value={menu} onChange={setMenu} />
          </div>
        )}

        {/* Venue plate packages — add/edit/remove tiers + their menus in place */}
        {category === 'Venue' && (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1.5">Plate packages</label>
            <div className="space-y-2.5">
              {platePackages.map((pkg, idx) => (
                <div key={pkg.id} className="rounded-xl border border-card-border p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => setPlatePackages(prev => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                      placeholder={`Package ${idx + 1} name`}
                      className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
                    />
                    <div className="relative w-[120px] shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                      <input
                        type="number" min={0} step={50}
                        value={pkg.pricePerPlate || ''}
                        onChange={(e) => setPlatePackages(prev => prev.map((p, i) => i === idx ? { ...p, pricePerPlate: Math.max(0, parseInt(e.target.value) || 0) } : p))}
                        placeholder="0"
                        className="w-full pl-6 pr-10 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">/plate</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlatePackages(prev => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove package"
                      className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
                    >×</button>
                  </div>
                  {/* Import another package's menu as a starting point. */}
                  {(() => {
                    const sources = platePackages.filter((p, i) => i !== idx && menuItemCount(p.menu) > 0)
                    if (sources.length === 0) return null
                    return (
                      <select
                        value=""
                        onChange={(e) => { if (e.target.value) importPackageMenu(idx, e.target.value) }}
                        className="w-full px-2.5 py-2 rounded-lg border border-dashed border-mustard/50 text-[11px] font-medium text-dark bg-white outline-none focus:border-mustard"
                      >
                        <option value="">↓ Import menu from another package…</option>
                        {sources.map((p) => (
                          <option key={p.id} value={p.id}>{p.name?.trim() || `Package ${platePackages.indexOf(p) + 1}`} ({menuItemCount(p.menu)} items)</option>
                        ))}
                      </select>
                    )
                  })()}

                  <details className="rounded-lg border border-card-border overflow-hidden">
                    <summary className="px-2.5 py-1.5 text-[11px] font-medium text-mustard cursor-pointer select-none">
                      Menu · {menuItemCount(pkg.menu)} items
                    </summary>
                    <div className="px-2 pb-2">
                      <MenuBuilder
                        value={pkg.menu || []}
                        onChange={(next) => setPlatePackages(prev => prev.map((p, i) => i === idx ? { ...p, menu: next } : p))}
                      />
                    </div>
                  </details>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlatePackages(prev => [...prev, { id: `pp-${Date.now()}-${prev.length}`, name: '', pricePerPlate: 0 }])}
              className="mt-2.5 w-full py-2.5 rounded-lg border border-dashed border-mustard/50 text-[11px] font-semibold text-mustard active:bg-mustard-light/40"
            >
              + Add package
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Count dishes offered across a menu (bank picks + custom dishes). */
function menuItemCount(m?: MenuSection[]): number {
  return (m || []).reduce((n, s) => n + s.dishIds.length + (s.customDishes?.length || 0), 0)
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
