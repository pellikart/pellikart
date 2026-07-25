import { useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { formatINR, guestCountFor } from '@/lib/helpers'
import SignOutButton from './SignOutButton'
import RoleSwitch from './RoleSwitch'
import AdminLink from './AdminLink'

// Mirrors the onboarding guest stepper (see OnboardingPage).
const GUEST_STEP = 50
const GUEST_MIN = 50
const GUEST_DEFAULT = 300

/**
 * The couple's profile: a review-and-edit view of their onboarding answers
 * (names, home location, and per-event guest counts) plus account actions and
 * sign-out. Opened from the profile button in the top bar. Edits persist via
 * `updateOnboardingData` (couples table in live mode) without rebuilding boards,
 * and guest changes re-price totals/packages immediately on save.
 */
export default function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { onboardingData, updateOnboardingData } = useStore()

  const events = useMemo(
    () => (onboardingData ? [...onboardingData.events, ...onboardingData.customEvents] : []),
    [onboardingData],
  )

  const [partner1, setPartner1] = useState(onboardingData?.partner1 ?? '')
  const [partner2, setPartner2] = useState(onboardingData?.partner2 ?? '')
  const [location, setLocation] = useState(onboardingData?.location ?? '')
  const [guests, setGuests] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {}
    for (const e of events) seed[e] = String(guestCountFor(onboardingData?.eventGuests?.[e]) || GUEST_DEFAULT)
    return seed
  })
  const [saved, setSaved] = useState(false)

  if (!onboardingData) return null

  const guestVal = (e: string) => {
    const n = parseInt(guests[e] ?? '', 10)
    return Number.isFinite(n) && n > 0 ? n : GUEST_DEFAULT
  }
  const setGuest = (e: string, n: number) =>
    setGuests((prev) => ({ ...prev, [e]: String(Math.max(GUEST_MIN, n)) }))

  const dateLabel = (e: string) => {
    const d = onboardingData.eventDates?.[e]
    if (!d?.start) return 'Date TBD'
    if (d.end && d.end !== d.start) return `${d.start} → ${d.end}`
    return d.start
  }

  function handleSave() {
    updateOnboardingData({
      partner1: partner1.trim() || onboardingData!.partner1,
      partner2: partner2.trim() || onboardingData!.partner2,
      location: location.trim() || null,
      eventGuests: { ...onboardingData!.eventGuests, ...guests },
    })
    setSaved(true)
    setTimeout(onClose, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full md:max-w-[440px] h-full bg-white overflow-y-auto flex flex-col animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-card-border px-5 pt-[max(0.9rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-dark">Profile</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 active:bg-empty-bg text-lg">✕</button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6">
          {/* Couple */}
          <section>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Couple</p>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Partner 1</label>
                <input
                  value={partner1} onChange={(e) => setPartner1(e.target.value)} placeholder="Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Partner 2</label>
                <input
                  value={partner2} onChange={(e) => setPartner2(e.target.value)} placeholder="Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-dark block mb-1">Where you live <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Locality or address"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
                />
                <p className="text-[11px] text-gray-400 mt-1">Helps us surface venues and vendors near you.</p>
              </div>
            </div>
          </section>

          {/* Events & guests */}
          <section>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Events &amp; guests</p>
            <div className="space-y-2.5">
              {events.map((e) => {
                const val = guestVal(e)
                const budget = onboardingData.eventBudgets?.[e]
                return (
                  <div key={e} className="p-3 rounded-xl border border-card-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-dark truncate">{e}</p>
                        <p className="text-[11px] text-gray-400">{dateLabel(e)}{budget ? ` · ${formatINR(budget)}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setGuest(e, val - GUEST_STEP)} disabled={val <= GUEST_MIN}
                          aria-label={`Decrease guests for ${e}`}
                          className="w-8 h-8 rounded-full border border-card-border text-dark text-lg leading-none flex items-center justify-center active:bg-empty-bg disabled:opacity-40 transition-colors"
                        >−</button>
                        <div className="w-[52px] text-center">
                          <span className="text-[15px] font-bold text-dark leading-none">{val}</span>
                          <span className="block text-[8px] text-gray-400 leading-none mt-0.5">guests</span>
                        </div>
                        <button
                          onClick={() => setGuest(e, val + GUEST_STEP)}
                          aria-label={`Increase guests for ${e}`}
                          className="w-8 h-8 rounded-full border border-magenta text-magenta text-lg leading-none flex items-center justify-center active:bg-magenta-light transition-colors"
                        >+</button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {events.length === 0 && <p className="text-[12px] text-gray-400">No events yet.</p>}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Guest counts drive venue, catering and package pricing.</p>
          </section>

          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-xl text-[14px] font-semibold active:scale-[0.98] transition-all ${saved ? 'bg-green-500 text-white' : 'bg-magenta text-white'}`}
          >
            {saved ? 'Saved ✓' : 'Save changes'}
          </button>

          {/* Account */}
          <section className="pt-2 border-t border-card-border space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Account</p>
            <AdminLink />
            <div className="text-[12px] text-gray-500">
              Are you a vendor? <RoleSwitch to="vendor" />
            </div>
            <SignOutButton />
          </section>
        </div>
      </div>
    </div>
  )
}
