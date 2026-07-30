import { useState } from 'react'
import {
  PANDIT_SUGGESTED_EVENTS,
  PANDIT_EVENT_RITUALS,
  newPanditCardId,
  type PanditPricing,
  type PanditCard,
} from '@/lib/vendor-category-config'

/**
 * Vendor-side editor for a Purohit's pricing. The Purohit builds one or more
 * "event cards"; each card covers a single event and holds the rituals included,
 * the duration (hours, or "varies by caste"), the number of people, the number
 * of purohits, whether transport is included, and a flat total price (₹). Add as
 * many events as they perform (incl. custom poojas). Shared by the add-listing
 * and edit-listing flows.
 */
export default function PanditPricingEditor({
  value,
  onChange,
}: {
  value: PanditPricing
  onChange: (next: PanditPricing) => void
}) {
  const [eventDraft, setEventDraft] = useState('')
  const cards = value.cards || []

  function patchCards(next: PanditCard[]) {
    onChange({ ...value, cards: next })
  }
  function setCard(id: string, patch: Partial<PanditCard>) {
    patchCards(cards.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }
  function removeCard(id: string) {
    patchCards(cards.filter(c => c.id !== id))
  }
  function addCard(event: string) {
    patchCards([...cards, {
      id: newPanditCardId(), event, ritualsIncluded: [],
      durationHours: 2, durationVaries: false, people: 0, purohits: 1,
      transportIncluded: false, price: 0,
    }])
  }
  function addCustomCard() {
    const event = eventDraft.trim()
    if (!event) return
    addCard(event)
    setEventDraft('')
  }

  const priceInputClass =
    'w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div className="space-y-4">
      {cards.map((card, idx) => (
        <div key={card.id} className="rounded-2xl border border-card-border p-3.5 bg-white">
          {/* Card header: label + remove */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Event {idx + 1}</span>
            {cards.length > 1 && (
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="text-[11px] text-gray-400 active:text-red-500 shrink-0 px-1"
                aria-label={`Remove event ${idx + 1}`}
              >✕ Remove</button>
            )}
          </div>

          {/* Event — chips (defaults + this card's own custom event). */}
          <label className="text-[12px] font-semibold text-dark block mb-1.5">Event</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from(new Set([...PANDIT_SUGGESTED_EVENTS, card.event].filter(Boolean))).map(ev => {
              const on = card.event === ev
              return (
                <button
                  key={ev}
                  type="button"
                  onClick={() => setCard(card.id, { event: ev })}
                  className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${on ? 'bg-mustard text-white' : 'bg-white border border-card-border text-gray-600 active:bg-mustard-light'}`}
                >
                  {on && <span className="mr-0.5">✓ </span>}{ev}
                </button>
              )
            })}
          </div>

          {/* Rituals included — preset multi-select for the event + custom add */}
          <RitualsIncludedEditor
            event={card.event}
            value={card.ritualsIncluded}
            onChange={(next) => setCard(card.id, { ritualsIncluded: next })}
          />

          {/* Duration — hours stepper OR "varies by caste" */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-dark">Duration</span>
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white ${card.durationVaries ? 'opacity-40' : ''}`}>
                <button type="button" disabled={card.durationVaries || card.durationHours <= 1}
                  onClick={() => setCard(card.id, { durationHours: Math.max(1, card.durationHours - 1) })}
                  className="px-3 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
                <span className="min-w-[54px] px-1 flex items-center justify-center text-[12px] font-semibold text-dark">{card.durationHours} hr</span>
                <button type="button" disabled={card.durationVaries}
                  onClick={() => setCard(card.id, { durationHours: card.durationHours + 1 })}
                  className="px-3 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">+</button>
              </div>
              <button type="button"
                onClick={() => setCard(card.id, { durationVaries: !card.durationVaries })}
                className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${card.durationVaries ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-600 active:bg-mustard-light'}`}
              >{card.durationVaries && <span className="mr-0.5">✓ </span>}Varies by caste</button>
            </div>
          </div>

          {/* No. of people + No. of purohits steppers */}
          <div className="mt-2.5 space-y-2.5">
            <StepperRow label="No. of people" value={card.people} min={0} step={10}
              hint={card.people === 0 ? 'Any / not specified' : undefined}
              onChange={(n) => setCard(card.id, { people: n })} />
            <StepperRow label="No. of purohits" value={card.purohits} min={1} step={1}
              onChange={(n) => setCard(card.id, { purohits: n })} />
          </div>

          {/* Transport included */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-dark">Transport included?</span>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setCard(card.id, { transportIncluded: true })}
                className={`py-1.5 px-4 rounded-lg text-[11px] font-medium transition-all ${card.transportIncluded ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>Yes</button>
              <button type="button" onClick={() => setCard(card.id, { transportIncluded: false })}
                className={`py-1.5 px-4 rounded-lg text-[11px] font-medium transition-all ${!card.transportIncluded ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}>No</button>
            </div>
          </div>

          {/* Total price */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-dark">Total price</span>
            <div className="relative w-[130px] shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
              <input
                type="number" min={0} step={500}
                value={card.price || ''}
                onChange={(e) => setCard(card.id, { price: Math.max(0, parseInt(e.target.value) || 0) })}
                placeholder="0"
                className={priceInputClass}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add another event card */}
      <div className="flex gap-2">
        <input
          type="text"
          value={eventDraft}
          onChange={(e) => setEventDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCard() } }}
          placeholder="Add another event (e.g. Satyanarayana Vratham)…"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
        />
        <button
          type="button"
          onClick={addCustomCard}
          className="px-4 py-2.5 rounded-lg bg-empty-bg border border-card-border text-[12px] font-medium text-dark active:bg-mustard-light/40 shrink-0"
        >+ Add</button>
      </div>
    </div>
  )
}

/** Rituals included in an event — multi-select from the event's preset list,
 *  plus any custom rituals the vendor adds. */
function RitualsIncludedEditor({ event, value, onChange }: { event: string; value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const items = value || []
  const presets = PANDIT_EVENT_RITUALS[event] || []
  // Custom rituals = selected items that aren't in this event's presets.
  const customItems = items.filter(r => !presets.includes(r))
  const toggle = (r: string) => onChange(items.includes(r) ? items.filter(x => x !== r) : [...items, r])
  const add = () => {
    const v = draft.trim()
    if (!v || items.includes(v)) { setDraft(''); return }
    onChange([...items, v])
    setDraft('')
  }
  return (
    <div>
      <label className="text-[12px] font-medium text-dark block mb-1.5">Rituals included</label>

      {/* Preset rituals for this event — tap to include */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {presets.map((r) => {
            const on = items.includes(r)
            return (
              <button
                key={r} type="button" onClick={() => toggle(r)}
                className={`py-1.5 px-3 rounded-full text-[10px] font-medium transition-all ${on ? 'bg-mustard text-white' : 'bg-white border border-card-border text-gray-600 active:bg-mustard-light'}`}
              >{on && <span className="mr-0.5">✓ </span>}{r}</button>
            )
          })}
        </div>
      )}

      {/* Custom rituals added by the vendor */}
      {customItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {customItems.map((r) => (
            <span key={r} className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-medium bg-mustard-light text-dark">
              {r}
              <button type="button" onClick={() => onChange(items.filter(x => x !== r))} className="text-gray-500 active:text-red-500" aria-label={`Remove ${r}`}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Add a custom ritual not in the presets */}
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={presets.length > 0 ? 'Add a custom ritual…' : 'Add a ritual (e.g. Ganapati Puja)…'}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
        />
        <button type="button" onClick={add} disabled={!draft.trim()}
          className="px-3 py-2 rounded-lg bg-mustard text-white text-[11px] font-semibold disabled:opacity-40 shrink-0">Add</button>
      </div>
    </div>
  )
}

/** A labelled −/value/+ stepper row (min-clamped). */
function StepperRow({ label, value, min, step, hint, onChange }: {
  label: string; value: number; min: number; step: number; hint?: string; onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <span className="text-[12px] font-medium text-dark">{label}</span>
        {hint && <p className="text-[9px] text-gray-400">{hint}</p>}
      </div>
      <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
        <button type="button" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}
          className="px-3 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40">−</button>
        <span className="min-w-[54px] px-1 flex items-center justify-center text-[12px] font-semibold text-dark">{value}</span>
        <button type="button" onClick={() => onChange(value + step)}
          className="px-3 text-dark text-[14px] font-medium active:bg-mustard-light/40">+</button>
      </div>
    </div>
  )
}
