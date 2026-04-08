import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'
import { VendorProfile, VendorPackage } from '@/lib/vendor-types'

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Mehendi', 'DJ / Music', 'Pandit', 'Invitations', 'Other']
const AREAS = ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kukatpally', 'Secunderabad', 'Kondapur', 'Hitech City', 'Begumpet', 'Ameerpet']
const TEAM_SIZES = ['Solo', '2-5', '5-10', '10+']

export default function VendorOnboarding() {
  const navigate = useNavigate()
  const { completeVendorOnboarding } = useVendorStore()

  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [sameAsPhone, setSameAsPhone] = useState(true)
  const [description, setDescription] = useState('')
  const [experience, setExperience] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const totalSteps = 5
  function next() { setStep((s) => Math.min(s + 1, totalSteps)) }
  function back() { setStep((s) => Math.max(s - 1, 1)) }

  function handleGoLive() {
    const profile: VendorProfile = {
      businessName: businessName || 'My Business',
      category: category || 'Photography',
      city: 'Hyderabad',
      area: area || 'Jubilee Hills',
      phone: phone || '+919876543210',
      whatsapp: sameAsPhone ? (phone || '+919876543210') : (whatsapp || '+919876543210'),
      email: email || 'vendor@example.com',
      description: description || 'Professional wedding services',
      experience: parseInt(experience) || 5,
      teamSize: teamSize || '2-5',
      portfolioPhotos: ['/images/gallery/photo/1.jpg', '/images/gallery/photo/2.jpg', '/images/gallery/photo/3.jpg', '/images/gallery/photo/4.jpg', '/images/gallery/photo/5.jpg', '/images/gallery/photo/6.jpg'],
      rating: 4.7,
      profileCompleteness: 85,
    }
    const defaultPackages: VendorPackage[] = [
      { id: 'pkg-0', name: 'Standard Package', price: 120000, features: ['Full coverage', '500 edited photos', '1 album'], capacity: 'Full day' },
      { id: 'pkg-1', name: 'Premium Package', price: 180000, features: ['Full coverage', '1000 edited photos', '2 albums', 'Pre-wedding shoot'], capacity: '2 days' },
    ]
    completeVendorOnboarding(profile, defaultPackages)
    navigate('/vendor')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">
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
                <label className="text-[12px] font-medium text-dark block mb-1.5">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setCategory(c)} className={`py-2 px-3 rounded-xl text-[11px] font-medium text-left transition-all ${category === c ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Area</label>
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map((a) => (
                    <button key={a} onClick={() => setArea(a)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${area === a ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-4">This helps couples in your area discover you.</p>
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
                <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5" className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[13px] outline-none focus:border-mustard" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1.5">Team size</label>
                <div className="flex gap-2">
                  {TEAM_SIZES.map((t) => (
                    <button key={t} onClick={() => setTeamSize(t)} className={`flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-all ${teamSize === t ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>
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

        {/* Screen 5: Ready */}
        {step === 5 && (
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
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Area</p>
                  <p className="text-[12px] font-semibold text-dark mt-0.5">{area || 'Jubilee Hills'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Experience</p>
                  <p className="text-[12px] font-semibold text-dark mt-0.5">{experience || '5'} years</p>
                </div>
              </div>
            </div>
            <button onClick={handleGoLive} className="mt-8 w-full py-3.5 rounded-xl bg-mustard text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Go live
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
