import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorProfile, VendorPackage, VendorListing } from '@/lib/vendor-types'
import { uploadPhotos, updateVendorFields } from '@/lib/supabase-db'
import { emptyMehendiPricing, emptyMakeupPricing, emptySareeDrapingPricing, isSingleListingCategory, type MehendiPricing, type MakeupPricing, type SareeDrapingPricing } from '@/lib/vendor-category-config'
import { getMehendiFromPrice, getMakeupFromPrice, getSareeDrapingFromPrice } from '@/lib/helpers'
import MehendiPricingEditor from '@/components/MehendiPricingEditor'
import MakeupPricingEditor from '@/components/MakeupPricingEditor'
import SareeDrapingPricingEditor from '@/components/SareeDrapingPricingEditor'

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Mehendi', 'DJ / Music', 'Pandit', 'Invitations', 'Banjantrilu', 'Reels', 'Hair Stylist', 'Saree Draping', 'Live Stalls', 'Hosts / Entertainers', 'Wedding Props']
const AREAS = ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kukatpally', 'Secunderabad', 'Kondapur', 'Hitech City', 'Begumpet', 'Ameerpet']
const TEAM_SIZES_DEFAULT = ['Solo', '2-5', '5-10', '10+']
// Decor crews are usually larger — start at 5 and step up by 5 to 30+.
const TEAM_SIZES_DECOR = ['5', '10', '15', '20', '25', '30+']

export default function VendorOnboarding() {
  const navigate = useNavigate()
  const { completeVendorOnboarding } = useVendorStore()

  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryPhone, setSecondaryPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(true)
  const [description, setDescription] = useState('')
  const [experience, setExperience] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  // Single-listing categories (Mehendi, Makeup) author their pricing here in
  // onboarding and auto-create one listing on go-live.
  const [mehendiPricing, setMehendiPricing] = useState<MehendiPricing>(emptyMehendiPricing())
  const [makeupPricing, setMakeupPricing] = useState<MakeupPricing>(emptyMakeupPricing())
  const [sareePricing, setSareePricing] = useState<SareeDrapingPricing>(emptySareeDrapingPricing())
  // Makeup-only: some makeup artists also offer saree draping as an add-on.
  const [sareeAvailable, setSareeAvailable] = useState<boolean | null>(null)

  // Steps: 1=Welcome, 2=Business Basics, 3=Contact, 4=About, 5=Portfolio Photos, [6=Pricing], [7=Saree add-on (Makeup)], last=Ready
  // Single-listing categories (Mehendi/Makeup/Saree Draping) capture pricing here.
  // Makeup gets an extra "also offer saree draping?" screen.
  const isMehendi = category === 'Mehendi'
  const isMakeup = category === 'Makeup'
  const isSaree = category === 'Saree Draping'
  const isSingleListing = isSingleListingCategory(category)
  const pricingStep = 6 // only meaningful for single-listing categories
  const sareeAddonStep = 7 // Makeup only
  const totalSteps = isMakeup ? 8 : isSingleListing ? 7 : 6

  function next() { setStep((s) => Math.min(s + 1, totalSteps)) }
  function back() { setStep((s) => Math.max(s - 1, 1)) }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setPhotoFiles(prev => [...prev, ...files].slice(0, 10))
      const previews = files.map(f => URL.createObjectURL(f))
      setPhotoPreviews(prev => [...prev, ...previews].slice(0, 10))
    }
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
    await completeVendorOnboarding(profile, defaultPackages)

    // Now that completeVendorOnboarding has run upsertVendor, _vendorDbId
    // is populated. Upload photos/videos and persist their public URLs.
    const { _vendorDbId, _userId, _liveMode } = useVendorStore.getState()
    // Photos to attach to an auto-created listing (Mehendi). Demo uses blob previews;
    // live uses the uploaded public URLs once available.
    let listingPhotos: string[] = _liveMode ? [] : photoPreviews
    if (_liveMode && _vendorDbId && _userId) {
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
        await updateVendorFields(_userId, updates)

        // Reflect the real URLs in the local store so the dashboard renders
        // them immediately, not just after the next refresh.
        useVendorStore.setState((s) => ({
          vendorProfile: s.vendorProfile ? {
            ...s.vendorProfile,
            ...(photoFiles.length > 0 ? { portfolioPhotos: portfolioUrls } : {}),
            ...(videoFiles.length > 0 ? { portfolioVideos: portfolioVideoUrls } : {}),
          } : null,
        }))
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
      }
      const listing: VendorListing = isMehendi
        ? { ...base, name: `${profile.businessName} — Mehendi`, category: 'Mehendi', price: getMehendiFromPrice(mehendiPricing), mehendiPricing, rituals: ['Mehendi'] }
        : isMakeup
        ? { ...base, name: `${profile.businessName} — Makeup`, category: 'Makeup', price: getMakeupFromPrice(makeupPricing), makeupPricing, sareeDrapingPricing: sareeAvailable ? sareePricing : undefined, rituals: [] }
        : { ...base, name: `${profile.businessName} — Saree Draping`, category: 'Saree Draping', price: getSareeDrapingFromPrice(sareePricing), sareeDrapingPricing: sareePricing, rituals: [] }
      useVendorStore.getState().addListing(listing)
    }

    setUploading(false)
    navigate('/vendor')
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

        {/* Screen 5: Portfolio Photos */}
        {step === 5 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Show your work</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Upload photos of your best work. This is what couples see first. (You can add more later)</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {photoPreviews.map((p, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
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
              : <SareeDrapingPricingEditor value={sareePricing} onChange={setSareePricing} />}
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

        {/* Ready (last screen) */}
        {step === totalSteps && (
          <div className="animate-fadeIn text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-[22px] font-bold text-dark leading-tight">Your profile is ready!</h1>
            <p className="text-[12px] text-gray-400 mt-2 max-w-[260px] mx-auto">You can add photos, packages, pricing, and manage availability from your profile later.</p>
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
            <button onClick={handleGoLive} disabled={uploading} className="mt-8 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50">
              {uploading ? 'Setting up...' : 'Go live'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
