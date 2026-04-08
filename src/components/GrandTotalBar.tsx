import { useStore } from '@/lib/store'
import { formatINR } from '@/lib/helpers'

export default function GrandTotalBar() {
  const { ritualBoards, vendors, onboardingData } = useStore()

  let grandTotal = 0
  let eventCount = 0
  let vendorCount = 0

  for (const board of ritualBoards) {
    const activeCats = board.categories.filter((c) => !c.removed)
    let hasSelected = false
    for (const cat of activeCats) {
      if (cat.selectedVendorId && vendors[cat.selectedVendorId]) {
        grandTotal += vendors[cat.selectedVendorId].price
        vendorCount++
        hasSelected = true
      }
    }
    if (hasSelected) eventCount++
  }

  return (
    <div className="px-4 py-3 bg-white border-b border-card-border sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {onboardingData ? `${onboardingData.partner1} & ${onboardingData.partner2}` : 'Your wedding'}
          </p>
          <p className="text-lg font-bold text-dark tracking-tight">{formatINR(grandTotal)}</p>
        </div>
        <div className="text-right text-[11px] text-gray-400">
          <p>{eventCount} events</p>
          <p>{vendorCount} vendors</p>
        </div>
      </div>
    </div>
  )
}
