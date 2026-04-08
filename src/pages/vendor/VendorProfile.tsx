import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVendorStore } from '@/lib/vendor-store'

const CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Mehendi', 'DJ / Music', 'Pandit', 'Invitations', 'Other']
const AREAS = ['Jubilee Hills', 'Banjara Hills', 'Madhapur', 'Gachibowli', 'Kukatpally', 'Secunderabad', 'Kondapur', 'Hitech City', 'Begumpet', 'Ameerpet']
const TEAM_SIZES = ['Solo', '2-5', '5-10', '10+']

export default function VendorProfile() {
  const navigate = useNavigate()
  const { vendorProfile, vendorReviews, updateVendorProfile } = useVendorStore()
  const [editSheet, setEditSheet] = useState(false)
  const p = vendorProfile

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editExperience, setEditExperience] = useState('')
  const [editTeamSize, setEditTeamSize] = useState('')

  if (!p) return null

  function openEdit() {
    setEditName(p!.businessName)
    setEditCategory(p!.category)
    setEditArea(p!.area)
    setEditPhone(p!.phone)
    setEditWhatsapp(p!.whatsapp)
    setEditEmail(p!.email)
    setEditDescription(p!.description)
    setEditExperience(String(p!.experience))
    setEditTeamSize(p!.teamSize)
    setEditSheet(true)
  }

  function saveEdit() {
    updateVendorProfile({
      businessName: editName,
      category: editCategory,
      area: editArea,
      phone: editPhone,
      whatsapp: editWhatsapp,
      email: editEmail,
      description: editDescription,
      experience: parseInt(editExperience) || 0,
      teamSize: editTeamSize,
    })
    setEditSheet(false)
  }

  const sections = [
    { label: 'Analytics & Insights', desc: 'Views, shortlists, conversions', link: '/vendor/analytics' },
    { label: 'Reviews', desc: `${vendorReviews.length} reviews · ★ ${p.rating}`, link: '/vendor/reviews' },
    { label: 'Earnings', desc: 'Payments & transactions', link: '/vendor/earnings' },
    { label: 'Trial Requests', desc: 'Manage trial sessions', link: '/vendor/trials' },
    { label: 'Custom Bids', desc: 'Design bid requests', link: '/vendor/bids' },
  ]

  return (
    <div className="pb-20 page-enter">
      <div className="px-4 py-3 bg-white border-b border-card-border sticky top-0 z-20">
        <p className="text-[14px] font-bold text-dark">Profile</p>
      </div>

      {/* Profile header */}
      <div className="px-4 mt-3 mb-4">
        <div className="p-4 rounded-2xl bg-mustard-light border border-mustard/20">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <img src={p.portfolioPhotos[0]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-dark">{p.businessName}</p>
              <p className="text-[10px] text-gray-500">{p.category} · {p.area}, {p.city}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-mustard font-medium">★ {p.rating}</span>
                <span className="text-[9px] text-gray-400">{p.experience} yrs exp · Team of {p.teamSize}</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-gray-500">Profile completeness</span>
              <span className="text-[9px] text-mustard font-semibold">{p.profileCompleteness}%</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-mustard rounded-full transition-all" style={{ width: `${p.profileCompleteness}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Business Details — editable */}
      <div className="px-4 mb-3">
        <button
          onClick={openEdit}
          className="w-full flex items-center justify-between py-3 border border-card-border rounded-xl px-3"
        >
          <div>
            <p className="text-[12px] font-medium text-dark">Business Details</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{p.category} · {p.area} · {p.phone}</p>
          </div>
          <span className="text-[10px] text-mustard font-medium">Edit</span>
        </button>
      </div>

      {/* Other sections */}
      <div className="px-4">
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate(s.link)}
            className="w-full flex items-center justify-between py-3 border-b border-card-border/50 text-left"
          >
            <div>
              <p className="text-[12px] font-medium text-dark">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      {/* Edit Business Details Sheet */}
      {editSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setEditSheet(false)}>
          <div className="bg-white rounded-t-2xl w-full max-w-[480px] p-4 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3" />
            <p className="text-[14px] font-bold text-dark mb-4">Edit Business Details</p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Business name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setEditCategory(c)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium ${editCategory === c ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>{c}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1.5">Area</label>
                <div className="flex flex-wrap gap-1.5">
                  {AREAS.map((a) => (
                    <button key={a} onClick={() => setEditArea(a)} className={`py-1.5 px-3 rounded-full text-[10px] font-medium ${editArea === a ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600'}`}>{a}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Phone</label>
                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">WhatsApp</label>
                <input type="tel" value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} maxLength={500} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard resize-none" />
                <span className="text-[8px] text-gray-400">{editDescription.length}/500</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1">Years of experience</label>
                <input type="number" value={editExperience} onChange={(e) => setEditExperience(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] outline-none focus:border-mustard" />
              </div>

              <div>
                <label className="text-[11px] font-medium text-dark block mb-1.5">Team size</label>
                <div className="flex gap-2">
                  {TEAM_SIZES.map((t) => (
                    <button key={t} onClick={() => setEditTeamSize(t)} className={`flex-1 py-2 rounded-xl text-[11px] font-medium ${editTeamSize === t ? 'border-2 border-mustard bg-mustard-light' : 'border border-card-border text-gray-600'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={saveEdit} className="mt-5 w-full py-2.5 rounded-xl bg-mustard text-white font-semibold text-[13px] active:scale-[0.98] transition-transform">
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
