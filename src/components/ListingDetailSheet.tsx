import { useState, useEffect } from 'react'
import { Vendor } from '@/lib/types'
import { useStore } from '@/lib/store'
import { parseCoordsFromMapLink, distanceLabel } from '@/lib/geo'
import { mockVendors, mockDesigns } from '@/lib/mock-data'
import { formatINR, bgStyle, getEffectivePrice, getPhotographyEventFromPrice, getPhotographyEventSelectionTotal, getOfferedEventServices, getPhotographyModels, getEntertainerFromPrice, getMehendiFromPrice, getMehendiSelectionTotal, getMakeupFromPrice, getMakeupSelectionTotal, getSareeDrapingFromPrice, getSareeSelectionTotal, getHairStylingFromPrice, getHairSelectionTotal, venueFitsGuestBucket } from '@/lib/helpers'
import { getListingConfig, MEHENDI_COVERAGES, MEHENDI_DESIGNS, mehendiDesignLabel, MAKEUP_EVENTS, MAKEUP_ADDONS } from '@/lib/vendor-category-config'
import type { MehendiPricing } from '@/lib/vendor-category-config'
import { buildBundleEntries } from '@/lib/bundle'
import VendorPortfolioSheet from './VendorPortfolioSheet'
import MenuPicker from './MenuPicker'

/** Format a 'HH:MM' (24h) time string as a 12-hour label, e.g. '09:00' → '9:00 AM'. */
function fmtTime(t?: string): string {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr)
  if (Number.isNaN(h)) return t
  const ampm = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:${(mStr ?? '00').padStart(2, '0')} ${ampm}`
}

/** Editable number display for a +/− stepper — lets users type a value directly
 *  instead of only tapping the buttons. Shows blank with a "0" placeholder when
 *  empty so the leading zero never gets in the way of typing. */
function StepperValueInput({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === 0 ? '' : String(value)}
      placeholder="0"
      onChange={e => {
        const digits = e.target.value.replace(/[^0-9]/g, '')
        let n = digits === '' ? 0 : parseInt(digits, 10)
        if (max != null) n = Math.min(max, n)
        onChange(Math.max(0, n))
      }}
      onFocus={e => e.target.select()}
      className="w-8 text-center text-[12px] font-semibold text-dark bg-transparent outline-none focus:bg-mustard-light/30"
    />
  )
}

/** Per-look/guest stepper rows (bridal/groom/guest), shared by Saree Draping and
 *  Hair Styling — both standalone listings and Makeup add-on sections. */
function PerLookGuestRows({ p, sel, onUpdate, labels }: {
  p: { bridalPricePerLook?: number; groomPricePerLook?: number; guestPricePerPerson?: number; prePleatingPricePerSaree?: number }
  sel: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number }
  onUpdate: (patch: { bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number }) => void
  labels: { bridal: string; groom: string; guest: string; prePleating?: string }
}) {
  const rows: { key: 'bridalLooks' | 'groomLooks' | 'guests' | 'prePleatingSarees'; label: string; price: number; unit: string }[] = []
  if ((p.bridalPricePerLook ?? 0) > 0) rows.push({ key: 'bridalLooks', label: labels.bridal, price: p.bridalPricePerLook!, unit: '/ look' })
  if ((p.groomPricePerLook ?? 0) > 0) rows.push({ key: 'groomLooks', label: labels.groom, price: p.groomPricePerLook!, unit: '/ look' })
  if ((p.guestPricePerPerson ?? 0) > 0) rows.push({ key: 'guests', label: labels.guest, price: p.guestPricePerPerson!, unit: '/ guest' })
  if (labels.prePleating && (p.prePleatingPricePerSaree ?? 0) > 0) rows.push({ key: 'prePleatingSarees', label: labels.prePleating, price: p.prePleatingPricePerSaree!, unit: '/ saree' })
  return (
    <div className="space-y-1.5">
      {rows.map(r => {
        const value = sel[r.key] || 0
        return (
          <div key={r.key} className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg transition-all ${value > 0 ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-dark truncate">{r.label}</p>
              <p className="text-[10px] text-gray-500">{formatINR(r.price)} {r.unit}</p>
            </div>
            <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
              <button type="button" onClick={() => onUpdate({ [r.key]: Math.max(0, value - 1) })} disabled={value <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
              <StepperValueInput value={value} onChange={v => onUpdate({ [r.key]: v })} />
              <button type="button" onClick={() => onUpdate({ [r.key]: value + 1 })} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Bridal coverage+design, groom, and guest controls for Mehendi — shared by the
 *  standalone Mehendi listing and the Makeup add-on section (some makeup artists
 *  also offer mehendi). */
function MehendiControls({ p, sel, onUpdate }: {
  p: MehendiPricing
  sel: { coverage?: string; design?: string; groom?: boolean; guests?: number }
  onUpdate: (patch: { coverage?: string; design?: string; groom?: boolean; guests?: number }) => void
}) {
  const offeredCoverages = MEHENDI_COVERAGES.filter(cov => MEHENDI_DESIGNS.some(d => (p.bridal?.[cov]?.[d] ?? 0) > 0))
  const designsFor = (cov?: string) => cov ? MEHENDI_DESIGNS.filter(d => (p.bridal?.[cov]?.[d] ?? 0) > 0) : []
  const groomOK = (p.groomPrice ?? 0) > 0
  const guestOK = (p.guestPricePerPerson ?? 0) > 0
  const guests = sel.guests || 0
  return (
    <div className="space-y-3">
      {/* Bridal coverage + design */}
      {p.bridalOffered && offeredCoverages.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Bridal mehendi</p>
          <p className="text-[10px] text-gray-500 mb-1">Coverage</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {offeredCoverages.map(cov => (
              <button
                key={cov}
                type="button"
                onClick={() => onUpdate({ coverage: cov, design: (designsFor(cov) as string[]).includes(sel.design || '') ? sel.design : undefined })}
                className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${sel.coverage === cov ? 'bg-magenta text-white' : 'bg-white border border-card-border text-gray-600'}`}
              >{cov}</button>
            ))}
          </div>
          {sel.coverage && (
            <>
              <p className="text-[10px] text-gray-500 mb-1">Design</p>
              <div className="flex flex-wrap gap-1.5">
                {designsFor(sel.coverage).map(d => {
                  const price = p.bridal?.[sel.coverage!]?.[d] ?? 0
                  const isSel = sel.design === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onUpdate({ design: d })}
                      className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${isSel ? 'bg-magenta text-white' : 'bg-white border border-card-border text-gray-600'}`}
                    >{mehendiDesignLabel(d)} · {formatINR(price)}</button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Groom */}
      {groomOK && (
        <button
          type="button"
          onClick={() => onUpdate({ groom: !sel.groom })}
          className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${sel.groom ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}
        >
          <span className="text-[12px] font-medium text-dark">{sel.groom ? '✓ ' : ''}Groom mehendi</span>
          <span className="text-[12px] font-semibold text-magenta">{formatINR(p.groomPrice!)}</span>
        </button>
      )}

      {/* Guests */}
      {guestOK && (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-medium text-dark">Guest mehendi</p>
            <p className="text-[10px] text-gray-500">{formatINR(p.guestPricePerPerson!)} / guest</p>
          </div>
          <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
            <button type="button" onClick={() => onUpdate({ guests: Math.max(0, guests - 1) })} disabled={guests <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
            <StepperValueInput value={guests} onChange={v => onUpdate({ guests: v })} />
            <button type="button" onClick={() => onUpdate({ guests: guests + 1 })} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Transport/logistics informational note shown inside a pricing box — whether it's
 *  included or not (no amount; it varies by distance). */
function TransportRow({ vendor }: { vendor: Vendor }) {
  if (vendor.transportIncluded === true) {
    return <div className="text-[11px] text-green-600">Transport &amp; logistics included</div>
  }
  if (vendor.transportIncluded === false) {
    return <div className="text-[11px] text-gray-500">Transport &amp; logistics not included</div>
  }
  return null
}

interface Props {
  vendor: Vendor
  onClose: () => void
  unlocked: boolean
  onSwitchListing?: (id: string) => void
  ritualId?: string
  categoryId?: string
  selectedTierHours?: number
  /** Vendor-side preview: shows a "how couples see this" banner. Rendered with
   *  no board context, so the couple-only board actions are already hidden. */
  preview?: boolean
}

/** Informational chips for a Photography event package — coverage duration,
 *  cinematic trailer, and approx delivery time. Renders nothing if none are set. */
function EventPackageInfoChips({ pkg }: { pkg: import('@/lib/vendor-category-config').PhotographyEventPackage }) {
  if (!pkg.durationHours && !pkg.cinematicTrailer && !pkg.deliveryDays) return null
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {pkg.durationHours ? (
        <span className="bg-white border border-card-border text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full">🕐 {pkg.durationHours} hrs coverage</span>
      ) : null}
      {pkg.cinematicTrailer ? (
        <span className="bg-white border border-card-border text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full">🎬 Cinematic trailer</span>
      ) : null}
      {pkg.deliveryDays ? (
        <span className="bg-white border border-card-border text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full">📦 ~{pkg.deliveryDays} day delivery</span>
      ) : null}
    </div>
  )
}

export default function ListingDetailSheet({ vendor, onClose, unlocked, onSwitchListing, ritualId, categoryId, selectedTierHours, preview = false }: Props) {
  const [showPortfolio, setShowPortfolio] = useState(false)
  // Photo lightbox: index into `gallery`, or null when closed.
  const [lightbox, setLightbox] = useState<number | null>(null)
  // Menu-photo zoom: a single menu image URL to show full-screen, or null.
  const [menuPhotoZoom, setMenuPhotoZoom] = useState<string | null>(null)
  const { _liveMode, _listingVendorMap, vendors: allVendors, selectVendorTier, addVenueToBoard, selectPhotographyEventServices, selectMehendiOptions, selectMakeupOptions, selectSareeOptions, selectHairOptions, selectMenuOptions, selectVendor, ritualBoards } = useStore()
  // The board category this sheet was opened from (reactive — re-reads on each render).
  const currentCategory = (ritualId && categoryId)
    ? ritualBoards.find(b => b.id === ritualId)?.categories.find(c => c.id === categoryId)
    : undefined
  // Saved menu picks for this listing keyed by package (or 'listing' for a
  // package-less catering menu), + a persist handler (only when we have a board
  // context to save against).
  const menuPicksFor = (packageKey: string) => currentCategory?.menuSelection?.[vendor.id]?.[packageKey]
  function menuOnChange(packageKey: string) {
    const rid = ritualId, cid = categoryId
    if (!rid || !cid) return undefined
    return (picks: Record<string, (number | string)[]>) => selectMenuOptions(rid, cid, vendor.id, packageKey, picks)
  }
  // Reference-only menu photos: a thumbnail grid; tap to zoom. Used for both the
  // catering listing menu and per-plate package menus when the vendor uploaded
  // photos instead of building the menu dish-by-dish.
  function renderMenuPhotos(photos: string[]) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setMenuPhotoZoom(src)}
            className="aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border border-card-border"
          >
            <img src={src} alt={`Menu ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )
  }

  // Whether this exact vendor is the one currently added to the board for this category.
  const isAddedToBoard = !!currentCategory && currentCategory.selectedVendorId === vendor.id
  // Local mock-up state: how many of each paid room the couple is interested in.
  // Not persisted — only here to visualize the inventory cap + a separate subtotal.
  const [roomSelections, setRoomSelections] = useState<Record<string, number>>({})
  const [roomsExpanded, setRoomsExpanded] = useState(false)

  // ── Photography event-based package (the only pricing model) ──
  // Each event package is its own couple-facing listing, so this vendor carries a
  // single package. Couples tick the services they want; the total is their sum.
  const photoModels = getPhotographyModels(vendor)
  const savedEventSel = currentCategory?.photographyEventSelection
  const eventPkg = vendor.eventPackages?.[0]
  const offeredEventServices = getOfferedEventServices(eventPkg)
  const [eventServices, setEventServices] = useState<string[]>(() =>
    savedEventSel?.services ?? offeredEventServices.map(s => s.key),
  )
  function persistEventServices(services: string[]) {
    if (ritualId && categoryId) selectPhotographyEventServices(ritualId, categoryId, services)
  }
  function toggleEventService(key: string) {
    const next = eventServices.includes(key) ? eventServices.filter(k => k !== key) : [...eventServices, key]
    setEventServices(next)
    persistEventServices(next)
  }
  function addPhotographerEvent() {
    if (!ritualId || !categoryId) return
    persistEventServices(eventServices)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Mehendi selection (bridal coverage + design, groom, guests) ──
  const savedMehendi = currentCategory?.mehendiSelection
  const [mehendiSel, setMehendiSel] = useState<{ coverage?: string; design?: string; groom?: boolean; guests?: number }>(
    () => savedMehendi ?? {},
  )
  function updateMehendi(patch: Partial<typeof mehendiSel>) {
    const next = { ...mehendiSel, ...patch }
    setMehendiSel(next)
    if (ritualId && categoryId) selectMehendiOptions(ritualId, categoryId, next)
  }
  function addMehendi() {
    if (!ritualId || !categoryId) return
    selectMehendiOptions(ritualId, categoryId, mehendiSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Makeup selection (looks per bridal event, groom, guests) ──
  const savedMakeup = currentCategory?.makeupSelection
  const [makeupSel, setMakeupSel] = useState<{ eventLooks?: Record<string, number>; groom?: boolean; guests?: number; addons?: string[] }>(
    () => savedMakeup ?? {},
  )
  function updateMakeup(patch: Partial<typeof makeupSel>) {
    const next = { ...makeupSel, ...patch }
    setMakeupSel(next)
    if (ritualId && categoryId) selectMakeupOptions(ritualId, categoryId, next)
  }
  function toggleMakeupAddon(addon: string) {
    const cur = makeupSel.addons || []
    updateMakeup({ addons: cur.includes(addon) ? cur.filter(a => a !== addon) : [...cur, addon] })
  }
  function setEventLooks(event: string, looks: number) {
    updateMakeup({ eventLooks: { ...makeupSel.eventLooks, [event]: Math.max(0, looks) } })
  }
  function addMakeup() {
    if (!ritualId || !categoryId) return
    selectMakeupOptions(ritualId, categoryId, makeupSel)
    // Makeup artists can also offer mehendi / saree draping / hairstyling — persist those too.
    if (vendor.mehendiPricing) selectMehendiOptions(ritualId, categoryId, mehendiSel)
    if (vendor.sareeDrapingPricing) selectSareeOptions(ritualId, categoryId, sareeSel)
    if (vendor.hairStylingPricing) selectHairOptions(ritualId, categoryId, hairSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Saree Draping selection (bridal looks, groom looks, guests) ──
  const savedSaree = currentCategory?.sareeSelection
  const [sareeSel, setSareeSel] = useState<{ bridalLooks?: number; groomLooks?: number; guests?: number; prePleatingSarees?: number }>(
    () => savedSaree ?? {},
  )
  function updateSaree(patch: Partial<typeof sareeSel>) {
    const next = { ...sareeSel, ...patch }
    setSareeSel(next)
    if (ritualId && categoryId) selectSareeOptions(ritualId, categoryId, next)
  }
  function addSaree() {
    if (!ritualId || !categoryId) return
    selectSareeOptions(ritualId, categoryId, sareeSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

  // ── Hair Styling selection (bridal looks, groom looks, guests) ──
  const savedHair = currentCategory?.hairSelection
  const [hairSel, setHairSel] = useState<{ bridalLooks?: number; groomLooks?: number; guests?: number }>(
    () => savedHair ?? {},
  )
  function updateHair(patch: Partial<typeof hairSel>) {
    const next = { ...hairSel, ...patch }
    setHairSel(next)
    if (ritualId && categoryId) selectHairOptions(ritualId, categoryId, next)
  }
  function addHair() {
    if (!ritualId || !categoryId) return
    selectHairOptions(ritualId, categoryId, hairSel)
    selectVendor(ritualId, categoryId, vendor.id)
  }

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

  // Lightbox keyboard nav: ← / → to move, Esc to close.
  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      else if (e.key === 'ArrowRight' && gallery.length > 1) setLightbox((i) => (i === null ? i : (i + 1) % gallery.length))
      else if (e.key === 'ArrowLeft' && gallery.length > 1) setLightbox((i) => (i === null ? i : (i - 1 + gallery.length) % gallery.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, gallery.length])

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
        if (field.type === 'range') {
          // Stored as [min, max]; legacy single values render as a plain number.
          const [lo, hi] = Array.isArray(raw) ? raw : [raw, raw]
          const unit = field.numberUnit ? ` ${field.numberUnit}` : ''
          display = String(lo) === String(hi) ? `${lo}${unit}` : `${lo}–${hi}${unit}`
        } else if (Array.isArray(raw)) {
          display = raw.join(', ')
        } else if (field.type === 'slider' && field.sliderUnit) {
          display = `${raw} ${field.sliderUnit}`
        } else if (field.type === 'number' && field.numberUnit) {
          // Parse the leading number so legacy string values (e.g. "50 cars",
          // "200+ cars") don't double up the unit into "50 cars cars".
          const n = parseInt(String(raw), 10)
          display = Number.isFinite(n) ? `${n} ${field.numberUnit}` : String(raw)
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

  // Soft capacity match: for a venue opened from a board, flag it when its
  // guest-capacity range covers the couple's guest count for that event.
  const eventGuestBucket = (() => {
    if (!ritualId) return undefined
    const board = ritualBoards.find(b => b.id === ritualId)
    return board ? onboardingData?.eventGuests?.[board.name] : undefined
  })()
  const capacityFits = derivedCategory === 'Venue' && venueFitsGuestBucket(categoryFields.capacity, eventGuestBucket)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center md:items-center md:p-6" onClick={onClose}>
        <div className="bg-white rounded-t-2xl w-full max-w-[480px] max-h-[85vh] overflow-y-auto md:rounded-2xl md:max-w-[880px] md:max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
          {preview && (
            <div className="sticky top-0 z-30 bg-mustard text-white text-[11px] font-semibold px-4 py-2 flex items-center gap-2">
              <span>👁</span>
              <span>Preview — this is how couples see your listing</span>
            </div>
          )}
          {/* Hero */}
          <div
            className={`h-44 md:h-60 relative ${gallery.length > 0 ? 'cursor-pointer' : ''}`}
            style={bgStyle(vendor.photo)}
            onClick={() => { if (gallery.length > 0) setLightbox(Math.max(0, gallery.indexOf(vendor.photo))) }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button onClick={(e) => { e.stopPropagation(); onClose() }} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white text-sm">✕</span>
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white font-bold text-lg">{unlocked ? vendor.name : (vendor.publicCode || vendor.code)}</p>
              {parentVendor && (
                <p className="text-white/70 text-[10px] mt-0.5">by {unlocked ? parentVendor.name : (parentVendor.publicCode || parentVendor.code)}</p>
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

            {/* Photography pricing — event-based packages (the only pricing model) */}
            {photoModels.length > 0 && eventPkg && (
              <div className="mb-4">

            {eventPkg && (() => {
              const fromPrice = getPhotographyEventFromPrice(vendor.eventPackages)
              const pkgs = vendor.eventPackages ?? []

              // Vendor preview shows the whole authored listing (multiple packages) —
              // render them all read-only. Couples only ever see a single package
              // (each is fanned out into its own listing), which stays interactive.
              if (pkgs.length > 1) {
                return (
                  <div>
                    <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)} <span className="text-[12px] font-normal text-gray-400">/ event</span></p>
                    <p className="text-[10px] text-gray-400 mb-3">{pkgs.length} event packages · flat per-service pricing, per event</p>
                    <div className="space-y-3">
                      {pkgs.map(pkg => {
                        const services = getOfferedEventServices(pkg)
                        return (
                          <div key={pkg.id} className="p-3 rounded-xl border border-card-border bg-white">
                            {pkg.events.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {pkg.events.map(ev => (
                                  <span key={ev} className="bg-empty-bg text-gray-600 text-[10px] font-medium px-2 py-1 rounded-full">{ev}</span>
                                ))}
                              </div>
                            )}
                            <EventPackageInfoChips pkg={pkg} />
                            <div className="divide-y divide-card-border">
                              {services.map(service => (
                                <div key={service.key} className="flex items-center justify-between py-1.5">
                                  <span className="text-[12px] text-dark">{service.label}</span>
                                  <span className="text-[12px] font-semibold text-dark">{formatINR(pkg.prices[service.key] ?? 0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              const total = getPhotographyEventSelectionTotal(vendor, { services: eventServices }) ?? 0
              return (
                <div>
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)} <span className="text-[12px] font-normal text-gray-400">/ event</span></p>
                  <p className="text-[10px] text-gray-400 mb-3">Prices are per event — pick the services you want below.</p>

                  {/* Events this vendor covers, at the same per-event pricing */}
                  {eventPkg.events.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] text-gray-500 mb-1.5">This vendor also does these events — the same per-event pricing applies to each:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {eventPkg.events.map(ev => (
                          <span key={ev} className="bg-empty-bg text-gray-600 text-[10px] font-medium px-2 py-1 rounded-full">{ev}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coverage duration, cinematic trailer, delivery */}
                  <EventPackageInfoChips pkg={eventPkg} />

                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                    <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Services</p>
                    <div className="space-y-1.5">
                      {offeredEventServices.map(service => {
                        const price = eventPkg.prices[service.key] ?? 0
                        const on = eventServices.includes(service.key)
                        return (
                          <button
                            key={service.key}
                            type="button"
                            onClick={() => toggleEventService(service.key)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all ${on ? 'border-magenta bg-white' : 'border-card-border bg-white/60'}`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${on ? 'border-magenta bg-magenta' : 'border-gray-300 bg-white'}`}>
                                {on && <span className="text-white text-[9px] leading-none">✓</span>}
                              </span>
                              <span className="text-[12px] font-medium text-dark truncate">{service.label}</span>
                            </span>
                            <span className="text-[12px] font-semibold text-dark shrink-0">{formatINR(price)}</span>
                          </button>
                        )
                      })}
                    </div>

                    {total > 0 && (
                      <div className="mt-3 pt-3 border-t border-mustard/20 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-dark">Estimated total <span className="font-normal text-gray-400">/ event</span></span>
                        <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                      </div>
                    )}

                    {/* Add to board — lock in this photographer + event package for the category */}
                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addPhotographerEvent}
                        disabled={total <= 0}
                        className={`mt-3 w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40 ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total > 0 ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}
              </div>
            )}

            {/* Hosts / Entertainers — flat price per event (couple sees a single fanned event) */}
            {vendor.entertainerPricing && (vendor.entertainerPricing.eventRates?.length ?? 0) > 0 && (() => {
              const p = vendor.entertainerPricing!
              const rates = p.eventRates.filter(r => r.price > 0)
              if (rates.length === 0) return null
              const fromPrice = getEntertainerFromPrice(p)

              const details = (
                <>
                  {(p.durationHours || p.additionalHourCharge) ? (
                    <div className="space-y-1.5">
                      {p.durationHours ? (
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-gray-600">Performance duration</span>
                          <span className="font-semibold text-dark">{p.durationHours} hrs</span>
                        </div>
                      ) : null}
                      {p.additionalHourCharge ? (
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-gray-600">Additional hour</span>
                          <span className="font-semibold text-dark">{formatINR(p.additionalHourCharge)} / hr</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {p.languages && p.languages.length > 0 && (
                    <div className={`${(p.durationHours || p.additionalHourCharge) ? 'mt-3 pt-3 border-t border-mustard/20' : ''}`}>
                      <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.languages.map(lang => (
                          <span key={lang} className="bg-white border border-card-border text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full">{lang}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )

              // Vendor preview (multiple events) → read-only list of every event + price.
              if (rates.length > 1) {
                return (
                  <div className="mb-4">
                    <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                    <p className="text-[10px] text-gray-400 mb-3">{rates.length} events · flat price each</p>
                    <div className="rounded-xl border border-card-border divide-y divide-card-border mb-3">
                      {rates.map(r => (
                        <div key={r.id} className="flex items-center justify-between px-3 py-2.5">
                          <span className="text-[12px] text-dark">{r.event}</span>
                          <span className="text-[12px] font-semibold text-dark">{formatINR(r.price)}</span>
                        </div>
                      ))}
                    </div>
                    {(p.durationHours || p.additionalHourCharge || (p.languages?.length ?? 0) > 0) && (
                      <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">{details}</div>
                    )}
                  </div>
                )
              }

              // Couple-facing single fanned event → flat price + add to board.
              const rate = rates[0]
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">{formatINR(rate.price)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Flat price for {rate.event}</p>
                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                    {details}
                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={() => selectVendor(ritualId, categoryId, vendor.id)}
                        className={`${(p.durationHours || p.additionalHourCharge || (p.languages?.length ?? 0) > 0) ? 'mt-3' : ''} w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard ? '✓ Added to your board' : `Add to my board · ${formatINR(rate.price)}`}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Mehendi — standalone listing (a Makeup listing folds mehendi into its block below) */}
            {vendor.mehendiPricing && !vendor.makeupPricing && (() => {
              const p = vendor.mehendiPricing
              const fromPrice = getMehendiFromPrice(p)
              const baseTotal = getMehendiSelectionTotal(vendor, mehendiSel)
              const total = baseTotal
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-2">Pick what you need — your price updates live</p>
                  {p.conesIncluded !== undefined && (
                    <span className={`inline-block text-[10px] font-medium px-2 py-1 rounded-full mb-3 ${p.conesIncluded ? 'bg-green-100 text-green-700' : 'bg-empty-bg text-gray-500'}`}>
                      {p.conesIncluded ? '✓ Mehendi cones included' : 'Mehendi cones not included'}
                    </span>
                  )}

                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-3">
                    <MehendiControls p={p} sel={mehendiSel} onUpdate={updateMehendi} />

                    {/* Total */}
                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 space-y-1">
                        <TransportRow vendor={vendor} />
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                          <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                        </div>
                      </div>
                    )}

                    {/* Add to board */}
                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addMehendi}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Makeup — interactive pricing picker (bridal events, groom, guests) */}
            {vendor.makeupPricing && (() => {
              const p = vendor.makeupPricing
              const fromPrice = getMakeupFromPrice(p)
              // Standard events, plus any custom key (e.g. 'simple' mode's single
              // overall bridal entry) so both pricing modes render.
              const offeredEvents = [
                ...MAKEUP_EVENTS.filter(e => (p.bridalByEvent?.[e] ?? 0) > 0),
                ...Object.keys(p.bridalByEvent || {}).filter(k => !(MAKEUP_EVENTS as readonly string[]).includes(k) && (p.bridalByEvent[k] ?? 0) > 0),
              ]
              const offeredAddons = MAKEUP_ADDONS.filter(a => (p.addons?.[a] ?? 0) > 0)
              const groomOK = (p.groomPrice ?? 0) > 0
              const guestOK = (p.guestPricePerPerson ?? 0) > 0
              const makeupTotal = getMakeupSelectionTotal(vendor, makeupSel)
              const guests = makeupSel.guests || 0
              // Optional add-ons (some makeup artists also offer mehendi / saree draping / hairstyling).
              const mp = vendor.mehendiPricing
              const sp = vendor.sareeDrapingPricing
              const hp = vendor.hairStylingPricing
              const mehendiTotal = mp ? getMehendiSelectionTotal(vendor, mehendiSel) : null
              const sareeTotal = sp ? getSareeSelectionTotal(vendor, sareeSel) : null
              const hairTotal = hp ? getHairSelectionTotal(vendor, hairSel) : null
              const total = makeupTotal != null || mehendiTotal != null || sareeTotal != null || hairTotal != null
                ? (makeupTotal ?? 0) + (mehendiTotal ?? 0) + (sareeTotal ?? 0) + (hairTotal ?? 0) : null
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Choose how many looks per category — your price updates live</p>

                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-3">
                    {/* Bridal looks per event */}
                    {offeredEvents.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Bridal makeup · looks per category</p>
                        <div className="space-y-1.5">
                          {offeredEvents.map(e => {
                            const looks = makeupSel.eventLooks?.[e] || 0
                            return (
                              <div key={e} className={`flex items-center justify-between gap-2 py-2 px-3 rounded-lg transition-all ${looks > 0 ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-medium text-dark leading-tight">{e}</p>
                                  <p className="text-[10px] text-gray-500">{formatINR(p.bridalByEvent[e])} / look</p>
                                </div>
                                <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                                  <button type="button" onClick={() => setEventLooks(e, looks - 1)} disabled={looks <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
                                  <StepperValueInput value={looks} onChange={v => setEventLooks(e, v)} />
                                  <button type="button" onClick={() => setEventLooks(e, looks + 1)} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Groom */}
                    {groomOK && (
                      <button
                        type="button"
                        onClick={() => updateMakeup({ groom: !makeupSel.groom })}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${makeupSel.groom ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}
                      >
                        <span className="text-[12px] font-medium text-dark">{makeupSel.groom ? '✓ ' : ''}Groom makeup</span>
                        <span className="text-[12px] font-semibold text-magenta">{formatINR(p.groomPrice!)}</span>
                      </button>
                    )}

                    {/* Guests */}
                    {guestOK && (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-medium text-dark">Guest makeup</p>
                          <p className="text-[10px] text-gray-500">{formatINR(p.guestPricePerPerson!)} / guest</p>
                        </div>
                        <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
                          <button type="button" onClick={() => updateMakeup({ guests: Math.max(0, guests - 1) })} disabled={guests <= 0} className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
                          <StepperValueInput value={guests} onChange={v => updateMakeup({ guests: v })} />
                          <button type="button" onClick={() => updateMakeup({ guests: guests + 1 })} className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
                        </div>
                      </div>
                    )}

                    {/* Makeup add-ons (lashes, extensions, etc.) */}
                    {offeredAddons.length > 0 && (
                      <div className="pt-3 border-t border-mustard/20">
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Add-ons</p>
                        <div className="space-y-1.5">
                          {offeredAddons.map(a => {
                            const sel = (makeupSel.addons || []).includes(a)
                            return (
                              <button
                                key={a}
                                type="button"
                                onClick={() => toggleMakeupAddon(a)}
                                className={`w-full flex items-center justify-between py-2 px-3 rounded-lg text-left transition-all ${sel ? 'border-2 border-magenta bg-magenta-light' : 'border border-card-border bg-white'}`}
                              >
                                <span className="text-[12px] font-medium text-dark">{sel ? '✓ ' : ''}{a}</span>
                                <span className="text-[12px] font-semibold text-magenta">{formatINR(p.addons![a])}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Mehendi add-on (this makeup artist also offers it) */}
                    {mp && (
                      <div className="pt-3 border-t border-mustard/20">
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Mehendi <span className="text-gray-400 font-normal normal-case">· add-on</span></p>
                        <MehendiControls p={mp} sel={mehendiSel} onUpdate={updateMehendi} />
                      </div>
                    )}

                    {/* Saree draping add-on (this makeup artist also offers it) */}
                    {sp && (
                      <div className="pt-3 border-t border-mustard/20">
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Saree draping <span className="text-gray-400 font-normal normal-case">· add-on</span></p>
                        <PerLookGuestRows p={sp} sel={sareeSel} onUpdate={updateSaree} labels={{ bridal: 'Bridal saree draping', groom: 'Groom panche draping', guest: 'Guest saree draping', prePleating: 'Saree pre-pleating' }} />
                      </div>
                    )}

                    {/* Hairstyling add-on (this makeup artist also offers it) */}
                    {hp && (
                      <div className="pt-3 border-t border-mustard/20">
                        <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Hairstyling <span className="text-gray-400 font-normal normal-case">· add-on</span></p>
                        <PerLookGuestRows p={hp} sel={hairSel} onUpdate={updateHair} labels={{ bridal: 'Bridal hairstyling', groom: 'Groom hairstyling', guest: 'Guest hairstyling' }} />
                      </div>
                    )}

                    {/* Simple mode: what each look includes (no separate pricing). */}
                    {p.mode === 'simple' && p.simpleIncludes && (() => {
                      const rows = [
                        ...offeredEvents.map(ev => ({ key: ev, label: ev, draping: 'Saree draping' })),
                        ...(groomOK ? [{ key: 'groom', label: 'Groom makeup', draping: 'Vesti draping' }] : []),
                        ...(guestOK ? [{ key: 'guest', label: 'Guest makeup', draping: 'Saree draping' }] : []),
                      ].map(r => {
                        const inc = p.simpleIncludes?.[r.key]
                        const items = [inc?.draping ? r.draping : null, inc?.hair ? 'Hair styling' : null, inc?.mehendi ? 'Mehendi' : null].filter(Boolean) as string[]
                        return { label: r.label, items }
                      }).filter(r => r.items.length > 0)
                      if (rows.length === 0) return null
                      return (
                        <div className="pt-3 border-t border-mustard/20">
                          <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">What's included</p>
                          <div className="space-y-2">
                            {rows.map(r => (
                              <div key={r.label}>
                                <p className="text-[11px] font-medium text-dark mb-0.5">{r.label}</p>
                                <div className="flex flex-wrap gap-1">
                                  {r.items.map(it => <span key={it} className="py-0.5 px-2 rounded-full text-[10px] font-medium bg-empty-bg text-gray-700 border border-card-border">{it}</span>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 space-y-1">
                        <TransportRow vendor={vendor} />
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                          <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                        </div>
                      </div>
                    )}

                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addMakeup}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Saree Draping — standalone listing (a Makeup listing folds saree into its block above) */}
            {vendor.sareeDrapingPricing && !vendor.makeupPricing && (() => {
              const p = vendor.sareeDrapingPricing
              const fromPrice = getSareeDrapingFromPrice(p)
              const baseTotal = getSareeSelectionTotal(vendor, sareeSel)
              const total = baseTotal
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Choose how many you need — your price updates live</p>
                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-2">
                    <PerLookGuestRows p={p} sel={sareeSel} onUpdate={updateSaree} labels={{ bridal: 'Bridal saree draping', groom: 'Groom panche draping', guest: 'Guest saree draping', prePleating: 'Saree pre-pleating' }} />

                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 space-y-1">
                        <TransportRow vendor={vendor} />
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                          <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                        </div>
                      </div>
                    )}

                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addSaree}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Hair Styling — standalone listing (a Makeup listing folds hair into its block above) */}
            {vendor.hairStylingPricing && !vendor.makeupPricing && (() => {
              const p = vendor.hairStylingPricing
              const fromPrice = getHairStylingFromPrice(p)
              const baseTotal = getHairSelectionTotal(vendor, hairSel)
              const total = baseTotal
              return (
                <div className="mb-4">
                  <p className="text-[20px] font-bold text-magenta">From {formatINR(fromPrice)}</p>
                  <p className="text-[10px] text-gray-400 mb-3">Choose how many you need — your price updates live</p>
                  <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20 space-y-2">
                    <PerLookGuestRows p={p} sel={hairSel} onUpdate={updateHair} labels={{ bridal: 'Bridal hairstyling', groom: 'Groom hairstyling', guest: 'Guest hairstyling' }} />

                    {total != null && (
                      <div className="pt-3 border-t border-mustard/20 space-y-1">
                        <TransportRow vendor={vendor} />
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-dark">Estimated total</span>
                          <span className="text-[16px] font-bold text-magenta">{formatINR(total)}</span>
                        </div>
                      </div>
                    )}

                    {ritualId && categoryId && (
                      <button
                        type="button"
                        onClick={addHair}
                        className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          isAddedToBoard
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-magenta text-white active:scale-[0.98]'
                        }`}
                      >
                        {isAddedToBoard
                          ? '✓ Added to your board'
                          : total != null ? `Add to my board · ${formatINR(total)}` : 'Add to my board'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Price (non rate-card / non-mehendi / non-makeup / non-saree / non-hair listings) */}
            {!vendor.eventPackages?.length && !vendor.entertainerPricing && !vendor.mehendiPricing && !vendor.makeupPricing && !vendor.sareeDrapingPricing && !vendor.hairStylingPricing && (
            <p className="text-[20px] font-bold text-magenta">{formatINR(getEffectivePrice(vendor, selectedTierHours))}</p>
            )}
            {vendor.hourlyPricing && vendor.hourlyPricing.length > 0 && (
              <p className="text-[10px] text-gray-400">
                {selectedTierHours ? `For ${selectedTierHours} hr rental` : `Default venue rent`}
              </p>
            )}
            {vendor.category === 'Venue' && vendor.venuePricingModels?.includes('perPlate') && !vendor.hourlyPricing && (
              <p className="text-[10px] text-gray-400">
                Per plate{(vendor.platePackages?.length ?? 0) > 1 ? ' · from' : ''}
              </p>
            )}
            {vendor.sizes && vendor.sizes.length > 0 && (
              <p className="text-[10px] text-gray-400">Starting price · varies by size below</p>
            )}
            {/* Transport & logistics — informational yes/no only (varies by distance, no amount) */}
            {!vendor.eventPackages?.length && !vendor.entertainerPricing && !vendor.mehendiPricing && !vendor.makeupPricing && !vendor.sareeDrapingPricing && !vendor.hairStylingPricing && (vendor.transportIncluded === true ? (
              <>
                <p className="text-[10px] text-green-600 mt-1 pl-3 relative before:content-['•'] before:absolute before:left-0">
                  Transport &amp; logistics included
                </p>
                <div className="mb-3" />
              </>
            ) : vendor.transportIncluded === false ? (
              <>
                <p className="text-[10px] text-gray-500 mt-1 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                  Transport &amp; logistics not included
                </p>
                <div className="mb-3" />
              </>
            ) : (
              <div className="mb-3" />
            ))}

            {/* Size & pricing options — decor designs with size variants */}
            {vendor.sizes && vendor.sizes.length > 0 && (
              <div className="mb-4 p-2.5 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1.5">Available sizes</p>
                <div className="flex flex-col gap-1.5">
                  {vendor.sizes.map((sz, i) => (
                    <div
                      key={i}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-card-border"
                    >
                      <span className="text-[12px] font-medium text-dark">
                        {sz.widthFt} ft × {sz.heightFt} ft
                      </span>
                      <span className="text-[12px] font-semibold text-magenta">{formatINR(sz.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Per-plate packages (Venue per-plate model) */}
            {vendor.category === 'Venue' && vendor.venuePricingModels?.includes('perPlate') && vendor.platePackages && vendor.platePackages.length > 0 && (
              <div className="mb-4 p-2.5 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1">Per-plate packages</p>
                {ritualId && categoryId && (
                  <p className="text-[10px] text-gray-500 mb-1.5">
                    {currentCategory?.platePackageByVendor?.[vendor.id]
                      ? '✓ On your board — tap another to switch package'
                      : 'Pick the package you want to add this venue to your board'}
                  </p>
                )}
                {/* Venue-level service time slots — shared across all packages */}
                {vendor.slots && vendor.slots.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {vendor.slots.map((s) => {
                      const range = s.from && s.to ? `${fmtTime(s.from)}–${fmtTime(s.to)}` : (s.from ? fmtTime(s.from) : '')
                      return (
                        <span key={s.id} className="bg-white border border-card-border text-[9px] text-gray-600 px-2 py-0.5 rounded-full">
                          {s.name?.trim() || 'Slot'}{range ? ` · ${range}` : ''}
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {vendor.platePackages.map((pkg) => {
                    const selectable = !!(ritualId && categoryId)
                    const pkgSelected = currentCategory?.platePackageByVendor?.[vendor.id] === pkg.id
                    return (
                    <div key={pkg.id} className={`w-full rounded-lg bg-white border overflow-hidden ${pkgSelected ? 'border-2 border-mustard' : 'border-card-border'}`}>
                      <button
                        type="button"
                        disabled={!selectable}
                        onClick={() => { if (selectable) addVenueToBoard(ritualId!, categoryId!, vendor.id, pkg.id) }}
                        className={`w-full flex items-center justify-between py-2 px-3 text-left ${selectable ? 'active:bg-mustard-light/30' : 'cursor-default'}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {selectable && (
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${pkgSelected ? 'border-mustard' : 'border-gray-300'}`}>
                              {pkgSelected && <span className="w-2 h-2 rounded-full bg-mustard" />}
                            </span>
                          )}
                          <span className="text-[12px] font-medium text-dark truncate">
                            {pkg.name?.trim() || 'Per plate'}
                            {pkg.minPlates ? <span className="text-[10px] text-gray-400 font-normal"> · min {pkg.minPlates}</span> : null}
                          </span>
                        </span>
                        <span className="text-[12px] font-semibold text-magenta shrink-0">{formatINR(pkg.pricePerPlate)} <span className="text-[10px] font-normal text-gray-400">/plate</span></span>
                      </button>
                      {(() => {
                        const pkgShowPhotos = pkg.menuMode === 'photos' && (pkg.menuPhotos?.length ?? 0) > 0
                        const pkgShowPicker = !pkgShowPhotos && (pkg.menu?.length ?? 0) > 0
                        if (!pkgShowPhotos && !pkgShowPicker) return null
                        return (
                          <details className="border-t border-card-border">
                            <summary className="px-3 py-1.5 text-[10px] font-medium text-mustard cursor-pointer select-none">View menu</summary>
                            <div className="px-2.5 pb-2.5">
                              {pkgShowPhotos ? renderMenuPhotos(pkg.menuPhotos!) : (
                                <MenuPicker
                                  key={pkg.id}
                                  menu={pkg.menu!}
                                  initialPicks={menuPicksFor(pkg.id)}
                                  onPicksChange={menuOnChange(pkg.id)}
                                />
                              )}
                            </div>
                          </details>
                        )
                      })()}
                    </div>
                  )})}
                </div>
              </div>
            )}

            {/* Venue location */}
            {vendor.category === 'Venue' && vendor.venueLocation?.address && (
              <div className="mb-4 p-3 rounded-xl bg-empty-bg border border-card-border">
                <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-1">Location</p>
                <p className="text-[11px] text-gray-700 leading-relaxed">{vendor.venueLocation.address}</p>
                {(vendor.venueLocation.area || vendor.venueLocation.city) && (
                  <p className="text-[10px] text-gray-500 mt-0.5">{[vendor.venueLocation.area, vendor.venueLocation.city].filter(Boolean).join(', ')}</p>
                )}
                {(() => {
                  const cc = onboardingData?.locationLat != null && onboardingData?.locationLng != null
                    ? { lat: onboardingData.locationLat, lng: onboardingData.locationLng } : null
                  const loc = vendor.venueLocation!
                  const vc = loc.lat != null && loc.lng != null
                    ? { lat: loc.lat, lng: loc.lng }
                    : parseCoordsFromMapLink(loc.mapsLink)
                  const label = distanceLabel(cc, vc)
                  return label ? <p className="text-[10px] font-semibold text-magenta mt-1">📍 {label} from you</p> : null
                })()}
                {vendor.venueLocation.mapsLink && (
                  <a
                    href={vendor.venueLocation.mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-magenta active:opacity-70"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 0112 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>
                    View on map
                  </a>
                )}
              </div>
            )}

            {/* In-house decor (Venue) — priced separately; policy governs outside decorators */}
            {vendor.category === 'Venue' && vendor.inHouseDecor && (() => {
              const ihd = vendor.inHouseDecor
              const policy = ihd.outsideDecorPolicy ?? (ihd.compulsory ? 'notAllowed' : 'allowedFree')
              return (
              <div className="mb-4 p-3 rounded-xl bg-magenta-light/40 border border-magenta/20">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-dark">
                    {policy === 'notAllowed' ? 'In-house decor — required' : 'In-house decor'}
                  </p>
                  {ihd.startingPrice ? <p className="text-[11px] font-semibold text-magenta">From {formatINR(ihd.startingPrice)}</p> : null}
                </div>
                <p className="text-[10px] text-gray-600 mb-2">
                  {policy === 'notAllowed'
                    ? 'This venue requires its in-house decor, priced separately from the venue.'
                    : policy === 'royalty'
                    ? `You may bring an outside decorator${ihd.outsideDecorRoyalty ? ` for a ${formatINR(ihd.outsideDecorRoyalty)} royalty` : ' for a royalty'}, or use the venue's in-house decor.`
                    : "You may bring your own decorator, or use the venue's in-house decor."}
                </p>
                {unlocked && ihd.decoratorPhone && (
                  <p className="text-[10px] text-gray-700 mb-2">
                    Decorator: <a href={`tel:${ihd.decoratorPhone}`} className="font-medium text-magenta">{ihd.decoratorPhone}</a>
                  </p>
                )}
                {ihd.designs && ihd.designs.length > 0 ? (
                  <div className="space-y-1.5">
                    {ihd.designs.map((d) => {
                      const from = (d.sizes?.length || 0) > 0
                        ? Math.min(...(d.sizes || []).map(s => s.price).filter(p => p > 0))
                        : d.price
                      return (
                        <div key={d.id} className="flex items-center gap-2.5 bg-white rounded-lg px-2.5 py-1.5">
                          {d.photos[0] && <img src={d.photos[0]} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />}
                          <span className="text-[11px] font-medium text-dark truncate flex-1">{d.name?.trim() || 'Decor design'}</span>
                          <span className="text-[11px] font-semibold text-magenta shrink-0">{from > 0 ? formatINR(from) : '—'}{(d.sizes?.length || 0) > 0 ? <span className="text-[9px] font-normal text-gray-400"> from</span> : null}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">Decor details coming soon.</p>
                )}
              </div>
              )
            })()}

            {/* Soft capacity match — venue fits the couple's guest count for this event */}
            {capacityFits && eventGuestBucket && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
                <span className="text-green-600 text-[13px] leading-none">✓</span>
                <p className="text-[12px] font-medium text-green-700">Fits your {eventGuestBucket} guests</p>
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
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightbox(i)}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
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

            {/* Catering menu — photos (reference-only) if the vendor uploaded them,
                otherwise the interactive dish picker per section. */}
            {(() => {
              const showPhotos = vendor.menuMode === 'photos' && (vendor.menuPhotos?.length ?? 0) > 0
              const showPicker = !showPhotos && (vendor.menu?.length ?? 0) > 0
              if (!showPhotos && !showPicker) return null
              return (
                <div className="mb-4">
                  <p className="text-[10px] font-semibold text-dark uppercase tracking-wider mb-2">Menu</p>
                  {showPhotos ? renderMenuPhotos(vendor.menuPhotos!) : (
                    <MenuPicker
                      menu={vendor.menu!}
                      initialPicks={menuPicksFor('listing')}
                      onPicksChange={menuOnChange('listing')}
                    />
                  )}
                </div>
              )
            })()}

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

      {/* Photo lightbox — tap a gallery photo to expand, arrows / ← → to browse */}
      {lightbox !== null && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center select-none"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-lg flex items-center justify-center backdrop-blur-sm"
            aria-label="Close"
          >✕</button>

          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length) }}
              className="absolute left-3 md:left-6 w-11 h-11 rounded-full bg-white/15 text-white text-2xl flex items-center justify-center backdrop-blur-sm active:scale-95"
              aria-label="Previous photo"
            >‹</button>
          )}

          <img
            src={gallery[lightbox]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg"
          />

          {gallery.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length) }}
              className="absolute right-3 md:right-6 w-11 h-11 rounded-full bg-white/15 text-white text-2xl flex items-center justify-center backdrop-blur-sm active:scale-95"
              aria-label="Next photo"
            >›</button>
          )}

          {gallery.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-[12px] bg-black/40 px-3 py-1 rounded-full">
              {lightbox + 1} / {gallery.length}
            </div>
          )}
        </div>
      )}

      {/* Menu-photo zoom — tap a menu image to view it full-screen */}
      {menuPhotoZoom !== null && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center select-none"
          onClick={() => setMenuPhotoZoom(null)}
        >
          <button
            onClick={() => setMenuPhotoZoom(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-lg flex items-center justify-center backdrop-blur-sm"
            aria-label="Close menu photo"
          >×</button>
          <img
            src={menuPhotoZoom}
            alt="Menu"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  )
}
