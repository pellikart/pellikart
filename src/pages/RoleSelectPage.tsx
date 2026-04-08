import { useStore } from '@/lib/store'
import { useNavigate } from 'react-router-dom'
import { AppRole } from '@/lib/types'

export default function RoleSelectPage() {
  const { setRole } = useStore()
  const navigate = useNavigate()

  function handleSelect(role: AppRole) {
    setRole(role)
    if (role === 'user') navigate('/onboarding')
    else navigate('/vendor')
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      {/* Logo */}
      <img src="/logo.png" alt="Pellikart" className="w-20 h-20 object-cover rounded-2xl mb-6" />

      <h1 className="text-[22px] font-bold text-dark text-center leading-tight">Welcome to Pellikart</h1>
      <p className="text-[13px] text-gray-500 mt-2 text-center">How would you like to use the app?</p>

      <div className="w-full mt-8 space-y-3">
        {/* User card */}
        <button
          onClick={() => handleSelect('user')}
          className="w-full p-5 rounded-2xl border-2 border-card-border bg-white text-left active:border-magenta active:bg-magenta-light/30 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-magenta-light flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E91E78" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-dark">I'm planning a wedding</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Browse vendors, plan events, book slots</p>
            </div>
          </div>
        </button>

        {/* Vendor card */}
        <button
          onClick={() => handleSelect('vendor')}
          className="w-full p-5 rounded-2xl border-2 border-card-border bg-white text-left active:border-mustard active:bg-mustard-light/30 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mustard-light flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-dark">I'm a vendor</p>
              <p className="text-[11px] text-gray-400 mt-0.5">List your services, manage bookings, get leads</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
