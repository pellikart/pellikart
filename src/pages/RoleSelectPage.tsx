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
            <img src="/user-logo.png" alt="User" className="w-12 h-12 rounded-xl object-cover shrink-0" />
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
            <img src="/vendor-logo.png" alt="Vendor" className="w-12 h-12 rounded-xl object-cover shrink-0" />
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
