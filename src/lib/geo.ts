// ─── GEO / DISTANCE ─────────────────────────
// Turns a vendor's pasted Google Maps link into coordinates and measures how
// far a venue is from the couple. Two moving parts:
//   1. parseCoordsFromMapLink — pulls lat/lng straight out of a *full* maps URL
//      (works in the browser, no network). Short "share" links (maps.app.goo.gl)
//      have no coords in them — those are resolved server-side (see api/resolve-geo).
//   2. haversineKm / formatDistance — the actual distance calculator + label.

export interface LatLng {
  lat: number
  lng: number
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    // 0,0 is almost always a parse artifact, not a real Hyderabad venue.
    !(lat === 0 && lng === 0)
  )
}

/**
 * Extract coordinates from a Google Maps URL. Handles the common shapes:
 *   - .../@17.4485,78.3908,17z/...        (map center)
 *   - ...!3d17.4485!4d78.3908...          (exact place pin — most accurate)
 *   - ?q=17.4485,78.3908 / &query= / &ll= / &destination= / &center=
 *   - /place/17.4485,78.3908
 * Returns null for short share links or address-only queries (no coords in URL).
 */
export function parseCoordsFromMapLink(url: string | undefined | null): LatLng | null {
  if (!url || typeof url !== 'string') return null

  let decoded = url
  try { decoded = decodeURIComponent(url) } catch { /* keep raw on malformed escapes */ }

  const pair = '(-?\\d{1,3}(?:\\.\\d+)?)'
  // Ordered most-accurate first: the !3d!4d place pin beats the @ viewport center.
  const patterns: RegExp[] = [
    new RegExp(`!3d${pair}!4d${pair}`),
    new RegExp(`[?&](?:q|query|ll|sll|destination|center)=${pair},${pair}`),
    new RegExp(`/@${pair},${pair}`),
    new RegExp(`/place/${pair},${pair}`),
  ]

  for (const re of patterns) {
    const m = decoded.match(re)
    if (m) {
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      if (isValidLatLng(lat, lng)) return { lat, lng }
    }
  }
  return null
}

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Human label for a distance, e.g. "250 m away", "3.4 km away", "12 km away".
 * Kept deliberately approximate — straight-line distance, not driving distance.
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return ''
  if (km < 1) {
    const m = Math.round(km * 1000 / 50) * 50 // nearest 50 m
    return `${Math.max(m, 50)} m away`
  }
  if (km < 10) return `${km.toFixed(1).replace(/\.0$/, '')} km away`
  return `${Math.round(km)} km away`
}

/** Convenience: distance label between two points, or '' if either is missing. */
export function distanceLabel(from: LatLng | null | undefined, to: LatLng | null | undefined): string {
  if (!from || !to) return ''
  return formatDistance(haversineKm(from, to))
}
