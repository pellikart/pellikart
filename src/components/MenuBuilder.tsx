import { useState } from 'react'
import { DISH_BANK, MENU_SECTIONS } from '@/lib/dish-bank'
import type { MenuSection } from '@/lib/vendor-types'

interface Props {
  /** Current menu state */
  value: MenuSection[]
  /** Kept for call-site compatibility — no longer used. */
  foodType?: string
  onChange: (next: MenuSection[]) => void
}

/**
 * Dish-bank menu builder. The vendor picks a category from the fixed list
 * (MENU_SECTIONS, sourced from the catering dish-bank Excel), then ticks the
 * dishes they offer from that category's curated list. Dishes not in the bank
 * can still be typed in via the "add your own" box — those land in
 * `customDishes`; bank picks land in `dishIds`. A per-category pick limit
 * controls how many the couple may choose.
 */
export default function MenuBuilder({ value, onChange }: Props) {
  // Per-section draft text for the "add your own dish" input, keyed by section index.
  const [dishDrafts, setDishDrafts] = useState<Record<number, string>>({})
  // Per-section search text to filter long dish lists, keyed by section index.
  const [search, setSearch] = useState<Record<number, string>>({})
  // The category currently selected in the "add category" dropdown.
  const [newCategory, setNewCategory] = useState('')

  const usedSections = new Set(value.map(s => s.section))
  const availableSections = MENU_SECTIONS.filter(s => !usedSections.has(s))

  function addCategory(name: string) {
    if (!name || usedSections.has(name)) return
    onChange([...value, { section: name, dishIds: [], customDishes: [], pickLimit: 1 }])
  }

  function updateSection(idx: number, patch: Partial<MenuSection>) {
    onChange(value.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  function removeCategory(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
    setDishDrafts(prev => { const next = { ...prev }; delete next[idx]; return next })
    setSearch(prev => { const next = { ...prev }; delete next[idx]; return next })
  }

  function toggleDish(idx: number, id: number) {
    const ids = value[idx].dishIds
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    updateSection(idx, { dishIds: next })
  }

  function addCustomDish(idx: number) {
    const name = dishDrafts[idx]?.trim()
    if (!name) return
    const sec = value[idx]
    const existingCustom = sec.customDishes || []
    // Skip if it duplicates a custom dish or a bank dish already offered in this section.
    const bankNames = DISH_BANK.filter(d => sec.dishIds.includes(d.id)).map(d => d.name.toLowerCase())
    if (existingCustom.some(d => d.toLowerCase() === name.toLowerCase()) || bankNames.includes(name.toLowerCase())) {
      setDishDrafts(prev => ({ ...prev, [idx]: '' }))
      return
    }
    updateSection(idx, { customDishes: [...existingCustom, name] })
    setDishDrafts(prev => ({ ...prev, [idx]: '' }))
  }

  function removeCustomDish(idx: number, name: string) {
    const existing = value[idx].customDishes || []
    updateSection(idx, { customDishes: existing.filter(d => d !== name) })
  }

  return (
    <div className="space-y-2.5">
      {value.map((sec, idx) => {
        const bankDishes = DISH_BANK.filter(d => d.section === sec.section)
        const q = (search[idx] || '').trim().toLowerCase()
        const visible = q ? bankDishes.filter(d => d.name.toLowerCase().includes(q)) : bankDishes
        const selectedIds = new Set(sec.dishIds)
        const customs = sec.customDishes || []
        const totalOffered = sec.dishIds.length + customs.length
        const limit = sec.pickLimit ?? 1
        const draft = dishDrafts[idx] || ''

        return (
          <div key={idx} className="rounded-xl border border-card-border p-3 space-y-2.5">
            {/* Category name (from the bank) + remove */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-dark truncate">{sec.section}</p>
                <p className="text-[10px] text-gray-400">{totalOffered} {totalOffered === 1 ? 'dish' : 'dishes'} offered</p>
              </div>
              <button
                type="button"
                onClick={() => removeCategory(idx)}
                aria-label="Remove category"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
              >×</button>
            </div>

            {/* Search filter — only when the category has a long list */}
            {bankDishes.length > 10 && (
              <input
                type="text"
                value={search[idx] || ''}
                onChange={(e) => setSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                placeholder={`Search ${bankDishes.length} dishes…`}
                className="w-full px-2.5 py-1.5 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
              />
            )}

            {/* Bank dish options — tap to offer/remove */}
            {visible.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
                {visible.map(d => {
                  const sel = selectedIds.has(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDish(idx, d.id)}
                      className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-medium transition-all ${sel ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-700 border border-card-border active:bg-mustard-light/40'}`}
                    >
                      {sel && <span className="leading-none">✓</span>}
                      {d.name}
                      {d.veg === 'Non-Veg' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">No dishes match “{search[idx]}”.</p>
            )}

            {/* Custom (off-bank) dishes the vendor added */}
            {customs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customs.map(name => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 py-1 pl-2.5 pr-1 rounded-full text-[10px] font-medium bg-magenta text-white"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeCustomDish(idx, name)}
                      aria-label={`Remove ${name}`}
                      className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px] leading-none active:bg-white/40"
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Add a dish not in the list */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDishDrafts(prev => ({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addCustomDish(idx) }
                }}
                maxLength={60}
                placeholder="Add a dish not in the list…"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-dashed border-magenta/40 text-[11px] outline-none focus:border-magenta"
              />
              <button
                type="button"
                onClick={() => addCustomDish(idx)}
                disabled={!draft.trim()}
                className="px-3 py-1.5 rounded-lg bg-magenta text-white text-[11px] font-semibold disabled:opacity-40"
              >Add</button>
            </div>

            {/* Pick-limit stepper — how many the couple can choose from this category */}
            {totalOffered > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-card-border">
                <span className="text-[11px] text-gray-600 pt-1">Couple can pick</span>
                <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden mt-1">
                  <button
                    type="button"
                    onClick={() => updateSection(idx, { pickLimit: Math.max(0, limit - 1) })}
                    disabled={limit <= 0}
                    className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                  >−</button>
                  <input
                    type="number" min={0} max={totalOffered} value={limit}
                    onChange={(e) => updateSection(idx, { pickLimit: Math.min(totalOffered, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-10 text-center text-[12px] font-semibold text-dark outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateSection(idx, { pickLimit: Math.min(totalOffered, limit + 1) })}
                    disabled={limit >= totalOffered}
                    className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                  >+</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Add a category from the bank */}
      {availableSections.length > 0 ? (
        <select
          value={newCategory}
          onChange={(e) => { addCategory(e.target.value); setNewCategory('') }}
          className="w-full px-2.5 py-2.5 rounded-lg border border-dashed border-mustard/50 text-[11px] font-medium text-dark bg-white outline-none focus:border-mustard"
        >
          <option value="">+ Add a category…</option>
          {availableSections.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ) : (
        <p className="text-[10px] text-gray-400 text-center py-1">All categories added.</p>
      )}
    </div>
  )
}
