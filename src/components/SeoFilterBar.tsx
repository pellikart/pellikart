import { useMemo } from 'react'
import type { FilterDef, FilterValues, SeoRow, SeoSort } from '@/lib/seo/types'

/**
 * Category-agnostic filter bar for the SEO landing pages.
 *
 * Renders whatever filters the category adapter declares. These are UI-only by
 * design: they never write to the URL and never mint an indexable page, which
 * is what keeps a curated architecture from degenerating into a faceted-URL
 * explosion. Options for enum filters are derived from the rows actually on the
 * page when the adapter doesn't enumerate them, so the bar never offers a
 * choice that would empty the list.
 */

interface Props {
  rows: SeoRow[]
  defs: FilterDef[]
  values: FilterValues
  onChange: (next: FilterValues) => void
  sort: SeoSort
  onSortChange: (s: SeoSort) => void
  resultCount: number
  onReset: () => void
  /** Drops the page-level chrome — sticky positioning, the full-bleed border
   *  and the bar's own max-width — for use inside a section that already sets
   *  its own width, e.g. the landing page's category explorer. */
  embedded?: boolean
}

export default function SeoFilterBar({
  rows, defs, values, onChange, sort, onSortChange, resultCount, onReset, embedded = false,
}: Props) {
  const derived = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const d of defs) {
      if (d.kind !== 'enum' && d.kind !== 'includes') continue
      if (d.options?.length) { out[d.key] = d.options; continue }
      const seen = new Set<string>()
      for (const r of rows) {
        const v = r.facets[d.key]
        if (typeof v === 'string' && v) seen.add(v)
        else if (Array.isArray(v)) v.forEach((x) => seen.add(x))
      }
      out[d.key] = [...seen].sort()
    }
    return out
  }, [defs, rows])

  const set = (key: string, val: FilterValues[string]) => onChange({ ...values, [key]: val })

  const activeCount = Object.entries(values).filter(
    ([, v]) => v !== undefined && v !== '' && v !== false,
  ).length

  // A filter with fewer than two choices can only narrow to nothing or to
  // everything — noise either way, so it isn't rendered.
  const visible = defs.filter((d) =>
    d.kind === 'bool' || d.kind === 'max' || d.kind === 'min' || (derived[d.key]?.length ?? 0) > 1,
  )

  return (
    <div className={embedded
      ? 'rounded-2xl border border-card-border bg-white'
      : 'sticky top-0 z-30 border-b border-card-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80'}>
      <div className={embedded ? 'px-4 py-3' : 'mx-auto max-w-[1180px] px-5 py-3'}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((d) => {
            if (d.kind === 'bool') {
              const on = values[d.key] === true
              return (
                <button
                  key={d.key}
                  onClick={() => set(d.key, on ? undefined : true)}
                  aria-pressed={on}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                    on ? 'border-dark bg-dark text-white' : 'border-card-border bg-white text-dark hover:border-dark'
                  }`}
                >
                  {on && <span className="mr-1">✓</span>}{d.label}
                </button>
              )
            }
            const value = values[d.key]
            const active = value !== undefined && value !== ''
            const options =
              d.kind === 'max' || d.kind === 'min'
                ? d.options.map((o) => ({ value: String(o.value), label: o.label }))
                : (derived[d.key] ?? []).map((o) => ({ value: o, label: o }))
            return (
              <select
                key={d.key}
                aria-label={d.label}
                value={value === undefined ? '' : String(value)}
                onChange={(e) => {
                  const raw = e.target.value
                  if (!raw) return set(d.key, undefined)
                  set(d.key, d.kind === 'max' || d.kind === 'min' ? Number(raw) : raw)
                }}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] outline-none transition-colors cursor-pointer ${
                  active ? 'border-dark bg-dark text-white' : 'border-card-border bg-white text-dark hover:border-dark'
                }`}
              >
                <option value="">{`Any ${d.label.toLowerCase()}`}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-card-border/70">
          <p className="text-[12.5px] text-gray-500" aria-live="polite">
            <span className="font-semibold text-dark">{resultCount}</span> showing
            {activeCount > 0 && (
              <button onClick={onReset} className="ml-3 text-magenta hover:underline font-medium">
                Clear filters
              </button>
            )}
          </p>
          <label className="flex items-center gap-2 text-[12.5px] text-gray-500">
            Sort
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SeoSort)}
              className="rounded-lg border border-card-border px-2.5 py-1.5 text-[12.5px] text-dark bg-white outline-none focus:border-dark"
            >
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating-desc">Rating</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}
