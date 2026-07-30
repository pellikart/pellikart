import { useState } from 'react'
import { newStallItemId, type StallItem, type StallPricing } from '@/lib/vendor-category-config'

/**
 * Vendor-side editor for Live Stalls pricing. A stall prices in ONE of two
 * mutually-exclusive ways:
 *   - 'package': a single flat price for the whole stall (the listing's price,
 *      driven by the shared slider passed in via price/onPriceChange).
 *   - 'perItem': a list of named items, each priced PER GUEST. On the couple's
 *      side they tick the items they want and enter a guest count; the total is
 *      Σ(picked item ₹/guest) × guests. Vendors add custom items freely.
 * Shared by the add-listing and edit-listing flows.
 */
export default function StallPricingEditor({
  value,
  onChange,
  price,
  onPriceChange,
  priceRange,
}: {
  value: StallPricing
  onChange: (next: StallPricing) => void
  price: number
  onPriceChange: (n: number) => void
  priceRange: { min: number; max: number; step: number }
}) {
  const [nameDraft, setNameDraft] = useState('')
  const [priceDraft, setPriceDraft] = useState('')

  const mode = value.mode || 'package'
  const items = value.items || []

  function setMode(m: 'package' | 'perItem') {
    onChange({ ...value, mode: m })
  }
  function patchItems(next: StallItem[]) {
    onChange({ ...value, items: next })
  }
  function setItem(id: string, patch: Partial<StallItem>) {
    patchItems(items.map(it => (it.id === id ? { ...it, ...patch } : it)))
  }
  function removeItem(id: string) {
    patchItems(items.filter(it => it.id !== id))
  }
  function addItem() {
    const name = nameDraft.trim()
    const p = Math.max(0, parseInt(priceDraft) || 0)
    if (!name) return
    patchItems([...items, { id: newStallItemId(), name, pricePerGuest: p }])
    setNameDraft('')
    setPriceDraft('')
  }

  const priceInputClass =
    'w-full pl-6 pr-2 py-2 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  return (
    <div>
      <label className="text-[12px] font-medium text-dark block mb-1.5">How do you price this stall?</label>
      <div className="flex gap-2 mb-4">
        <button
          type="button" onClick={() => setMode('package')}
          className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${mode === 'package' ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
        >
          Total package price<br /><span className="text-[9px] font-normal text-gray-400">one flat price</span>
        </button>
        <button
          type="button" onClick={() => setMode('perItem')}
          className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${mode === 'perItem' ? 'border-2 border-mustard bg-mustard-light text-dark' : 'border border-card-border text-gray-600'}`}
        >
          Per guest (per item)<br /><span className="text-[9px] font-normal text-gray-400">item cost × guests</span>
        </button>
      </div>

      {mode === 'package' ? (
        <div>
          <label className="text-[11px] font-medium text-dark block mb-1.5">Price</label>
          <div className="relative w-[180px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">₹</span>
            <input
              type="number" min={0} step={priceRange.step}
              value={price || ''}
              onChange={(e) => onPriceChange(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-card-border text-[15px] font-semibold text-dark outline-none focus:border-mustard [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5">Flat price for the whole stall.</p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-gray-500 mb-3">Add each item you offer and its cost per guest. Couples pick the items they want and their guest count multiplies the price.</p>

          <div className="space-y-2 mb-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2 rounded-xl border border-card-border p-2.5 bg-white">
                <input
                  type="text"
                  value={it.name}
                  onChange={(e) => setItem(it.id, { name: e.target.value })}
                  placeholder="Item name"
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
                />
                <div className="relative w-[120px] shrink-0">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
                  <input
                    type="number" min={0} step={50}
                    value={it.pricePerGuest || ''}
                    onChange={(e) => setItem(it.id, { pricePerGuest: Math.max(0, parseInt(e.target.value) || 0) })}
                    placeholder="0"
                    className={priceInputClass}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-400 pointer-events-none">/guest</span>
                </div>
                <button
                  type="button" onClick={() => removeItem(it.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 active:text-red-500 active:bg-gray-100 shrink-0"
                  aria-label={`Remove ${it.name || 'item'}`}
                >✕</button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-[10px] text-gray-400 italic">No items yet — add your first one below.</p>
            )}
          </div>

          {/* Add a custom item */}
          <div className="flex gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
              placeholder="Add an item (e.g. Bangle set)…"
              className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-card-border text-[12px] outline-none focus:border-mustard"
            />
            <div className="relative w-[110px] shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">₹</span>
              <input
                type="number" min={0} step={50}
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
                placeholder="0"
                className={priceInputClass}
              />
            </div>
            <button
              type="button" onClick={addItem} disabled={!nameDraft.trim()}
              className="px-4 py-2.5 rounded-lg bg-mustard text-white text-[12px] font-semibold active:scale-[0.98] disabled:opacity-40 shrink-0"
            >+ Add</button>
          </div>
        </div>
      )}
    </div>
  )
}
