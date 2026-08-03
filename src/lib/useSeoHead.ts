import { useEffect } from 'react'

/**
 * Per-route document head: title, description, canonical, OpenGraph, Twitter
 * and JSON-LD. Generic — not venue-specific — so any route can use it.
 *
 * Every tag it writes is stamped with data-seo-head so it can be removed again
 * on unmount, which keeps one route's metadata from leaking into the next in a
 * client-rendered SPA. Tags emitted by the prerenderer carry the same stamp, so
 * hydration replaces them cleanly instead of duplicating them.
 */

export const SITE_ORIGIN = 'https://www.pellikart.com'

export interface SeoHeadInput {
  title: string
  description: string
  /** Path only, e.g. "/venues/hyderabad/outdoor". Origin is added. */
  canonicalPath: string
  /** Absolute URL. Falls back to the site logo. */
  ogImage?: string
  ogType?: string
  /** JSON-LD blocks, serialised as-is. */
  jsonLd?: unknown[]
  /** Emit <meta name="robots" content="noindex"> — used for empty result sets. */
  noindex?: boolean
}

const STAMP = 'data-seo-head'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(STAMP, '')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function useSeoHead(input: SeoHeadInput) {
  const { title, description, canonicalPath, ogImage, ogType, jsonLd, noindex } = input
  const ld = JSON.stringify(jsonLd ?? [])

  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const url = `${SITE_ORIGIN}${canonicalPath}`
    const image = ogImage || `${SITE_ORIGIN}/logo.png`

    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:type', ogType || 'website')
    upsertMeta('property', 'og:image', image)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)
    if (noindex) upsertMeta('name', 'robots', 'noindex, follow')

    // Canonical — an SPA must rewrite this per route, never leave a stale one.
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      link.setAttribute(STAMP, '')
      document.head.appendChild(link)
    }
    link.href = url

    const scripts = (JSON.parse(ld) as unknown[]).map((block) => {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.setAttribute(STAMP, '')
      s.textContent = JSON.stringify(block)
      document.head.appendChild(s)
      return s
    })

    return () => {
      document.title = previousTitle
      scripts.forEach((s) => s.remove())
      const robots = document.head.querySelector(`meta[name="robots"][${STAMP}]`)
      robots?.remove()
    }
  }, [title, description, canonicalPath, ogImage, ogType, ld, noindex])
}

/* ------------------------------------------------------------------ *
 * JSON-LD builders — shared by the React template and the prerenderer so
 * a crawler sees identical structured data either way.
 * ------------------------------------------------------------------ */

export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE_ORIGIN}${t.path}`,
    })),
  }
}

export function faqLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/**
 * ItemList of the result set.
 *
 * PAYWALL: items are named by their anonymous public code, never the business
 * name — the same rule the cards follow. Structured data is public by
 * definition, so this is the one place a leak would be permanent.
 */
export function itemListLd(
  items: { label: string; price: number; facets?: Record<string, unknown> }[],
  pagePath: string,
  pageName: string,
  itemType = 'Service',
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: pageName,
    url: `${SITE_ORIGIN}${pagePath}`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((it, i) => {
      const capacity = it.facets?.capacityMax
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': itemType,
          name: it.label,
          ...(typeof capacity === 'number' && capacity > 0
            ? { maximumAttendeeCapacity: capacity } : {}),
          ...(it.price ? { priceRange: `From ₹${it.price.toLocaleString('en-IN')}` } : {}),
        },
      }
    }),
  }
}
