import { useState } from 'react'
import type { Vendor } from '@/lib/types'
import { getListingConfig, type SelectField } from '@/lib/vendor-category-config'
import { formatINR } from '@/lib/helpers'

/* ------------------------------------------------------------------ *
 * Filter definitions — derived from each category's LISTING_CONFIG.
 * `primary` = price + rating always, plus the first few category fields
 * vendors actually filled, plus inclusions (shown as chips). `more` = every
 * remaining parameter, surfaced via the "Other filters" button.
 * ------------------------------------------------------------------ */

export type FilterDef =
  | { kind: 'price'; key: 'price'; label: string; min: number; max: number; step: number }
  | { kind: 'rating'; key: 'rating'; label: string }
  | { kind: 'options'; key: string; label: string; options: string[]; multiValue: boolean }
  | { kind: 'range'; key: string; label: string; min: number; max: number; step: number; unit?: string }
  | { kind: 'inclusions'; key: '__inclusions'; label: string; options: string[] }

export type FilterValues = Record<string, unknown>

/** How many category-specific parameters appear as default chips. */
const DEFAULT_CATEGORY_FILTERS = 5

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

export function buildFilterDefs(categoryLabel: string, vendors: Vendor[]): { primary: FilterDef[]; more: FilterDef[] } {
  const config = getListingConfig(categoryLabel)
  const allFields = config.steps.flatMap((s) => s.fields)
  const nonConditional = allFields.filter((f) => !f.visibleWhen)
  const conditional = allFields.filter((f) => f.visibleWhen)
  // Default chips prefer params vendors actually filled, padded with the rest
  // up to the limit. Everything else — including params no vendor filled yet —
  // is still offered under "Other filters" so the full parameter list is there.
  const filled = (f: SelectField) => vendors.some((v) => hasValue(v, f.key))
  const filledFirst = [...nonConditional.filter(filled), ...nonConditional.filter((f) => !filled(f))]

  const toDef = (f: SelectField): FilterDef | null => {
    if (f.type === 'single' || f.type === 'multi') {
      const options = f.options?.length ? f.options : distinctValues(vendors, f.key)
      return options.length ? { kind: 'options', key: f.key, label: f.label, options, multiValue: f.type === 'multi' } : null
    }
    if (f.type === 'slider') return { kind: 'range', key: f.key, label: f.label, min: f.sliderMin ?? 0, max: f.sliderMax ?? 1000, step: f.sliderStep ?? 1, unit: f.sliderUnit }
    if (f.type === 'number') return { kind: 'range', key: f.key, label: f.label, min: f.numberMin ?? 0, max: f.numberMax ?? 1000, step: f.numberStep ?? 1, unit: f.numberUnit }
    return null
  }

  const primaryFields = filledFirst.slice(0, DEFAULT_CATEGORY_FILTERS)
  const primarySet = new Set(primaryFields)
  const moreFields = [...filledFirst.filter((f) => !primarySet.has(f)), ...conditional]

  const primary: FilterDef[] = [
    { kind: 'price', key: 'price', label: 'Price', min: config.priceRange.min, max: config.priceRange.max, step: config.priceRange.step },
    { kind: 'rating', key: 'rating', label: 'Rating' },
    ...(primaryFields.map(toDef).filter(Boolean) as FilterDef[]),
  ]
  const usefulInclusions = config.inclusions.filter((inc) => vendors.some((v) => v.includes?.includes(inc)))
  primary.push({ kind: 'inclusions', key: '__inclusions', label: 'Inclusions', options: usefulInclusions.length ? usefulInclusions : config.inclusions })

  const more: FilterDef[] = moreFields.map(toDef).filter(Boolean) as FilterDef[]
  // Style is a generic parameter on every category — surface it under "Other".
  if (config.styles.length) more.unshift({ kind: 'options', key: '__style', label: 'Style', options: config.styles, multiValue: false })

  return { primary, more }
}

/** The up-to-2 category parameters shown as a compact spec box on each explore
 *  card. Prefers params vendors have actually filled, falling back to the first
 *  config fields so a category always offers a consistent pair. */
export function getCardSpecFields(categoryLabel: string, vendors: Vendor[]): { key: string; label: string }[] {
  const fields = getListingConfig(categoryLabel).steps.flatMap((s) => s.fields).filter((f) => !f.visibleWhen)
  const filled = fields.filter((f) => vendors.some((v) => hasValue(v, f.key)))
  const ordered = filled.length >= 2 ? filled : [...filled, ...fields.filter((f) => !filled.includes(f))]
  return ordered.slice(0, 4).map((f) => ({ key: f.key, label: f.label }))
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
          if (def.key === '__style') {
            if (!v?.style || !selected.includes(v.style)) return false
          } else {
            const vv = v?.categoryFields?.[def.key]
            if (def.multiValue) {
              const arr = Array.isArray(vv) ? vv : vv ? [vv] : []
              if (!selected.some((s) => arr.includes(s))) return false
            } else if (!vv || !selected.includes(String(vv))) {
              return false
            }
          }
        }
      } else if (def.kind === 'range') {
        const r = val as { min?: number; max?: number } | undefined
        const vv = v?.categoryFields?.[def.key]
        // parseFloat (not Number) so legacy string values like "50 cars" /
        // "200+ cars" yield 50 / 200 instead of NaN and stay filterable.
        const n = typeof vv === 'string' ? parseFloat(vv) : NaN
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

const MORE_KEY = '__more'

export default function ExploreFilterBar({
  defs, moreDefs = [], values, onChange,
}: {
  defs: FilterDef[]
  moreDefs?: FilterDef[]
  values: FilterValues
  onChange: (next: FilterValues) => void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  if (defs.length === 0) return null

  const setValue = (key: string, v: unknown) => onChange({ ...values, [key]: v })
  const clearAll = () => { onChange({}); setOpenKey(null) }
  const allDefs = [...defs, ...moreDefs]
  const totalActive = activeFilterCount(values, allDefs)
  const moreActive = activeFilterCount(values, moreDefs)
  const openDef = openKey && openKey !== MORE_KEY ? defs.find((d) => d.key === openKey) || null : null

  return (
    <div className="relative border-b border-card-border">
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-2">
          {defs.map((def) => {
            const active = isActive(values[def.key], def)
            return (
              <button
                key={def.key}
                onClick={() => setOpenKey(openKey === def.key ? null : def.key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  active || openKey === def.key ? 'bg-magenta text-white border-magenta' : 'bg-white text-gray-600 border-card-border'
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
        </div>

        {/* Pinned to the right so it never scrolls out of view */}
        {(moreDefs.length > 0 || totalActive > 0) && (
          <div className="shrink-0 flex items-center gap-1 pl-2 pr-3 py-2 border-l border-card-border bg-white">
            {moreDefs.length > 0 && (
              <button
                onClick={() => setOpenKey(openKey === MORE_KEY ? null : MORE_KEY)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                  moreActive > 0 || openKey === MORE_KEY ? 'bg-magenta text-white border-magenta' : 'bg-white text-magenta border-magenta/40'
                }`}
              >
                <span className="text-[11px] leading-none">⋯</span>
                Other filters
                {moreActive > 0 && <span className="text-[9px]">({moreActive})</span>}
              </button>
            )}
            {totalActive > 0 && (
              <button onClick={clearAll} className="shrink-0 px-2 py-1.5 text-[11px] font-medium text-magenta">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Single-chip dropdown */}
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

      {/* "Other filters" panel — every remaining parameter, stacked */}
      {openKey === MORE_KEY && moreDefs.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenKey(null)} />
          <div className="absolute left-0 right-0 top-full z-50 px-4">
            <div className="bg-white rounded-xl border border-card-border shadow-lg w-full max-w-[360px] max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between px-3 py-2 border-b border-card-border sticky top-0 bg-white">
                <p className="text-[12px] font-bold text-dark">Other filters</p>
                <button onClick={() => setOpenKey(null)} className="text-[11px] font-medium text-magenta">Done</button>
              </div>
              <div className="p-3 space-y-3">
                {moreDefs.map((def) => (
                  <div key={def.key} className="pb-3 border-b border-card-border last:border-0 last:pb-0">
                    <FilterPanel def={def} value={values[def.key]} onChange={(v) => setValue(def.key, v)} />
                  </div>
                ))}
              </div>
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
