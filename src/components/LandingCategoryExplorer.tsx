import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LIVE_CATEGORY_ICONS, type LandingCategory } from '@/lib/landing-categories'
import { fetchAllLiveVendors, fetchAllListings, fetchAllAvailability } from '@/lib/supabase-db'
import { buildLiveVendorMap, useStore } from '@/lib/store'
import { adapterByCategory } from '@/lib/seo/adapters'
import { collapseFanOut, sortRows, usefulSpecKeys, type SeoRow } from '@/lib/seo/types'
import SeoVendorCard from '@/components/SeoVendorCard'
import type { Vendor } from '@/lib/types'

/** The full listing sheet is ~1900 lines and only opens on click — keep it out
 *  of the landing bundle until someone actually asks for a vendor. */
const ListingDetailSheet = lazy(() => import('@/components/ListingDetailSheet'))

/** Cards per page. Every listing in a category is reachable from here; this
 *  only bounds how many images the browser paints at once. */
const PAGE_SIZE = 12

/** Spelled-out counts for the heading, so it can never contradict the strip. */
const COUNT_WORDS = [
  'No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
]

/**
 * The category strip under the hero, and the listings for whichever category is
 * selected — all inline, no navigation.
 *
 * The icons are still real links to each category's curated SEO page: crawlers
 * (and anyone middle-clicking) follow them, while a plain left click is
 * intercepted and switches the panel instead. Losing those ten internal links
 * would cost the SEO pages their only route in from the homepage.
 *
 * Clicking a vendor opens the app's own ListingDetailSheet with `unlocked=false`,
 * so a couple sees the entire listing — pricing, packages, specs, gallery — with
 * the business name replaced by its public code and the contact block withheld.
 */
export default function LandingCategoryExplorer() {
  const [active, setActive] = useState<LandingCategory>(LIVE_CATEGORY_ICONS[0])
  const [page, setPage] = useState(1)
  const [vendors, setVendors] = useState<Record<string, Vendor> | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // One fetch for every category; switching tabs is then instant.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [liveVendors, listings, availability] = await Promise.all([
          fetchAllLiveVendors(), fetchAllListings(), fetchAllAvailability(),
        ])
        if (cancelled) return
        const { vendorMap, lvMap } = buildLiveVendorMap(
          liveVendors as Record<string, unknown>[],
          listings as Record<string, unknown>[],
          availability as Record<string, unknown>[],
        )
        // ListingDetailSheet resolves siblings and packages through the store.
        // Not live mode — no DB writes, and board actions are gated on the
        // ritual/category ids we deliberately don't pass.
        useStore.setState({ vendors: vendorMap, _listingVendorMap: lvMap, _liveMode: false })
        setVendors(vendorMap)
      } catch {
        if (!cancelled) { setLoadFailed(true); setVendors({}) }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const adapter = adapterByCategory(active.category)

  const rows: SeoRow[] | null = useMemo(() => {
    if (!vendors || !adapter) return null
    return sortRows(
      collapseFanOut(
        Object.values(vendors).filter((v) => v.category === adapter.category).map(adapter.toRow),
      ),
      'price-asc',
    )
  }, [vendors, adapter])

  const total = rows?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Guards the window against a stale page number in the render right after a
  // category switch, before the effect below resets it.
  const current = Math.min(page, pageCount)
  const shown = rows?.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) ?? []
  // Judge coverage on the whole category, not just the page on screen, so the
  // columns don't shift as you move between pages.
  const specKeys = useMemo(() => usefulSpecKeys(rows ?? []), [rows])
  const loading = rows === null
  const detailVendor = detailId && vendors ? vendors[detailId] : null

  function choose(cat: LandingCategory, el: HTMLElement) {
    setActive(cat)
    setPage(1)
    // On mobile the strip scrolls — bring the tapped icon fully into view.
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  function goToPage(next: number) {
    setPage(next)
    // Land at the top of the results rather than mid-grid.
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="py-16 px-6 bg-white border-y border-card-border">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[2px] text-mustard mb-3">
          EVERYTHING YOU NEED
        </p>
        <h2 className="font-serif text-center text-[28px] md:text-[34px] font-bold text-dark leading-tight mb-10">
          {COUNT_WORDS[LIVE_CATEGORY_ICONS.length] ?? LIVE_CATEGORY_ICONS.length} categories. One wedding board.
        </h2>

        {/* Equal gap between every icon at every breakpoint: a scrollable row on
            mobile, then a centred wrapping row. Fixed-width items rather than a
            fixed column count, so the spacing stays even however many
            categories are live (ten still fit on one desktop row).
            scroll-pl-6 keeps the snap points inside the padding, otherwise the
            first tile snaps flush against the viewport edge. */}
        <ul className="no-scrollbar flex overflow-x-auto snap-x scroll-pl-6 -mx-6 px-6 pb-2 gap-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap sm:justify-center sm:gap-x-3 sm:gap-y-7 md:gap-x-4">
          {LIVE_CATEGORY_ICONS.map((cat) => {
            const isActive = cat.label === active.label
            return (
              <li key={cat.label} className="w-[88px] shrink-0 snap-start sm:w-[96px]">
                <a
                  href={cat.href}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={(e) => {
                    // Let modified clicks (new tab, new window) reach the real page.
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                    e.preventDefault()
                    choose(cat, e.currentTarget)
                  }}
                  className="group flex flex-col items-center text-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-4"
                >
                  <img
                    src={cat.src}
                    alt=""
                    width={256}
                    height={256}
                    loading="lazy"
                    decoding="async"
                    className={`w-full max-w-[104px] aspect-square rounded-2xl object-cover transition-all duration-200 ${
                      isActive
                        ? 'scale-110 shadow-lg ring-2 ring-magenta ring-offset-2'
                        : 'opacity-60 shadow-sm group-hover:opacity-100 group-hover:shadow-md group-hover:-translate-y-0.5'
                    }`}
                  />
                  <span className={`mt-2.5 text-[12px] leading-tight transition-colors ${
                    isActive ? 'font-bold text-magenta' : 'font-semibold text-dark group-hover:text-magenta'
                  }`}>
                    {cat.label}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>

        {/* ── Results for the selected category ── */}
        <div ref={panelRef} className="mt-12 pt-10 border-t border-card-border">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-6">
            <h3 aria-live="polite" className="font-serif text-[24px] md:text-[28px] font-bold text-dark">
              {adapter ? cap(adapter.nounPlural) : active.label} in Hyderabad
            </h3>
            {!loading && pageCount > 1 && (
              <p className="text-[13px] text-gray-400">Page {current} of {pageCount}</p>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-card-border overflow-hidden animate-pulse">
                  <div className="h-44 bg-empty-bg" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-1/3 bg-empty-bg rounded" />
                    <div className="h-3 w-2/3 bg-empty-bg rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[15px] font-semibold text-dark">
                {loadFailed
                  ? "We couldn't load these just now"
                  : `No ${adapter?.nounPlural ?? active.label} listed yet`}
              </p>
              <p className="mt-2 text-[13.5px] text-gray-500">
                {loadFailed ? 'Check your connection and refresh the page.' : 'New vendors join every week.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((r) => (
                  <SeoVendorCard key={r.id} row={r} specKeys={specKeys} onOpen={() => setDetailId(r.id)} />
                ))}
              </div>
              {pageCount > 1 && (
                <nav aria-label={`${adapter?.nounPlural ?? active.label} pages`} className="mt-8 flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => goToPage(current - 1)}
                    disabled={current === 1}
                    className="px-3 py-2 rounded-lg text-[13px] font-medium text-dark border border-card-border hover:border-dark disabled:opacity-35 disabled:hover:border-card-border transition-colors"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={n === current ? 'page' : undefined}
                      className={`min-w-[36px] px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                        n === current
                          ? 'bg-magenta text-white'
                          : 'text-dark border border-card-border hover:border-dark'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => goToPage(current + 1)}
                    disabled={current === pageCount}
                    className="px-3 py-2 rounded-lg text-[13px] font-medium text-dark border border-card-border hover:border-dark disabled:opacity-35 disabled:hover:border-card-border transition-colors"
                  >
                    Next →
                  </button>
                </nav>
              )}

              <p className="mt-6 text-center text-[13px] text-gray-500">
                Names and contact details stay hidden until you unlock.{' '}
                <Link to={active.href} className="font-semibold text-magenta hover:underline">
                  Filter and compare {adapter?.nounPlural ?? active.label} →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Full listing, anonymised: no name, no contact block, no board actions. */}
      {detailVendor && (
        <Suspense fallback={null}>
          <ListingDetailSheet
            vendor={detailVendor}
            unlocked={false}
            publicPreview
            onClose={() => setDetailId(null)}
          />
        </Suspense>
      )}
    </section>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
