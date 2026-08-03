import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { SeoLandingBody } from '@/pages/SeoLandingPage'
import { fetchAllLiveVendors, fetchAllListings, fetchAllAvailability } from '@/lib/supabase-db'
import { buildLiveVendorMap } from '@/lib/store'
import { allSeoRoutes, seoPath } from '@/lib/seo/registry'
import { ADAPTERS, adapterByCategory } from '@/lib/seo/adapters'
import { isIndexable, computeStats, type SeoRow } from '@/lib/seo/types'
import { breadcrumbLd, faqLd, itemListLd, SITE_ORIGIN } from '@/lib/useSeoHead'
import type { Vendor } from '@/lib/types'

/**
 * Build-time prerenderer for every curated SEO landing page.
 *
 * The app is a client-rendered SPA, so a crawler would otherwise get an empty
 * #root. This server-renders the real page component and writes static HTML to
 * dist/<prefix>/<city>/<slug>/index.html, which Vercel serves ahead of the SPA
 * rewrite. React then mounts over it.
 *
 * It also decides indexability: a page that hasn't cleared its result threshold
 * is written with noindex and kept out of the sitemap. That is the curated-not-
 * programmatic rule enforced mechanically rather than by good intentions.
 */

const DIST = join(process.cwd(), 'dist')

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

/** JSON-LD is injected into HTML, so neutralise any embedded tag close. */
const safeJsonLd = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

function buildHead(i: {
  title: string; description: string; canonicalPath: string
  jsonLd: unknown[]; noindex: boolean; lastUpdated: string
}): string {
  const url = `${SITE_ORIGIN}${i.canonicalPath}`
  const img = `${SITE_ORIGIN}/logo.png`
  return [
    `<title>${escapeHtml(i.title)}</title>`,
    `<meta name="description" content="${escapeHtml(i.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    i.noindex ? `<meta name="robots" content="noindex, follow" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(i.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(i.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:site_name" content="Pellikart" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(i.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(i.description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    `<meta name="pk:last-updated" content="${i.lastUpdated}" />`,
    ...i.jsonLd.map((b) => `<script type="application/ld+json">${safeJsonLd(b)}</script>`),
  ].filter(Boolean).join('\n    ')
}

async function loadRowsByCategory(): Promise<Record<string, SeoRow[]>> {
  const [liveVendors, listings, availability] = await Promise.all([
    fetchAllLiveVendors(), fetchAllListings(), fetchAllAvailability(),
  ])
  if (!liveVendors || !listings) {
    throw new Error('Supabase returned no data — refusing to prerender empty pages.')
  }
  const { vendorMap } = buildLiveVendorMap(
    liveVendors as Record<string, unknown>[],
    listings as Record<string, unknown>[],
    (availability || []) as Record<string, unknown>[],
  )
  const all = Object.values(vendorMap) as Vendor[]
  const out: Record<string, SeoRow[]> = {}
  for (const a of ADAPTERS) {
    out[a.category] = all.filter((v) => v.category === a.category).map(a.toRow)
  }
  return out
}

async function main() {
  let shell: string
  try {
    shell = readFileSync(join(DIST, 'index.html'), 'utf8')
  } catch {
    console.warn('[prerender] dist/index.html missing — run `vite build` first. Skipping.')
    return
  }

  let byCategory: Record<string, SeoRow[]>
  try {
    byCategory = await loadRowsByCategory()
  } catch (err) {
    console.warn(`[prerender] skipped — ${(err as Error).message}`)
    console.warn('[prerender] landing pages will still work client-side.')
    return
  }

  const lastUpdated = new Date().toISOString().slice(0, 10)
  const indexed: string[] = []
  const skipped: { path: string; count: number }[] = []

  for (const { city, page, urlPrefix, path } of allSeoRoutes()) {
    const adapter = adapterByCategory(page.category)!
    const rows = byCategory[page.category] ?? []
    const pageRows = rows.filter(page.match)
    const stats = computeStats(pageRows)
    const faqs = page.faqs(stats, city.name)
    const indexable = isIndexable(page, pageRows.length)

    const trail = [
      { name: 'Pellikart', path: '/' },
      { name: `${adapter.nounPlural} in ${city.name}`, path: seoPath(urlPrefix, city.slug, '') },
      ...(page.slug ? [{ name: page.label, path }] : []),
    ]

    const body = renderToString(
      <StaticRouter location={path}>
        <SeoLandingBody
          city={city.name} citySlug={city.slug} adapter={adapter} page={page}
          allRows={rows} loadFailed={false}
        />
      </StaticRouter>,
    )

    const head = buildHead({
      title: page.title,
      description: page.description,
      canonicalPath: path,
      noindex: !indexable,
      lastUpdated,
      jsonLd: [
        breadcrumbLd(trail),
        faqLd(faqs),
        ...(pageRows.length ? [itemListLd(pageRows, path, page.h1, adapter.schemaType)] : []),
      ],
    })

    const html = shell
      .replace(/<title>[\s\S]*?<\/title>/, head)
      .replace(/<meta name="description"[^>]*>/, '')
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`)

    const out = join(DIST, path.replace(/^\//, ''), 'index.html')
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html)

    if (indexable) indexed.push(path)
    else skipped.push({ path, count: pageRows.length })
  }

  writeSitemapEntries(indexed, lastUpdated)

  console.log(`[prerender] ${indexed.length + skipped.length} pages written.`)
  console.log(`[prerender] ${indexed.length} indexable, in the sitemap.`)
  if (skipped.length) {
    console.log(`[prerender] ${skipped.length} below the result threshold — noindex, excluded from sitemap:`)
    for (const s of skipped) console.log(`             ${s.path}  (${s.count} results)`)
  }
}

/**
 * Only indexable pages enter the sitemap. gen-sitemap.mjs can't produce these —
 * the slugs are computed in the registry, and indexability depends on live data
 * that only exists at build time.
 */
function writeSitemapEntries(paths: string[], lastmod: string) {
  const file = join(DIST, 'sitemap.xml')
  let xml: string
  try {
    xml = readFileSync(file, 'utf8')
  } catch {
    console.warn('[prerender] dist/sitemap.xml missing — landing-page URLs not added.')
    return
  }
  if (!paths.length) return
  const entries = paths.map((p) => `  <url>
    <loc>${SITE_ORIGIN}${p}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.split('/').filter(Boolean).length > 2 ? '0.8' : '0.9'}</priority>
  </url>`).join('\n')
  writeFileSync(file, xml.replace('</urlset>', `${entries}\n</urlset>`))
}

main().catch((err) => {
  console.error('[prerender] failed:', err)
  process.exit(1)
})
