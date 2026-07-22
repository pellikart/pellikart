import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useVendorBase } from '@/lib/vendor-nav'
import { useVendorStore } from '@/lib/vendor-store'
import { uploadPhotos } from '@/lib/supabase-db'
import { resolveMapLinkCoords } from '@/lib/resolveVenueGeo'
import { formatINR, getRateCardBaseHourly, getPhotographyGuestFromPrice, getPhotographyEventFromPrice, getMehendiFromPrice, getMakeupFromPrice, getSareeDrapingFromPrice } from '@/lib/helpers'
import { getListingConfig, RITUALS, PHOTOGRAPHY_RATE_ROLES, PHOTOGRAPHY_HOUR_OPTIONS, emptyMehendiPricing, emptyMakeupPricing, emptySareeDrapingPricing, emptyHairStylingPricing, emptyPhotographyGuestPackages, emptyPhotographyEventPackages, isSingleListingCategory, MAKEUP_EVENTS, type SelectField, type PhotographyRateCard, type PhotographyPricingModel, type PhotographyGuestPackages, type PhotographyEventPackage, type MehendiPricing, type MakeupPricing, type MakeupSimpleInclude, type SareeDrapingPricing, type HairStylingPricing } from '@/lib/vendor-category-config'
import type { MenuSection, MenuMode, PlatePackage, PlateSlot, VenueLocation, VenuePricingModel, SizePrice, InHouseDecor, PaidRoom } from '@/lib/vendor-types'
import DesignsEditor, { type DesignDraft } from '@/components/DesignsEditor'
import PaidRoomsEditor from '@/components/PaidRoomsEditor'
import PhotographyGuestPackagesEditor from '@/components/PhotographyGuestPackagesEditor'
import PhotographyEventPackagesEditor from '@/components/PhotographyEventPackagesEditor'
import MenuEditor from '@/components/MenuEditor'
import SizesEditor from '@/components/SizesEditor'
import PlateSlotsEditor from '@/components/PlateSlotsEditor'
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
  // Videos mirror photos: blob: previews with their File kept for upload on save.
  const [videos, setVideos] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<Record<string, File>>({})
  const [saving, setSaving] = useState(false)
  const [style, setStyle] = useState('')
  const [price, setPrice] = useState(pr.min)
  const [rateCard, setRateCard] = useState<PhotographyRateCard>({})
  const [availableHours, setAvailableHours] = useState<number[]>([])
  const [photographyPricingModels, setPhotographyPricingModels] = useState<PhotographyPricingModel[]>(['hourly'])
  const [guestPackages, setGuestPackages] = useState<PhotographyGuestPackages>(emptyPhotographyGuestPackages())
  const [guestPackagePhotographers, setGuestPackagePhotographers] = useState<Record<string, number>>({})
  const [guestPackageVideographers, setGuestPackageVideographers] = useState<Record<string, number>>({})
  const [eventPackages, setEventPackages] = useState<PhotographyEventPackage[]>(emptyPhotographyEventPackages())
  const [mehendiPricing, setMehendiPricing] = useState<MehendiPricing>(emptyMehendiPricing())
  const [makeupPricing, setMakeupPricing] = useState<MakeupPricing>(emptyMakeupPricing())
  const [makeupAddons, setMakeupAddons] = useState<Record<string, number>>({})
  // Makeup pricing mode: 'detailed' (per-event + priced add-ons) or 'simple'
  // (overall bridal/groom/guest + offered-service checkboxes).
  const [makeupMode, setMakeupMode] = useState<'detailed' | 'simple'>('detailed')
  // Simple mode: bridal split into the 3 MAKEUP_EVENTS, plus groom + guest.
  const [simpleBridalByEvent, setSimpleBridalByEvent] = useState<Record<string, number>>({})
  const [simpleGroom, setSimpleGroom] = useState(0)
  const [simpleGuest, setSimpleGuest] = useState(0)
  // Included services (draping / hair / mehendi) keyed per line (event / groom / guest).
  const [simpleIncludes, setSimpleIncludes] = useState<Record<string, MakeupSimpleInclude>>({})
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
  // Catering menu photos + which input mode ('items' builder vs 'photos' upload).
  const [menuPhotos, setMenuPhotos] = useState<string[]>([])
  const [menuMode, setMenuMode] = useState<MenuMode>('items')
  const [platePackages, setPlatePackages] = useState<PlatePackage[]>([])
  // Venue-level service time slots, shared across all plate packages.
  const [slots, setSlots] = useState<PlateSlot[]>([])
  // Decor per-size pricing.
  const [sizes, setSizes] = useState<SizePrice[]>([])
  // Venue location + rent pricing.
  const [venueLocation, setVenueLocation] = useState<VenueLocation>({ address: '' })
  const [venuePricingModels, setVenuePricingModels] = useState<VenuePricingModel[]>([])
  const [hourlyPricing, setHourlyPricing] = useState<{ hours: number; price: number }[]>([])
  // Venue-only: in-house decor. offersDecor toggles the whole block; the rest
  // mirrors the add flow (compulsory, detail fields, per-design entries) plus the
  // dedicated decorator's contact number.
  const [offersDecor, setOffersDecor] = useState(false)
  // Outside-decorator policy: couples must use in-house ('notAllowed'), may bring
  // their own for a royalty ('royalty'), or freely ('allowedFree').
  const [decorPolicy, setDecorPolicy] = useState<'notAllowed' | 'royalty' | 'allowedFree'>('notAllowed')
  const [decorFields, setDecorFields] = useState<Record<string, string | string[]>>({})
  const [decorDesigns, setDecorDesigns] = useState<DesignDraft[]>([])
  const [decorFiles, setDecorFiles] = useState<Record<string, { photos: File[]; videos: File[] }>>({})
  const [decoratorPhone, setDecoratorPhone] = useState('')
  const [decorStartingPrice, setDecorStartingPrice] = useState(0)
  const [decorOutsideRoyalty, setDecorOutsideRoyalty] = useState(0)
  // Venue-only: paid lodging rooms (+ pending per-room photo uploads).
  const [paidRooms, setPaidRooms] = useState<PaidRoom[]>([])
  const [paidRoomFiles, setPaidRoomFiles] = useState<Record<string, File[]>>({})

  useEffect(() => {
    if (listing) {
      setName(listing.name)
      setPhotos(listing.photos)
      setVideos(listing.videos || [])
      setCoverIndex(listing.coverPhotoIndex ?? 0)
      setStyle(listing.style)
      setPrice(listing.price)
      setRateCard(listing.rateCard || {})
      setAvailableHours(listing.availableHours || [])
      setGuestPackages(listing.guestPackages || emptyPhotographyGuestPackages())
      setGuestPackagePhotographers(listing.guestPackagePhotographers || {})
      setGuestPackageVideographers(listing.guestPackageVideographers || {})
      setEventPackages(listing.eventPackages || emptyPhotographyEventPackages())
      setPhotographyPricingModels(
        listing.photographyPricingModels && listing.photographyPricingModels.length > 0
          ? listing.photographyPricingModels
          : (() => {
              const models: PhotographyPricingModel[] = []
              if (listing.rateCard && Object.keys(listing.rateCard).length > 0) models.push('hourly')
              if (listing.guestPackages && Object.keys(listing.guestPackages).length > 0) models.push('guestBased')
              if (listing.eventPackages && listing.eventPackages.length > 0) models.push('eventBased')
              return models.length > 0 ? models : ['hourly']
            })()
      )
      setMehendiPricing(listing.mehendiPricing || emptyMehendiPricing())
      setMehendiAddon(listing.category === 'Makeup' && !!listing.mehendiPricing)
      setMakeupPricing(listing.makeupPricing || emptyMakeupPricing())
      setMakeupAddons(listing.makeupPricing?.addons || {})
      // Seed makeup pricing mode + simple-mode fields.
      const mk = listing.makeupPricing
      const simple = mk?.mode === 'simple'
      setMakeupMode(simple ? 'simple' : 'detailed')
      setSimpleBridalByEvent(simple ? (mk?.bridalByEvent || {}) : {})
      setSimpleGroom(simple ? (mk?.groomPrice || 0) : 0)
      setSimpleGuest(simple ? (mk?.guestPricePerPerson || 0) : 0)
      setSimpleIncludes(mk?.simpleIncludes || {})
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
      setMenuPhotos(listing.menuPhotos || [])
      setMenuMode(listing.menuMode || 'items')
      setPlatePackages(listing.platePackages || [])
      setSlots(listing.slots || [])
      setSizes(listing.sizes || [])
      setVenueLocation(listing.venueLocation && listing.venueLocation.address ? listing.venueLocation : { address: '' })
      setVenuePricingModels(listing.venuePricingModels || [])
      setHourlyPricing(listing.hourlyPricing || [])
      // In-house decor (Venue). Presence of the object means the venue offers it.
      const ihd = listing.inHouseDecor
      setOffersDecor(!!ihd)
      // Derive the policy: explicit field wins; else fall back to the legacy
      // compulsory flag (true ⇒ outside not allowed, false ⇒ allowed free).
      setDecorPolicy(ihd?.outsideDecorPolicy ?? (ihd?.compulsory ? 'notAllowed' : 'allowedFree'))
      setDecorFields(ihd?.fields || {})
      setDecorDesigns(ihd?.designs || [])
      setDecoratorPhone(ihd?.decoratorPhone || '')
      setDecorStartingPrice(ihd?.startingPrice || 0)
      setDecorOutsideRoyalty(ihd?.outsideDecorRoyalty || 0)
      setPaidRooms(listing.paidRooms || [])
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

  function removePhoto(idx: number) {
    const url = photos[idx]
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    // Keep the cover index pointing at the right photo after removal.
    setCoverIndex((prev) => (idx === prev ? 0 : idx < prev ? prev - 1 : prev))
    // Drop the pending-upload file mapping if this was a newly-added blob.
    if (url && photoFiles[url]) {
      setPhotoFiles((prev) => { const n = { ...prev }; delete n[url]; return n })
    }
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const fileMap: Record<string, File> = {}
      const newVideos = Array.from(e.target.files).map((f) => {
        const url = URL.createObjectURL(f)
        fileMap[url] = f
        return url
      })
      setVideos((prev) => [...prev, ...newVideos].slice(0, 5))
      setVideoFiles((prev) => ({ ...prev, ...fileMap }))
    }
  }

  function removeVideo(idx: number) {
    const url = videos[idx]
    setVideos((prev) => prev.filter((_, i) => i !== idx))
    if (url && videoFiles[url]) {
      setVideoFiles((prev) => { const n = { ...prev }; delete n[url]; return n })
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
  const photoOffersEvent = photographyPricingModels.includes('eventBased')
  const photoHourlyBase = getRateCardBaseHourly(rateCard)
  const photoGuestFrom = getPhotographyGuestFromPrice(guestPackages)
  const photoEventFrom = getPhotographyEventFromPrice(eventPackages)
  // Only cards with at least one event AND one priced service are kept on save.
  const validEventPackages = eventPackages.filter(
    c => c.events.length > 0 && Object.values(c.prices).some(p => (p ?? 0) > 0),
  )

  // Venue pricing (mirrors the add flow's derivation).
  const venueOffersRent = venuePricingModels.includes('rent')
  const venueOffersPerPlate = venuePricingModels.includes('perPlate')
  const venueRentTier = hourlyPricing.find(t => t.hours === 24) || hourlyPricing[0]
  const venueRentPrice = venueRentTier?.price || 0
  const venuePlateFrom = platePackages.length > 0 ? Math.min(...platePackages.map(p => p.pricePerPlate).filter(p => p > 0), Infinity) : 0
  const venueFrom = venueOffersRent && venueRentPrice > 0 ? venueRentPrice
    : venueOffersPerPlate && venuePlateFrom > 0 && venuePlateFrom !== Infinity ? venuePlateFrom
    : 0
  // Decor "from" price = cheapest size variant.
  const decorPrices = sizes.map(s => s.price || 0).filter(p => p > 0)
  const decorFrom = decorPrices.length > 0 ? Math.min(...decorPrices) : 0

  // Simple-makeup lines: the 3 bridal events + groom + guest (price + includes).
  const makeupSimplePeople: { key: string; label: string; unit: string; price: number; setPrice: (n: number) => void; step: number; drapingLabel: string }[] = [
    ...MAKEUP_EVENTS.map(ev => ({ key: ev, label: ev, unit: '/ look', price: simpleBridalByEvent[ev] || 0, setPrice: (n: number) => setSimpleBridalByEvent(prev => ({ ...prev, [ev]: n })), step: 500, drapingLabel: 'Saree draping' })),
    { key: 'groom', label: 'Groom makeup', unit: '/ look', price: simpleGroom, setPrice: setSimpleGroom, step: 500, drapingLabel: 'Vesti draping' },
    { key: 'guest', label: 'Guest makeup', unit: '/ guest', price: simpleGuest, setPrice: setSimpleGuest, step: 100, drapingLabel: 'Saree draping' },
  ]

  // Live-mode menu-photo uploader passed to MenuEditor. In demo mode it's
  // undefined, so MenuEditor falls back to local object-URL previews.
  const menuUploadFn = _liveMode && _vendorDbId
    ? (files: File[]) => uploadPhotos(_vendorDbId, files, 'listing')
    : undefined

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
    // Videos — same upload flow as photos.
    let finalVideos = videos
    if (_liveMode && _vendorDbId) {
      const existing = videos.filter((v) => !v.startsWith('blob:'))
      const newFiles = videos.filter((v) => v.startsWith('blob:')).map((v) => videoFiles[v]).filter(Boolean)
      const uploaded = newFiles.length > 0 ? await uploadPhotos(_vendorDbId, newFiles, 'listing') : []
      finalVideos = [...existing, ...uploaded]
    }

    // In-house decor (Venue) — upload each design's newly-added media, then
    // assemble the payload. offersDecor off ⇒ clear it; non-venue keeps whatever
    // was there via the ...listing spread below.
    let inHouseDecorOut: InHouseDecor | undefined = listing.inHouseDecor
    if (category === 'Venue') {
      if (!offersDecor) {
        inHouseDecorOut = undefined
      } else {
        let designs = decorDesigns
        if (decorDesigns.length > 0 && _liveMode && _vendorDbId) {
          designs = await Promise.all(decorDesigns.map(async (d) => {
            const files = decorFiles[d.id]
            let dPhotos = d.photos
            let dVideos = d.videos
            if (files?.photos.length) {
              const up = await uploadPhotos(_vendorDbId, files.photos, 'listing')
              if (up.length > 0) dPhotos = [...(d.photos || []).filter((p) => !p.startsWith('blob:')), ...up]
            }
            if (files?.videos.length) {
              const up = await uploadPhotos(_vendorDbId, files.videos, 'listing')
              if (up.length > 0) dVideos = [...(d.videos || []).filter((v) => !v.startsWith('blob:')), ...up]
            }
            return { ...d, photos: dPhotos, videos: dVideos }
          }))
        }
        const hasDetails = designs.length > 0 || Object.keys(decorFields).length > 0
        const compulsory = decorPolicy === 'notAllowed'
        inHouseDecorOut = {
          compulsory,
          outsideDecorPolicy: decorPolicy,
          pending: compulsory && !hasDetails ? true : undefined,
          fields: Object.keys(decorFields).length > 0 ? decorFields : undefined,
          designs: designs.length > 0 ? designs : undefined,
          decoratorPhone: decoratorPhone.trim() || undefined,
          startingPrice: decorStartingPrice > 0 ? decorStartingPrice : undefined,
          outsideDecorRoyalty: decorPolicy === 'royalty' && decorOutsideRoyalty > 0 ? decorOutsideRoyalty : undefined,
        }
      }
    }

    // Paid rooms (Venue) — upload each room's newly-added photos, then assemble.
    let paidRoomsOut: PaidRoom[] | undefined = category === 'Venue' ? paidRooms : listing.paidRooms
    if (category === 'Venue' && paidRooms.length > 0 && _liveMode && _vendorDbId) {
      paidRoomsOut = await Promise.all(paidRooms.map(async (room) => {
        const files = paidRoomFiles[room.id] || []
        if (files.length === 0) return room
        const uploaded = await uploadPhotos(_vendorDbId, files, 'listing')
        const existing = (room.photos || []).filter((p) => !p.startsWith('blob:'))
        return uploaded.length > 0 ? { ...room, photos: [...existing, ...uploaded] } : room
      }))
    }
    const safeCover = Math.min(coverIndex, Math.max(0, finalPhotos.length - 1))
    // Photography: prefer the hourly "₹X/hr" board figure; fall back to the cheapest
    // guest-package cell when only guest-based pricing is offered.
    // Assemble the makeup pricing object from whichever mode is active.
    const makeupPricingOut: MakeupPricing = makeupMode === 'simple'
      ? {
          mode: 'simple',
          bridalByEvent: Object.fromEntries(Object.entries(simpleBridalByEvent).filter(([, v]) => v > 0)),
          groomPrice: simpleGroom || undefined,
          guestPricePerPerson: simpleGuest || undefined,
          simpleIncludes,
        }
      : { ...makeupPricing, addons: makeupAddons }
    const makeupDetailed = makeupMode === 'detailed'

    const effectivePrice = category === 'Photography'
      ? (photoOffersHourly && photoHourlyBase > 0 ? photoHourlyBase
        : photoOffersGuest && photoGuestFrom > 0 ? photoGuestFrom
        : photoEventFrom)
      : category === 'Mehendi' ? getMehendiFromPrice(mehendiPricing)
      : category === 'Makeup' ? getMakeupFromPrice(makeupPricingOut)
      : category === 'Saree Draping' ? getSareeDrapingFromPrice(sareePricing)
      : category === 'Venue' ? venueFrom
      : category === 'Decor' ? decorFrom
      : price
    // Venue: keep the map-link coordinates fresh. Re-resolve only when the link
    // changed; otherwise reuse the coords already stored. Best-effort.
    let resolvedVenueLocation = venueLocation
    if (category === 'Venue' && venueLocation.address.trim() && venueLocation.mapsLink?.trim()) {
      const prev = listing.venueLocation
      const linkUnchanged = prev?.mapsLink === venueLocation.mapsLink && prev?.lat != null && prev?.lng != null
      if (linkUnchanged) {
        resolvedVenueLocation = { ...venueLocation, lat: prev!.lat, lng: prev!.lng }
      } else {
        const c = await resolveMapLinkCoords(venueLocation.mapsLink)
        if (c) resolvedVenueLocation = { ...venueLocation, lat: c.lat, lng: c.lng }
      }
    }

    updateListing({
      ...listing,
      name, photos: finalPhotos, videos: finalVideos.length > 0 ? finalVideos : undefined, coverPhotoIndex: safeCover, style, price: effectivePrice, rituals, includes, categoryFields,
      inHouseDecor: category === 'Venue' ? inHouseDecorOut : listing.inHouseDecor,
      paidRooms: category === 'Venue' ? (paidRoomsOut && paidRoomsOut.length > 0 ? paidRoomsOut : undefined) : listing.paidRooms,
      rateCard: category === 'Photography' && photoOffersHourly ? rateCard : undefined,
      availableHours: category === 'Photography' && photoOffersHourly && availableHours.length > 0 ? [...availableHours].sort((a, b) => a - b) : undefined,
      photographyPricingModels: category === 'Photography' && photographyPricingModels.length > 0 ? photographyPricingModels : undefined,
      guestPackages: category === 'Photography' && photoOffersGuest && photoGuestFrom > 0 ? guestPackages : undefined,
      guestPackagePhotographers: category === 'Photography' && photoOffersGuest && Object.keys(guestPackagePhotographers).length > 0 ? guestPackagePhotographers : undefined,
      guestPackageVideographers: category === 'Photography' && photoOffersGuest && Object.keys(guestPackageVideographers).length > 0 ? guestPackageVideographers : undefined,
      eventPackages: category === 'Photography' && photoOffersEvent && validEventPackages.length > 0 ? validEventPackages : undefined,
      mehendiPricing: category === 'Mehendi' ? mehendiPricing
        : category === 'Makeup' && makeupDetailed && mehendiAddon ? mehendiPricing
        : undefined,
      makeupPricing: category === 'Makeup' ? makeupPricingOut : undefined,
      sareeDrapingPricing: category === 'Saree Draping' ? sareePricing
        : category === 'Makeup' && makeupDetailed && sareeAddon ? sareePricing
        : undefined,
      hairStylingPricing: category === 'Makeup' && makeupDetailed && hairAddon ? hairPricing : undefined,
      transportIncluded: transportIncluded === null ? undefined : transportIncluded,
      bundledListings: category === 'Venue' ? bundledListings : undefined,
      bundleMandatory: category === 'Venue' ? bundleMandatory : undefined,
      // Menu edits: catering menu, or per-package venue menus. Left as-is for
      // other categories (they carry over via the ...listing spread above).
      menu: category === 'Catering' ? menu : listing.menu,
      menuPhotos: category === 'Catering' ? menuPhotos : listing.menuPhotos,
      menuMode: category === 'Catering' ? menuMode : listing.menuMode,
      platePackages: category === 'Venue' ? platePackages : listing.platePackages,
      slots: category === 'Venue' ? slots : listing.slots,
      sizes: category === 'Decor' ? (sizes.length > 0 ? sizes : undefined) : listing.sizes,
      venueLocation: category === 'Venue' ? (resolvedVenueLocation.address.trim() ? resolvedVenueLocation : undefined) : listing.venueLocation,
      venuePricingModels: category === 'Venue' ? (venuePricingModels.length > 0 ? venuePricingModels : undefined) : listing.venuePricingModels,
      hourlyPricing: category === 'Venue' && venuePricingModels.includes('rent') ? (hourlyPricing.length > 0 ? hourlyPricing : undefined) : (category === 'Venue' ? undefined : listing.hourlyPricing),
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
          <p className="text-[10px] text-gray-400 mb-1.5">Tap a photo to set it as cover · tap × to remove.</p>
          <div className="grid grid-cols-4 gap-1.5">
            {photos.map((p, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden relative cursor-pointer" onClick={() => setCoverIndex(i)}>
                <img src={p} alt="" className="w-full h-full object-cover" />
                {i === coverIndex && <span className="absolute top-0.5 left-0.5 bg-mustard text-white text-[6px] font-bold px-1 py-0.5 rounded">COVER</span>}
                {i !== coverIndex && <div className="absolute inset-0 bg-black/20" />}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                  aria-label="Remove photo"
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] leading-none active:bg-red-500"
                >×</button>
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

        {/* Videos */}
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1">Videos <span className="text-[10px] text-gray-400 font-normal">(optional)</span></label>
          <p className="text-[10px] text-gray-400 mb-1.5">Add short clips of your work · tap × to remove.</p>
          <div className="grid grid-cols-4 gap-1.5">
            {videos.map((v, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden relative bg-black">
                <video src={v} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(i)}
                  aria-label="Remove video"
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white text-[10px] leading-none active:bg-red-500"
                >×</button>
              </div>
            ))}
            {videos.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-mustard/30 flex items-center justify-center cursor-pointer">
                <span className="text-mustard text-lg">+</span>
                <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
              </label>
            )}
          </div>
        </div>

        {/* In-house decor (Venue only) */}
        {category === 'Venue' && (
          <div className="p-3 rounded-xl border border-mustard/20 bg-mustard-light/20">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="accent-mustard mt-0.5" checked={offersDecor} onChange={() => setOffersDecor((v) => !v)} />
              <div>
                <span className="text-[12px] font-semibold text-dark">Offer in-house decor</span>
                <p className="text-[10px] text-gray-500">Add the decor designs &amp; details couples see with this venue.</p>
              </div>
            </label>

            {offersDecor && (
              <div className="mt-3 space-y-4">
                {/* Outside-decorator policy */}
                <div>
                  <label className="text-[11px] font-medium text-dark block mb-1.5">Can couples bring an outside decorator?</label>
                  <div className="flex flex-col gap-1.5">
                    {([
                      { val: 'notAllowed' as const, title: 'No — in-house decor is compulsory', desc: 'Couples must take your in-house decor.' },
                      { val: 'royalty' as const, title: 'Yes, but we charge a royalty', desc: 'Couples can bring their own decorator for a fee.' },
                      { val: 'allowedFree' as const, title: 'Yes, no royalty', desc: 'Couples can freely bring their own decorator.' },
                    ]).map((opt) => {
                      const selected = decorPolicy === opt.val
                      return (
                        <button
                          key={opt.val} type="button" onClick={() => setDecorPolicy(opt.val)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all ${selected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                        >
                          <span className="text-[11px] font-semibold text-dark">{opt.title}</span>
                          <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Royalty amount — only when outside decor is allowed for a fee */}
                {decorPolicy === 'royalty' && (
                  <div>
                    <label className="text-[11px] font-medium text-dark block mb-1">Outside-decorator royalty (₹)</label>
                    <input
                      type="number" inputMode="numeric" min={0} value={decorOutsideRoyalty || ''}
                      onChange={(e) => setDecorOutsideRoyalty(Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 50000"
                      className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard"
                    />
                  </div>
                )}

                {/* Starting price of decor designs — useful even before designs are added */}
                <div>
                  <label className="text-[11px] font-medium text-dark block mb-1">
                    Starting price of decor designs (₹) <span className="text-[10px] text-gray-400 font-normal">(shown as "from")</span>
                  </label>
                  <input
                    type="number" inputMode="numeric" min={0} value={decorStartingPrice || ''}
                    onChange={(e) => setDecorStartingPrice(Math.max(0, parseInt(e.target.value) || 0))} placeholder="e.g. 75000"
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-dark block mb-1">
                    Decorator contact number <span className="text-[10px] text-gray-400 font-normal">(dedicated decor person)</span>
                  </label>
                  <input
                    type="tel" inputMode="tel" value={decoratorPhone}
                    onChange={(e) => setDecoratorPhone(e.target.value)} placeholder="+91…"
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard"
                  />
                </div>

                {/* Decor detail fields (reused from the Decor listing flow) */}
                <div className="space-y-4">
                  {getListingConfig('Decor').steps[0].fields.map((field) => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={decorFields[field.key]}
                      onChange={(val) => setDecorFields((prev) => ({ ...prev, [field.key]: val }))}
                      onToggleMulti={(val) => setDecorFields((prev) => {
                        const cur = (prev[field.key] as string[]) || []
                        return { ...prev, [field.key]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] }
                      })}
                    />
                  ))}
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-dark mb-1">Decor designs</p>
                  <p className="text-[10px] text-gray-500 mb-2">Add each decor design with its own photos and price.</p>
                  <DesignsEditor
                    value={decorDesigns}
                    onChange={setDecorDesigns}
                    showSizes={false}
                    onFilesAdded={(designId, kind, files) =>
                      setDecorFiles((prev) => {
                        const entry = prev[designId] || { photos: [], videos: [] }
                        return {
                          ...prev,
                          [designId]: kind === 'photo'
                            ? { ...entry, photos: [...entry.photos, ...files] }
                            : { ...entry, videos: [...entry.videos, ...files] },
                        }
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paid rooms (Venue only) */}
        {category === 'Venue' && (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1">Paid rooms <span className="text-[10px] text-gray-400 font-normal">(optional)</span></label>
            <p className="text-[10px] text-gray-400 mb-2">Rooms you rent out for guests — each with its own occupancy, price, amenities, and photos.</p>
            <PaidRoomsEditor
              value={paidRooms}
              onChange={setPaidRooms}
              onFilesAdded={(roomId, files) =>
                setPaidRoomFiles((prev) => ({ ...prev, [roomId]: [...(prev[roomId] || []), ...files] }))
              }
            />
          </div>
        )}

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
                { key: 'eventBased' as const, title: 'Event-based packages', desc: 'Pricing cards per event — a flat price per service (photo, video, drone, album…) for the whole event.' },
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

            {/* Event-based model */}
            {photoOffersEvent && (
              <div className="mb-1">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Event-based packages</p>
                <p className="text-[10px] text-gray-400 mb-2">Create a card per event group, pick the events it covers, and set a flat price per service.</p>
                <PhotographyEventPackagesEditor value={eventPackages} onChange={setEventPackages} />
                {photoEventFrom > 0 && (
                  <p className="text-[11px] text-gray-600 mt-3">Board card shows <span className="font-bold text-mustard">from {formatINR(photoEventFrom)}</span> when event-based is your only model.</p>
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
            {/* Pricing mode selector */}
            <div>
              <label className="text-[11px] font-medium text-dark block mb-1.5">Pricing style</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMakeupMode('detailed')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${makeupMode === 'detailed' ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>Detailed<br /><span className="text-[9px] font-normal text-gray-400">per event + add-ons</span></button>
                <button type="button" onClick={() => setMakeupMode('simple')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${makeupMode === 'simple' ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>Simple<br /><span className="text-[9px] font-normal text-gray-400">overall prices</span></button>
              </div>
            </div>

            {makeupMode === 'simple' ? (
              <div className="space-y-3">
                <p className="text-[10px] text-gray-400">One overall price per look, and what each one includes.</p>
                {makeupSimplePeople.map(row => {
                  const inc = simpleIncludes[row.key] || {}
                  const setInc = (patch: Partial<MakeupSimpleInclude>) => setSimpleIncludes(prev => ({ ...prev, [row.key]: { ...(prev[row.key] || {}), ...patch } }))
                  const services: { k: keyof MakeupSimpleInclude; label: string }[] = [
                    { k: 'draping', label: row.drapingLabel },
                    { k: 'hair', label: 'Hair styling' },
                    { k: 'mehendi', label: 'Mehendi' },
                  ]
                  return (
                    <div key={row.key} className="p-3 rounded-xl border border-card-border space-y-2.5">
                      <div>
                        <span className="text-[12px] font-semibold text-dark block leading-tight mb-1.5">{row.label}</span>
                        <div className="relative w-[150px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                          <input type="number" min={0} step={row.step} value={row.price || ''} onChange={(e) => row.setPrice(Math.max(0, parseInt(e.target.value) || 0))} placeholder="0"
                            className="w-full pl-6 pr-12 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">{row.unit}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1.5">Includes:</p>
                        <div className="space-y-1.5">
                          {services.map(svc => (
                            <label key={svc.k} className="flex items-center gap-2.5 cursor-pointer">
                              <input type="checkbox" className="accent-mustard w-4 h-4" checked={!!inc[svc.k]} onChange={() => setInc({ [svc.k]: !inc[svc.k] })} />
                              <span className="text-[12px] text-dark">{svc.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : category === 'Saree Draping' ? (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-2">Saree draping pricing</label>
            <SareeDrapingPricingEditor value={sareePricing} onChange={setSareePricing} />
          </div>
        ) : category === 'Venue' ? (
          <div className="space-y-4">
            {/* Location */}
            <div>
              <label className="text-[11px] font-medium text-dark block mb-1.5">Venue location</label>
              <textarea
                value={venueLocation.address}
                onChange={(e) => setVenueLocation(prev => ({ ...prev, address: e.target.value }))}
                rows={2} placeholder="Building, street, landmark…"
                className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard resize-none"
              />
              <div className="flex gap-2 mt-2">
                <input value={venueLocation.area || ''} onChange={(e) => setVenueLocation(prev => ({ ...prev, area: e.target.value }))} placeholder="Area" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
                <input value={venueLocation.city || ''} onChange={(e) => setVenueLocation(prev => ({ ...prev, city: e.target.value }))} placeholder="City" className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>
              <input type="url" value={venueLocation.mapsLink || ''} onChange={(e) => setVenueLocation(prev => ({ ...prev, mapsLink: e.target.value }))} placeholder="Google Maps link (optional)" className="w-full mt-2 px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
            </div>

            {/* Pricing models */}
            <div>
              <label className="text-[11px] font-medium text-dark block mb-1.5">How do you price this venue?</label>
              <div className="flex flex-col gap-2">
                {([{ key: 'rent' as const, title: 'Venue rent', desc: 'You charge rent; food arranged separately.' }, { key: 'perPlate' as const, title: 'Per-plate (food included)', desc: 'Couples take food from your venue, charged per plate.' }]).map(m => {
                  const selected = venuePricingModels.includes(m.key)
                  return (
                    <button key={m.key} type="button"
                      onClick={() => setVenuePricingModels(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${selected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                    >
                      <p className="text-[12px] font-semibold text-dark">{m.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rent — hourly tiers */}
            {venueOffersRent && (
              <div className="p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[12px] font-semibold text-dark mb-2">Venue rent</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[12, 24].map(h => {
                    const selected = hourlyPricing.some(t => t.hours === h)
                    return (
                      <button key={h} type="button"
                        onClick={() => setHourlyPricing(prev => selected ? prev.filter(t => t.hours !== h) : [...prev, { hours: h, price: 0 }])}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${selected ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 border border-card-border'}`}
                      >{selected && <span className="mr-0.5">✓ </span>}{h} hr</button>
                    )
                  })}
                  <button type="button" onClick={() => setHourlyPricing(prev => [...prev, { hours: 6, price: 0 }])} className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-empty-bg text-dark border border-card-border active:bg-mustard-light/40">+ Custom</button>
                </div>
                {hourlyPricing.length > 0 && (
                  <div className="space-y-2">
                    {hourlyPricing.map((tier, i) => {
                      const isPreset = tier.hours === 12 || tier.hours === 24
                      return (
                        <div key={i} className="flex items-center gap-2">
                          {isPreset ? (
                            <span className="px-2.5 py-2 rounded-lg bg-white border border-card-border text-[11px] font-medium text-dark min-w-[60px] text-center">{tier.hours} hr</span>
                          ) : (
                            <div className="relative">
                              <input type="number" min={1} value={tier.hours || ''} onChange={(e) => { const h = parseInt(e.target.value) || 0; setHourlyPricing(prev => prev.map((t, idx) => idx === i ? { ...t, hours: h } : t)) }} className="w-16 pl-2 pr-7 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard" placeholder="6" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">hr</span>
                            </div>
                          )}
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                            <input type="number" min={0} step={1000} value={tier.price || ''} onChange={(e) => { const p = parseInt(e.target.value) || 0; setHourlyPricing(prev => prev.map((t, idx) => idx === i ? { ...t, price: p } : t)) }} className="w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard" placeholder="Price" />
                          </div>
                          <button type="button" onClick={() => setHourlyPricing(prev => prev.filter((_, idx) => idx !== i))} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100">×</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] text-gray-400">Per-plate packages (and their menus) are managed in the “Plate packages” section below.</p>
          </div>
        ) : category === 'Decor' ? (
          <div>
            <label className="text-[11px] font-medium text-dark block mb-1.5">Sizes &amp; pricing</label>
            <SizesEditor value={sizes} onChange={setSizes} />
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
            <MenuEditor
              menu={menu}
              onMenuChange={setMenu}
              photos={menuPhotos}
              onPhotosChange={setMenuPhotos}
              mode={menuMode}
              onModeChange={setMenuMode}
              uploadFn={menuUploadFn}
            />
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
                      Menu · {menuSummary(pkg)}
                    </summary>
                    <div className="px-2 pb-2">
                      <MenuEditor
                        menu={pkg.menu || []}
                        onMenuChange={(next) => setPlatePackages(prev => prev.map((p, i) => i === idx ? { ...p, menu: next } : p))}
                        photos={pkg.menuPhotos || []}
                        onPhotosChange={(next) => setPlatePackages(prev => prev.map((p, i) => i === idx ? { ...p, menuPhotos: next } : p))}
                        mode={pkg.menuMode || 'items'}
                        onModeChange={(next) => setPlatePackages(prev => prev.map((p, i) => i === idx ? { ...p, menuMode: next } : p))}
                        uploadFn={menuUploadFn}
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
            {/* Venue-level service time slots — shared across all packages */}
            <div className="mt-3 pt-3 border-t border-card-border">
              <PlateSlotsEditor value={slots} onChange={setSlots} />
            </div>
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

/** Short summary of a plate package's menu, accounting for photo vs item mode. */
function menuSummary(pkg: PlatePackage): string {
  if (pkg.menuMode === 'photos') {
    const n = pkg.menuPhotos?.length || 0
    return `${n} ${n === 1 ? 'photo' : 'photos'}`
  }
  const n = menuItemCount(pkg.menu)
  return `${n} ${n === 1 ? 'item' : 'items'}`
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

  if (field.type === 'range') {
    const min = field.numberMin ?? 0
    const max = field.numberMax ?? 9999
    const step = field.numberStep ?? 1
    // Stored as [lo, hi]. A legacy single value (old slider) was the venue's
    // capacity, so read it as the MAX with the floor as min ([min, v]) —
    // consistent with how display/matching treat it as "up to v". An untouched
    // field defaults to the full [min, max] span.
    const [loRaw, hiRaw] = Array.isArray(value)
      ? value
      : typeof value === 'string' && value ? [String(min), value] : [String(min), String(max)]
    const lo = parseInt(loRaw) || min
    const hi = parseInt(hiRaw) || max
    // Keep lo ≤ hi without dragging the other end when the user crosses them.
    const setLo = (n: number) => { let v = Math.max(min, Math.min(max, n)); if (v > hi) v = hi; onChange([String(v), String(hi)]) }
    const setHi = (n: number) => { let v = Math.max(min, Math.min(max, n)); if (v < lo) v = lo; onChange([String(lo), String(v)]) }
    const box = (val: number, onSet: (n: number) => void, label: string) => (
      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-gray-400 block mb-1">{label}</span>
        <div className="inline-flex items-stretch rounded-xl border border-card-border overflow-hidden w-full">
          <button type="button" onClick={() => onSet(val - step)} disabled={val <= min}
            className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
          <input type="number" min={min} max={max} step={step} value={val}
            onChange={(e) => onSet(parseInt(e.target.value) || min)}
            className="w-full min-w-0 text-center text-[13px] font-medium text-dark outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button type="button" onClick={() => onSet(val + step)} disabled={val >= max}
            className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40">+</button>
        </div>
      </div>
    )
    return (
      <div>
        <label className="text-[12px] font-medium text-dark block mb-1.5">{field.label}{field.numberUnit ? ` (${field.numberUnit})` : ''}</label>
        <div className="flex items-end gap-2">
          {box(lo, setLo, 'Min')}
          {box(hi, setHi, 'Max')}
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

  if (field.type === 'number') {
    const min = field.numberMin ?? 0
    const max = field.numberMax ?? 999
    const step = field.numberStep ?? 1
    const numVal = typeof value === 'string' ? (parseInt(value) || min) : min
    const dec = () => onChange(String(Math.max(min, numVal - step)))
    const inc = () => onChange(String(Math.min(max, numVal + step)))
    return (
      <div>
        <label className="text-[12px] font-medium text-dark block mb-1.5">{field.label}</label>
        <div className="inline-flex items-stretch rounded-xl border border-card-border overflow-hidden">
          <button
            type="button" onClick={dec} disabled={numVal <= min}
            className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
          >−</button>
          <input
            type="number"
            min={min} max={max} step={step}
            value={numVal}
            onChange={(e) => {
              const n = parseInt(e.target.value) || min
              onChange(String(Math.min(max, Math.max(min, n))))
            }}
            className="w-14 text-center text-[13px] font-medium text-dark outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button" onClick={inc} disabled={numVal >= max}
            className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
          >+</button>
          {field.numberUnit && <span className="px-3 flex items-center text-[11px] text-gray-500 border-l border-card-border bg-empty-bg">{field.numberUnit}</span>}
        </div>
      </div>
    )
  }

  return null
}
