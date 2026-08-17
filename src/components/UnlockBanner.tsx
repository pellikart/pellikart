import { useState } from 'react'
import { useStore } from '@/lib/store'
import { formatINR } from '@/lib/helpers'
import { UNLOCK_PRICE } from '@/lib/types'
import ConsultSheet from './ConsultSheet'

/**
 * The app's only paywall.
 *
 * Silver (₹999) and Gold (₹1,999) are gone — two tiers selling the same unlock
 * only ever lost the sale to hesitation. What's left is a single ₹300 deposit
 * that is refundable and comes off the booking, which makes it a commitment
 * rather than a fee. There's also a free door: book a call and an expert does
 * the same work with you on the phone.
 */
export default function UnlockBanner() {
  const { subscription, ritualBoards, activeBoardId } = useStore()
  const [sheet, setSheet] = useState<'unlock' | 'consult' | null>(null)

  if (subscription !== 'free') return null

  const board = ritualBoards.find((b) => b.id === activeBoardId) ?? ritualBoards[0]

  return (
    <>
      {/* Deliberately not magenta-light: the board-ready banner above it already
          owns that, and two pink blocks in a row read as one shouty thing. */}
      <div className="mx-4 md:mx-6 mt-3 p-3 rounded-xl bg-white border border-card-border">
        <p className="text-[12px] font-semibold text-dark">Vendor names are hidden</p>
        <p className="text-[10.5px] text-gray-500 mt-0.5 leading-relaxed">
          Unlock for {formatINR(UNLOCK_PRICE)} to see who each vendor is and have us check them
          for your dates. It's refundable, and it comes off your booking.
        </p>
        <div className="flex items-center gap-3 mt-2.5">
          <button
            onClick={() => setSheet('unlock')}
            className="py-2 px-3.5 rounded-lg bg-magenta text-white font-semibold text-[12px] active:scale-[0.98] transition-transform"
          >
            Unlock for {formatINR(UNLOCK_PRICE)}
          </button>
          <button
            onClick={() => setSheet('consult')}
            className="text-[11px] font-medium text-magenta"
          >
            Or talk to an expert, free
          </button>
        </div>
      </div>

      {sheet && (
        <ConsultSheet
          board={board}
          variant={sheet === 'unlock' ? 'unlock' : 'consult'}
          source={sheet === 'unlock' ? 'paid_unlock' : 'help'}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}
