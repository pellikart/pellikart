import type { ReactNode } from 'react'
import { formatINR, bgStyle } from '@/lib/helpers'
import type { SeoRow } from '@/lib/seo/types'

/**
 * One anonymous vendor card, shared by the curated SEO landing pages and the
 * landing page's category explorer.
 *
 * The row never carries a business name (see adapters.ts) — the code badge is
 * the identity a couple sees until they unlock.
 *
 * Two modes:
 *  - `compare` renders the compare toggle the SEO pages use.
 *  - `onOpen` makes the whole card a button that opens the full listing sheet.
 * They are mutually exclusive by construction: `onOpen` wraps the card body in
 * a button, and nesting the compare button inside it would be invalid HTML.
 */
export default function SeoVendorCard({ row, onOpen, compare }: {
  row: SeoRow
  onOpen?: () => void
  compare?: { selected: boolean; onToggle: () => void; full: boolean }
}) {
  const selected = compare?.selected ?? false

  const body = (footer: ReactNode) => (
    <>
      <div className="relative h-44 bg-empty-bg" style={row.photo ? bgStyle(row.photo) : undefined}>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/65 backdrop-blur text-white text-[10px] font-mono tracking-wide">
          {row.label}
        </span>
        {row.rating > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/95 text-dark text-[11px] font-semibold">★ {row.rating.toFixed(1)}</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[19px] font-bold text-dark tracking-[-0.02em]">
            {row.price ? formatINR(row.price) : '—'}
            <span className="ml-1 text-[12px] font-normal text-gray-500">{row.priceUnit}</span>
          </p>
          {row.area && <span className="text-[12px] text-gray-500 shrink-0">{row.area}</span>}
        </div>
        {row.summary && <p className="mt-1.5 text-[12.5px] text-gray-600 leading-snug">{row.summary}</p>}
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-card-border pt-3">
          {row.specs.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wide text-gray-400">{k}</dt>
              <dd className="text-[12.5px] text-dark truncate">{v}</dd>
            </div>
          ))}
        </dl>
        {footer}
      </div>
    </>
  )

  const shell = `rounded-2xl border overflow-hidden bg-white transition-all ${
    selected
      ? 'border-magenta ring-2 ring-magenta/15'
      : 'border-card-border hover:border-dark/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
  }`

  if (onOpen) {
    return (
      <article className={shell}>
        <button
          type="button"
          onClick={onOpen}
          className="group block w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-inset"
        >
          {body(
            <p className="mt-3.5 text-[13px] font-semibold text-magenta">
              View full details{' '}
              <span aria-hidden className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </p>,
          )}
        </button>
      </article>
    )
  }

  return (
    <article className={shell}>
      {body(
        compare && (
          <button
            onClick={compare.onToggle}
            disabled={compare.full}
            className={`mt-3.5 w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selected ? 'bg-dark text-white' : 'bg-empty-bg text-dark hover:bg-mustard-light'}`}
          >
            {selected ? '✓ Added to compare' : compare.full ? 'Compare list full' : 'Compare'}
          </button>
        ),
      )}
    </article>
  )
}
