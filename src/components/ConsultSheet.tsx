import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/lib/store'
import { useOptionalAuth } from '@/lib/auth-context'
import { requestConsult } from '@/lib/supabase-db'
import { formatINR } from '@/lib/helpers'
import {
  CONSULT_SLOTS, buildConsultSnapshot, setLocalConsult,
  type ConsultSnapshot, type ConsultSource,
} from '@/lib/consult'
import { UNLOCK_PRICE, type RitualBoard } from '@/lib/types'

/** Optional WhatsApp number for the "couldn't save it" escape hatch. Unset in
 *  most environments — the fallback simply doesn't render then. */
const SUPPORT_WHATSAPP = (import.meta.env.VITE_PELLIKART_WHATSAPP as string | undefined)?.replace(/\D/g, '')

/** Tomorrow, as the default preferred day — today's slots are mostly gone by
 *  the time someone finishes a board. */
function defaultDate(): string {
  const d = new Date(Date.now() + 86400000)
  return d.toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The handoff to a human, in two doors.
 *
 * Both send a lead carrying a frozen snapshot of the board, so whoever picks it
 * up already knows what they chose, what they're still deciding between, and
 * what's missing. Works signed-out too (public demo / landing) — the row just
 * carries no user, and the phone number is what we work from.
 *
 *  - 'consult' — free: they book a call slot and we do the work on the phone.
 *  - 'unlock'  — the ₹300 deposit: refundable, adjusted against the booking.
 *    There's no payment gateway in the app, so this raises the request and we
 *    send a payment link; the leads desk flips their unlock once it lands.
 */
export default function ConsultSheet({ board, source = 'board_ready', variant = 'consult', onClose, onSubmitted }: {
  /** The board being handed off. Omitted for a generic "talk to someone" ask. */
  board?: RitualBoard
  source?: ConsultSource
  /** Which door this is. 'unlock' swaps the framing and drops the call slot. */
  variant?: 'consult' | 'unlock'
  onClose: () => void
  onSubmitted?: () => void
}) {
  const isUnlock = variant === 'unlock'
  const { vendors, onboardingData, ritualBoards } = useStore()
  const auth = useOptionalAuth()

  const [name, setName] = useState(
    onboardingData ? [onboardingData.partner1, onboardingData.partner2].filter(Boolean).join(' & ') : ''
  )
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(auth?.user?.email ?? '')
  const [date, setDate] = useState(defaultDate())
  const [slot, setSlot] = useState<string>(CONSULT_SLOTS[1])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const snapshot: ConsultSnapshot | null = useMemo(() => {
    if (!board) return null
    return buildConsultSnapshot(board, vendors, {
      guestBucket: onboardingData?.eventGuests?.[board.name],
      allBoards: ritualBoards,
    })
  }, [board, vendors, onboardingData, ritualBoards])

  // 8 digits is the shortest real number we'd accept; the RPC enforces the same.
  const phoneOk = phone.replace(/\D/g, '').length >= 8

  async function submit() {
    if (!phoneOk || saving) return
    setSaving(true)
    setError(null)
    const id = await requestConsult({
      name, phone, email,
      boardId: board?.id,
      boardName: board?.name,
      // The unlock door isn't booking a call slot — leaving these off keeps the
      // desk from showing a time we never agreed to.
      preferredDate: isUnlock ? undefined : date,
      preferredSlot: isUnlock ? undefined : slot,
      notes,
      source: isUnlock ? 'paid_unlock' : source,
      snapshot,
    })
    setSaving(false)
    if (!id) {
      setError("We couldn't save your request just now. Please try again.")
      return
    }
    setLocalConsult({ boardId: board?.id, phone, preferredDate: date, preferredSlot: slot })
    setDone(true)
    onSubmitted?.()
  }

  const waHref = SUPPORT_WHATSAPP
    ? `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
        `Hi Pellikart — I'd like to book a slot with an expert.${board ? ` My ${board.name} board is ready.` : ''}`
      )}`
    : null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consult-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-[480px] p-4 pb-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="w-8 h-1 rounded-full bg-gray-300 mx-auto mb-3 sm:hidden" />

        {done ? (
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p id="consult-title" className="text-[15px] font-bold text-dark mt-3">
              {isUnlock ? "We're sending your payment link" : 'Your slot is requested'}
            </p>
            <p className="text-[12px] text-gray-500 mt-1 px-4">
              {isUnlock ? (
                <>We'll WhatsApp it to <span className="font-semibold text-dark">{phone}</span>. Your shortlist unlocks the moment it's paid.</>
              ) : (
                <>
                  An expert will call you on <span className="font-semibold text-dark">{phone}</span>
                  {date ? <> — {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, {slot}</> : null}.
                </>
              )}
            </p>

            <div className="mt-5 text-left rounded-xl bg-empty-bg p-3.5 space-y-2.5">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">What happens next</p>
              {(isUnlock ? [
                `We WhatsApp you a ${formatINR(UNLOCK_PRICE)} payment link.`,
                'Vendor names, profiles and addresses open up on your board.',
                'We check every shortlisted vendor for your dates and come back with quotes.',
              ] : [
                'We confirm your slot on WhatsApp.',
                'The expert reviews your board and calls the vendors on it.',
                'You get real quotes and availability — and we hold the dates.',
              ]).map((step, i) => (
                <div key={step} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-magenta-light text-magenta text-[10px] font-bold flex items-center justify-center mt-px">{i + 1}</span>
                  <span className="text-[12px] text-dark leading-snug">{step}</span>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl bg-magenta text-white font-semibold text-[13px] active:scale-[0.98] transition-transform">
              Back to my board
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-mustard">
              {isUnlock ? 'Refundable deposit' : 'No obligation'}
            </p>
            <h2 id="consult-title" className="text-[17px] font-bold text-dark mt-1.5 leading-tight">
              {isUnlock ? 'Unlock your shortlist' : 'Book a free slot with a Pellikart expert'}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1.5 leading-relaxed">
              {isUnlock
                ? 'See who every vendor on your board actually is — real names, full profiles and addresses — while we check each one for your dates.'
                : "You've done the picking — we do the running around. We call the vendors on your board, get you real quotes and availability, and hold your dates."}
            </p>

            {isUnlock && (
              <div className="mt-3 rounded-xl border border-magenta/25 bg-magenta-light/40 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] font-bold text-dark">{formatINR(UNLOCK_PRICE)}</span>
                  <span className="text-[10px] font-semibold text-magenta uppercase tracking-wider">Fully refundable</span>
                </div>
                <p className="text-[11px] text-dark/70 mt-1 leading-relaxed">
                  It comes off your booking — the deposit is adjusted against whatever you book
                  through us. Changed your mind, or nobody's free on your dates? We refund it.
                </p>
              </div>
            )}

            {/* What the expert will be looking at */}
            {snapshot && (
              <div className="mt-4 rounded-xl border border-card-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-dark">{snapshot.boardName}</p>
                  <p className="text-[12px] font-semibold text-magenta">{formatINR(snapshot.total)}</p>
                </div>
                <div className="mt-2 space-y-1">
                  {snapshot.picked.slice(0, 4).map((p) => (
                    <div key={p.category} className="flex items-center gap-2 text-[11px]">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-600 flex-1 truncate">{p.category}</span>
                      <span className="text-gray-400">{formatINR(p.price)}</span>
                    </div>
                  ))}
                  {snapshot.picked.length > 4 && (
                    <p className="text-[10px] text-gray-400 pl-5">+{snapshot.picked.length - 4} more picked</p>
                  )}
                </div>
                {(snapshot.deciding.length > 0 || snapshot.missing.length > 0) && (
                  <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-card-border">
                    We'll also help with{' '}
                    {[...snapshot.deciding.map((d) => d.category), ...snapshot.missing].slice(0, 4).join(', ')}
                    {snapshot.deciding.length + snapshot.missing.length > 4 ? '…' : ''}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="consult-name" className="text-[11px] font-medium text-dark block mb-1">Your name</label>
                <input
                  id="consult-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Bride & groom"
                  className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] text-dark outline-none focus:border-magenta"
                />
              </div>

              <div>
                <label htmlFor="consult-phone" className="text-[11px] font-medium text-dark block mb-1">
                  Phone <span className="text-magenta">*</span>
                  <span className="text-gray-400 font-normal"> — we call and WhatsApp this number</span>
                </label>
                <input
                  id="consult-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] text-dark outline-none focus:border-magenta"
                  autoFocus
                />
              </div>

              {!auth?.user && (
                <div>
                  <label htmlFor="consult-email" className="text-[11px] font-medium text-dark block mb-1">
                    Email <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="consult-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] text-dark outline-none focus:border-magenta"
                  />
                </div>
              )}

              {/* The unlock door isn't booking a call — no slot to pick. */}
              {!isUnlock && (
                <>
                  <div>
                    <label htmlFor="consult-date" className="text-[11px] font-medium text-dark block mb-1">Preferred day</label>
                    <input
                      id="consult-date" type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] text-dark outline-none focus:border-magenta"
                    />
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-dark mb-1.5">Preferred time</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CONSULT_SLOTS.map((s) => (
                        <button
                          key={s} type="button" onClick={() => setSlot(s)}
                          aria-pressed={slot === s}
                          className={`py-2 rounded-xl text-[11px] font-medium border transition-colors ${
                            slot === s
                              ? 'bg-magenta text-white border-magenta'
                              : 'border-card-border text-gray-600 active:bg-empty-bg'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="consult-notes" className="text-[11px] font-medium text-dark block mb-1">
                  Anything we should know? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="consult-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Budget is tight on decor, need the venue locked first…"
                  className="w-full px-3 py-2.5 rounded-xl border border-card-border text-[12px] text-dark outline-none focus:border-magenta resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3">
                <p className="text-[11px] text-red-500">{error}</p>
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold text-magenta">
                    Message us on WhatsApp instead →
                  </a>
                )}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!phoneOk || saving}
              className={`w-full mt-5 py-3 rounded-xl font-semibold text-[13px] transition-transform ${
                phoneOk && !saving ? 'bg-magenta text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving
                ? (isUnlock ? 'Sending…' : 'Requesting…')
                : (isUnlock ? `Send me the ${formatINR(UNLOCK_PRICE)} link` : 'Request my call')}
            </button>
            <button onClick={onClose} className="w-full mt-2 py-2 text-[12px] text-gray-500">
              Not yet — keep planning
            </button>
          </>
        )}
      </div>
    </div>
  )
}
