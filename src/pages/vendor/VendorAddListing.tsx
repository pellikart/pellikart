import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVendorBase } from '@/lib/vendor-nav'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorListing } from '@/lib/vendor-types'
import { formatINR, getRateCardBaseHourly, getPhotographyGuestFromPrice } from '@/lib/helpers'
import { getListingConfig, RITUALS, PHOTOGRAPHY_RATE_ROLES, PHOTOGRAPHY_HOUR_OPTIONS, isSingleListingCategory, emptyPhotographyGuestPackages, type SelectField, type PhotographyRateCard, type PhotographyPricingModel, type PhotographyGuestPackages } from '@/lib/vendor-category-config'
import { uploadPhotos } from '@/lib/supabase-db'
import PhotographyGuestPackagesEditor from '@/components/PhotographyGuestPackagesEditor'
import PaidRoomsEditor from '@/components/PaidRoomsEditor'
import MenuBuilder from '@/components/MenuBuilder'
import TimePicker from '@/components/TimePicker'
import DesignsEditor, { type DesignDraft } from '@/components/DesignsEditor'
import type { PaidRoom, MenuSection, PlatePackage, VenuePricingModel, InHouseDecor, VenueLocation } from '@/lib/vendor-types'

export default function VendorAddListing({ embedded = false, onPublished }: { embedded?: boolean; onPublished?: () => void } = {}) {
  const navigate = useNavigate()
  const base = useVendorBase()
  const { search } = useLocation()
  // First listing during onboarding — either embedded in the onboarding flow,
  // or (legacy) reached via the ?onboarding=1 route.
  const isFirstListing = embedded || new URLSearchParams(search).get('onboarding') === '1'
  const { vendorProfile, vendorListings, addListing, updateListing, addNotification, _vendorDbId, _liveMode } = useVendorStore()
  const profileCategory = vendorProfile?.category || 'Photography'
  // Single-listing categories (Mehendi/Makeup/Saree Draping) are authored in onboarding — no manual add flow.
  useEffect(() => {
    if (!embedded && isSingleListingCategory(profileCategory)) navigate('/vendor/listings', { replace: true })
  }, [embedded, profileCategory, navigate])
  // Each vendor lists only within their own category. (Venue's in-house catering
  // is now captured via per-plate packages; in-house décor is parked for later.)
  const allowedCategories = useMemo(() => [profileCategory], [profileCategory])

  const [category, setCategory] = useState(profileCategory)
  const config = getListingConfig(category)

  const [step, setStep] = useState(1)
  // Listing name was removed from the UI — listings are identified by their
  // anonymous public code + photo/price/specs. Kept blank so effectiveName uses
  // the auto-generated fallback.
  const [name] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [price, setPrice] = useState(config.priceRange.min + Math.floor((config.priceRange.max - config.priceRange.min) / 3))
  // Photography-only: per-hour rate card keyed by role (₹/hr). Blank/0 = not offered.
  const [rateCard, setRateCard] = useState<PhotographyRateCard>({})
  // Photography-only: hour blocks the vendor is willing to work (couples pick from these).
  const [availableHours, setAvailableHours] = useState<number[]>([])
  // Photography-only: which pricing model(s) this photographer offers. Defaults to
  // the hourly rate card so the existing flow is unchanged unless they add packages.
  const [photographyPricingModels, setPhotographyPricingModels] = useState<PhotographyPricingModel[]>(['hourly'])
  // Photography-only: guest-based packages (guest bucket × hours → flat price).
  const [guestPackages, setGuestPackages] = useState<PhotographyGuestPackages>(emptyPhotographyGuestPackages())
  // Photography-only: photographers present per guest bucket (informational).
  const [guestPackagePhotographers, setGuestPackagePhotographers] = useState<Record<string, number>>({})
  // Photography-only: videographers present per guest bucket (informational).
  const [guestPackageVideographers, setGuestPackageVideographers] = useState<Record<string, number>>({})
  const [includes, setIncludes] = useState<string[]>([])
  const [rituals, setRituals] = useState<string[]>([])
  const [categoryFields, setCategoryFields] = useState<Record<string, string | string[]>>({})
  const [coverIndex, setCoverIndex] = useState(0)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  // Venue-only: bundle other listings with this one
  const [bundledListings, setBundledListings] = useState<string[]>([])
  const [bundleMandatory, setBundleMandatory] = useState(false)
  // Decor/Catering-only (for Venue vendors): link this listing back to existing venues
  const [linkedVenueIds, setLinkedVenueIds] = useState<string[]>([])
  const [linkedVenueMandatory, setLinkedVenueMandatory] = useState(false)
  // Venue-only: the venue's location (prefilled from the vendor's profile city/area)
  const [venueLocation, setVenueLocation] = useState<VenueLocation>({
    address: '', area: vendorProfile?.area || '', city: vendorProfile?.city || '', mapsLink: '',
  })
  // Venue-only: which pricing model(s) this venue offers — rent and/or per-plate
  const [venuePricingModels, setVenuePricingModels] = useState<VenuePricingModel[]>([])
  // Venue-only: per-duration rent tiers (used by the 'rent' model)
  const [hourlyPricing, setHourlyPricing] = useState<{ hours: number; price: number }[]>([])
  // Venue-only: per-plate food packages (used by the 'perPlate' model)
  const [platePackages, setPlatePackages] = useState<PlatePackage[]>([])
  // Venue-only: which plate package's menu is currently being edited (catering-style sub-screen)
  const [menuEditPkgId, setMenuEditPkgId] = useState<string | null>(null)
  // Venue-only: in-house decor — is it compulsory, and (if so) its details
  const [inHouseDecorCompulsory, setInHouseDecorCompulsory] = useState<boolean | null>(null)
  // When compulsory: 'now' = add details in this flow, 'skip' = add later (reminder)
  const [inHouseDecorMode, setInHouseDecorMode] = useState<'now' | 'skip' | null>(null)
  // Whether the decor details form has been opened (via Continue) — gates the form reveal
  const [decorFormOpen, setDecorFormOpen] = useState(false)
  const [inHouseDecorFields, setInHouseDecorFields] = useState<Record<string, string | string[]>>({})
  const [inHouseDecorDesigns, setInHouseDecorDesigns] = useState<DesignDraft[]>([])
  // Per-design pending File uploads for in-house decor (live mode replaces blob URLs)
  const [inHouseDecorFiles, setInHouseDecorFiles] = useState<Record<string, { photos: File[]; videos: File[] }>>({})
  // Venue-only: paid lodging rooms
  const [paidRooms, setPaidRooms] = useState<PaidRoom[]>([])
  // Per-room pending File uploads (live mode publish replaces blob URLs with public URLs)
  const [paidRoomFiles, setPaidRoomFiles] = useState<Record<string, File[]>>({})
  // Catering-only: curated menu
  const [menu, setMenu] = useState<MenuSection[]>([])
  // Transport & logistics — collected on Review step for every category
  const [transportIncluded, setTransportIncluded] = useState<boolean | null>(null)
  // Decor-only: portfolio of designs — each becomes its own published listing
  const [designs, setDesigns] = useState<DesignDraft[]>([])
  // Per-design pending File uploads (live mode publish replaces blob URLs with public URLs)
  const [designFiles, setDesignFiles] = useState<Record<string, { photos: File[]; videos: File[] }>>({})

  // When category changes (Venue vendor switching listing type), reset category-dependent state
  function changeCategory(next: string) {
    if (next === category) return
    setCategory(next)
    const nextConfig = getListingConfig(next)
    setPrice(nextConfig.priceRange.min + Math.floor((nextConfig.priceRange.max - nextConfig.priceRange.min) / 3))
    setRateCard({})
    setAvailableHours([])
    setIncludes([])
    setCategoryFields({})
    setBundledListings([])
    setBundleMandatory(false)
    setLinkedVenueIds([])
    setLinkedVenueMandatory(false)
    setVenueLocation({ address: '', area: vendorProfile?.area || '', city: vendorProfile?.city || '', mapsLink: '' })
    setVenuePricingModels([])
    setHourlyPricing([])
    setPlatePackages([])
    setMenuEditPkgId(null)
    setInHouseDecorCompulsory(null)
    setInHouseDecorMode(null)
    setDecorFormOpen(false)
    setInHouseDecorFields({})
    setInHouseDecorDesigns([])
    setInHouseDecorFiles({})
    setPaidRooms([])
    setPaidRoomFiles({})
    setMenu([])
    setDesigns([])
    setDesignFiles({})
    setTransportIncluded(null)
    setStep(1)
  }

  // Steps: 1=Photos & Name (skipped for Decor), then Rituals, then category-specific,
  // then category-conditional steps, then Review. Order of conditional steps:
  //   - Venue:       Inclusions → Paid rooms → Review
  //   - Catering:    Menu → Pricing → Review
  //   - Decor:       Designs (per-design listings) → Review (no Photos & Name, no Pricing, no Inclusions)
  //   - Photography: Pricing → Review (no Inclusions)
  //   - Others:      Pricing → Inclusions → Review
  const categoryStepCount = config.steps.length
  // Step 1 (listing-type picker) only exists for Venue vendors who can also list
  // in-house catering/décor. The listing NAME step was removed — listings are
  // identified by their anonymous public code + photo/price/specs.
  const hasListingTypeStep = allowedCategories.length > 1
  const hasLocationStep = category === 'Venue'
  const hasPhotosStep = category !== 'Decor'
  const hasStylePriceStep = category !== 'Venue' && category !== 'Decor'
  const hasPaidRoomsStep = category === 'Venue'
  const hasMenuStep = category === 'Catering'
  const hasDesignsStep = category === 'Decor'
  const hasInclusionsStep = category !== 'Decor' && category !== 'Photography' && category !== 'Catering'

  // Each category gets a contiguous run of steps. Decor skips Photos & Name, so its
  // step indices start at 1 with Rituals. Venue leads with a Location step.
  const firstStep = hasListingTypeStep ? 1 : -1
  const baseBeforeLocation = hasListingTypeStep ? 1 : 0
  const locationStep = hasLocationStep ? baseBeforeLocation + 1 : -1
  const ritualsStep = (hasLocationStep ? locationStep : baseBeforeLocation) + 1
  const categoryStepStart = ritualsStep + 1

  let nextStep = categoryStepStart + categoryStepCount
  let inclusionsStep = -1
  let paidRoomsStep = -1
  let venuePricingStep = -1
  let decorCompulsoryStep = -1
  let menuStep = -1
  let stylePriceStep = -1
  let designsStep = -1
  if (category === 'Venue') {
    if (hasInclusionsStep) inclusionsStep = nextStep++
    venuePricingStep = nextStep++
    decorCompulsoryStep = nextStep++
    if (hasPaidRoomsStep) paidRoomsStep = nextStep++
  } else if (category === 'Catering') {
    if (hasMenuStep) menuStep = nextStep++
    if (hasStylePriceStep) stylePriceStep = nextStep++
  } else if (category === 'Decor') {
    if (hasDesignsStep) designsStep = nextStep++
  } else {
    if (hasStylePriceStep) stylePriceStep = nextStep++
    if (hasInclusionsStep) inclusionsStep = nextStep++
  }
  // Photos & videos go near the end (not for Decor, which uses per-design photos),
  // so vendors fill all text/number fields first and finish with the upload.
  const photosStep = hasPhotosStep ? nextStep++ : -1
  const reviewStep = nextStep
  const totalSteps = reviewStep

  const pr = config.priceRange

  // Venue pricing model — derived helpers (used by publish, review preview & gating)
  const venueOffersRent = venuePricingModels.includes('rent')
  const venueOffersPerPlate = venuePricingModels.includes('perPlate')
  const venueRentTier = hourlyPricing.find(t => t.hours === 24) || hourlyPricing[0]
  const venueRentPrice = venueRentTier?.price || 0
  const venuePlateFrom = platePackages.length > 0 ? Math.min(...platePackages.map(p => p.pricePerPlate)) : 0
  // True once the venue has at least one model with valid pricing entered.
  const venuePricingReady =
    (venueOffersRent && venueRentPrice > 0) ||
    (venueOffersPerPlate && venuePlateFrom > 0)

  // Photography pricing model — derived helpers (mirror the venue ones)
  const photoOffersHourly = photographyPricingModels.includes('hourly')
  const photoOffersGuest = photographyPricingModels.includes('guestBased')
  const photoHourlyBase = getRateCardBaseHourly(rateCard)
  const photoGuestFrom = getPhotographyGuestFromPrice(guestPackages)
  // True once the photographer has at least one model with valid pricing entered.
  const photoPricingReady =
    (photoOffersHourly && photoHourlyBase > 0) ||
    (photoOffersGuest && photoGuestFrom > 0)
  // Number of dishes (dish-bank + custom) configured in a plate package's menu.
  const menuItemCount = (menu?: MenuSection[]) =>
    (menu || []).reduce((s, sec) => s + sec.dishIds.length + (sec.customDishes?.length || 0), 0)
  // Decor step is answerable once they pick No, choose to skip, or open the add-now form.
  const decorStepReady =
    inHouseDecorCompulsory === false ||
    inHouseDecorMode === 'skip' ||
    (inHouseDecorMode === 'now' && decorFormOpen)
  // Decor detail fields reuse the Decor listing's first step ("Decor details").
  const decorFieldDefs = getListingConfig('Decor').steps[0].fields
  // Location step needs at least an address before continuing.
  const venueLocationReady = venueLocation.address.trim().length > 0

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
      for (const stepCfg of config.steps) {
        for (const f of stepCfg.fields) {
          if (!f.visibleWhen) continue
          if (!isFieldVisible(f, next)) {
            delete next[f.key]
          } else if (f.type === 'number' && next[f.key] === undefined) {
            // Field just became visible — pre-fill with its min so the displayed value is the stored value
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

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)

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
    // (so couples see that by default). For Decor there's no listing-level price
    // (couples use the Customize/bid flow). Other categories use the slider.
    const effectivePrice = category === 'Venue'
      ? (venueOffersRent && venueRentPrice > 0 ? venueRentPrice
        : venueOffersPerPlate && venuePlateFrom > 0 ? venuePlateFrom
        : price)
      : category === 'Decor' ? 0
      // Photography: prefer the hourly "₹X/hr" board figure; fall back to the
      // cheapest guest-package cell when only guest-based pricing is offered.
      : category === 'Photography'
        ? (photoOffersHourly && photoHourlyBase > 0 ? photoHourlyBase : photoGuestFrom)
      : price

    // Upload paid-room photos in live mode and replace blob URLs with public URLs.
    let paidRoomsForPayload: PaidRoom[] = paidRooms
    if (category === 'Venue' && paidRooms.length > 0 && _liveMode && _vendorDbId) {
      paidRoomsForPayload = await Promise.all(paidRooms.map(async room => {
        const files = paidRoomFiles[room.id] || []
        if (files.length === 0) return room
        const uploaded = await uploadPhotos(_vendorDbId, files, 'listing')
        // Replace the room's photos with uploaded URLs (drop the blob previews).
        return uploaded.length > 0 ? { ...room, photos: uploaded } : room
      }))
    }

    // In-house decor — upload design media in live mode, then build the payload object.
    let inHouseDecorForPayload: InHouseDecor | undefined = undefined
    if (category === 'Venue' && inHouseDecorCompulsory !== null) {
      const addingNow = inHouseDecorCompulsory && inHouseDecorMode === 'now'
      const pending = inHouseDecorCompulsory && inHouseDecorMode === 'skip'
      let decorDesigns = inHouseDecorDesigns
      if (addingNow && decorDesigns.length > 0 && _liveMode && _vendorDbId) {
        decorDesigns = await Promise.all(decorDesigns.map(async d => {
          const files = inHouseDecorFiles[d.id]
          let photos = d.photos
          let videos = d.videos
          if (files?.photos.length) {
            const up = await uploadPhotos(_vendorDbId, files.photos, 'listing')
            if (up.length > 0) photos = up
          }
          if (files?.videos.length) {
            const up = await uploadPhotos(_vendorDbId, files.videos, 'listing')
            if (up.length > 0) videos = up
          }
          return { ...d, photos, videos }
        }))
      }
      inHouseDecorForPayload = {
        compulsory: inHouseDecorCompulsory,
        pending: pending || undefined,
        fields: addingNow && Object.keys(inHouseDecorFields).length > 0 ? inHouseDecorFields : undefined,
        designs: addingNow && decorDesigns.length > 0 ? decorDesigns : undefined,
      }
    }

    const createdAt = new Date().toISOString().split('T')[0]
    // Transport & logistics — applied uniformly across all listings produced by this flow.
    const transportFields = {
      transportIncluded: transportIncluded === null ? undefined : transportIncluded,
    }

    // Decor: fan out each design into its own listing — shared category fields,
    // rituals, and shared decor logistics. Photos/videos and price per design.
    if (category === 'Decor') {
      const ts = Date.now()
      // Upload each design's photos/videos in live mode and replace blob URLs.
      const designListings: VendorListing[] = await Promise.all(designs.map(async (d, i) => {
        let designPhotos = d.photos
        let designVideos = d.videos
        if (_liveMode && _vendorDbId) {
          const files = designFiles[d.id]
          if (files?.photos.length) {
            const uploaded = await uploadPhotos(_vendorDbId, files.photos, 'listing')
            if (uploaded.length > 0) designPhotos = uploaded
          }
          if (files?.videos.length) {
            const uploaded = await uploadPhotos(_vendorDbId, files.videos, 'listing')
            if (uploaded.length > 0) designVideos = uploaded
          }
        }
        // Normalise sizes — keep only complete rows (positive W, H, and price).
        // If any are valid, the listing price is the cheapest size (the "from" price).
        const validSizes = (d.sizes || []).filter(s => s.widthFt > 0 && s.heightFt > 0 && s.price > 0)
        const startingPrice = validSizes.length > 0
          ? Math.min(...validSizes.map(s => s.price))
          : d.price
        return {
          id: `vl-${ts}-${i}`,
          name: d.name.trim() || `Design ${i + 1}`,
          photos: designPhotos,
          videos: designVideos.length > 0 ? designVideos : undefined,
          coverPhotoIndex: 0,
          category,
          price: startingPrice,
          sizes: validSizes.length > 0 ? validSizes : undefined,
          style: '',
          rituals,
          categoryFields,
          includes,
          createdAt,
          ...transportFields,
        }
      }))
      let allOk = true
      for (const l of designListings) { if (!(await addListing(l))) allOk = false }
      if (!allOk) {
        setPublishing(false)
        setPublishError("We couldn't save one or more of your designs. Please check your connection and try again.")
        return
      }

      // Apply Decor → venue links to each newly-created design listing
      if (linkedVenueIds.length > 0) {
        for (const venueId of linkedVenueIds) {
          const venue = vendorListings.find(l => l.id === venueId)
          if (!venue) continue
          let existing = venue.bundledListings || []
          for (const dl of designListings) {
            if (!existing.includes(dl.id)) existing = [...existing, dl.id]
          }
          updateListing({
            ...venue,
            bundledListings: existing,
            bundleMandatory: linkedVenueMandatory ? true : venue.bundleMandatory,
          })
        }
      }

      setPublishing(false)
      navigate(`${base}/listings`)
      return
    }

    const listing: VendorListing = {
      id: `vl-${Date.now()}`,
      name: effectiveName,
      photos: photoUrls,
      videos: videoUrls.length > 0 ? videoUrls : undefined,
      coverPhotoIndex: coverIndex,
      category,
      price: effectivePrice,
      style: '',
      rituals,
      categoryFields,
      includes,
      createdAt,
      bundledListings: category === 'Venue' ? bundledListings : undefined,
      bundleMandatory: category === 'Venue' ? bundleMandatory : undefined,
      venueLocation: category === 'Venue' && venueLocation.address.trim() ? venueLocation : undefined,
      venuePricingModels: category === 'Venue' && venuePricingModels.length > 0 ? venuePricingModels : undefined,
      hourlyPricing: category === 'Venue' && venueOffersRent && hourlyPricing.length > 0 ? hourlyPricing : undefined,
      platePackages: category === 'Venue' && venueOffersPerPlate && platePackages.length > 0 ? platePackages : undefined,
      rateCard: category === 'Photography' && photoOffersHourly ? rateCard : undefined,
      availableHours: category === 'Photography' && photoOffersHourly && availableHours.length > 0 ? [...availableHours].sort((a, b) => a - b) : undefined,
      photographyPricingModels: category === 'Photography' && photographyPricingModels.length > 0 ? photographyPricingModels : undefined,
      guestPackages: category === 'Photography' && photoOffersGuest && photoGuestFrom > 0 ? guestPackages : undefined,
      guestPackagePhotographers: category === 'Photography' && photoOffersGuest && Object.keys(guestPackagePhotographers).length > 0 ? guestPackagePhotographers : undefined,
      guestPackageVideographers: category === 'Photography' && photoOffersGuest && Object.keys(guestPackageVideographers).length > 0 ? guestPackageVideographers : undefined,
      paidRooms: category === 'Venue' && paidRoomsForPayload.length > 0 ? paidRoomsForPayload : undefined,
      inHouseDecor: category === 'Venue' ? inHouseDecorForPayload : undefined,
      menu: category === 'Catering' && menu.length > 0 ? menu : undefined,
      ...transportFields,
    }
    const published = await addListing(listing)
    if (!published) {
      setPublishing(false)
      setPublishError("We couldn't publish your listing. Your details are still here — please check your connection and try again.")
      return
    }

    // In-house decor was marked compulsory but details were skipped — remind the vendor.
    if (category === 'Venue' && inHouseDecorForPayload?.pending) {
      addNotification({
        id: `n-${Date.now()}`,
        type: 'decor_reminder',
        title: 'Add your in-house decor details',
        body: `Your venue "${effectiveName}" requires in-house decor. Add the decor designs and details so couples can see what's included.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/vendor/listings',
      })
    }

    // If this Catering listing was linked to any venues, append it to each
    // venue's bundle so the existing user-side mandatory-bundle popup picks it up.
    if (linkedVenueIds.length > 0 && category === 'Catering') {
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
    // Embedded in onboarding — hand control back so onboarding can finish.
    if (embedded && onPublished) { onPublished(); return }
    navigate(`${base}/listings`)
  }


  // Price label per category
  const priceLabel = category === 'Catering' ? 'Price per plate' : category === 'Invitations' ? 'Price per invite' : 'Price'

  // Name is optional. If left blank, fall back to an ANONYMOUS default — never
  // the business name, since the paywall hides vendor identity until couples
  // unlock. We use a category headline attribute when there's a descriptive one,
  // else a generic label. Per-listing differences still show via the cover
  // photo, price, and the spec chips on the card.
  const HEADLINE_FIELD: Record<string, string> = { Venue: 'venueType', Catering: 'foodType', Decor: 'decorType' }
  const headlineValue = (() => {
    const key = HEADLINE_FIELD[category]
    const v = key ? categoryFields[key] : undefined
    return typeof v === 'string' && v.trim() ? v.trim() : null
  })()
  const effectiveName = name.trim() || (headlineValue ? `${category} · ${headlineValue}` : `${category} Package`)

  return (
    <div className="min-h-dvh bg-white page-enter flex flex-col">
      {/* Header */}
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {!isFirstListing && <button onClick={() => navigate(`${base}/listings`)} className="text-sm">←</button>}
          <p className="text-[14px] font-bold text-dark">{isFirstListing ? 'Your first listing' : 'New Listing'}</p>
        </div>
        <span className="text-[10px] text-gray-400">Step {step}/{totalSteps}</span>
      </div>

      {/* Onboarding hand-off banner */}
      {isFirstListing && (
        <div className="px-4 py-2 bg-mustard-light/60 border-b border-mustard/20">
          <p className="text-[11px] text-mustard font-medium text-center">Last step — add your first listing so couples can find you</p>
        </div>
      )}

      {/* Progress */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-mustard transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
      </div>

      <div className="flex-1 px-5 py-5 overflow-y-auto">

        {/* Step 1: Name (photos & videos moved to the end) */}
        {step === firstStep && hasListingTypeStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Listing type</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">As a venue you can also list in-house catering or décor. What is this listing for?</p>

            <div className="flex flex-wrap gap-2">
              {allowedCategories.map(c => (
                <button
                  key={c} onClick={() => changeCategory(c)}
                  className={`py-2 px-4 rounded-full text-[12px] font-medium transition-all ${c === category ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button onClick={() => setStep(ritualsStep)} className="mt-6 w-full py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">
              Next
            </button>
          </div>
        )}

        {/* Location step (Venue only) — the first step of the venue flow */}
        {step === locationStep && hasLocationStep && (
          <div className="animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-mustard-light flex items-center justify-center mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-6-5.3-6-10a6 6 0 0112 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" />
              </svg>
            </div>
            <h1 className="text-[20px] font-bold text-dark">Where is your venue?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Add the venue's location so couples can find it.</p>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1.5">Address</label>
                <textarea
                  value={venueLocation.address}
                  onChange={(e) => setVenueLocation(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  placeholder="Building, street, landmark…"
                  className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard resize-none"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-dark block mb-1.5">Area</label>
                  <input
                    type="text"
                    value={venueLocation.area || ''}
                    onChange={(e) => setVenueLocation(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Area / locality"
                    className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-dark block mb-1.5">City</label>
                  <input
                    type="text"
                    value={venueLocation.city || ''}
                    onChange={(e) => setVenueLocation(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard"
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1.5">Google Maps link <span className="text-[10px] text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="url"
                  value={venueLocation.mapsLink || ''}
                  onChange={(e) => setVenueLocation(prev => ({ ...prev, mapsLink: e.target.value }))}
                  placeholder="https://maps.google.com/…"
                  className="w-full px-3 py-2 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard"
                />
                <p className="text-[9px] text-gray-400 mt-1">Paste your venue's Google Maps link so couples can open directions.</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => navigate(`${base}/listings`)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Cancel</button>
              <button
                onClick={() => setStep(locationStep + 1)}
                disabled={!venueLocationReady}
                className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        )}

        {/* Rituals / Events step */}
        {step === ritualsStep && (
          <div className="animate-fadeIn">
            {/* Listing type picker for Decor (since Photos & Name step is skipped) */}
            {!hasListingTypeStep && allowedCategories.length > 1 && (
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
              {hasListingTypeStep ? (
                <button onClick={() => setStep(firstStep)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              ) : hasLocationStep ? (
                <button onClick={() => setStep(locationStep)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              ) : (
                <button onClick={() => navigate(`${base}/listings`)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Cancel</button>
              )}
              <button onClick={() => setStep(categoryStepStart)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Category-specific steps */}
        {config.steps.map((stepConfig, idx) => {
          const stepNum = categoryStepStart + idx
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

        {/* Designs step (Decor only) — each design becomes its own published listing */}
        {step === designsStep && hasDesignsStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Add your designs</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Each design becomes a separate listing couples can browse. Add photos, a price, and an optional name per design.</p>
            <DesignsEditor
              value={designs}
              onChange={setDesigns}
              onFilesAdded={(designId, kind, files) =>
                setDesignFiles(prev => {
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
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(designsStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(designsStep + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Menu step (Catering only) */}
        {step === menuStep && hasMenuStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Build your menu</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Pick a category, then tick the dishes you offer from the list — or add your own. Set how many the couple can pick per category.</p>
            <MenuBuilder
              value={menu}
              foodType={categoryFields.foodType as string | undefined}
              onChange={setMenu}
            />
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(menuStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(menuStep + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Pricing model step → per-package menu sub-screen (catering-style flow) */}
        {step === venuePricingStep && category === 'Venue' && menuEditPkgId && (() => {
          const pkg = platePackages.find(p => p.id === menuEditPkgId)
          if (!pkg) { setMenuEditPkgId(null); return null }
          return (
            <div className="animate-fadeIn">
              <button onClick={() => setMenuEditPkgId(null)} className="text-[12px] text-mustard font-medium mb-2">← Back to packages</button>
              <h1 className="text-[20px] font-bold text-dark">{pkg.name.trim() || 'Package'} menu</h1>
              <p className="text-[11px] text-gray-400 mt-1 mb-5">Pick a category, then tick the dishes included in this package — or add your own. Set how many the couple can pick per category.</p>
              {/* Start from another package's menu instead of from scratch. */}
              {(() => {
                const sources = platePackages.filter(p => p.id !== pkg.id && menuItemCount(p.menu) > 0)
                if (sources.length === 0) return null
                return (
                  <select
                    value=""
                    onChange={(e) => {
                      const src = platePackages.find(p => p.id === e.target.value)
                      if (!src || menuItemCount(src.menu) === 0) return
                      if (menuItemCount(pkg.menu) > 0 && !window.confirm("Replace this package's menu with a copy from the selected package?")) return
                      const copy = JSON.parse(JSON.stringify(src.menu)) as MenuSection[]
                      setPlatePackages(prev => prev.map(p => p.id === pkg.id ? { ...p, menu: copy } : p))
                    }}
                    className="w-full mb-3 px-2.5 py-2.5 rounded-lg border border-dashed border-mustard/50 text-[11px] font-medium text-dark bg-white outline-none focus:border-mustard"
                  >
                    <option value="">↓ Import menu from another package…</option>
                    {sources.map(p => (
                      <option key={p.id} value={p.id}>{p.name?.trim() || 'Package'} ({menuItemCount(p.menu)} items)</option>
                    ))}
                  </select>
                )
              })()}
              <MenuBuilder
                value={pkg.menu || []}
                foodType={categoryFields.foodPolicy as string | undefined}
                onChange={(next) => setPlatePackages(prev => prev.map(p => p.id === pkg.id ? { ...p, menu: next } : p))}
              />
              <button
                onClick={() => setMenuEditPkgId(null)}
                className="mt-6 w-full py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
              >Done · {menuItemCount(pkg.menu)} {menuItemCount(pkg.menu) === 1 ? 'item' : 'items'}</button>
            </div>
          )
        })()}

        {/* Pricing model step (Venue only) — rent and/or per-plate */}
        {step === venuePricingStep && category === 'Venue' && !menuEditPkgId && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">How do you price this venue?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Pick one or both. Couples will see each option clearly when comparing venues.</p>

            {/* Model selector */}
            <div className="flex flex-col gap-2.5 mb-5">
              {([
                { key: 'rent' as const, title: 'Venue rent', desc: 'You charge rent for the venue. Food is arranged separately.' },
                { key: 'perPlate' as const, title: 'Per-plate (food included)', desc: 'Rent is free — couples take food from your venue, charged per plate.' },
              ]).map(m => {
                const selected = venuePricingModels.includes(m.key)
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setVenuePricingModels(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
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

            {/* Rent model — per-duration hourly tiers */}
            {venueOffersRent && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Venue rent</p>
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

            {/* Per-plate model — food packages/tiers */}
            {venueOffersPerPlate && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Per-plate packages</p>
                <p className="text-[10px] text-gray-500 mb-2">Add menu tiers (e.g. Veg Silver, Non-veg Gold), each with its own per-plate price. Couples see the lowest as the "from" price.</p>

                {platePackages.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {platePackages.map((pkg, i) => {
                      const items = menuItemCount(pkg.menu)
                      return (
                        <div key={pkg.id} className="p-2 rounded-lg bg-white border border-card-border">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={pkg.name}
                              onChange={(e) => setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))}
                              className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
                              placeholder="Tier name"
                            />
                            <div className="relative w-[110px] shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                              <input
                                type="number"
                                min={0}
                                step={50}
                                value={pkg.pricePerPlate || ''}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 0
                                  setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, pricePerPlate: v } : p))
                                }}
                                className="w-full pl-6 pr-10 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
                                placeholder="0"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">/plate</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPlatePackages(prev => prev.filter((_, idx) => idx !== i))}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
                            >
                              ×
                            </button>
                          </div>
                          {/* Menu — opens the catering-style dish picker for this package */}
                          <button
                            type="button"
                            onClick={() => setMenuEditPkgId(pkg.id)}
                            className={`mt-2 w-full flex items-center justify-between py-2 px-2.5 rounded-lg text-[11px] font-medium transition-all ${items > 0 ? 'bg-mustard-light/50 text-dark border border-mustard/30' : 'bg-empty-bg text-gray-600 border border-card-border'}`}
                          >
                            <span>{items > 0 ? `Menu · ${items} ${items === 1 ? 'item' : 'items'}` : '+ Add menu items'}</span>
                            <span className="text-gray-400">›</span>
                          </button>

                          {/* Time slots — vendor names slots and sets hours so couples know the timing */}
                          <div className="mt-2">
                            <p className="text-[10px] text-gray-500 mb-1.5">Time slots <span className="text-gray-400">(optional)</span></p>
                            {(pkg.slots && pkg.slots.length > 0) && (
                              <div className="space-y-1.5 mb-1.5">
                                {pkg.slots.map((slot, si) => (
                                  <div key={slot.id} className="rounded-lg border border-card-border p-2.5 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={slot.name}
                                        onChange={(e) => setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, slots: (p.slots || []).map((s, sj) => sj === si ? { ...s, name: e.target.value } : s) } : p))}
                                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
                                        placeholder="e.g. Morning"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, slots: (p.slots || []).filter((_, sj) => sj !== si) } : p))}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-medium text-gray-500 w-8 shrink-0">From</span>
                                      <TimePicker
                                        value={slot.from}
                                        onChange={(val) => setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, slots: (p.slots || []).map((s, sj) => sj === si ? { ...s, from: val } : s) } : p))}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-medium text-gray-500 w-8 shrink-0">To</span>
                                      <TimePicker
                                        value={slot.to}
                                        onChange={(val) => setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, slots: (p.slots || []).map((s, sj) => sj === si ? { ...s, to: val } : s) } : p))}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setPlatePackages(prev => prev.map((p, idx) => idx === i ? { ...p, slots: [...(p.slots || []), { id: `sl-${Date.now()}-${(p.slots || []).length}`, name: '', from: '', to: '' }] } : p))}
                              className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-empty-bg text-dark border border-card-border active:bg-mustard-light/40"
                            >
                              + Add slot
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPlatePackages(prev => [...prev, { id: `pp-${Date.now()}-${prev.length}`, name: '', pricePerPlate: 0 }])}
                  className="px-3 py-1.5 rounded-full text-[10px] font-medium bg-empty-bg text-dark border border-card-border active:bg-mustard-light/40"
                >
                  + Add package
                </button>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(venuePricingStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button
                onClick={() => setStep(venuePricingStep + 1)}
                disabled={!venuePricingReady}
                className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        )}

        {/* In-house decor step (Venue only) — compulsory question, then the decor form */}
        {step === decorCompulsoryStep && category === 'Venue' && (
          inHouseDecorMode === 'now' && decorFormOpen ? (
            /* ── Decor details form (shown only after Continue) ── */
            <div className="animate-fadeIn">
              <h1 className="text-[20px] font-bold text-dark">In-house decor details</h1>
              <p className="text-[11px] text-gray-400 mt-1 mb-5">Add your decor style and designs. Couples booking this venue will see these.</p>

              <div className="space-y-5">
                {/* Decor detail fields (reused from the Decor listing flow) */}
                <div className="space-y-5">
                  {decorFieldDefs.map(field => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={inHouseDecorFields[field.key]}
                      onChange={(val) => setInHouseDecorFields(prev => ({ ...prev, [field.key]: val }))}
                      onToggleMulti={(val) => setInHouseDecorFields(prev => {
                        const cur = (prev[field.key] as string[]) || []
                        return { ...prev, [field.key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }
                      })}
                    />
                  ))}
                </div>

                {/* Designs — each with its own photos & price */}
                <div>
                  <p className="text-[12px] font-semibold text-dark mb-1">Decor designs</p>
                  <p className="text-[10px] text-gray-500 mb-2">Add each decor design with its own photos and price.</p>
                  <DesignsEditor
                    value={inHouseDecorDesigns}
                    onChange={setInHouseDecorDesigns}
                    showSizes={false}
                    onFilesAdded={(designId, kind, files) =>
                      setInHouseDecorFiles(prev => {
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

              <div className="flex gap-2 mt-6">
                <button onClick={() => setDecorFormOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
                <button
                  onClick={() => setStep(decorCompulsoryStep + 1)}
                  className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
                >Next</button>
              </div>
            </div>
          ) : (
            /* ── Compulsory question ── */
            <div className="animate-fadeIn">
              {/* Decorative header icon */}
              <div className="w-12 h-12 rounded-2xl bg-mustard-light flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.1L12 15.6 7.4 17l.9-5.1L4.5 8.5l5.2-.8z" />
                </svg>
              </div>
              <h1 className="text-[20px] font-bold text-dark">Is in-house decor compulsory?</h1>
              <p className="text-[11px] text-gray-400 mt-1 mb-5">Do couples booking this venue have to take your in-house decor?</p>

              <div className="flex flex-col gap-2.5 mb-5">
                {([
                  { val: true, title: 'Yes, compulsory', desc: 'Couples must take your in-house decor with the venue.' },
                  { val: false, title: 'No', desc: 'Couples can bring their own decor or arrange it elsewhere.' },
                ] as const).map(opt => {
                  const selected = inHouseDecorCompulsory === opt.val
                  return (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => { setInHouseDecorCompulsory(opt.val); setInHouseDecorMode(opt.val ? 'now' : null); setDecorFormOpen(false) }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-mustard' : 'border-gray-300'}`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-mustard" />}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-dark">{opt.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {inHouseDecorCompulsory === true && (
                <div className="animate-fadeIn">
                  {inHouseDecorMode === 'skip' ? (
                    <div className="p-3 rounded-xl bg-mustard-light/50 border border-mustard/30">
                      <p className="text-[11px] text-mustard font-semibold">You'll add decor details later</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">Couples will see this venue requires in-house decor; the designs appear once you add them. We'll remind you with a notification and a banner on this listing.</p>
                      <button
                        type="button"
                        onClick={() => { setInHouseDecorMode('now'); setDecorFormOpen(true) }}
                        className="mt-2 text-[11px] text-mustard font-semibold active:opacity-70"
                      >+ Add decor details now</button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setDecorFormOpen(true)}
                        className="w-full py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
                      >Continue to decor details</button>
                      <button
                        type="button"
                        onClick={() => setInHouseDecorMode('skip')}
                        className="block mx-auto mt-3 text-[10px] text-mustard/90 underline underline-offset-2 active:opacity-70"
                      >
                        Can't add these now? Skip for now — we'll remind you later.
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(decorCompulsoryStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
                <button
                  onClick={() => setStep(decorCompulsoryStep + 1)}
                  disabled={!decorStepReady}
                  className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
                >Next</button>
              </div>
            </div>
          )
        )}

        {/* Paid rooms step (Venue only) */}
        {step === paidRoomsStep && hasPaidRoomsStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Paid rooms (optional)</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Add rooms you rent out for guests. Each room can have its own occupancy, price, amenities, and photos.</p>
            <PaidRoomsEditor
              value={paidRooms}
              onChange={setPaidRooms}
              onFilesAdded={(roomId, files) =>
                setPaidRoomFiles(prev => ({ ...prev, [roomId]: [...(prev[roomId] || []), ...files] }))
              }
            />
            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(paidRoomsStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(paidRoomsStep + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Pricing step — Photography: pick model(s) (hourly and/or guest-based) */}
        {step === stylePriceStep && category === 'Photography' && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">How do you price?</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Pick one or both. Couples will choose whichever option works for them.</p>

            {/* Model selector */}
            <div className="flex flex-col gap-2.5 mb-5">
              {([
                { key: 'hourly' as const, title: 'Hourly rates', desc: 'Couples build a team (per role) and pick coverage hours. Priced per hour.' },
                { key: 'guestBased' as const, title: 'Guest-based packages', desc: 'Flat all-inclusive prices by guest count and coverage hours.' },
              ]).map(m => {
                const selected = photographyPricingModels.includes(m.key)
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPhotographyPricingModels(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${selected ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border bg-white'}`}
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

            {/* Hourly model — per-role rate card + willing hours */}
            {photoOffersHourly && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Hourly rates</p>
                <p className="text-[10px] text-gray-400 mb-3">Price per hour for each role you offer. Leave a role blank if you don't provide it.</p>

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

                {/* Willing hours — couples pick their coverage hours from these */}
                <div className="mt-4">
                  <label className="text-[12px] font-medium text-dark block mb-1">How many hours are you willing to work?</label>
                  <p className="text-[10px] text-gray-400 mb-2">Select every block you'll take on.</p>
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

            {/* Guest-based model — guest bucket × hours price matrix */}
            {photoOffersGuest && (
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-dark mb-0.5">Guest-based packages</p>
                <p className="text-[10px] text-gray-400 mb-3">Set a flat price for each guest count and coverage-hours combination you offer.</p>
                <PhotographyGuestPackagesEditor value={guestPackages} onChange={setGuestPackages} photographers={guestPackagePhotographers} onPhotographersChange={setGuestPackagePhotographers} videographers={guestPackageVideographers} onVideographersChange={setGuestPackageVideographers} />
                {photoGuestFrom > 0 && (
                  <p className="text-[11px] text-gray-600 mt-3">Board card shows <span className="font-bold text-mustard">from {formatINR(photoGuestFrom)}</span> when guest-based is your only model.</p>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(stylePriceStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button
                onClick={() => setStep(stylePriceStep + 1)}
                disabled={!photoPricingReady}
                className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        )}

        {/* Pricing step — single-price slider (non-Venue, non-Photography categories) */}
        {step === stylePriceStep && category !== 'Photography' && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Pricing</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Set your price.</p>

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
              <button onClick={() => setStep(stylePriceStep + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Inclusions step (skipped for Decor, Photography, Catering) */}
        {hasInclusionsStep && step === inclusionsStep && (
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
              <button onClick={() => setStep(inclusionsStep + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Photos & videos — moved to the end so text fields come first */}
        {step === photosStep && hasPhotosStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Add photos &amp; videos</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">Tap any photo to set it as your listing cover. Videos are optional.</p>

            {/* Photo upload */}
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

            <div className="flex gap-2 mt-6">
              <button onClick={() => setStep(photosStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={() => setStep(photosStep + 1)} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform">Next</button>
            </div>
          </div>
        )}

        {/* Review & Publish */}
        {step === reviewStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[20px] font-bold text-dark">Review & publish</h1>
            <p className="text-[11px] text-gray-400 mt-1 mb-5">
              {category === 'Decor'
                ? `Each design will be published as its own listing — ${designs.length} ${designs.length === 1 ? 'listing' : 'listings'} total.`
                : "Here's how your listing will look to couples."}
            </p>

            {/* Decor: grid of design tiles instead of single preview card */}
            {category === 'Decor' && (
              <div className="rounded-2xl border border-card-border p-3 mb-4">
                {designs.length === 0 ? (
                  <p className="text-[11px] text-gray-500 italic text-center py-4">No designs added — go back and add at least one before publishing.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {designs.map((d, i) => (
                      <div key={d.id} className="rounded-xl overflow-hidden border border-card-border">
                        {d.photos[0] ? (
                          <img src={d.photos[0]} alt="" className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-empty-bg flex items-center justify-center text-gray-400 text-[10px]">No photo</div>
                        )}
                        <div className="p-2">
                          <p className="text-[11px] font-semibold text-dark truncate">{d.name.trim() || `Design ${i + 1}`}</p>
                          <p className="text-[10px] font-bold text-mustard mt-0.5">{d.price > 0 ? formatINR(d.price) : 'Price not set'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Standard preview card (non-Decor) */}
            {category !== 'Decor' && (
            <div className="rounded-2xl border border-card-border overflow-hidden mb-4">
              {photoPreviews.length > 0 ? (
                <img src={photoPreviews[coverIndex] || photoPreviews[0]} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-empty-bg flex items-center justify-center text-gray-400 text-xs">No photo added</div>
              )}
              <div className="p-3">
                <p className="text-[14px] font-bold text-dark">{effectiveName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{vendorProfile?.area}</p>
                {(() => {
                  if (category === 'Venue') {
                    if (!venuePricingReady) return <p className="text-[12px] text-gray-400 italic mt-1">Price not set</p>
                    return (
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        {venueOffersRent && venueRentPrice > 0 && (
                          <p className="text-[16px] font-bold text-mustard">{formatINR(venueRentTier!.price)} <span className="text-[10px] font-normal text-gray-400">/ {venueRentTier!.hours} hr rent</span></p>
                        )}
                        {venueOffersPerPlate && venuePlateFrom > 0 && (
                          <p className="text-[16px] font-bold text-mustard">{formatINR(venuePlateFrom)} <span className="text-[10px] font-normal text-gray-400">/ plate{platePackages.length > 1 ? ' (from)' : ''}</span></p>
                        )}
                      </div>
                    )
                  }
                  if (category === 'Decor') {
                    return <p className="text-[12px] text-gray-400 italic mt-1">Couples request a quote via Customize</p>
                  }
                  if (category === 'Photography') {
                    return (
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        {photoOffersHourly && photoHourlyBase > 0 && (
                          <p className="text-[16px] font-bold text-mustard">{formatINR(photoHourlyBase)} <span className="text-[10px] font-normal text-gray-400">/hr · 1 of each role</span></p>
                        )}
                        {photoOffersGuest && photoGuestFrom > 0 && (
                          <p className="text-[16px] font-bold text-mustard">{formatINR(photoGuestFrom)} <span className="text-[10px] font-normal text-gray-400">/ package (from)</span></p>
                        )}
                        {!photoPricingReady && (
                          <p className="text-[12px] text-gray-400 italic">Set at least one price</p>
                        )}
                      </div>
                    )
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
            )}

            {/* Transport & logistics — asked for every category except Venue (a venue is a fixed location) */}
            {category !== 'Venue' && (
              <div className="mb-4 p-3 rounded-xl bg-empty-bg border border-card-border">
                <p className="text-[12px] font-semibold text-dark mb-1">Transport &amp; logistics included?</p>
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

            {/* Venue-only: location summary */}
            {category === 'Venue' && venueLocation.address.trim() && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] font-semibold text-dark">Location</p>
                  <button onClick={() => setStep(locationStep)} className="text-[10px] font-medium text-mustard">Edit</button>
                </div>
                <p className="text-[11px] text-dark">{venueLocation.address}</p>
                {(venueLocation.area || venueLocation.city) && (
                  <p className="text-[10px] text-gray-500 mt-0.5">{[venueLocation.area, venueLocation.city].filter(Boolean).join(', ')}</p>
                )}
                {venueLocation.mapsLink && <p className="text-[10px] text-mustard mt-0.5 truncate">📍 Map link added</p>}
              </div>
            )}

            {/* Venue-only: pricing model summary (edit in the Pricing model step) */}
            {category === 'Venue' && venuePricingModels.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-semibold text-dark">Pricing</p>
                  <button onClick={() => setStep(venuePricingStep)} className="text-[10px] font-medium text-mustard">Edit</button>
                </div>
                <div className="space-y-1.5">
                  {venueOffersRent && hourlyPricing.filter(t => t.price > 0).map((tier, i) => (
                    <div key={`r-${i}`} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5">
                      <span className="text-[11px] text-dark">Rent · {tier.hours} hr</span>
                      <span className="text-[11px] font-semibold text-mustard">{formatINR(tier.price)}</span>
                    </div>
                  ))}
                  {venueOffersPerPlate && platePackages.filter(p => p.pricePerPlate > 0).map((pkg) => {
                    const items = menuItemCount(pkg.menu)
                    return (
                      <div key={pkg.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5">
                        <span className="text-[11px] text-dark truncate">
                          {pkg.name.trim() || 'Per plate'}
                          {items > 0 ? <span className="text-[9px] text-gray-400 font-normal"> · {items} {items === 1 ? 'item' : 'items'}</span> : null}
                        </span>
                        <span className="text-[11px] font-semibold text-mustard">{formatINR(pkg.pricePerPlate)} <span className="text-[9px] font-normal text-gray-400">/plate</span></span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Venue-only: in-house decor summary */}
            {category === 'Venue' && inHouseDecorCompulsory !== null && (
              <div className="mb-4 p-3 rounded-xl bg-mustard-light/30 border border-mustard/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] font-semibold text-dark">In-house decor</p>
                  <button onClick={() => setStep(decorCompulsoryStep)} className="text-[10px] font-medium text-mustard">Edit</button>
                </div>
                {inHouseDecorCompulsory === false ? (
                  <p className="text-[10px] text-gray-500">Not compulsory.</p>
                ) : inHouseDecorMode === 'skip' ? (
                  <p className="text-[10px] text-gray-500">Compulsory · details to be added later (you'll be reminded).</p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500">Compulsory · {inHouseDecorDesigns.length} {inHouseDecorDesigns.length === 1 ? 'design' : 'designs'}</p>
                    {inHouseDecorDesigns.filter(d => d.price > 0 || (d.sizes?.length || 0) > 0).map((d) => {
                      const from = (d.sizes?.length || 0) > 0 ? Math.min(...(d.sizes || []).map(s => s.price).filter(p => p > 0)) : d.price
                      return (
                        <div key={d.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] text-dark truncate">{d.name.trim() || 'Design'}</span>
                          <span className="text-[11px] font-semibold text-mustard">{from > 0 ? formatINR(from) : '—'}</span>
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

            {publishError && (
              <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">{publishError}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(reviewStep - 1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium text-[13px]">Back</button>
              <button onClick={handlePublish} disabled={publishing} className="flex-1 py-3 rounded-xl bg-mustard text-white font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-50">
                {publishing ? (isFirstListing ? 'Going live...' : 'Publishing...') : (isFirstListing ? '🎉 Go live' : 'Publish listing')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Compact 12-hour time picker (hour / minute / AM-PM). Stores 'HH:MM' (24h). */
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
            type="button" onClick={dec}
            disabled={numVal <= min}
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
            type="button" onClick={inc}
            disabled={numVal >= max}
            className="px-3 text-dark text-[16px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
          >+</button>
          {field.numberUnit && <span className="px-3 flex items-center text-[11px] text-gray-500 border-l border-card-border bg-empty-bg">{field.numberUnit}</span>}
        </div>
      </div>
    )
  }

  return null
}
