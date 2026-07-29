// DB-computed proximity matching.
//
// Calls the listings_near Postgres RPC (PostGIS) so distance is computed in the
// database — the same numbers web and mobile get, instead of each running its
// own haversine. Used to rank and annotate the couple's discovery feed by how
// far each venue is from their home location.
//
// Returns [] when Supabase isn't configured (demo / web preview) so callers
// degrade gracefully to their existing, non-spatial ordering.

import { supabase } from '@/lib/supabase.native'

export interface NearbyListing {
  id: string
  vendor_id: string
  category: string
  price: number
  distance_km: number
}

export async function fetchNearbyListings(params: {
  lat: number
  lng: number
  category?: string
  radiusKm?: number
  maxPrice?: number
}): Promise<NearbyListing[]> {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('listings_near', {
    p_lat: params.lat,
    p_lng: params.lng,
    p_category: params.category ?? null,
    p_radius_km: params.radiusKm ?? 100,
    p_max_price: params.maxPrice ?? null,
  })
  if (error) {
    console.warn('[matching] listings_near failed:', error.message)
    return []
  }
  return (data ?? []) as NearbyListing[]
}
