import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { formatINR, getCategorySelectionTotal } from '@/lib/helpers'
import AdminLink from './AdminLink'
import RoleSwitch from './RoleSwitch'
import SignOutButton from './SignOutButton'

/**
 * Desktop-only left sidebar for the couple app. Hidden below `md` — on mobile
 * the existing in-page event tabs remain the navigation. On desktop this becomes
 * the primary nav: brand, running grand total, and one row per event board.
 */
export default function CoupleSidebar() {
  const { ritualBoards, vendors, onboardingData, activeBoardId, setActiveBoardId } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Running grand total across every booked/selected vendor (mirrors GrandTotalBar).
  let grandTotal = 0
  let vendorCount = 0
  for (const board of ritualBoards) {
    for (const cat of board.categories.filter((c) => !c.removed)) {
      if (cat.selectedVendorId && vendors[cat.selectedVendorId]) {
        const v = vendors[cat.selectedVendorId]
        const sel = getCategorySelectionTotal(v, cat)
        grandTotal += sel != null ? sel : v.price
        vendorCount++
      }
    }
  }

  const onHome = pathname === '/'
  const effectiveActive = activeBoardId ?? ritualBoards[0]?.id ?? null

  function openBoard(id: string) {
    setActiveBoardId(id)
    if (!onHome) navigate('/')
  }

  function addEvent() {
    setActiveBoardId(null)
    navigate('/?add=1')
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-dvh md:sticky md:top-0 bg-white border-r border-card-border">
      {/* Brand */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-card-border"
      >
        <img src="/logo.png" alt="Pellikart" className="w-9 h-9 rounded-lg object-cover" />
        <span className="font-serif text-lg font-bold text-dark">Pellikart</span>
      </button>

      {/* Grand total */}
      <div className="px-5 py-4 border-b border-card-border">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
          {onboardingData ? `${onboardingData.partner1} & ${onboardingData.partner2}` : 'Your wedding'}
        </p>
        <p className="text-2xl font-bold text-dark tracking-tight mt-0.5">{formatINR(grandTotal)}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{vendorCount} vendors booked</p>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        <p className="px-2 text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Events</p>
        <nav className="space-y-1">
          {ritualBoards.map((b) => {
            const active = onHome && b.id === effectiveActive
            const cats = b.categories.filter((c) => !c.removed)
            const filled = cats.filter((c) => c.selectedVendorId && vendors[c.selectedVendorId]).length
            return (
              <button
                key={b.id}
                onClick={() => openBoard(b.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  active ? 'bg-magenta text-white' : 'text-gray-700 hover:bg-magenta-light/40'
                }`}
              >
                <span className="text-[13px] font-medium truncate">{b.name}</span>
                <span className={`text-[10px] shrink-0 ${active ? 'text-white/80' : 'text-gray-400'}`}>
                  {filled}/{cats.length}
                </span>
              </button>
            )
          })}
        </nav>

        <button
          onClick={addEvent}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-magenta border border-dashed border-magenta/40 hover:bg-magenta-light/30 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New event
        </button>
      </div>

      {/* Account — pinned to the bottom-left. AdminLink self-checks and renders
          nothing for non-admins, so only admins see the admin panel link. */}
      <div className="shrink-0 border-t border-card-border px-3 py-4 space-y-2.5">
        <AdminLink className="block px-2 text-[13px] font-semibold text-magenta hover:underline" />
        <div className="px-2 text-[12px] text-gray-400">
          Are you a vendor? <RoleSwitch to="vendor" />
        </div>
        <SignOutButton />
      </div>
    </aside>
  )
}
