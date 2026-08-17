import { describe, it, expect } from 'vitest'
import { CATEGORY_ICONS, LIVE_CATEGORY_ICONS } from '@/lib/landing-categories'
import { allSeoRoutes, seoPath } from '@/lib/seo/registry'
import { adapterByCategory } from '@/lib/seo/adapters'

/**
 * The landing page's category strip writes its hrefs out as literals so the
 * marketing bundle doesn't have to import the whole SEO registry. That trade
 * is only safe if something checks the literals — a renamed urlPrefix would
 * otherwise turn ten landing-page links into 404s silently.
 */
describe('landing page category icons', () => {
  it('links every icon to a real curated route', () => {
    const routes = new Set(allSeoRoutes().map((r) => r.path))
    for (const cat of CATEGORY_ICONS) {
      expect(routes, `${cat.label} → ${cat.href}`).toContain(cat.href)
    }
  })

  it('points each icon at its own category index', () => {
    for (const cat of CATEGORY_ICONS) {
      const adapter = adapterByCategory(cat.category)
      expect(adapter, `no adapter for category "${cat.category}"`).toBeDefined()
      expect(cat.href).toBe(seoPath(adapter!.urlPrefix, 'hyderabad', ''))
    }
  })

  it('keeps paused categories out of the strip but still routable', () => {
    // Paused entries stay in CATEGORY_ICONS so their href keeps being checked
    // above — restoring one is a matter of dropping the flag.
    expect(LIVE_CATEGORY_ICONS.length).toBeGreaterThan(0)
    expect(LIVE_CATEGORY_ICONS.every((c) => !c.paused)).toBe(true)
    expect(LIVE_CATEGORY_ICONS).toEqual(CATEGORY_ICONS.filter((c) => !c.paused))
  })

  it('has a distinct icon, label and destination per entry', () => {
    const unique = (xs: string[]) => new Set(xs).size === xs.length
    expect(unique(CATEGORY_ICONS.map((c) => c.href))).toBe(true)
    expect(unique(CATEGORY_ICONS.map((c) => c.label))).toBe(true)
    expect(unique(CATEGORY_ICONS.map((c) => c.src))).toBe(true)
  })
})
