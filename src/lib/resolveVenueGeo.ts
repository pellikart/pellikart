// Resolve a vendor's pasted Google Maps link into coordinates.
// Full links are parsed instantly in the browser; short share links fall back
// to the serverless resolver (api/resolve-geo), which follows the redirect.
// Best-effort by design: callers should treat null as "no distance available"
// and never block a save on it.

import { parseCoordsFromMapLink, type LatLng } from './geo'

export async function resolveMapLinkCoords(mapsLink: string | undefined | null): Promise<LatLng | null> {
  if (!mapsLink || typeof mapsLink !== 'string') return null

  // 1. Full link — coordinates are in the URL. No network needed.
  const direct = parseCoordsFromMapLink(mapsLink)
  if (direct) return direct

  // 2. Short share link — ask the serverless resolver to follow the redirect.
  //    (Under `vite dev` there's no /api function, so this simply returns null.)
  try {
    const res = await fetch(`/api/resolve-geo?url=${encodeURIComponent(mapsLink)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (
      data && typeof data.lat === 'number' && typeof data.lng === 'number' &&
      data.lat >= -90 && data.lat <= 90 && data.lng >= -180 && data.lng <= 180
    ) {
      return { lat: data.lat, lng: data.lng }
    }
  } catch {
    // Offline, demo mode, or resolver unavailable — degrade to no coords.
  }
  return null
}
