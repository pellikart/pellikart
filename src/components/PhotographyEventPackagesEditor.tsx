import { useState } from 'react'
import {
  PHOTOGRAPHY_EVENT_SERVICES,
  type PhotographyEventPackage,
  type PhotographyEventServiceKey,
} from '@/lib/vendor-category-config'
import { RITUALS } from '@/lib/vendor-category-config'

/**
 * Vendor-side editor for event-based photography pricing cards. Each card is a
 * flat price sheet for a group of events: the vendor multi-selects the events it
 * covers (RITUALS + any custom-added events), then sets a flat price per service
 * (Traditional/Candid photo & video, LED screens, drone, album, live streaming).
 * The price is for the whole event — not per hour, and not multiplied per event.
 * Shared by the add-listing and edit-listing flows.
 */

let cardSeq = 0
function newCardId(): string {
  cardSeq += 1
  return `epk-${Date.now()}-${cardSeq}`
}

function emptyCard(): PhotographyEventPackage {
  return { id: newCardId(), events: [], prices: {} }
}

export default function PhotographyEventPackagesEditor({
  value,
  onChange,
}: {
  value: PhotographyEventPackage[]
  onChange: (next: PhotographyEventPackage[]) => void
}) {
  // Per-card custom-event text input (kept locally — not part of the saved model).
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({})

  function updateCard(id: string, patch: Partial<PhotographyEventPackage>) {
    onChange(value.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }

  function toggleEvent(card: PhotographyEventPackage, event: string) {
    const events = card.events.includes(event)
      ? card.events.filter(e => e !== event)
      : [...card.events, event]
    updateCard(card.id, { events })
  }

  function addCustomEvent(card: PhotographyEventPackage) {
    const draft = (customDrafts[card.id] || '').trim()
    if (!draft) return
    // Case-insensitive de-dupe against already-selected events.
    if (!card.events.some(e => e.toLowerCase() === draft.toLowerCase())) {
      updateCard(card.id, { events: [...card.events, draft] })
    }
    setCustomDrafts(prev => ({ ...prev, [card.id]: '' }))
  }

  function setPrice(card: PhotographyEventPackage, key: PhotographyEventServiceKey, price: number) {
    const prices = { ...card.prices }
    if (price > 0) prices[key] = price
    else delete prices[key]
    updateCard(card.id, { prices })
  }

  function removeCard(id: string) {
    onChange(value.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-4">
      {value.map((card, idx) => {
        // Custom events = anything selected that isn't a standard ritual.
        const customEvents = card.events.filter(e => !RITUALS.includes(e))
        return (
          <div key={card.id} className="p-3 rounded-xl border border-card-border bg-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-dark">Pricing card {idx + 1}</p>
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="text-[11px] text-gray-400 active:text-red-500"
              >Remove</button>
            </div>

            {/* Events this card applies to */}
            <label className="text-[11px] font-medium text-dark block mb-1">Which events does this cover?</label>
            <p className="text-[10px] text-gray-400 mb-2">Select all that share this pricing. Add your own if it's not listed.</p>
            <div className="flex flex-wrap gap-1.5">
              {RITUALS.map(event => {
                const selected = card.events.includes(event)
                return (
                  <button
                    key={event}
                    type="button"
                    onClick={() => toggleEvent(card, event)}
                    className={`py-1.5 px-3 rounded-full text-[11px] font-medium transition-all ${selected ? 'bg-mustard text-white' : 'bg-white border border-card-border text-gray-600 active:bg-mustard-light'}`}
                  >
                    {selected && <span className="mr-0.5">✓ </span>}{event}
                  </button>
                )
              })}
              {/* Custom events already added show as removable chips too */}
              {customEvents.map(event => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(card, event)}
                  className="py-1.5 px-3 rounded-full text-[11px] font-medium bg-mustard text-white transition-all"
                >
                  ✓ {event}
                </button>
              ))}
            </div>

            {/* Custom-event add row */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customDrafts[card.id] || ''}
                onChange={(e) => setCustomDrafts(prev => ({ ...prev, [card.id]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomEvent(card) } }}
                placeholder="Add a custom event…"
                className="flex-1 px-3 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
              />
              <button
                type="button"
                onClick={() => addCustomEvent(card)}
                className="px-3 py-2 rounded-lg bg-empty-bg border border-card-border text-[12px] font-medium text-dark active:bg-mustard-light/40"
              >Add</button>
            </div>

            {/* Per-service flat prices */}
            <div className="mt-3 pt-3 border-t border-card-border">
              <label className="text-[11px] font-medium text-dark block mb-0.5">Price per service</label>
              <p className="text-[10px] text-gray-400 mb-2">Flat price for the whole event. Leave blank if you don't offer it.</p>
              <div className="rounded-xl border border-card-border divide-y divide-card-border">
                {PHOTOGRAPHY_EVENT_SERVICES.map(service => (
                  <div key={service.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="text-[12px] text-dark flex-1 min-w-0 leading-tight">{service.label}</span>
                    <div className="relative w-[130px] shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                      <input
                        type="number" min={0} step={1000}
                        value={card.prices[service.key] || ''}
                        onChange={(e) => setPrice(card, service.key, Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange([...value, emptyCard()])}
        className="w-full py-2.5 rounded-xl border border-dashed border-mustard/60 text-[12px] font-semibold text-mustard active:bg-mustard-light/40"
      >
        + Create pricing card
      </button>

      {value.length > 0 && (
        <p className="text-[10px] text-gray-400">Only cards with at least one event and one price are shown to couples.</p>
      )}
    </div>
  )
}
