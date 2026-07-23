import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { OnboardingData } from '@/lib/types'
import { formatINR } from '@/lib/helpers'
import RoleSwitch from '@/components/RoleSwitch'

const PRESET_EVENTS = ['Engagement', 'Pelli Choopulu', 'Bottu', 'Haldi', 'Mehendi', 'Sangeeth', 'Pelli Koduku/Pellikuthuru Function', 'Pelli (Wedding)', 'Reception']
const GUEST_OPTIONS = ['100-200', '200-500', '500-1000', '1000+']
const EVENT_BUDGET_MIN = 25000
const EVENT_BUDGET_MAX = 5000000
const EVENT_BUDGET_STEP = 25000

function defaultBudgetFor(event: string): number {
  const lower = event.toLowerCase()
  if (lower.includes('pelli') && lower.includes('wedding')) return 1000000
  if (lower === 'reception') return 600000
  if (lower === 'sangeeth' || lower === 'mehendi') return 300000
  if (lower.includes('pre-wedding') || lower.includes('pre wedding')) return 75000
  return 200000
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding } = useStore()

  const [step, setStep] = useState(1)
  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [customEvent, setCustomEvent] = useState('')
  const [customEvents, setCustomEvents] = useState<string[]>([])
  const [eventDates, setEventDates] = useState<Record<string, { start: string; end: string } | null>>({})
  const [tbdDates, setTbdDates] = useState<Record<string, boolean>>({})
  const [eventGuests, setEventGuests] = useState<Record<string, string>>({})
  const [eventBudgets, setEventBudgets] = useState<Record<string, number>>({})
  const totalSteps = 7
  const allEvents = [...selectedEvents, ...customEvents]
  const totalBudget = allEvents.reduce((sum, e) => sum + (eventBudgets[e] ?? defaultBudgetFor(e)), 0)

  function detectLocation() {
    if (!('geolocation' in navigator)) {
      setGeoError("Location isn't available on this device — please type it in.")
      return
    }
    setGeoError(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          // Keep the exact coordinates — these drive the "X km away" distance
          // badge on venue cards. The reverse-geocode below is just for a
          // human-readable label.
          setCoords({ lat: latitude, lng: longitude })
          // Free, no-API-key reverse geocode → a readable locality that plugs
          // into our area-based vendor matching.
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          const data = await res.json()
          const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean)
          const label = [...new Set(parts)].slice(0, 2).join(', ')
          setLocation(label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } catch {
          setGeoError("Couldn't look up your area — please type it in.")
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setGeoError(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied — please type it in.'
          : "Couldn't get your location — please type it in.")
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  function next() { setStep((s) => Math.min(s + 1, totalSteps)) }
  function back() { setStep((s) => Math.max(s - 1, 1)) }

  function toggleEvent(e: string) {
    setSelectedEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])
  }

  function addCustomEvent() {
    const trimmed = customEvent.trim()
    if (trimmed && !customEvents.includes(trimmed) && !selectedEvents.includes(trimmed)) {
      setCustomEvents((prev) => [...prev, trimmed])
      setCustomEvent('')
    }
  }

  function removeCustomEvent(e: string) {
    setCustomEvents((prev) => prev.filter((x) => x !== e))
  }

  function handleComplete() {
    const finalEventBudgets: Record<string, number> = {}
    for (const e of allEvents) finalEventBudgets[e] = eventBudgets[e] ?? defaultBudgetFor(e)
    const data: OnboardingData = {
      partner1: partner1.trim(),
      partner2: partner2.trim(),
      events: selectedEvents,
      customEvents,
      eventDates,
      eventGuests,
      budget: totalBudget,
      eventBudgets: finalEventBudgets,
      style: null,
      location: location.trim() || null,
      locationLat: coords?.lat ?? null,
      locationLng: coords?.lng ?? null,
    }
    completeOnboarding(data)
    navigate('/')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white pt-[env(safe-area-inset-top)]">
      {/* Progress bar — screens 2-6 */}
      {step > 1 && step < 7 && (
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-magenta transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      )}

      {/* Back button — screens 2-7 */}
      {step > 1 && step < 8 && (
        <button onClick={back} className="self-start px-4 pt-3 text-sm text-gray-500">← Back</button>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6 justify-center">

        {/* Screen 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-fadeIn">
            <img src="/logo.png" alt="Pellikart" className="w-24 h-24 object-cover rounded-3xl mb-6" />
            <h1 className="text-[22px] font-bold text-dark leading-tight">Let's plan your<br/>dream wedding</h1>
            <p className="text-[13px] text-gray-500 mt-3 max-w-[280px]">A few quick questions and your personalized wedding board will be ready.</p>
            <button onClick={next} className="mt-8 w-full py-3.5 rounded-xl bg-magenta text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Let's go
            </button>
            {/* Escape hatch: a vendor who landed here by mistake can switch sides. */}
            <div className="mt-6 text-[12px] text-gray-400">
              Not planning a wedding? <RoleSwitch to="vendor" />
            </div>
          </div>
        )}

        {/* Screen 2: Names */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Who's getting married?</h1>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-dark block mb-1.5">Partner 1</label>
                <input
                  type="text" value={partner1} onChange={(e) => setPartner1(e.target.value)}
                  placeholder="Enter name" className="w-full px-4 py-3 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-dark block mb-1.5">Partner 2</label>
                <input
                  type="text" value={partner2} onChange={(e) => setPartner2(e.target.value)}
                  placeholder="Enter name" className="w-full px-4 py-3 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-dark block mb-1.5">
                  Where do you live? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text" value={location} onChange={(e) => { setLocation(e.target.value); setCoords(null) }}
                  placeholder="Locality or home address" className="w-full px-4 py-3 rounded-xl border border-card-border text-[14px] text-dark outline-none focus:border-magenta transition-colors"
                />
                <button
                  type="button" onClick={detectLocation} disabled={locating}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-magenta disabled:text-gray-400"
                >
                  <span>📍</span>{locating ? 'Locating…' : 'Use current location'}
                </button>
                {geoError && <p className="text-[11px] text-red-500 mt-1">{geoError}</p>}
                <p className="text-[12px] text-gray-400 mt-1.5">Sharing your location helps us show venues and vendors near you.</p>
              </div>
            </div>
            <p className="text-[12px] text-gray-400 mt-4">This personalizes your wedding boards and sharing invites.</p>
            <button
              onClick={next}
              disabled={!partner1.trim() || !partner2.trim()}
              className={`mt-8 w-full py-3.5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
                partner1.trim() && partner2.trim() ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Screen 3: Events */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Which events are you planning?</h1>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {PRESET_EVENTS.map((e) => {
                const selected = selectedEvents.includes(e)
                return (
                  <button
                    key={e} onClick={() => toggleEvent(e)}
                    className={`py-3 px-3 rounded-xl text-[13px] font-medium text-left transition-all ${
                      selected ? 'border-2 border-magenta bg-magenta-light text-magenta' : 'border border-card-border text-dark'
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}{e}
                  </button>
                )
              })}
            </div>
            {/* Custom events */}
            {customEvents.map((e) => (
              <div key={e} className="mt-2 flex items-center gap-2">
                <span className="flex-1 py-2.5 px-3 rounded-xl border-2 border-magenta bg-magenta-light text-magenta text-[13px] font-medium">✓ {e}</span>
                <button onClick={() => removeCustomEvent(e)} className="text-gray-400 text-sm">✕</button>
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <input
                type="text" value={customEvent} onChange={(e) => setCustomEvent(e.target.value)}
                placeholder="+ Add custom event" onKeyDown={(e) => e.key === 'Enter' && addCustomEvent()}
                className="flex-1 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-[12px] text-dark outline-none focus:border-magenta"
              />
              {customEvent.trim() && (
                <button onClick={addCustomEvent} className="px-3 py-2 rounded-xl bg-magenta text-white text-[12px] font-medium">Add</button>
              )}
            </div>
            <p className="text-[12px] text-gray-400 mt-4">We'll create a dedicated planning board for each event you select.</p>
            <button
              onClick={next}
              disabled={allEvents.length === 0}
              className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
                allEvents.length > 0 ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Screen 4: Dates */}
        {step === 4 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">When are your events?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Dates help vendors check availability and lock your slots.</p>
            <div className="space-y-4">
              {allEvents.map((e) => (
                <div key={e} className="py-2.5 border-b border-card-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-dark">{e}</span>
                    <button
                      onClick={() => {
                        setTbdDates((prev) => ({ ...prev, [e]: !prev[e] }))
                        if (!tbdDates[e]) {
                          setEventDates((prev) => ({ ...prev, [e]: null }))
                        }
                      }}
                      className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                        tbdDates[e] ? 'bg-magenta/10 text-magenta font-semibold' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      Not decided yet
                    </button>
                  </div>
                  {tbdDates[e] ? (
                    <p className="text-[11px] text-gray-400 italic">Dates TBD — you can set this later</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-400 block mb-0.5">Start date</label>
                        <input
                          type="date"
                          value={eventDates[e]?.start || ''}
                          onChange={(ev) => setEventDates((prev) => ({
                            ...prev,
                            [e]: { start: ev.target.value, end: prev[e]?.end || ev.target.value }
                          }))}
                          className="w-full text-[11px] text-dark border border-card-border rounded-lg px-2 py-1.5 outline-none focus:border-magenta"
                        />
                      </div>
                      <span className="text-gray-300 mt-3">→</span>
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-400 block mb-0.5">End date</label>
                        <input
                          type="date"
                          value={eventDates[e]?.end || eventDates[e]?.start || ''}
                          min={eventDates[e]?.start || ''}
                          onChange={(ev) => setEventDates((prev) => ({
                            ...prev,
                            [e]: { start: prev[e]?.start || ev.target.value, end: ev.target.value }
                          }))}
                          className="w-full text-[11px] text-dark border border-card-border rounded-lg px-2 py-1.5 outline-none focus:border-magenta"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {(() => {
              const allHandled = allEvents.every(e => tbdDates[e] || eventDates[e]?.start)
              return (
                <button
                  onClick={next}
                  disabled={!allHandled}
                  className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
                    allHandled ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              )
            })()}
          </div>
        )}

        {/* Screen 5: Guests (per event) */}
        {step === 5 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">How many guests per event?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">Guest count shapes venue options, catering packages, and pricing.</p>
            <div className="space-y-3">
              {allEvents.map((e) => (
                <div key={e} className="py-2.5 border-b border-card-border/50">
                  <p className="text-[13px] font-medium text-dark mb-2">{e}</p>
                  <div className="flex gap-1.5">
                    {GUEST_OPTIONS.map((g) => (
                      <button
                        key={g}
                        onClick={() => setEventGuests((prev) => ({ ...prev, [e]: g }))}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                          eventGuests[e] === g ? 'border-2 border-magenta bg-magenta-light text-magenta' : 'border border-card-border text-dark'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const allGuestsSet = allEvents.every(e => eventGuests[e])
              return (
                <button
                  onClick={next}
                  disabled={!allGuestsSet}
                  className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
                    allGuestsSet ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              )
            })()}
          </div>
        )}

        {/* Screen 6: Budget per ritual */}
        {step === 6 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">Budget for each event?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-4">Set what you'd like to spend on each event. We'll suggest vendors that fit.</p>

            <div className="text-center py-3 rounded-2xl bg-empty-bg border border-card-border mb-4">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total budget</p>
              <p className="text-[24px] font-bold text-magenta mt-0.5">{formatINR(totalBudget)}</p>
            </div>

            <div className="space-y-4">
              {allEvents.map((e) => {
                const v = eventBudgets[e] ?? defaultBudgetFor(e)
                const pct = ((v - EVENT_BUDGET_MIN) / (EVENT_BUDGET_MAX - EVENT_BUDGET_MIN)) * 100
                return (
                  <div key={e} className="py-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-dark">{e}</span>
                      <span className="text-[13px] font-semibold text-magenta">{formatINR(v)}</span>
                    </div>
                    <input
                      type="range"
                      min={EVENT_BUDGET_MIN}
                      max={EVENT_BUDGET_MAX}
                      step={EVENT_BUDGET_STEP}
                      value={v}
                      onChange={(ev) => setEventBudgets((prev) => ({ ...prev, [e]: Number(ev.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-magenta"
                      style={{ background: `linear-gradient(to right, #E91E78 ${pct}%, #eee ${pct}%)` }}
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                      <span>₹25K</span><span>₹50L</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[12px] text-gray-400 mt-4">Each event's budget filters vendors to your range — so every option you see is one you can actually afford.</p>
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-magenta text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Next
            </button>
          </div>
        )}

        {/* Screen 7: Ready */}
        {step === 7 && (
          <div className="animate-fadeIn text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-[22px] font-bold text-dark leading-tight">
              {partner1 || 'Partner 1'} & {partner2 || 'Partner 2'},<br/>your wedding board is ready!
            </h1>

            {/* Summary card */}
            <div className="mt-6 p-4 rounded-2xl border border-card-border bg-empty-bg text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Events</p>
                  <p className="text-[13px] font-semibold text-dark mt-0.5">{allEvents.length} events</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Guests</p>
                  <p className="text-[13px] font-semibold text-dark mt-0.5">{Object.keys(eventGuests).length > 0 ? `${Object.keys(eventGuests).length} events set` : 'TBD'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Budget</p>
                  <p className="text-[13px] font-semibold text-dark mt-0.5">{formatINR(totalBudget)}</p>
                </div>
              </div>
            </div>

            {/* Event preview cards */}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
              {allEvents.map((e) => (
                <span key={e} className="bg-magenta-light text-magenta text-[10px] font-medium px-2.5 py-1 rounded-full">{e}</span>
              ))}
            </div>

            <button onClick={handleComplete} className="mt-8 w-full py-3.5 rounded-xl bg-magenta text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Start planning
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
