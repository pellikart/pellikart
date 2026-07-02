import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorProfile, VendorPackage, VendorListing } from '@/lib/vendor-types'
import { uploadPhotos, setVendorLive, setVendorLiveById } from '@/lib/supabase-db'
import { emptyMehendiPricing, emptyMakeupPricing, emptySareeDrapingPricing, emptyHairStylingPricing, isSingleListingCategory, type MehendiPricing, type MakeupPricing, type SareeDrapingPricing, type HairStylingPricing } from '@/lib/vendor-category-config'
import { getMehendiFromPrice, getMakeupFromPrice, getSareeDrapingFromPrice, getHairStylingFromPrice } from '@/lib/helpers'
import MehendiPricingEditor from '@/components/MehendiPricingEditor'
import MakeupPricingEditor from '@/components/MakeupPricingEditor'
import MakeupAddonsEditor from '@/components/MakeupAddonsEditor'
import SareeDrapingPricingEditor from '@/components/SareeDrapingPricingEditor'
import HairStylingPricingEditor from '@/components/HairStylingPricingEditor'
import VendorAddListing from './VendorAddListing'

export const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Mehendi', 'DJ / Music', 'Pandit', 'Invitations', 'Banjantrilu', 'Reels', 'Hair Stylist', 'Saree Draping', 'Live Stalls', 'Hosts / Entertainers', 'Wedding Props']
const AREAS = ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kukatpally', 'Secunderabad', 'Kondapur', 'Hitech City', 'Begumpet', 'Ameerpet']
const TEAM_SIZES_DEFAULT = ['Solo', '2-5', '5-10', '10+']
// Decor crews are usually larger — start at 5 and step up by 5 to 30+.
const TEAM_SIZES_DECOR = ['5', '10', '15', '20', '25', '30+']

// Photos straight off a phone are 5–12 MB and decode to huge bitmaps. Holding ten
// of them in memory (as File objects + full-res <img> previews) can spike memory
// enough that mobile browsers discard and reload the tab — which resets the whole
// onboarding to step 1. Downscale to a web-friendly size on selection so previews
// and uploads stay small. Falls back to the original file if anything fails.
async function downscaleImage(file: File, maxDim = 2000, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    // Already small enough — keep the original (avoids needless re-encode).
    if (scale === 1 && file.size <= 1_500_000) { bitmap.close(); return file }
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return file }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file
  }
}

// Persist the questionnaire (everything except the binary photo/video files, which
// can't be serialized) so an accidental refresh or a mobile memory-reload doesn't
// wipe the vendor's progress. Stored per-tab; cleared once onboarding completes.
const DRAFT_KEY = 'pellikart:vendor-onboarding-draft'
function loadDraft(): Record<string, unknown> {
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}') } catch { return {} }
}

/** Optional props let staff reuse this exact flow inside the admin panel to
 *  build a vendor on someone's behalf: `returnPath` is where we go when done
 *  (back to /admin instead of the vendor dashboard) and `adminSeed` prefills the
 *  identity fields captured on the "Add vendor" step. When omitted it's the
 *  normal self-serve vendor onboarding. */
interface VendorOnboardingProps {
  returnPath?: string
  adminSeed?: { businessName: string; category: string; phone?: string }
}

export default function VendorOnboarding({ returnPath = '/vendor', adminSeed }: VendorOnboardingProps = {}) {
  const navigate = useNavigate()
  const { completeVendorOnboarding } = useVendorStore()

  // Restore any in-progress draft (text fields, selections, pricing, current step)
  // so a refresh / mobile memory-reload resumes instead of starting over.
  const draft = loadDraft()
  const [step, setStep] = useState<number>(() => (draft.step as number) ?? 1)
  // 'profile' = the onboarding questions; 'listing' = the embedded first-listing
  // wizard (multi-listing categories) shown before onboarding is marked complete.
  const [phase, setPhase] = useState<'profile' | 'listing'>('profile')
  const [businessName, setBusinessName] = useState((draft.businessName as string) ?? adminSeed?.businessName ?? '')
  const [category, setCategory] = useState((draft.category as string) ?? adminSeed?.category ?? '')
  const [area, setArea] = useState((draft.area as string) ?? '')
  const [phone, setPhone] = useState((draft.phone as string) ?? adminSeed?.phone ?? '')
  const [secondaryPhone, setSecondaryPhone] = useState((draft.secondaryPhone as string) ?? '')
  const [whatsapp, setWhatsapp] = useState((draft.whatsapp as string) ?? '')
  const [email, setEmail] = useState((draft.email as string) ?? '')
  const [instagram, setInstagram] = useState((draft.instagram as string) ?? '')
  const [sameAsPhone, setSameAsPhone] = useState((draft.sameAsPhone as boolean) ?? true)
  const [description, setDescription] = useState((draft.description as string) ?? '')
  const [experience, setExperience] = useState((draft.experience as string) ?? '')
  const [teamSize, setTeamSize] = useState((draft.teamSize as string) ?? '')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [goLiveError, setGoLiveError] = useState<string | null>(null)
  // Single-listing categories (Mehendi, Makeup) author their pricing here in
  // onboarding and auto-create one listing on go-live.
  const [mehendiPricing, setMehendiPricing] = useState<MehendiPricing>(() => (draft.mehendiPricing as MehendiPricing) ?? emptyMehendiPricing())
  const [makeupPricing, setMakeupPricing] = useState<MakeupPricing>(() => (draft.makeupPricing as MakeupPricing) ?? emptyMakeupPricing())
  const [makeupAddons, setMakeupAddons] = useState<Record<string, number>>(() => (draft.makeupAddons as Record<string, number>) ?? {})
  const [sareePricing, setSareePricing] = useState<SareeDrapingPricing>(() => (draft.sareePricing as SareeDrapingPricing) ?? emptySareeDrapingPricing())
  // Makeup-only: some makeup artists also offer mehendi / saree draping / hairstyling as add-ons.
  const [sareeAvailable, setSareeAvailable] = useState<boolean | null>((draft.sareeAvailable as boolean | null) ?? null)
  const [hairPricing, setHairPricing] = useState<HairStylingPricing>(() => (draft.hairPricing as HairStylingPricing) ?? emptyHairStylingPricing())
  const [hairAvailable, setHairAvailable] = useState<boolean | null>((draft.hairAvailable as boolean | null) ?? null)
  const [mehendiAvailable, setMehendiAvailable] = useState<boolean | null>((draft.mehendiAvailable as boolean | null) ?? null)
  // Single-listing categories: transport & logistics applied to the auto-created listing.
  const [transportIncluded, setTransportIncluded] = useState<boolean | null>((draft.transportIncluded as boolean | null) ?? null)

  // Keep the draft in sessionStorage in sync with the questionnaire. Photos/videos
  // are intentionally excluded (binary files can't be serialized) — on a reload the
  // vendor keeps every text/pricing answer and just re-adds media on the last step.
  useEffect(() => {
    const snapshot = {
      step, businessName, category, area, phone, secondaryPhone, whatsapp, email,
      instagram, sameAsPhone, description, experience, teamSize, mehendiPricing,
      makeupPricing, makeupAddons, sareePricing, sareeAvailable, hairPricing,
      hairAvailable, mehendiAvailable, transportIncluded,
    }
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot)) } catch { /* quota/serialize errors are non-fatal */ }
  }, [step, businessName, category, area, phone, secondaryPhone, whatsapp, email,
    instagram, sameAsPhone, description, experience, teamSize, mehendiPricing,
    makeupPricing, makeupAddons, sareePricing, sareeAvailable, hairPricing,
    hairAvailable, mehendiAvailable, transportIncluded])

  // Steps: 1=Welcome, 2=Business Basics, 3=Contact, 4=About, then category pricing/
  // add-ons (girly), then Portfolio Photos, then Ready. Photos go last so vendors
  // fill all text/number fields first and finish with the upload.
  const isMehendi = category === 'Mehendi'
  const isMakeup = category === 'Makeup'
  const isSaree = category === 'Saree Draping'
  const isHair = category === 'Hair Stylist'
  const isSingleListing = isSingleListingCategory(category)
  let _s = 5
  const pricingStep = isSingleListing ? _s++ : -1      // single-listing categories only
  const makeupAddonsStep = isMakeup ? _s++ : -1        // Makeup only — add-ons (lashes, etc.)
  const sareeAddonStep = isMakeup ? _s++ : -1          // Makeup only
  const hairAddonStep = isMakeup ? _s++ : -1           // Makeup only
  const mehendiAddonStep = isMakeup ? _s++ : -1        // Makeup only
  // Photos step only for single-listing categories (it IS their listing's photos).
  // Multi-listing categories add photos in the listing wizard instead, and their
  // portfolio is the aggregate of all listing photos — so no separate upload here.
  const portfolioStep = isSingleListing ? _s++ : -1
  const totalSteps = _s                                // Ready

  function next() { setStep((s) => Math.min(s + 1, totalSteps)) }
  function back() { setStep((s) => Math.max(s - 1, 1)) }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const incoming = Array.from(e.target.files)
    e.target.value = '' // allow re-picking the same file and release the input's hold on it
    // Downscale before storing so we never hold full-res phone photos in memory.
    const files = await Promise.all(incoming.map(f => downscaleImage(f)))
    setPhotoFiles(prev => [...prev, ...files].slice(0, 10))
    const previews = files.map(f => URL.createObjectURL(f))
    setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10))
  }

  function removePhoto(index: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleGoLive() {
    setUploading(true)
    setGoLiveError(null)

    // Initial profile carries empty media arrays. We need the vendor row to
    // exist (and hand back its DB id) before we can scope storage uploads
    // under it. We then swap in the real public URLs in a second pass.
    // Earlier this wrote blob: URLs from URL.createObjectURL into Supabase,
    // which broke on refresh because blob: URLs are session-scoped.
    const profile: VendorProfile = {
      businessName: businessName || 'My Business',
      category: category || 'Photography',
      city: 'Hyderabad',
      area: area || 'Jubilee Hills',
      phone: phone || '+919876543210',
      secondaryPhone: secondaryPhone.trim() || undefined,
      whatsapp: sameAsPhone ? (phone || '+919876543210') : (whatsapp || '+919876543210'),
      email: email || 'vendor@example.com',
      instagram: instagram.trim() || undefined,
      description: description || 'Professional wedding services',
      experience: parseInt(experience) || 5,
      teamSize: teamSize || '2-5',
      portfolioPhotos: [],
      portfolioVideos: undefined,
      rating: 0,
    }
    const defaultPackages: VendorPackage[] = []
    // For multi-listing categories we DEFER marking onboarding complete — the
    // vendor record is created (so we have a DB id for uploads) but onboarding
    // stays "in progress" so the embedded first-listing step is still shown.
    await completeVendorOnboarding(profile, defaultPackages, isSingleListing)

    // Now that completeVendorOnboarding has run upsertVendor, _vendorDbId
    // is populated. Upload photos/videos and persist their public URLs.
    const { _vendorDbId, _liveMode } = useVendorStore.getState()
    // Photos to attach to an auto-created listing (Mehendi). Demo uses blob previews;
    // live uses the uploaded public URLs once available. Upload keys off the
    // vendor DB id, so this path works for both a real vendor and an admin
    // building a vendor (user_id NULL) — the store re-keys the profile write.
    let listingPhotos: string[] = _liveMode ? [] : photoPreviews
    if (_liveMode && _vendorDbId) {
      const portfolioUrls = photoFiles.length > 0
        ? await uploadPhotos(_vendorDbId, photoFiles, 'portfolio')
        : []
      const portfolioVideoUrls = videoFiles.length > 0
        ? await uploadPhotos(_vendorDbId, videoFiles, 'portfolio')
        : []
      listingPhotos = portfolioUrls

      if (portfolioUrls.length > 0 || portfolioVideoUrls.length > 0) {
        const updates: Partial<VendorProfile> = {}
        if (photoFiles.length > 0) updates.portfolioPhotos = portfolioUrls
        if (videoFiles.length > 0) updates.portfolioVideos = portfolioVideoUrls
        // Persists via the store's admin-aware write (by id or user_id) and
        // merges the real URLs into local state so the dashboard renders them now.
        useVendorStore.getState().updateVendorProfile(updates)
      }
    } else if (!_liveMode) {
      // Demo mode — keep the blob previews on the local profile so the UI
      // shows something. They won't survive refresh, but demo has no refresh.
      useVendorStore.setState((s) => ({
        vendorProfile: s.vendorProfile ? {
          ...s.vendorProfile,
          portfolioPhotos: photoPreviews,
          portfolioVideos: videoPreviews.length > 0 ? videoPreviews : undefined,
        } : null,
      }))
    }

    // Single-listing categories: auto-create the one listing from the onboarding
    // pricing so it shows on the couple side without a separate creation flow.
    if (isSingleListing) {
      const base = {
        id: `vl-${Date.now()}`,
        photos: listingPhotos,
        coverPhotoIndex: 0,
        style: '',
        includes: [],
        createdAt: new Date().toISOString().split('T')[0],
        transportIncluded: transportIncluded === null ? undefined : transportIncluded,
      }
      const listing: VendorListing = isMehendi
        ? { ...base, name: `${profile.businessName} — Mehendi`, category: 'Mehendi', price: getMehendiFromPrice(mehendiPricing), mehendiPricing, rituals: ['Mehendi'] }
        : isMakeup
        ? { ...base, name: `${profile.businessName} — Makeup`, category: 'Makeup', price: getMakeupFromPrice(makeupPricing), makeupPricing: { ...makeupPricing, addons: makeupAddons }, mehendiPricing: mehendiAvailable ? mehendiPricing : undefined, sareeDrapingPricing: sareeAvailable ? sareePricing : undefined, hairStylingPricing: hairAvailable ? hairPricing : undefined, rituals: [] }
        : isSaree
        ? { ...base, name: `${profile.businessName} — Saree Draping`, category: 'Saree Draping', price: getSareeDrapingFromPrice(sareePricing), sareeDrapingPricing: sareePricing, rituals: [] }
        : { ...base, name: `${profile.businessName} — Hair Stylist`, category: 'Hair Stylist', price: getHairStylingFromPrice(hairPricing), hairStylingPricing: hairPricing, rituals: [] }
      const ok = await useVendorStore.getState().addListing(listing)
      if (!ok) {
        // The listing row didn't save — don't leave the vendor stranded as
        // "live" with nothing for couples to see. Surface the error so they can
        // retry; the vendor stays not-live until a listing actually lands.
        setUploading(false)
        setGoLiveError("We couldn't publish your listing. Please check your connection and try again.")
        return
      }
      // Listing confirmed — now it's safe to flip the vendor live. (addListing
      // already flips via id; this is a belt-and-suspenders retry.)
      const { _liveMode: lm, _adminMode: am, _userId: uid, _vendorDbId: vdbId } = useVendorStore.getState()
      if (lm && am && vdbId) await setVendorLiveById(vdbId)
      else if (lm && uid) await setVendorLive(uid)
    }

    setUploading(false)
    if (isSingleListing) {
      // Single-listing categories already authored their one listing above and
      // onboarding is marked complete — go to the dashboard.
      try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
      navigate(returnPath)
    } else {
      // Every other category continues — in the same onboarding flow — into the
      // embedded first-listing wizard. Onboarding finishes only once it publishes.
      setPhase('listing')
    }
  }

  // Called by the embedded listing wizard once the first listing is published:
  // mark onboarding complete and head to the dashboard.
  async function finishFirstListing() {
    // The embedded wizard only calls this after a listing was confirmed saved,
    // so it's now safe to flip the vendor live + onboarding-complete in the DB.
    const { _liveMode: lm, _adminMode: am, _userId: uid, _vendorDbId: vdbId } = useVendorStore.getState()
    if (lm && am && vdbId) await setVendorLiveById(vdbId)
    else if (lm && uid) await setVendorLive(uid)
    try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    useVendorStore.setState({ vendorOnboardingComplete: true })
    navigate(returnPath)
  }

  // Multi-listing categories: the first listing is created inside onboarding,
  // via the full listing wizard, before onboarding is marked complete.
  if (phase === 'listing') {
    return <VendorAddListing embedded onPublished={finishFirstListing} />
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white pt-[env(safe-area-inset-top)]">
      {step > 1 && step < totalSteps && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-mustard transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      )}
      {step > 1 && step < totalSteps && (
        <button onClick={back} className="self-start px-4 pt-3 text-sm text-gray-500">← Back</button>
      )}

      <div className="flex-1 flex flex-col px-6 py-6 justify-center">

        {/* Screen 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-fadeIn">
            <img src="/logo.png" alt="Pellikart" className="w-24 h-24 object-cover rounded-3xl mb-6" />
            <h1 className="text-[22px] font-bold text-dark leading-tight">Join Pellikart<br/>as a vendor</h1>
            <p className="text-[13px] text-gray-500 mt-3 max-w-[280px]">Set up your profile in a few minutes. Start receiving bookings.</p>
            <button onClick={next} className="mt-8 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Get started
            </button>
          </div>
        )}

        {/* Screen 2: Business Basics */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Business basics</h1>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Business name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Lens & Light Studio" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-[13px] outline-none bg-white focus:border-mustard ${category ? 'border-mustard text-dark' : 'border-card-border text-gray-400'}`}
                >
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Where you're based</label>
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map((a) => (
                    <button key={a} onClick={() => setArea(a)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${area === a ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">This helps couples nearby discover you.</p>
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Screen 3: Contact */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Contact details</h1>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Phone number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Secondary number <span className="text-[10px] text-gray-400 font-normal">(optional)</span></label>
                <input type="tel" value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} placeholder="+91 90000 00000" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
              </div>
              <div>
                <label className="flex items-center gap-2 mb-1">
                  <input type="checkbox" checked={sameAsPhone} onChange={() => setSameAsPhone(!sameAsPhone)} className="accent-mustard" />
                  <span className="text-[11px] text-gray-500">WhatsApp same as phone</span>
                </label>
                {!sameAsPhone && (
                  <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp number" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
                )}
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Instagram <span className="text-[10px] text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
                <p className="text-[10px] text-gray-400 mt-1">Show your latest work. Visible to subscribed couples.</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">Couples who book you will use these to reach you directly.</p>
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Screen 4: About */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">About your business</h1>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell couples what makes you special..." maxLength={500} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard resize-none" />
                <span className="text-[9px] text-gray-400">{description.length}/500</span>
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Years of experience</label>
                <div className="flex gap-2">
                  {['1', '2', '3', '5', '7', '10', '15', '20+'].map((y) => (
                    <button key={y} onClick={() => setExperience(y)} className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${experience === y ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1.5">Team size</label>
                <div className="flex flex-wrap gap-2">
                  {(category === 'Decor' ? TEAM_SIZES_DECOR : TEAM_SIZES_DEFAULT).map((t) => (
                    <button key={t} onClick={() => setTeamSize(t)} className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-[12px] font-medium transition-all ${teamSize === t ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">This builds trust — couples want to know who they're booking.</p>
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Portfolio Photos — moved near the end so text/number fields come first */}
        {step === portfolioStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Show your work</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Upload photos of your best work. This is what couples see first. (You can add more later)</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {photoPreviews.map((p, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                  <img src={p} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-mustard text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full">COVER</span>}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >×</button>
                </div>
              ))}
              {photoPreviews.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-mustard/30 flex flex-col items-center justify-center cursor-pointer active:bg-mustard-light/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  <span className="text-[9px] text-gray-400 mt-1">Add photos</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                </label>
              )}
            </div>

            <p className="text-[10px] text-gray-400">{photoPreviews.length}/10 photos · JPG, PNG, WebP · Max 5MB each</p>

            <p className="text-[13px] font-semibold text-dark mt-6 mb-2">Videos <span className="text-[10px] text-gray-400 font-normal">(optional)</span></p>
            <div className="grid grid-cols-3 gap-2 mb-2">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  <span className="text-[9px] text-gray-400 mt-1">Add videos</span>
                  <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoSelect} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-400">{videoPreviews.length}/5 videos · MP4, MOV, WebM · Max 50MB each</p>

            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              {photoPreviews.length === 0 && videoPreviews.length === 0 ? 'Skip for now' : 'Next'}
            </button>
          </div>
        )}

        {/* Screen 6 (single-listing categories): pricing — authored here, becomes the listing */}
        {isSingleListing && step === pricingStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Your {category} pricing</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">This becomes your listing — couples pick what they want and see the price. You can edit it anytime from your dashboard.</p>
            {isMehendi
              ? <MehendiPricingEditor value={mehendiPricing} onChange={setMehendiPricing} />
              : isMakeup
              ? <MakeupPricingEditor value={makeupPricing} onChange={setMakeupPricing} />
              : isSaree
              ? <SareeDrapingPricingEditor value={sareePricing} onChange={setSareePricing} />
              : <HairStylingPricingEditor value={hairPricing} onChange={setHairPricing} />}
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Makeup add-ons (lashes, extensions, etc.) — after the makeup pricing screen */}
        {isMakeup && step === makeupAddonsStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Add-ons</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Price any extras you offer. Leave blank for ones you don't. Couples can add these on top of their look.</p>
            <MakeupAddonsEditor value={makeupAddons} onChange={setMakeupAddons} />
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Screen 7 (Makeup only): saree draping add-on */}
        {isMakeup && step === sareeAddonStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Do you also offer Saree Draping?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Many makeup artists offer saree draping too. Add it and couples can book both together.</p>
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setSareeAvailable(true)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${sareeAvailable === true ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >Yes</button>
              <button
                type="button"
                onClick={() => setSareeAvailable(false)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${sareeAvailable === false ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >No</button>
            </div>
            {sareeAvailable === true && (
              <SareeDrapingPricingEditor value={sareePricing} onChange={setSareePricing} />
            )}
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Screen 8 (Makeup only): hairstyling add-on */}
        {isMakeup && step === hairAddonStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Do you also offer Hairstyling?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Many makeup artists style hair too. Add it and couples can book it together.</p>
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setHairAvailable(true)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${hairAvailable === true ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >Yes</button>
              <button
                type="button"
                onClick={() => setHairAvailable(false)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${hairAvailable === false ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >No</button>
            </div>
            {hairAvailable === true && (
              <HairStylingPricingEditor value={hairPricing} onChange={setHairPricing} />
            )}
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Screen 9 (Makeup only): mehendi add-on */}
        {isMakeup && step === mehendiAddonStep && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Do you also offer Mehendi?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Many makeup artists offer mehendi too. Add it and couples can book both together.</p>
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setMehendiAvailable(true)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${mehendiAvailable === true ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >Yes</button>
              <button
                type="button"
                onClick={() => setMehendiAvailable(false)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all ${mehendiAvailable === false ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
              >No</button>
            </div>
            {mehendiAvailable === true && (
              <MehendiPricingEditor value={mehendiPricing} onChange={setMehendiPricing} />
            )}
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">Next</button>
          </div>
        )}

        {/* Ready (last screen) */}
        {step === totalSteps && (
          <div className="animate-fadeIn text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-[22px] font-bold text-dark leading-tight">Your profile is ready!</h1>
            <p className="text-[12px] text-gray-400 mt-2 max-w-[280px] mx-auto">{isSingleListing ? 'You can add photos, packages, pricing, and manage availability from your profile later.' : 'Now let’s add your first listing so couples can discover and book you.'}</p>
            <div className="mt-5 p-4 rounded-2xl border border-card-border bg-empty-bg text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Business</p>
                  <p className="text-[12px] font-semibold text-dark mt-0.5">{businessName || 'My Business'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Category</p>
                  <p className="text-[12px] font-semibold text-dark mt-0.5">{category || 'Photography'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Based in</p>
                  <p className="text-[12px] font-semibold text-dark mt-0.5">{area || 'Jubilee Hills'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Experience</p>
                  <p className="text-[12px] font-semibold text-dark mt-0.5">{experience || '5'} years</p>
                </div>
              </div>
            </div>

            {/* Multi-listing: explain what a listing is before sending them in */}
            {!isSingleListing && (
              <div className="mt-4 p-4 rounded-2xl bg-mustard-light/40 border border-mustard/20 text-left">
                <p className="text-[12px] font-bold text-dark mb-1.5">What's a listing?</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  A listing is one <span className="font-medium text-dark">package or service</span> couples can browse and book — like a specific photography package, a venue hall, or a décor theme.
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[11px] text-gray-600">
                  <li className="flex gap-2"><span className="text-mustard font-bold">•</span> Add a few photos, a price, and what's included.</li>
                  <li className="flex gap-2"><span className="text-mustard font-bold">•</span> This is what couples see and shortlist you by.</li>
                  <li className="flex gap-2"><span className="text-mustard font-bold">•</span> You can add more listings anytime — let's start with one.</li>
                </ul>
              </div>
            )}

            {/* Transport & logistics — applied to the auto-created listing */}
            {isSingleListing && (
              <div className="mt-4 p-3 rounded-xl bg-empty-bg border border-card-border text-left">
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

            {goLiveError && (
              <p className="mt-4 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{goLiveError}</p>
            )}
            <button onClick={handleGoLive} disabled={uploading} className="mt-6 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50">
              {uploading ? 'Setting up...' : (isSingleListing ? 'Go live' : 'Continue to your first listing')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
