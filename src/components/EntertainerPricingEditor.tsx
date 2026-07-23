import { useState } from 'react'
import {
  ENTERTAINER_DEFAULT_EVENTS,
  ENTERTAINER_LANGUAGES,
  type EntertainerPricing,
  type EntertainerEventRate,
} from '@/lib/vendor-category-config'

/**
 * Vendor-side editor for Hosts/Entertainers pricing. The vendor sets a flat price
 * per event (a default set — Wedding, Engagement, Reception, Sangeet, Haldi — plus
 * any custom-added events), then shared listing-level details: performance
 * duration, an additional-hour charge, and the languages they perform in.
 * Shared by the add-listing and edit-listing flows.
 */

let rateSeq = 0
function newRateId(): string {
  rateSeq += 1
  return `ent-${Date.now()}-${rateSeq}`
}

const DEFAULT_SET = new Set<string>(ENTERTAINER_DEFAULT_EVENTS)

export default function EntertainerPricingEditor({
  value,
  onChange,
}: {
  value: EntertainerPricing
  onChange: (next: EntertainerPricing) => void
}) {
  const [customDraft, setCustomDraft] = useState('')

  const rates = value.eventRates || []

  function patch(p: Partial<EntertainerPricing>) {
    onChange({ ...value, ...p })
  }
  function setRate(id: string, price: number) {
    patch({ eventRates: rates.map(r => (r.id === id ? { ...r, price } : r)) })
  }
  function removeRate(id: string) {
    patch({ eventRates: rates.filter(r => r.id !== id) })
  }
  function addCustomEvent() {
    const event = customDraft.trim()
    if (!event) return
    // Case-insensitive de-dupe against existing rows.
    if (!rates.some(r => r.event.toLowerCase() === event.toLowerCase())) {
      const next: EntertainerEventRate = { id: newRateId(), event, price: 0 }
      patch({ eventRates: [...rates, next] })
    }
    setCustomDraft('')
  }
  function toggleLanguage(lang: string) {
    const langs = value.languages || []
    patch({ languages: langs.includes(lang) ? langs.filter(l => l !== lang) : [...langs, lang] })
  }

  const priceInputClass =
    'w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div className="space-y-5">
      {/* Per-event price boxes */}
      <div>
        <label className="text-[12px] font-semibold text-dark block mb-0.5">Price per event</label>
        <p className="text-[10px] text-gray-400 mb-2">Set your flat price for each event. Leave blank if you don't perform at it.</p>
        <div className="rounded-xl border border-card-border divide-y divide-card-border">
          {rates.map(rate => {
            const isCustom = !DEFAULT_SET.has(rate.event)
            return (
              <div key={rate.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-[12px] text-dark flex-1 min-w-0 leading-tight truncate">{rate.event}</span>
                <div className="relative w-[130px] shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                  <input
                    type="number" min={0} step={1000}
                    value={rate.price || ''}
                    onChange={(e) => setRate(rate.id, Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className={priceInputClass}
                  />
                </div>
                {isCustom ? (
                  <button
                    type="button"
                    onClick={() => removeRate(rate.id)}
                    className="text-[11px] text-gray-400 active:text-red-500 shrink-0"
                    aria-label={`Remove ${rate.event}`}
                  >✕</button>
                ) : (
                  <span className="w-[14px] shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Custom-event add row */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomEvent() } }}
            placeholder="Add another event…"
            className="flex-1 px-3 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
          />
          <button
            type="button"
            onClick={addCustomEvent}
            className="px-3 py-2 rounded-lg bg-empty-bg border border-card-border text-[12px] font-medium text-dark active:bg-mustard-light/40"
          >Add</button>
        </div>
      </div>

      {/* Event duration */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-dark">Event duration <span className="text-gray-400 font-normal">(hours)</span></span>
        <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden bg-white shrink-0">
          <button
            type="button"
            onClick={() => patch({ durationHours: Math.max(0, (value.durationHours ?? 0) - 1) || undefined })}
            disabled={(value.durationHours ?? 0) <= 0}
            className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
          >−</button>
          <span className="min-w-[62px] px-1 flex items-center justify-center text-[12px] font-semibold text-dark">
            {value.durationHours ? `${value.durationHours} hr` : '—'}
          </span>
          <button
            type="button"
            onClick={() => patch({ durationHours: (value.durationHours ?? 0) + 1 })}
            className="px-2.5 text-dark text-[14px] font-medium active:bg-mustard-light/40"
          >+</button>
        </div>
      </div>

      {/* Additional-hour charge */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-dark">Additional-hour charge</span>
        <div className="relative w-[130px] shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
          <input
            type="number" min={0} step={500}
            value={value.additionalHourCharge || ''}
            onChange={(e) => patch({ additionalHourCharge: Math.max(0, parseInt(e.target.value) || 0) || undefined })}
            placeholder="0"
            className={priceInputClass}
          />
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="text-[12px] font-medium text-dark block mb-1.5">Languages</label>
        <div className="flex flex-wrap gap-1.5">
          {ENTERTAINER_LANGUAGES.map(lang => {
            const on = (value.languages || []).includes(lang)
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`py-1.5 px-3.5 rounded-full text-[11px] font-medium transition-all ${on ? 'bg-mustard text-white' : 'bg-white border border-card-border text-gray-600 active:bg-mustard-light'}`}
              >
                {on && <span className="mr-0.5">✓ </span>}{lang}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
