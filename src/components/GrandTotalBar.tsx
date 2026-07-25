import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatINR, getCategorySelectionTotal, guestCountFor } from '@/lib/helpers'
import ProfileSheet from './ProfileSheet'

export default function GrandTotalBar() {
  const { ritualBoards, vendors, onboardingData } = useStore()
  const [showProfile, setShowProfile] = useState(false)

  // Initials for the profile button (first letters of both partners).
  const initials = onboardingData
    ? `${onboardingData.partner1?.[0] ?? ''}${onboardingData.partner2?.[0] ?? ''}`.toUpperCase() || '👤'
    : '👤'

  let grandTotal = 0
  let eventCount = 0
  let vendorCount = 0

  for (const board of ritualBoards) {
    const activeCats = board.categories.filter((c) => !c.removed)
    const guests = guestCountFor(onboardingData?.eventGuests?.[board.name])
    let hasSelected = false
    for (const cat of activeCats) {
      if (cat.selectedVendorId && vendors[cat.selectedVendorId]) {
        const v = vendors[cat.selectedVendorId]
        const sel = getCategorySelectionTotal(v, cat, guests)
        grandTotal += sel != null ? sel : v.price
        vendorCount++
        hasSelected = true
      }
    }
    if (hasSelected) eventCount++
  }

  return (
    <div className="px-4 md:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 bg-white border-b border-card-border sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {onboardingData ? `${onboardingData.partner1} & ${onboardingData.partner2}` : 'Your wedding'}
          </p>
          <p className="text-lg font-bold text-dark tracking-tight">{formatINR(grandTotal)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-gray-400">
            <p>{eventCount} events</p>
            <p>{vendorCount} vendors</p>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            aria-label="Profile"
            className="w-9 h-9 rounded-full bg-magenta-light text-magenta text-[12px] font-bold flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            {initials}
          </button>
        </div>
      </div>
      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}
    </div>
  )
}
