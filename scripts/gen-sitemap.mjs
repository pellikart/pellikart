/**
 * Regenerates public/sitemap.xml from the article registry.
 *
 * The site is a client-rendered SPA, so Google has no crawlable <a> trail to the
 * article pages until it renders JS. The sitemap is the reliable discovery path.
 * Run this after adding an article:  node scripts/gen-sitemap.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://www.pellikart.com'

const registry = readFileSync(join(root, 'src/lib/articles.tsx'), 'utf8')
const slugs = [...registry.matchAll(/^\s*slug: '([^']+)',$/gm)].map((m) => m[1])
if (slugs.length === 0) throw new Error('No article slugs found in src/lib/articles.tsx')

const today = new Date().toISOString().slice(0, 10)
const urls = [
  { loc: `${ORIGIN}/`, priority: '1.0', changefreq: 'weekly' },
  { loc: `${ORIGIN}/articles`, priority: '0.8', changefreq: 'weekly' },
  ...slugs.map((s) => ({ loc: `${ORIGIN}/articles/${s}`, priority: '0.7', changefreq: 'monthly' })),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(root, 'public/sitemap.xml'), xml)
console.log(`sitemap.xml written — ${urls.length} URLs (${slugs.length} articles)`)
