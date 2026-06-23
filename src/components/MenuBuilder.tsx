import { useState } from 'react'
import type { MenuSection } from '@/lib/vendor-types'

interface Props {
  /** Current menu state */
  value: MenuSection[]
  /** Kept for call-site compatibility — no longer used (menu is fully free-form). */
  foodType?: string
  onChange: (next: MenuSection[]) => void
}

/**
 * Free-form menu builder. The vendor creates their own categories (sections)
 * and types their own dishes under each — we no longer impose a fixed list of
 * sections or a curated dish bank. Dishes are stored in `customDishes`;
 * `dishIds` stays empty for new menus (it's only kept on the type for
 * backward-compat with any legacy bank-based data).
 */
export default function MenuBuilder({ value, onChange }: Props) {
  const [newCategory, setNewCategory] = useState('')
  // Per-section draft text for the "add dish" input, keyed by section index.
  const [dishDrafts, setDishDrafts] = useState<Record<number, string>>({})

  function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    // Avoid duplicate category names (case-insensitive).
    if (value.some(s => s.section.toLowerCase() === name.toLowerCase())) {
      setNewCategory('')
      return
    }
    onChange([...value, { section: name, dishIds: [], customDishes: [], pickLimit: 1 }])
    setNewCategory('')
  }

  function updateSection(idx: number, patch: Partial<MenuSection>) {
    onChange(value.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  function removeCategory(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
    setDishDrafts(prev => {
      const next = { ...prev }
      delete next[idx]
      return next
    })
  }

  function addDish(idx: number) {
    const name = dishDrafts[idx]?.trim()
    if (!name) return
    const existing = value[idx].customDishes || []
    if (existing.some(d => d.toLowerCase() === name.toLowerCase())) {
      setDishDrafts(prev => ({ ...prev, [idx]: '' }))
      return
    }
    updateSection(idx, { customDishes: [...existing, name] })
    setDishDrafts(prev => ({ ...prev, [idx]: '' }))
  }

  function removeDish(idx: number, name: string) {
    const existing = value[idx].customDishes || []
    updateSection(idx, { customDishes: existing.filter(d => d !== name) })
  }

  return (
    <div className="space-y-2.5">
      {value.map((sec, idx) => {
        const dishes = sec.customDishes || []
        const totalOffered = dishes.length
        const limit = sec.pickLimit ?? 1
        const draft = dishDrafts[idx] || ''

        return (
          <div key={idx} className="rounded-xl border border-card-border p-3 space-y-2.5">
            {/* Category name + remove */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sec.section}
                onChange={(e) => updateSection(idx, { section: e.target.value })}
                maxLength={40}
                placeholder="Category name"
                className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-card-border text-[12px] font-semibold text-dark outline-none focus:border-mustard"
              />
              <button
                type="button"
                onClick={() => removeCategory(idx)}
                aria-label="Remove category"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 active:bg-gray-100"
              >×</button>
            </div>

            {/* Dish chips */}
            {dishes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dishes.map(name => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 py-1 pl-2.5 pr-1 rounded-full text-[10px] font-medium bg-mustard text-white"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => removeDish(idx, name)}
                      aria-label={`Remove ${name}`}
                      className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px] leading-none active:bg-white/40"
                    >×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Add dish */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDishDrafts(prev => ({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDish(idx)
                  }
                }}
                maxLength={60}
                placeholder="Add a dish…"
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-card-border text-[11px] outline-none focus:border-mustard"
              />
              <button
                type="button"
                onClick={() => addDish(idx)}
                disabled={!draft.trim()}
                className="px-3 py-1.5 rounded-lg bg-mustard text-white text-[11px] font-semibold disabled:opacity-40"
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

      {/* Add a new category */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCategory()
            }
          }}
          maxLength={40}
          placeholder="New category (e.g. Welcome Drinks)"
          className="flex-1 px-2.5 py-2 rounded-lg border border-dashed border-mustard/50 text-[11px] outline-none focus:border-mustard"
        />
        <button
          type="button"
          onClick={addCategory}
          disabled={!newCategory.trim()}
          className="px-3 py-2 rounded-lg bg-mustard text-white text-[11px] font-semibold disabled:opacity-40"
        >+ Add</button>
      </div>
    </div>
  )
}
