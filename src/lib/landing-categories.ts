/**
 * The category icon strip shown under the hero on the landing page.
 *
 * `href` is the category's curated SEO city index (src/lib/seo/registry.ts).
 * The paths are written out rather than derived so the marketing bundle doesn't
 * pull in the whole registry; `landing-category-icons.test.ts` asserts every one
 * of them is a real curated route, so a renamed urlPrefix fails the suite rather
 * than quietly turning ten links into 404s.
 *
 * `category` is the database category name, and is what ties an entry back to
 * its adapter — it differs from `label` where the couple-facing word does
 * (Purohit / Pandit, Bhajantrilu / Banjantrilu).
 */
export interface LandingCategory {
  label: string
  category: string
  src: string
  href: string
}

export const CATEGORY_ICONS: LandingCategory[] = [
  { label: 'Venue', category: 'Venue', src: '/icons/categories/venue.webp', href: '/venues/hyderabad' },
  { label: 'Catering', category: 'Catering', src: '/icons/categories/catering.webp', href: '/caterers/hyderabad' },
  { label: 'Decor', category: 'Decor', src: '/icons/categories/decor.webp', href: '/decorators/hyderabad' },
  { label: 'Photography', category: 'Photography', src: '/icons/categories/photographer.webp', href: '/photographers/hyderabad' },
  { label: 'Makeup', category: 'Makeup', src: '/icons/categories/makeup.webp', href: '/makeup-artists/hyderabad' },
  { label: 'Mehendi', category: 'Mehendi', src: '/icons/categories/mehendi.webp', href: '/mehendi-artists/hyderabad' },
  { label: 'Purohit', category: 'Pandit', src: '/icons/categories/purohit.webp', href: '/pandits/hyderabad' },
  { label: 'Bhajantrilu', category: 'Banjantrilu', src: '/icons/categories/bhajantrilu.webp', href: '/wedding-bands/hyderabad' },
  { label: 'Hosts', category: 'Hosts / Entertainers', src: '/icons/categories/hosts.webp', href: '/wedding-entertainers/hyderabad' },
  { label: 'Live Stalls', category: 'Live Stalls', src: '/icons/categories/live-stalls.webp', href: '/live-stalls/hyderabad' },
]
