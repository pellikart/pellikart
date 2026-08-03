import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import LandingNav from '@/components/LandingNav'
import LandingFooter from '@/components/LandingFooter'
import SeoFilterBar from '@/components/SeoFilterBar'
import SeoCompareTray from '@/components/SeoCompareTray'
import { fetchAllLiveVendors, fetchAllListings, fetchAllAvailability } from '@/lib/supabase-db'
import { buildLiveVendorMap } from '@/lib/store'
import { formatINR, bgStyle } from '@/lib/helpers'
import { useSeoHead, breadcrumbLd, faqLd, itemListLd } from '@/lib/useSeoHead'
import {
  getCity, getPage, pagesForCategory, seoPath, resolveCanonical, adapterByPrefix,
} from '@/lib/seo/registry'
import {
  applyFilters, computeStats, sortRows, isIndexable,
  type CategoryAdapter, type FilterValues, type SeoPageDef, type SeoRow, type SeoSort,
} from '@/lib/seo/types'

/**
 * THE landing-page shell — every curated SEO page, every category.
 *
 * Routes are /:prefix/:city/:slug where prefix picks the category adapter and
 * slug picks the registry entry. What changes between pages is the registry
 * entry's predicate and copy; what changes between categories is the adapter's
 * row shape and filters. There is no per-page and no per-category component.
 *
 * PAYWALL: rows never carry a business name (see adapters.ts). The unlock CTA
 * hands off to the existing app flow; no paywall logic lives here.
 */
export default function SeoLandingPage() {
  const { prefix, city: citySlug, slug } = useParams<{ prefix: string; city: string; slug?: string }>()
  const adapter = adapterByPrefix(prefix)
  const city = getCity(citySlug)
  const page = city && adapter ? getPage(city.name, adapter.category, slug) : undefined

  const [rows, setRows] = useState<SeoRow[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!adapter) return
    let cancelled = false
    ;(async () => {
      try {
        const [liveVendors, listings, availability] = await Promise.all([
          fetchAllLiveVendors(), fetchAllListings(), fetchAllAvailability(),
        ])
        if (cancelled) return
        const { vendorMap } = buildLiveVendorMap(
          liveVendors as Record<string, unknown>[],
          listings as Record<string, unknown>[],
          availability as Record<string, unknown>[],
        )
        setRows(
          Object.values(vendorMap)
            .filter((v) => v.category === adapter.category)
            .map(adapter.toRow),
        )
      } catch {
        if (!cancelled) { setLoadFailed(true); setRows([]) }
      }
    })()
    return () => { cancelled = true }
  }, [adapter])

  if (!city || !adapter || !page) return <NotFound />

  return (
    <SeoLandingBody
      key={`${adapter.urlPrefix}/${city.slug}/${page.slug}`}
      city={city.name} citySlug={city.slug} adapter={adapter} page={page}
      allRows={rows} loadFailed={loadFailed}
    />
  )
}

/** Body with rows injected — the prerenderer server-renders this directly. */
export function SeoLandingBody({
  city, citySlug, adapter, page, allRows, loadFailed,
}: {
  city: string; citySlug: string; adapter: CategoryAdapter; page: SeoPageDef
  allRows: SeoRow[] | null; loadFailed: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterValues>(page.presetFilters ?? {})
  const [sort, setSort] = useState<SeoSort>((searchParams.get('sort') as SeoSort) || 'price-asc')
  const [compareIds, setCompareIds] = useState<string[]>([])

  // The page predicate defines the page — the metadata, the count and the
  // structured data all describe it. The filter bar narrows within that.
  const pageRows = useMemo(() => (allRows ?? []).filter(page.match), [allRows, page])
  const visible = useMemo(
    () => sortRows(applyFilters(pageRows, adapter.filters, filters), sort),
    [pageRows, adapter, filters, sort],
  )
  const stats = useMemo(() => computeStats(pageRows), [pageRows])
  const faqs = useMemo(() => page.faqs(stats, city), [page, stats, city])

  const path = seoPath(adapter.urlPrefix, citySlug, page.slug)
  const canonicalPath = resolveCanonical(city, citySlug, page, filters)
  const indexable = allRows !== null && isIndexable(page, pageRows.length)

  const trail = [
    { name: 'Pellikart', path: '/' },
    { name: `${cap(adapter.nounPlural)} in ${city}`, path: seoPath(adapter.urlPrefix, citySlug, '') },
    ...(page.slug ? [{ name: page.label, path }] : []),
  ]

  useSeoHead({
    title: page.title,
    description: page.description,
    canonicalPath,
    // A curated page must earn its index slot with real stock; below the
    // threshold it stays crawlable for its links but out of the index.
    noindex: !indexable,
    jsonLd: [
      breadcrumbLd(trail),
      faqLd(faqs),
      ...(pageRows.length ? [itemListLd(pageRows, path, page.h1, adapter.schemaType)] : []),
    ],
  })

  function setSortAndUrl(next: SeoSort) {
    setSort(next)
    const p = new URLSearchParams(searchParams)
    if (next === 'price-asc') p.delete('sort'); else p.set('sort', next)
    setSearchParams(p, { replace: true })
  }

  const toggleCompare = (id: string) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id])

  const related = page.related
    .map((s) => pagesForCategory(city, adapter.category).find((p) => p.slug === s))
    .filter((p): p is SeoPageDef => !!p)

  const loading = allRows === null

  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <LandingNav />

      <nav aria-label="Breadcrumb" className="border-b border-card-border bg-cream/60">
        <ol className="mx-auto max-w-[1180px] px-5 py-2.5 flex flex-wrap items-center gap-1.5 text-[12px] text-gray-500">
          {trail.map((t, i) => (
            <li key={t.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-gray-300">/</span>}
              {i === trail.length - 1
                ? <span className="text-dark font-medium">{t.name}</span>
                : <Link to={t.path} className="hover:text-magenta transition-colors">{t.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>

      <header className="border-b border-card-border">
        <div className="mx-auto max-w-[1180px] px-5 pt-8 pb-7">
          <h1 className="font-display text-[clamp(28px,4.2vw,44px)] leading-[1.08] tracking-[-0.03em] font-bold text-dark max-w-[20ch]">
            {page.h1}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-600 max-w-[70ch]">{page.intro}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="inline-flex items-center gap-2 font-semibold text-dark">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-magenta" />
              {loading
                ? `Loading ${adapter.nounPlural}…`
                : `${pageRows.length} ${pageRows.length === 1 ? adapter.noun : adapter.nounPlural} found`}
            </span>
            {stats.minPrice != null && <span className="text-gray-500">From {formatINR(stats.minPrice)}</span>}
            {stats.num.capacityMax && <span className="text-gray-500">Up to {stats.num.capacityMax.max} guests</span>}
            <span className="text-gray-400">Updated {lastUpdatedLabel()}</span>
          </div>
        </div>
      </header>

      <SeoFilterBar
        rows={pageRows}
        defs={adapter.filters}
        values={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={setSortAndUrl}
        resultCount={visible.length}
        onReset={() => setFilters(page.presetFilters ?? {})}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-[1180px] px-5 py-7">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-card-border overflow-hidden animate-pulse">
                  <div className="h-44 bg-empty-bg" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-1/3 bg-empty-bg rounded" />
                    <div className="h-3 w-2/3 bg-empty-bg rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              adapter={adapter} loadFailed={loadFailed} hasPageRows={pageRows.length > 0}
              onReset={() => setFilters(page.presetFilters ?? {})}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((r) => (
                  <VendorCard
                    key={r.id} row={r}
                    selected={compareIds.includes(r.id)}
                    onCompare={() => toggleCompare(r.id)}
                    compareFull={compareIds.length >= 4 && !compareIds.includes(r.id)}
                  />
                ))}
              </div>
              <UnlockCta count={visible.length} noun={adapter.nounPlural} />
            </>
          )}
        </div>

        <section className="border-t border-card-border bg-cream/50">
          <div className="mx-auto max-w-[820px] px-5 py-12">
            <h2 className="font-display text-[26px] font-bold text-dark tracking-[-0.02em]">Questions couples ask</h2>
            <div className="mt-5">
              {faqs.map((f) => (
                <details key={f.q} className="group border-b border-card-border py-4">
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                    <h3 className="text-[15px] font-medium text-dark">{f.q}</h3>
                    <span className="shrink-0 text-magenta text-[18px] leading-none mt-0.5 group-open:hidden">+</span>
                    <span className="shrink-0 text-magenta text-[18px] leading-none mt-0.5 hidden group-open:inline">−</span>
                  </summary>
                  <p className="mt-3 text-[14px] leading-relaxed text-gray-600 max-w-[65ch]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-card-border">
            <div className="mx-auto max-w-[1180px] px-5 py-11">
              <h2 className="font-display text-[22px] font-bold text-dark tracking-[-0.02em]">Related searches</h2>
              <ul className="mt-4 flex flex-wrap gap-2.5">
                {related.map((r) => (
                  <li key={r.slug || 'index'}>
                    <Link
                      to={seoPath(adapter.urlPrefix, citySlug, r.slug)}
                      className="inline-block px-4 py-2 rounded-full border border-card-border text-[13px] text-dark hover:border-dark hover:bg-cream transition-colors"
                    >
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <LandingFooter />

      <SeoCompareTray
        rows={visible.filter((r) => compareIds.includes(r.id))}
        adapter={adapter}
        onRemove={(id) => setCompareIds((p) => p.filter((x) => x !== id))}
        onClear={() => setCompareIds([])}
      />
    </div>
  )
}

function VendorCard({ row, selected, onCompare, compareFull }: {
  row: SeoRow; selected: boolean; onCompare: () => void; compareFull: boolean
}) {
  return (
    <article className={`rounded-2xl border overflow-hidden bg-white transition-all ${selected ? 'border-magenta ring-2 ring-magenta/15' : 'border-card-border hover:border-dark/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'}`}>
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
        <button
          onClick={onCompare}
          disabled={compareFull}
          className={`mt-3.5 w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selected ? 'bg-dark text-white' : 'bg-empty-bg text-dark hover:bg-mustard-light'}`}
        >
          {selected ? '✓ Added to compare' : compareFull ? 'Compare list full' : 'Compare'}
        </button>
      </div>
    </article>
  )
}

function UnlockCta({ count, noun }: { count: number; noun: string }) {
  return (
    <aside className="mt-8 rounded-2xl bg-dark text-white px-6 py-7 text-center">
      <h2 className="font-display text-[24px] font-bold tracking-[-0.02em]">Names are hidden until you unlock</h2>
      <p className="mt-2 text-[14px] text-white/70 max-w-[52ch] mx-auto leading-relaxed">
        Compare all {count} {noun} on specs and price right here. Unlock to see who they are,
        get their numbers, book trials and hold a date.
      </p>
      <Link to="/app" className="inline-block mt-5 px-8 py-3.5 rounded-full bg-mustard text-white font-semibold text-[14px] hover:bg-mustard/90 transition-colors">
        Unlock vendor details
      </Link>
    </aside>
  )
}

function EmptyState({ adapter, loadFailed, hasPageRows, onReset }: {
  adapter: CategoryAdapter; loadFailed: boolean; hasPageRows: boolean; onReset: () => void
}) {
  return (
    <div className="py-16 text-center">
      <p className="text-[16px] font-semibold text-dark">
        {loadFailed ? `We couldn't load ${adapter.nounPlural} just now`
          : hasPageRows ? 'Nothing matches these filters'
          : `No ${adapter.nounPlural} listed for this search yet`}
      </p>
      <p className="mt-2 text-[13.5px] text-gray-500 max-w-[46ch] mx-auto leading-relaxed">
        {loadFailed ? 'Check your connection and refresh the page.'
          : hasPageRows ? 'Widen a filter — price and capacity rule out the most vendors.'
          : 'New vendors join weekly. Try one of the related searches below.'}
      </p>
      {hasPageRows && (
        <button onClick={onReset} className="mt-5 px-6 py-2.5 rounded-full border border-card-border text-[13px] font-medium text-dark hover:border-dark transition-colors">
          Reset filters
        </button>
      )}
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <LandingNav />
      <div className="flex-1 flex items-center justify-center px-5 text-center">
        <div>
          <p className="text-[17px] font-semibold text-dark">This search doesn't exist</p>
          <p className="mt-2 text-[13.5px] text-gray-500">The link may be out of date.</p>
          <Link to="/venues/hyderabad" className="inline-block mt-5 px-6 py-2.5 rounded-full bg-mustard text-white text-[13px] font-semibold">
            Browse Hyderabad venues
          </Link>
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Prerendered pages carry a build-stamped date; the client falls back to today. */
function lastUpdatedLabel(): string {
  const stamped = typeof document !== 'undefined'
    ? document.querySelector('meta[name="pk:last-updated"]')?.getAttribute('content')
    : null
  const d = stamped ? new Date(stamped) : new Date()
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}
