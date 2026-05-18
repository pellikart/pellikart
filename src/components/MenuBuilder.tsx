import { useState } from 'react'
import { DISH_BANK, MENU_SECTIONS, type Dish } from '@/lib/dish-bank'
import type { MenuSection } from '@/lib/vendor-types'

interface Props {
  /** Current menu state */
  value: MenuSection[]
  /** Vendor's selected food type to filter the dish bank (Veg only / Non-veg / Both) */
  foodType?: string
  onChange: (next: MenuSection[]) => void
}

function getOrCreateSection(menu: MenuSection[], section: string): MenuSection {
  const found = menu.find(s => s.section === section)
  if (found) return found
  return { section, dishIds: [], pickLimit: 1 }
}

function upsertSection(menu: MenuSection[], updated: MenuSection): MenuSection[] {
  const next = menu.filter(s => s.section !== updated.section)
  // Only keep sections that have something configured (dishes or non-default limit)
  if (updated.dishIds.length === 0 && updated.pickLimit === 0) return next
  next.push(updated)
  return next
}

export default function MenuBuilder({ value, foodType, onChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const vegOnly = foodType === 'Veg only'

  function toggleExpanded(section: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  function dishesFor(section: string): Dish[] {
    return DISH_BANK.filter(d =>
      d.section === section && (!vegOnly || d.veg === 'Veg')
    )
  }

  function toggleDish(section: string, dishId: number) {
    const sec = getOrCreateSection(value, section)
    const has = sec.dishIds.includes(dishId)
    const updated: MenuSection = {
      ...sec,
      dishIds: has ? sec.dishIds.filter(id => id !== dishId) : [...sec.dishIds, dishId],
    }
    onChange(upsertSection(value, updated))
  }

  function setPickLimit(section: string, limit: number) {
    const sec = getOrCreateSection(value, section)
    const updated: MenuSection = { ...sec, pickLimit: limit }
    onChange(upsertSection(value, updated))
  }

  return (
    <div className="space-y-2">
      {MENU_SECTIONS.map(section => {
        const dishes = dishesFor(section)
        if (dishes.length === 0) return null
        const sec = value.find(s => s.section === section)
        const picked = sec?.dishIds.length || 0
        const limit = sec?.pickLimit ?? 1
        const isOpen = expanded.has(section)

        return (
          <div key={section} className="rounded-xl border border-card-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleExpanded(section)}
              className="w-full flex items-center justify-between px-3 py-2.5 active:bg-empty-bg"
            >
              <div className="text-left">
                <p className="text-[12px] font-semibold text-dark">{section}</p>
                <p className="text-[10px] text-gray-500">
                  {picked} / {dishes.length} offered
                  {picked > 0 && <span className="text-mustard font-medium"> · couple picks {limit}</span>}
                </p>
              </div>
              <span className={`text-dark text-[12px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {isOpen && (
              <div className="border-t border-card-border p-3 space-y-3">
                {/* Pick-limit stepper */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600">Couple can pick</span>
                  <div className="inline-flex items-stretch rounded-lg border border-card-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPickLimit(section, Math.max(0, limit - 1))}
                      disabled={limit <= 0}
                      className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                    >−</button>
                    <input
                      type="number" min={0} max={dishes.length} value={limit}
                      onChange={(e) => setPickLimit(section, Math.min(dishes.length, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-10 text-center text-[12px] font-semibold text-dark outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPickLimit(section, Math.min(dishes.length, limit + 1))}
                      disabled={limit >= dishes.length}
                      className="px-2.5 text-dark text-[14px] font-medium disabled:opacity-30 active:bg-mustard-light/40"
                    >+</button>
                  </div>
                </div>

                {/* Dish chips */}
                <div className="flex flex-wrap gap-1.5">
                  {dishes.map(d => {
                    const sel = sec?.dishIds.includes(d.id) || false
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDish(section, d.id)}
                        title={d.description}
                        className={`py-1 px-2.5 rounded-full text-[10px] font-medium transition-all ${sel ? 'bg-mustard text-white' : 'bg-empty-bg text-gray-700 border border-card-border'}`}
                      >
                        {sel && <span className="mr-0.5">✓ </span>}{d.name}
                        {d.veg === 'Non-Veg' && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
