import { useState } from 'react'
import {
  BANJANTRILU_DEFAULT_EVENTS,
  newBanjantriluCardId,
  type BanjantriluPricing,
  type BanjantriluCard,
} from '@/lib/vendor-category-config'

/**
 * Vendor-side editor for Banjantrilu pricing. The vendor builds one or more
 * "pricing cards"; each card covers a single event and holds the number of
 * artists, the number of hours, and a flat price (₹). Vendors can add as many
 * cards as they perform events. Shared by the add-listing and edit-listing flows.
 */

export default function BanjantriluPricingEditor({
  value,
  onChange,
}: {
  value: BanjantriluPricing
  onChange: (next: BanjantriluPricing) => void
}) {
  const [customDraft, setCustomDraft] = useState('')

  const cards = value.cards || []

  function patchCards(next: BanjantriluCard[]) {
    onChange({ ...value, cards: next })
  }
  function setCard(id: string, patch: Partial<BanjantriluCard>) {
    patchCards(cards.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }
  function removeCard(id: string) {
    patchCards(cards.filter(c => c.id !== id))
  }
  function addCard(event: string) {
    patchCards([...cards, { id: newBanjantriluCardId(), event, artists: 2, hours: 2, price: 0 }])
  }
  function addCustomCard() {
    const event = customDraft.trim()
    if (!event) return
    addCard(event)
    setCustomDraft('')
  }

  const priceInputClass =
    'w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div className="space-y-4">
      {cards.map((card, idx) => (
        <div key={card.id} className="rounded-2xl border border-card-border p-3.5 bg-white">
          {/* Card header: event picker + remove */}
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

          {/* Event — chips only. Defaults plus this card's own (custom) event, if any. */}
          <label className="text-[12px] font-semibold text-dark block mb-1.5">Event</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from(new Set([...BANJANTRILU_DEFAULT_EVENTS, card.event].filter(Boolean))).map(ev => {
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

          {/* Artists + hours steppers */}
          <div className="space-y-2.5 mb-3">
            <StepperRow
              label="Number of artists"
              value={card.artists}
              min={1}
              onChange={(n) => setCard(card.id, { artists: n })}
              unit=""
            />
            <StepperRow
              label="Number of hours"
              value={card.hours}
              min={1}
              onChange={(n) => setCard(card.id, { hours: n })}
              unit="hr"
            />
          </div>

          {/* Price */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-dark">Price</span>
            <div className="relative w-[130px] shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
              <input
                type="number" min={0} step={1000}
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
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCard() } }}
          placeholder="Add another event…"
          className="flex-1 px-3 py-2.5 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
        />
        <button
          type="button"
          onClick={addCustomCard}
          className="px-4 py-2.5 rounded-lg bg-empty-bg border border-card-border text-[12px] font-medium text-dark active:bg-mustard-light/40"
        >+ Add</button>
      </div>
    </div>
  )
}

/** A labelled −/value/+ stepper row (min-clamped). */
function StepperRow({
  label, value, min, unit, onChange,
}: {
  label: string
  value: number
  min: number
  unit: string
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] font-medium text-dark">{label}</span>
      <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="px-3 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
        >−</button>
        <span className="min-w-[62px] px-1 flex items-center justify-center text-[12px] font-semibold text-dark">
          {value}{unit ? ` ${unit}` : ''}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="px-3 text-dark text-[14px] font-medium active:bg-mustard-light/40"
        >+</button>
      </div>
    </div>
  )
}
