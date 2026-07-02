import { useState } from 'react'
import { DISH_BANK } from '@/lib/dish-bank'
import type { MenuSection } from '@/lib/vendor-types'

type Picks = Record<string, (number | string)[]>

interface Props {
  /** Menu from the catering / venue-package listing */
  menu: MenuSection[]
  /** The couple's previously-saved picks for this menu (section → picked keys). */
  initialPicks?: Picks
  /** Called whenever picks change, so the parent can persist them. */
  onPicksChange?: (picks: Picks) => void
}

/**
 * Couple-side menu picker. Shows every category and its dishes at once (no
 * per-category expanding) so the whole menu is scannable at a glance. Picks are
 * seeded from `initialPicks` and reported via `onPicksChange` for persistence.
 */
export default function MenuPicker({ menu, initialPicks, onPicksChange }: Props) {
  const [picks, setPicks] = useState<Record<string, Set<number | string>>>(() => {
    const init: Record<string, Set<number | string>> = {}
    for (const [sec, arr] of Object.entries(initialPicks || {})) init[sec] = new Set(arr)
    return init
  })

  if (menu.length === 0) return null

  function serialize(p: Record<string, Set<number | string>>): Picks {
    const out: Picks = {}
    for (const [sec, set] of Object.entries(p)) if (set.size > 0) out[sec] = [...set]
    return out
  }

  function togglePick(section: string, key: number | string, limit: number) {
    const cur = new Set(picks[section] || [])
    if (cur.has(key)) cur.delete(key)
    else if (cur.size < limit) cur.add(key)
    else return // at cap — explicit deselect required
    const next = { ...picks, [section]: cur }
    setPicks(next)
    onPicksChange?.(serialize(next))
  }

  // Only sections the vendor actually offers something in, with a positive limit.
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

        return (
          <div key={sec.section} className="rounded-xl border border-card-border p-3">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <p className="text-[11px] font-semibold text-dark">
                {sec.section}
                {sec.custom && <span className="ml-1.5 text-[9px] font-medium text-magenta align-middle">custom</span>}
              </p>
              <p className="text-[10px] text-gray-500 shrink-0">
                {totalOffered} on offer · pick up to {sec.pickLimit}
                {picked.size > 0 && <span className="text-magenta font-medium"> · {picked.size} picked</span>}
              </p>
            </div>

            {atCap && (
              <p className="text-[10px] text-mustard mb-1.5">Max reached — deselect a dish to pick another.</p>
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
        )
      })}
    </div>
  )
}
