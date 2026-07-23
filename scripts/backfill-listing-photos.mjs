// ─────────────────────────────────────────────────────────────
// One-time cleanup: APPEND every vendor's PORTFOLIO photos onto ALL of their
// LISTINGS — unconditionally, whether or not the listing already has photos.
//
// Many vendors (makeup artists especially) were onboarded with photos in the
// vendor-profile portfolio section but not on the listing itself, so the card
// couples see is empty or thin. This makes sure every portfolio photo also
// shows up on the listing.
//
// The one safeguard: a portfolio photo already present on the listing (same
// URL) is NOT appended again, so vendors who put the same image in both places
// don't get visible duplicates. Existing listing photos and the existing cover
// photo are preserved; new photos are added at the end.
//
// SAFE BY DEFAULT: runs as a DRY RUN (report only, no writes). Add --apply
// to actually write. Add --category=Makeup to limit to one category.
//
// USAGE (from the wedding-app-v2 folder):
//   # 1. Preview — see exactly what would change, no writes:
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/backfill-listing-photos.mjs
//   # 2. Limit to makeup artists only (optional):
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/backfill-listing-photos.mjs --category=Makeup
//   # 3. Apply for real:
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/backfill-listing-photos.mjs --apply
//
// The Supabase URL is read from .env (VITE_SUPABASE_URL) automatically; you
// only supply the SERVICE-ROLE key (Supabase → Project Settings → API →
// service_role). It bypasses RLS so the script can update every vendor's
// listings. Keep it secret — never commit it.
// ─────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const categoryArg = process.argv.find((a) => a.startsWith('--category='))
const ONLY_CATEGORY = categoryArg ? categoryArg.slice('--category='.length) : null

// ── Load config ───────────────────────────────────────────────
function readEnvFile() {
  try {
    const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
    const env = {}
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    return env
  } catch {
    return {}
  }
}

const fileEnv = readEnvFile()
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL) {
  console.error('✗ Missing Supabase URL. Set VITE_SUPABASE_URL in .env or pass SUPABASE_URL=…')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error('✗ Missing SUPABASE_SERVICE_ROLE_KEY. Get it from Supabase → Project Settings → API → service_role.')
  console.error('  Run:  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/backfill-listing-photos.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const isNonEmptyArray = (v) => Array.isArray(v) && v.length > 0
const asArray = (v) => (Array.isArray(v) ? v : [])

// ── Paginated fetch helper ────────────────────────────────────
async function fetchAll(table, columns, tweak) {
  const pageSize = 1000
  let from = 0
  const all = []
  for (;;) {
    let q = supabase.from(table).select(columns).range(from, from + pageSize - 1)
    if (tweak) q = tweak(q)
    const { data, error } = await q
    if (error) throw new Error(`Fetch ${table} failed: ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n🖼  Portfolio → listing photo backfill${APPLY ? '  (APPLY — writing changes)' : '  (DRY RUN — no writes)'}`)
  if (ONLY_CATEGORY) console.log(`   Restricted to category: ${ONLY_CATEGORY}`)
  console.log('')

  // Vendors with portfolio photos (optionally filtered by category).
  const vendors = await fetchAll('vendors', 'id, business_name, category, portfolio_photos, is_live', (q) =>
    ONLY_CATEGORY ? q.eq('category', ONLY_CATEGORY) : q
  )
  const withPortfolio = vendors.filter((v) => isNonEmptyArray(v.portfolio_photos))
  console.log(`Vendors scanned: ${vendors.length}  |  with portfolio photos: ${withPortfolio.length}\n`)

  // All listings, grouped by vendor.
  const listings = await fetchAll('vendor_listings', 'id, vendor_id, name, category, photos, cover_photo_index')
  const byVendor = new Map()
  for (const l of listings) {
    if (!byVendor.has(l.vendor_id)) byVendor.set(l.vendor_id, [])
    byVendor.get(l.vendor_id).push(l)
  }

  const plan = []            // listings to update: { listing, vendor, newPhotos, added }
  const noListingVendors = [] // portfolio photos but zero listings — can't attach here
  const catCounts = {}       // category → listings updated
  let totalAdded = 0

  for (const v of withPortfolio) {
    const vListings = byVendor.get(v.id) || []
    if (vListings.length === 0) {
      noListingVendors.push(v)
      continue
    }
    for (const l of vListings) {
      const existing = asArray(l.photos)
      const have = new Set(existing)
      // Append portfolio photos not already on the listing (dedupe by URL).
      const toAdd = v.portfolio_photos.filter((p) => typeof p === 'string' && !have.has(p))
      if (toAdd.length === 0) continue
      plan.push({ listing: l, vendor: v, newPhotos: [...existing, ...toAdd], added: toAdd.length })
    }
  }

  // ── Report ──
  if (plan.length === 0) {
    console.log('✓ Nothing to append — every listing already contains its vendor’s portfolio photos.')
  } else {
    console.log(`Listings to update (${plan.length}):\n`)
    for (const { listing, vendor, added, newPhotos } of plan) {
      const cat = vendor.category || '—'
      catCounts[cat] = (catCounts[cat] || 0) + 1
      totalAdded += added
      const before = asArray(listing.photos).length
      console.log(
        `  ${APPLY ? '✎' : '•'} ${vendor.business_name || '(no name)'}  [${cat}]` +
        `  listing "${listing.name || 'untitled'}"  ${before} → ${newPhotos.length} photos  (+${added})`
      )
    }
    console.log(`\n  ${totalAdded} photo(s) appended across ${plan.length} listing(s)`)
    console.log('  by category:')
    for (const [cat, n] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${cat.padEnd(18)} ${n} listing(s)`)
    }
  }

  if (noListingVendors.length > 0) {
    console.log(`\n⚠  ${noListingVendors.length} vendor(s) have portfolio photos but NO listing at all`)
    console.log('   (a listing must exist before photos can be attached — these are not touched):')
    for (const v of noListingVendors) {
      console.log(`     – ${v.business_name || '(no name)'}  [${v.category || '—'}]  is_live=${v.is_live}`)
    }
  }

  // ── Apply ──
  if (APPLY && plan.length > 0) {
    console.log(`\nWriting ${plan.length} listing update(s)…\n`)
    let ok = 0
    let failed = 0
    for (const { listing, vendor, newPhotos } of plan) {
      // Keep the existing cover if the listing already had photos; otherwise
      // default to the first (first appended portfolio photo).
      const hadPhotos = asArray(listing.photos).length > 0
      const update = { photos: newPhotos }
      if (!hadPhotos) update.cover_photo_index = 0
      const { error } = await supabase.from('vendor_listings').update(update).eq('id', listing.id)
      if (error) {
        failed++
        console.log(`  ✗ ${listing.id} (${vendor.business_name}): ${error.message}`)
      } else {
        ok++
      }
    }
    console.log(`\n✓ Updated ${ok} listing(s)` + (failed ? `,  ✗ ${failed} failed` : ''))
  }

  console.log(`\n── Summary ─────────────────────────────`)
  console.log(`  vendors with portfolio photos :  ${withPortfolio.length}`)
  console.log(`  listings ${APPLY ? 'updated      ' : 'to update    '} :  ${plan.length}`)
  console.log(`  photos ${APPLY ? 'appended     ' : 'to append    '}   :  ${totalAdded}`)
  console.log(`  vendors w/ portfolio, no listing: ${noListingVendors.length}`)
  if (!APPLY && plan.length > 0) console.log(`\n  Re-run with --apply to write these changes.`)
  console.log(`────────────────────────────────────────\n`)
}

main().catch((err) => {
  console.error('\n✗ Backfill failed:', err)
  process.exit(1)
})
