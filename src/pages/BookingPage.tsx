import { useStore } from '@/lib/store'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { formatINR, bgStyle } from '@/lib/helpers'
import MilestoneTracker from '@/components/MilestoneTracker'

export default function BookingPage() {
  const { ritualId } = useParams<{ ritualId: string }>()
  const navigate = useNavigate()

  const { ritualBoards, vendors, subscription, bookVendor, bookAllVendors, trialSessions } = useStore()
  const unlocked = subscription !== 'free'
  const [swapDialog, setSwapDialog] = useState<{ vendorId: string; amount: number } | null>(null)

  const board = ritualBoards.find((b) => b.id === ritualId)
  if (!board) {
    return (
      <div className="p-8 text-center text-gray-500">
        Board not found.
        <button onClick={() => navigate(-1)} className="block mx-auto mt-4 text-magenta">← Go back</button>
      </div>
    )
  }

  const activeCategories = board.categories.filter((c) => !c.removed && c.selectedVendorId)
  const vendorList = activeCategories.map((cat) => ({
    category: cat,
    vendor: vendors[cat.selectedVendorId!],
  })).filter((item) => item.vendor)

  const unbookedVendors = vendorList.filter((item) => !item.vendor.booked)
  const bookedVendors = vendorList.filter((item) => item.vendor.booked)
  const unbookedTotal = unbookedVendors.reduce((sum, item) => sum + item.vendor.price, 0)

  const bookAllAmount = Math.round(unbookedTotal * 0.04)
  const separateTotal = Math.round(unbookedTotal * 0.05)
  const savings = separateTotal - bookAllAmount
  const allBooked = unbookedVendors.length === 0

  return (
    <div className="min-h-dvh bg-white page-enter">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-white border-b border-card-border flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="text-sm">←</button>
        <div>
          <span className="font-semibold text-dark text-[13px]">{board.name}</span>
          <span className="text-gray-400 text-[11px] ml-1.5">Booking</span>
        </div>
      </div>

      {/* Vendor List */}
      <div className="px-4 py-3">
        {vendorList.map(({ category, vendor }) => {
          const individualAmount = Math.round(vendor.price * 0.05)
          const trialKey = `${ritualId}-${category.id}-${vendor.id}`
          const trialDone = trialSessions[trialKey]?.status === 'done'
          return (
            <div key={vendor.id} className="py-3 border-b border-card-border/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg shrink-0" style={bgStyle(vendor.photo)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-magenta-light text-magenta text-[9px] font-medium px-1.5 py-0.5 rounded-full">{category.label}</span>
                    <span className="text-xs font-medium text-dark truncate">{unlocked ? vendor.name : vendor.code}</span>
                    {vendor.booked && (
                      <span className="bg-green-100 text-green-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">Booked ✓</span>
                    )}
                    {!vendor.booked && trialDone && (
                      <span className="bg-green-100 text-green-600 text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0">Trial ✓</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">{vendor.packageTier}</p>
                  <p className="text-xs font-semibold text-dark">{formatINR(vendor.price)}</p>
                  {vendor.booked && <p className="text-[10px] text-green-600">{formatINR(vendor.amountPaid)} paid</p>}
                </div>
                {!vendor.booked ? (
                  <button
                    onClick={() => bookVendor(vendor.id, individualAmount)}
                    className="shrink-0 bg-magenta text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg active:scale-[0.97] transition-transform"
                  >
                    Book — {formatINR(individualAmount)}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a href="tel:+919876543210" className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center active:bg-green-100 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </a>
                    <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center active:bg-green-100 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#16a34a">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 0 1-4.243-1.214l-.252-.149-2.868.852.852-2.868-.168-.268A8 8 0 1 1 12 20z" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              {/* Milestone Tracker for booked vendors */}
              {vendor.booked && (
                <div className="ml-15 pl-[60px]">
                  <MilestoneTracker categoryLabel={category.label} vendorId={vendor.id} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Savings Callout */}
      {!allBooked && unbookedVendors.length > 1 && (
        <div className="mx-4 p-3 rounded-xl bg-mustard-light border border-mustard/20 mb-3">
          <p className="text-xs text-dark">
            <span className="font-semibold">Book together:</span> {formatINR(bookAllAmount)}.{' '}
            <span className="font-semibold">Separately:</span> {formatINR(separateTotal)}.{' '}
            <span className="text-magenta font-bold">Save {formatINR(savings)}</span> on upfront fees.
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            Pay less upfront when you book all vendors together. No extra charges either way.
          </p>
        </div>
      )}

      {/* Bottom CTA */}
      {!allBooked && (
        <div className="px-4 pb-4">
          <button
            onClick={() => bookAllVendors(ritualId!)}
            className="w-full py-2.5 rounded-xl bg-magenta text-white font-semibold text-xs active:scale-[0.98] transition-transform"
          >
            {bookedVendors.length > 0
              ? `Book remaining ${unbookedVendors.length} vendors — ${formatINR(bookAllAmount)}`
              : `Book all slots — ${formatINR(bookAllAmount)}`}
          </button>
        </div>
      )}

      {allBooked && (
        <div className="px-4 py-8 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-sm font-bold text-dark">All vendors booked!</p>
          <p className="text-xs text-gray-500 mt-1">
            Total paid: {formatINR(bookedVendors.reduce((sum, item) => sum + item.vendor.amountPaid, 0))}
          </p>
        </div>
      )}

      {/* Non-refundable Warning */}
      <div className="px-4 pb-8">
        <p className="text-[10px] text-gray-400 text-center">
          ★ Slot bookings are non-refundable. If you swap a vendor after booking, the booking amount will not be returned.
        </p>
      </div>

      {/* Swap Dialog */}
      {swapDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <p className="text-xs text-dark mb-4">
              You've already paid <span className="font-bold">{formatINR(swapDialog.amount)}</span> for this slot.
              Swapping will forfeit this amount. Continue?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setSwapDialog(null)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium">Cancel</button>
              <button onClick={() => setSwapDialog(null)} className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-xs font-medium">Swap & forfeit {formatINR(swapDialog.amount)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
