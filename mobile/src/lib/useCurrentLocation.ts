// "Use current location" for onboarding — the native counterpart of the web
// app's detectLocation (OnboardingPage). It captures exact coordinates, which
// feed the "X km away" venue badge, and reverse-geocodes them to a readable
// locality label for area-based matching.
//
// The web uses navigator.geolocation + a free bigdatacloud reverse-geocode
// endpoint. Here expo-location provides both the fix and the reverse geocode
// (no network round-trip, no API key), so the label comes from the OS.

import { useState } from 'react'
import * as Location from 'expo-location'

export interface LocationResult {
  label: string
  lat: number
  lng: number
}

export function useCurrentLocation() {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function detect(): Promise<LocationResult | null> {
    setError(null)
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission denied — please type it in.')
        return null
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const { latitude, longitude } = pos.coords

      // Reverse geocode to a human label. Best-effort: coordinates are what
      // actually matter for distance, so a failure here still returns the fix
      // with a lat/lng fallback label.
      let label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude })
        const p = places[0]
        if (p) {
          const parts = [p.district || p.subregion, p.city || p.region].filter(Boolean)
          const deduped = [...new Set(parts)].slice(0, 2)
          if (deduped.length) label = deduped.join(', ')
        }
      } catch {
        /* keep the coordinate label */
      }

      return { label, lat: latitude, lng: longitude }
    } catch {
      setError("Couldn't get your location — please type it in.")
      return null
    } finally {
      setLocating(false)
    }
  }

  return { detect, locating, error, setError }
}
