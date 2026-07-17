// ─────────────────────────────────────────────────────────────
// One-time backfill: resolve each already-onboarded venue's Google Maps link
// (venue_location.mapsLink) into coordinates and store them back into the
// venue_location jsonb as { lat, lng }.
//
// After the "distance from you" feature shipped, NEW/edited listings resolve
// their coordinates on save. This script covers venues onboarded BEFORE that —
// especially ones whose vendor pasted a short share link (maps.app.goo.gl),
// which the browser can't read without following the redirect.
//
// Full links (…/@lat,lng… , …!3d…!4d…) are parsed directly; short links are
// resolved by following the redirect (same logic as api/resolve-geo.js).
//
// USAGE (from the wedding-app-v2 folder):
//   SUPABASE_SERVICE_ROLE_KEY=<your service-role key> node scripts/backfill-venue-coords.mjs
//   …add --dry-run to preview without writing anything.
//
// The Supabase URL is read from .env (VITE_SUPABASE_URL) automatically; you
// only need to supply the SERVICE-ROLE key (Supabase → Project Settings → API).
// The service-role key bypasses RLS so the script can update every venue.
// Keep it secret — never commit it.
// ─────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')

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
  console.error('  Run:  SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/backfill-venue-coords.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ── Coordinate extraction (mirrors src/lib/geo.ts + api/resolve-geo.js) ──
const PAIR = '(-?\\d{1,3}(?:\\.\\d+)?)'
const PATTERNS = [
  new RegExp(`!3d${PAIR}!4d${PAIR}`),
  new RegExp(`[?&](?:q|query|ll|sll|destination|center)=${PAIR},${PAIR}`),
  new RegExp(`/@${PAIR},${PAIR}`),
  new RegExp(`/place/${PAIR},${PAIR}`),
]

function extractCoords(text) {
  if (!text) return null
  let decoded = text
  try { decoded = decodeURIComponent(text) } catch { /* keep raw */ }
  for (const re of PATTERNS) {
    const m = decoded.match(re)
    if (m) {
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      if (
        Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
        !(lat === 0 && lng === 0)
      ) return { lat, lng }
    }
  }
  return null
}

function isGoogleMapsHost(url) {
  try {
    const host = new URL(url).hostname
    return /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)$/i.test(host)
  } catch {
    return false
  }
}

// Returns { coords, via } — via is 'parsed' (from URL) or 'resolved' (followed redirect).
async function resolveLink(url) {
  const direct = extractCoords(url)
  if (direct) return { coords: direct, via: 'parsed' }

  if (!/^https?:\/\//i.test(url) || !isGoogleMapsHost(url)) return { coords: null, via: 'skipped' }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const resp = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      },
    })
    clearTimeout(timeout)
    const fromUrl = extractCoords(resp.url)
    if (fromUrl) return { coords: fromUrl, via: 'resolved' }
    const body = await resp.text()
    const fromBody = extractCoords(body)
    if (fromBody) return { coords: fromBody, via: 'resolved' }
    return { coords: null, via: 'unresolved' }
  } catch (err) {
    return { coords: null, via: 'error', error: String((err && err.message) || err) }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Fetch all venue listings (paginated) ──────────────────────
async function fetchAllVenues() {
  const pageSize = 1000
  let from = 0
  const all = []
  for (;;) {
    const { data, error } = await supabase
      .from('vendor_listings')
      .select('id, category, venue_location')
      .eq('category', 'Venue')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Fetch failed: ${error.message}`)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n📍 Venue coordinate backfill${DRY_RUN ? '  (DRY RUN — no writes)' : ''}\n`)

  const venues = await fetchAllVenues()
  console.log(`Scanning venue listings… ${venues.length} found\n`)

  const counts = { parsed: 0, resolved: 0, alreadyHad: 0, noLink: 0, unresolved: 0, error: 0, updated: 0 }

  for (const v of venues) {
    const loc = (v.venue_location && typeof v.venue_location === 'object') ? v.venue_location : {}

    if (loc.lat != null && loc.lng != null) { counts.alreadyHad++; continue }

    const link = (loc.mapsLink || '').trim()
    if (!link) { counts.noLink++; continue }

    const { coords, via, error } = await resolveLink(link)

    if (!coords) {
      if (via === 'error') { counts.error++; console.log(`  ✗ ${v.id}  error: ${error}`) }
      else { counts.unresolved++; console.log(`  — ${v.id}  no coords in link (${link.slice(0, 60)})`) }
      await sleep(150)
      continue
    }

    counts[via]++
    console.log(`  ✓ ${v.id}  ${via === 'parsed' ? 'parsed ' : 'resolved'}  → ${coords.lat}, ${coords.lng}`)

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from('vendor_listings')
        .update({ venue_location: { ...loc, lat: coords.lat, lng: coords.lng } })
        .eq('id', v.id)
      if (upErr) { counts.error++; console.log(`     ✗ update failed: ${upErr.message}`) }
      else counts.updated++
    }

    // Be polite to Google when following short-link redirects.
    if (via === 'resolved') await sleep(300)
  }

  console.log(`\n── Summary ─────────────────────────────`)
  console.log(`  full links parsed :  ${counts.parsed}`)
  console.log(`  short links resolved: ${counts.resolved}`)
  console.log(`  already had coords :  ${counts.alreadyHad}`)
  console.log(`  no/blank link      :  ${counts.noLink}`)
  console.log(`  link had no coords :  ${counts.unresolved}`)
  console.log(`  errors             :  ${counts.error}`)
  console.log(`  ${DRY_RUN ? 'would update' : 'venues updated'}    :  ${DRY_RUN ? counts.parsed + counts.resolved : counts.updated}`)
  console.log(`────────────────────────────────────────\n`)
}

main().catch((err) => {
  console.error('\n✗ Backfill failed:', err)
  process.exit(1)
})
