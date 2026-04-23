import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { OnboardingData } from '@/lib/types'
import { formatINR } from '@/lib/helpers'

const PRESET_EVENTS = ['Nischitartham', 'Pelli Choopulu', 'Nalugu', 'Mehendi', 'Sangeeth', 'Pelli (Wedding)', 'Reception']
const GUEST_OPTIONS = ['100-200', '200-500', '500-1000', '1000+']
const BUDGET_PRESETS = [
  { label: '₹5-10L', min: 500000, max: 1000000, mid: 750000 },
  { label: '₹10-20L', min: 1000000, max: 2000000, mid: 1500000 },
  { label: '₹20-40L', min: 2000000, max: 4000000, mid: 3000000 },
  { label: '₹40L+', min: 4000000, max: 10000000, mid: 5000000 },
]
const STYLES = [
  { id: 'traditional', label: 'Traditional', desc: 'Classic mandapam, gold & red tones', image: '/images/gallery/decor/1.jpg' },
  { id: 'contemporary', label: 'Contemporary', desc: 'Minimal floral, clean lines, pastels', image: '/images/gallery/decor/2.jpg' },
  { id: 'fusion', label: 'Fusion', desc: 'Modern meets traditional', image: '/images/gallery/decor/3.jpg' },
  { id: 'royal', label: 'Royal Heritage', desc: 'Grand palace setup, heavy decor', image: '/images/gallery/venue/1.jpg' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { completeOnboarding } = useStore()

  const [step, setStep] = useState(1)
  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [customEvent, setCustomEvent] = useState('')
  const [customEvents, setCustomEvents] = useState<string[]>([])
  const [eventDates, setEventDates] = useState<Record<string, { start: string; end: string } | null>>({})
  const [eventGuests, setEventGuests] = useState<Record<string, string>>({})
  const [budget, setBudget] = useState(1500000)
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [style, setStyle] = useState<string | null>(null)

  const totalSteps = 8
  const allEvents = [...selectedEvents, ...customEvents]

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
    const data: OnboardingData = {
      partner1: partner1.trim(),
      partner2: partner2.trim(),
      events: selectedEvents,
      customEvents,
      eventDates,
      eventGuests,
      budget,
      style,
    }
    completeOnboarding(data)
    navigate('/')
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      {/* Progress bar — screens 2-7 */}
      {step > 1 && step < 8 && (
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
                  <span className="text-[13px] font-medium text-dark block mb-2">{e}</span>
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
                </div>
              ))}
            </div>
            {(() => {
              const allDatesSet = allEvents.every(e => eventDates[e]?.start)
              return (
                <button
                  onClick={next}
                  disabled={!allDatesSet}
                  className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
                    allDatesSet ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

        {/* Screen 6: Budget */}
        {step === 6 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">What's your total budget?</h1>
            <div className="mt-6 text-center">
              <p className="text-[28px] font-bold text-magenta">{formatINR(budget)}</p>
            </div>
            <div className="mt-5 px-1">
              <input
                type="range" min={500000} max={10000000} step={100000}
                value={budget} onChange={(e) => { setBudget(Number(e.target.value)); setActivePreset(null) }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-magenta"
                style={{ background: `linear-gradient(to right, #E91E78 ${((budget - 500000) / 9500000) * 100}%, #eee ${((budget - 500000) / 9500000) * 100}%)` }}
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>₹5L</span><span>₹1Cr</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {BUDGET_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setBudget(p.mid); setActivePreset(i) }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    activePreset === i ? 'bg-magenta text-white' : 'border border-magenta text-magenta'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-gray-400 mt-4">Your budget filters vendors to your range — so every option you see is one you can actually afford.</p>
            <button onClick={next} className="mt-6 w-full py-3.5 rounded-xl bg-magenta text-white font-semibold text-[15px] active:scale-[0.98] transition-transform">
              Next
            </button>
          </div>
        )}

        {/* Screen 7: Style */}
        {step === 7 && (
          <div className="animate-fadeIn">
            <h1 className="text-[22px] font-bold text-dark">What's your style?</h1>
            <p className="text-[12px] text-gray-400 mt-1 mb-5">This helps us surface vendors and inspiration that match your vibe.</p>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id} onClick={() => setStyle(s.label)}
                  className={`rounded-xl overflow-hidden transition-all ${
                    style === s.label ? 'ring-2 ring-magenta ring-offset-2' : ''
                  }`}
                >
                  <div className="h-24 relative overflow-hidden">
                    <img src={s.image} alt={s.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <div className={`p-2.5 text-left ${style === s.label ? 'bg-magenta-light' : 'bg-white border border-card-border border-t-0'}`}>
                    <p className={`text-[12px] font-semibold ${style === s.label ? 'text-magenta' : 'text-dark'}`}>{s.label}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={next}
              disabled={!style}
              className={`mt-6 w-full py-3.5 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-transform ${
                style ? 'bg-magenta text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Screen 8: Ready */}
        {step === 8 && (
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
                  <p className="text-[13px] font-semibold text-dark mt-0.5">{formatINR(budget)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Style</p>
                  <p className="text-[13px] font-semibold text-dark mt-0.5">{style || 'All styles'}</p>
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
