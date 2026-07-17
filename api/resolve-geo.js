// Vercel serverless function: resolve any Google Maps link → { lat, lng }.
//
// Full links (…/@lat,lng… or …!3d…!4d…) carry coordinates and are parsed in the
// browser already. This endpoint exists for SHORT share links
// (maps.app.goo.gl / goo.gl/maps): the coordinates only appear after following
// Google's redirect, which the browser can't do cross-origin. We follow it
// server-side, then extract coords from the resolved URL (or its HTML body).
//
// GET /api/resolve-geo?url=<encoded maps link>  →  { lat, lng } | { error }

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
      ) {
        return { lat, lng }
      }
    }
  }
  return null
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control', 'public, max-age=86400') // coords for a link don't change

  if (req.method === 'OPTIONS') { res.status(204).end(); return }

  const url = req.query && req.query.url
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'Missing or invalid url parameter' })
    return
  }
  // Only follow links to Google Maps to avoid being an open redirect-follower.
  if (!/(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)$/i.test(new URL(url).hostname)) {
    res.status(400).json({ error: 'Only Google Maps links are supported' })
    return
  }

  // Fast path: the link already carries coordinates.
  const direct = extractCoords(url)
  if (direct) { res.status(200).json(direct); return }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const resp = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // A desktop UA makes Google hand back a coordinate-bearing URL/body.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
      },
    })
    clearTimeout(timeout)

    // Try the final resolved URL first, then the HTML body as a fallback.
    const fromFinalUrl = extractCoords(resp.url)
    if (fromFinalUrl) { res.status(200).json(fromFinalUrl); return }

    const body = await resp.text()
    const fromBody = extractCoords(body)
    if (fromBody) { res.status(200).json(fromBody); return }

    res.status(404).json({ error: 'Could not extract coordinates from link' })
  } catch (err) {
    res.status(502).json({ error: 'Failed to resolve link', detail: String(err && err.message || err) })
  }
}
