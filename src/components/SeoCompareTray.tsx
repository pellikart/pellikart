import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatINR } from '@/lib/helpers'
import type { CategoryAdapter, SeoRow } from '@/lib/seo/types'

/**
 * Compare tray + side-by-side sheet, shared by every category.
 *
 * Rows come from the category adapter, so a venue comparison shows capacity and
 * catering policy while a photographer comparison shows candid, drone and
 * delivery. Values that differ between vendors are emphasised and identical
 * ones greyed, so the table reads as "what actually separates these".
 *
 * PAYWALL: columns are headed by the anonymous public code. Unlocking hands off
 * to the existing app flow.
 */
export default function SeoCompareTray({ rows, adapter, onRemove, onClear }: {
  rows: SeoRow[]
  adapter: CategoryAdapter
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null

  const specLabels = rows[0] ? adapter.compareRows(rows[0]).map(([k]) => k) : []

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-card-border bg-white/95 backdrop-blur shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-[1180px] px-5 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rows.map((r) => (
              <span key={r.id} className="shrink-0 inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-empty-bg text-[12px] font-mono text-dark">
                {r.label}
                <button
                  onClick={() => onRemove(r.id)}
                  aria-label={`Remove ${r.label} from comparison`}
                  className="w-4 h-4 rounded-full bg-dark/10 hover:bg-dark/20 text-dark text-[11px] leading-none flex items-center justify-center"
                >×</button>
              </span>
            ))}
            <button onClick={onClear} className="shrink-0 text-[12px] text-gray-500 hover:text-dark px-2">Clear</button>
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={rows.length < 2}
            className="shrink-0 px-6 py-2.5 rounded-full bg-magenta text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-magenta/90 transition-colors"
          >
            {rows.length < 2 ? 'Add one more to compare' : `Compare ${rows.length}`}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setOpen(false)}>
          <div
            role="dialog" aria-modal="true" aria-label={`Compare ${adapter.nounPlural}`}
            className="bg-white w-full max-w-[1000px] max-h-[88vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h2 className="font-display text-[19px] font-bold text-dark">Comparing {rows.length}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close comparison" className="w-8 h-8 rounded-full hover:bg-empty-bg text-gray-500 text-[18px] leading-none">×</button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th scope="col" className="p-3 text-[11px] uppercase tracking-wide text-gray-400 font-medium w-[150px]">Spec</th>
                    {rows.map((r) => (
                      <th scope="col" key={r.id} className="p-3 text-[12px] font-mono text-dark border-l border-card-border align-bottom">{r.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-card-border">
                    <th scope="row" className="p-3 text-[12.5px] text-gray-500 font-normal align-top">Price</th>
                    {rows.map((r) => (
                      <td key={r.id} className="p-3 text-[13px] border-l border-card-border align-top text-dark font-semibold">
                        {r.price ? `${formatINR(r.price)} ${r.priceUnit}` : '—'}
                      </td>
                    ))}
                  </tr>
                  {specLabels.map((labelText, i) => {
                    const vals = rows.map((r) => adapter.compareRows(r)[i]?.[1] ?? '—')
                    const allSame = vals.every((v) => v === vals[0])
                    return (
                      <tr key={labelText} className="border-t border-card-border">
                        <th scope="row" className="p-3 text-[12.5px] text-gray-500 font-normal align-top">{labelText}</th>
                        {vals.map((v, j) => (
                          <td key={rows[j].id} className={`p-3 text-[13px] border-l border-card-border align-top ${allSame ? 'text-gray-500' : 'text-dark font-medium'}`}>{v}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-card-border px-5 py-4 bg-cream/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[12.5px] text-gray-600 text-center sm:text-left max-w-[46ch]">
                Names and contact details are hidden. Unlock to see who these are and reach them directly.
              </p>
              <Link to="/app" className="shrink-0 px-6 py-3 rounded-full bg-mustard text-white text-[13px] font-semibold hover:bg-mustard/90 transition-colors">
                Unlock these vendors
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
