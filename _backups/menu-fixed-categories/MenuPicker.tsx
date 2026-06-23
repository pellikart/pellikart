import { useState } from 'react'
import { DISH_BANK } from '@/lib/dish-bank'
import type { MenuSection } from '@/lib/vendor-types'

interface Props {
  /** Menu from the catering listing */
  menu: MenuSection[]
}

/**
 * Couple-side interactive menu picker. State is local (not persisted) — it's
 * a mock-up of how a couple would curate dishes within the caterer's pick limit.
 */
export default function MenuPicker({ menu }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // Picks track either a dish ID (number, from DISH_BANK) or a custom dish name (string).
  const [picks, setPicks] = useState<Record<string, Set<number | string>>>({})

  if (menu.length === 0) return null

  function toggleSection(section: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  function togglePick(section: string, key: number | string, limit: number) {
    setPicks(prev => {
      const current = prev[section] || new Set<number | string>()
      const has = current.has(key)
      const next = new Set(current)
      if (has) {
        next.delete(key)
      } else if (next.size < limit) {
        next.add(key)
      } else {
        // At cap — ignore. We could replace oldest, but explicit is friendlier.
        return prev
      }
      return { ...prev, [section]: next }
    })
  }

  // Only show sections the vendor actually offers something in (defaults or customs, with a positive limit).
  const offered = menu.filter(s => (s.dishIds.length > 0 || (s.customDishes?.length || 0) > 0) && s.pickLimit > 0)
  if (offered.length === 0) return null

  return (
    <div className="space-y-2">
      {offered.map(sec => {
        const sectionDishes = DISH_BANK.filter(d => sec.dishIds.includes(d.id))
        const customs = sec.customDishes || []
        const totalOffered = sectionDishes.length + customs.length
        const picked = picks[sec.section] || new Set<number | string>()
        const atCap = picked.size >= sec.pickLimit
        const isOpen = expanded.has(sec.section)
        return (
          <div key={sec.section} className="rounded-xl border border-card-border overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(sec.section)}
              className="w-full flex items-center justify-between px-3 py-2.5 active:bg-empty-bg"
            >
              <div className="text-left">
                <p className="text-[11px] font-semibold text-dark">{sec.section}</p>
                <p className="text-[10px] text-gray-500">
                  {totalOffered} on offer · pick up to {sec.pickLimit}
                  {picked.size > 0 && <span className="text-magenta font-medium"> · {picked.size} picked</span>}
                </p>
              </div>
              <span className={`text-dark text-[11px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {isOpen && (
              <div className="border-t border-card-border p-3 space-y-2">
                {atCap && (
                  <p className="text-[10px] text-mustard">Max reached — deselect a dish to pick another.</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {sectionDishes.map(d => {
                    const sel = picked.has(d.id)
                    const disabled = !sel && atCap
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => togglePick(sec.section, d.id, sec.pickLimit)}
                        disabled={disabled}
                        title={d.description}
                        className={`py-1 px-2.5 rounded-full text-[10px] font-medium transition-all ${sel ? 'bg-mustard text-white' : disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-empty-bg text-gray-700 border border-card-border active:bg-mustard-light/40'}`}
                      >
                        {sel && <span className="mr-0.5">✓ </span>}{d.name}
                        {d.veg === 'Non-Veg' && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500" />}
                      </button>
                    )
                  })}
                  {customs.map(name => {
                    const sel = picked.has(name)
                    const disabled = !sel && atCap
                    return (
                      <button
                        key={`custom:${name}`}
                        type="button"
                        onClick={() => togglePick(sec.section, name, sec.pickLimit)}
                        disabled={disabled}
                        className={`py-1 px-2.5 rounded-full text-[10px] font-medium transition-all ${sel ? 'bg-mustard text-white' : disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-empty-bg text-gray-700 border border-card-border active:bg-mustard-light/40'}`}
                      >
                        {sel && <span className="mr-0.5">✓ </span>}{name}
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
