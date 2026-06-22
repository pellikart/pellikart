import { useState } from 'react'
import type { Vendor } from '@/lib/types'
import { getListingConfig } from '@/lib/vendor-category-config'
import { formatINR } from '@/lib/helpers'

/* ------------------------------------------------------------------ *
 * Filter definitions — derived from each category's LISTING_CONFIG.
 * "Smart subset": price + rating always, plus the first few category
 * fields that at least one vendor actually filled in, plus inclusions.
 * ------------------------------------------------------------------ */

export type FilterDef =
  | { kind: 'price'; key: 'price'; label: string; min: number; max: number; step: number }
  | { kind: 'rating'; key: 'rating'; label: string }
  | { kind: 'options'; key: string; label: string; options: string[]; multiValue: boolean }
  | { kind: 'range'; key: string; label: string; min: number; max: number; step: number; unit?: string }
  | { kind: 'inclusions'; key: '__inclusions'; label: string; options: string[] }

export type FilterValues = Record<string, unknown>

const MAX_CATEGORY_FILTERS = 4

function hasValue(v: Vendor | undefined, key: string): boolean {
  const val = v?.categoryFields?.[key]
  return Array.isArray(val) ? val.length > 0 : !!val
}

/** Distinct observed values for a single-select field, used when the config
 *  doesn't enumerate options. */
function distinctValues(vendors: Vendor[], key: string): string[] {
  const seen = new Set<string>()
  for (const v of vendors) {
    const val = v.categoryFields?.[key]
    if (typeof val === 'string' && val) seen.add(val)
  }
  return [...seen]
}

export function buildFilterDefs(categoryLabel: string, vendors: Vendor[]): FilterDef[] {
  const config = getListingConfig(categoryLabel)
  const defs: FilterDef[] = [
    { kind: 'price', key: 'price', label: 'Price', min: config.priceRange.min, max: config.priceRange.max, step: config.priceRange.step },
    { kind: 'rating', key: 'rating', label: 'Rating' },
  ]

  // Category-specific fields: only those at least one vendor filled, skip
  // conditional (visibleWhen) fields, cap at MAX_CATEGORY_FILTERS.
  const fields = config.steps
    .flatMap((s) => s.fields)
    .filter((f) => !f.visibleWhen && vendors.some((v) => hasValue(v, f.key)))
    .slice(0, MAX_CATEGORY_FILTERS)

  for (const f of fields) {
    if (f.type === 'single' || f.type === 'multi') {
      const options = f.options?.length ? f.options : distinctValues(vendors, f.key)
      if (options.length) defs.push({ kind: 'options', key: f.key, label: f.label, options, multiValue: f.type === 'multi' })
    } else if (f.type === 'slider') {
      defs.push({ kind: 'range', key: f.key, label: f.label, min: f.sliderMin ?? 0, max: f.sliderMax ?? 1000, step: f.sliderStep ?? 1, unit: f.sliderUnit })
    } else if (f.type === 'number') {
      defs.push({ kind: 'range', key: f.key, label: f.label, min: f.numberMin ?? 0, max: f.numberMax ?? 1000, step: f.numberStep ?? 1, unit: f.numberUnit })
    }
  }

  const usefulInclusions = config.inclusions.filter((inc) => vendors.some((v) => v.includes?.includes(inc)))
  if (usefulInclusions.length) defs.push({ kind: 'inclusions', key: '__inclusions', label: 'Inclusions', options: usefulInclusions })

  return defs
}

/* ------------------------------------------------------------------ *
 * Filtering — applied to the explore items, joining to parent vendor.
 * ------------------------------------------------------------------ */

type ExploreItem = { id: string; vendorId: string; price: number; rating: number }

export function applyExploreFilters<T extends ExploreItem>(
  items: T[],
  values: FilterValues,
  defs: FilterDef[],
  getVendor: (item: T) => Vendor | undefined,
): T[] {
  return items.filter((item) => {
    const v = getVendor(item)
    for (const def of defs) {
      const val = values[def.key]
      if (def.kind === 'price') {
        const r = val as { min?: number; max?: number } | undefined
        if (r?.min != null && item.price < r.min) return false
        if (r?.max != null && item.price > r.max) return false
      } else if (def.kind === 'rating') {
        if (typeof val === 'number' && val > 0 && item.rating < val) return false
      } else if (def.kind === 'options') {
        const selected = (val as string[]) || []
        if (selected.length) {
          const vv = v?.categoryFields?.[def.key]
          if (def.multiValue) {
            const arr = Array.isArray(vv) ? vv : vv ? [vv] : []
            if (!selected.some((s) => arr.includes(s))) return false
          } else if (!vv || !selected.includes(String(vv))) {
            return false
          }
        }
      } else if (def.kind === 'range') {
        const r = val as { min?: number; max?: number } | undefined
        const vv = v?.categoryFields?.[def.key]
        const n = typeof vv === 'string' ? Number(vv) : NaN
        if (r?.min != null && (isNaN(n) || n < r.min)) return false
        if (r?.max != null && (isNaN(n) || n > r.max)) return false
      } else if (def.kind === 'inclusions') {
        const selected = (val as string[]) || []
        if (selected.length) {
          const inc = v?.includes || []
          if (!selected.every((s) => inc.includes(s))) return false
        }
      }
    }
    return true
  })
}

export function activeFilterCount(values: FilterValues, defs: FilterDef[]): number {
  return defs.reduce((n, def) => (isActive(values[def.key], def) ? n + 1 : n), 0)
}

function isActive(val: unknown, def: FilterDef): boolean {
  if (def.kind === 'price' || def.kind === 'range') {
    const r = val as { min?: number; max?: number } | undefined
    return !!r && (r.min != null || r.max != null)
  }
  if (def.kind === 'rating') return typeof val === 'number' && val > 0
  return Array.isArray(val) && val.length > 0
}

/* ------------------------------------------------------------------ *
 * Inline filter bar UI.
 * ------------------------------------------------------------------ */

export default function ExploreFilterBar({
  defs, values, onChange,
}: {
  defs: FilterDef[]
  values: FilterValues
  onChange: (next: FilterValues) => void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  if (defs.length === 0) return null

  const setValue = (key: string, v: unknown) => onChange({ ...values, [key]: v })
  const clearAll = () => { onChange({}); setOpenKey(null) }
  const totalActive = activeFilterCount(values, defs)
  const openDef = defs.find((d) => d.key === openKey) || null

  return (
    <div className="relative border-b border-card-border">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2">
        {defs.map((def) => {
          const active = isActive(values[def.key], def)
          return (
            <button
              key={def.key}
              onClick={() => setOpenKey(openKey === def.key ? null : def.key)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                active || openKey === def.key
                  ? 'bg-magenta text-white border-magenta'
                  : 'bg-white text-gray-600 border-card-border'
              }`}
            >
              {def.label}
              {active && def.kind !== 'price' && def.kind !== 'range' && def.kind !== 'rating' && (
                <span className="text-[9px]">({(values[def.key] as string[]).length})</span>
              )}
              <span className="text-[8px] opacity-70">▾</span>
            </button>
          )
        })}
        {totalActive > 0 && (
          <button onClick={clearAll} className="shrink-0 px-2.5 py-1.5 text-[11px] font-medium text-magenta">
            Clear all
          </button>
        )}
      </div>

      {openDef && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenKey(null)} />
          <div className="absolute left-0 right-0 top-full z-50 px-4">
            <div className="bg-white rounded-xl border border-card-border shadow-lg p-3 w-full max-w-[320px]">
              <FilterPanel def={openDef} value={values[openDef.key]} onChange={(v) => setValue(openDef.key, v)} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function FilterPanel({ def, value, onChange }: { def: FilterDef; value: unknown; onChange: (v: unknown) => void }) {
  if (def.kind === 'price' || def.kind === 'range') {
    const r = (value as { min?: number; max?: number }) || {}
    const unit = def.kind === 'price' ? '₹' : def.unit || ''
    return (
      <div>
        <p className="text-[11px] font-semibold text-dark mb-2">{def.label}{def.kind === 'range' && def.unit ? ` (${def.unit})` : ''}</p>
        <div className="flex items-center gap-2">
          <input
            type="number" inputMode="numeric" placeholder={`Min ${def.kind === 'price' ? formatINR(def.min) : def.min}`}
            value={r.min ?? ''} onChange={(e) => onChange({ ...r, min: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-full px-2 py-1.5 rounded-lg border border-card-border text-[11px] outline-none focus:border-magenta"
          />
          <span className="text-gray-300 text-[11px]">–</span>
          <input
            type="number" inputMode="numeric" placeholder={`Max ${def.kind === 'price' ? formatINR(def.max) : def.max}`}
            value={r.max ?? ''} onChange={(e) => onChange({ ...r, max: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="w-full px-2 py-1.5 rounded-lg border border-card-border text-[11px] outline-none focus:border-magenta"
          />
        </div>
        {unit === '₹' && <p className="text-[9px] text-gray-400 mt-1.5">Enter amounts in ₹</p>}
      </div>
    )
  }

  if (def.kind === 'rating') {
    const current = (value as number) || 0
    const opts = [0, 3, 3.5, 4, 4.5]
    return (
      <div>
        <p className="text-[11px] font-semibold text-dark mb-2">Minimum rating</p>
        <div className="flex flex-col gap-1">
          {opts.map((o) => (
            <button
              key={o} onClick={() => onChange(o)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] ${current === o ? 'bg-magenta-light text-magenta font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>{o === 0 ? 'Any rating' : `★ ${o}+`}</span>
              {current === o && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // options / inclusions — checkbox group
  const options = def.options
  const selected = (value as string[]) || []
  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  return (
    <div>
      <p className="text-[11px] font-semibold text-dark mb-2">{def.label}</p>
      <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto no-scrollbar">
        {options.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt} onClick={() => toggle(opt)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-left ${on ? 'bg-magenta-light text-magenta font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${on ? 'bg-magenta border-magenta text-white' : 'border-gray-300'}`}>
                {on && '✓'}
              </span>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
