import { describe, it, expect } from 'vitest'
import { parseCoordsFromMapLink, haversineKm, formatDistance, distanceLabel } from '@/lib/geo'

describe('parseCoordsFromMapLink', () => {
  it('parses the @lat,lng viewport form', () => {
    const c = parseCoordsFromMapLink('https://www.google.com/maps/place/Taj/@17.4485,78.3908,17z/data=x')
    expect(c).toEqual({ lat: 17.4485, lng: 78.3908 })
  })

  it('prefers the !3d!4d place pin over the @ center', () => {
    const c = parseCoordsFromMapLink('https://www.google.com/maps/place/X/@17.40,78.40,17z/data=!3d17.4485!4d78.3908')
    expect(c).toEqual({ lat: 17.4485, lng: 78.3908 })
  })

  it('parses the ?q=lat,lng query form', () => {
    expect(parseCoordsFromMapLink('https://maps.google.com/?q=17.4485,78.3908')).toEqual({ lat: 17.4485, lng: 78.3908 })
  })

  it('parses ll= and destination= forms', () => {
    expect(parseCoordsFromMapLink('https://maps.google.com/?ll=17.4485,78.3908&z=15')).toEqual({ lat: 17.4485, lng: 78.3908 })
    expect(parseCoordsFromMapLink('https://www.google.com/maps/dir/?api=1&destination=17.4485,78.3908')).toEqual({ lat: 17.4485, lng: 78.3908 })
  })

  it('returns null for short share links (no coords in URL)', () => {
    expect(parseCoordsFromMapLink('https://maps.app.goo.gl/AbCdEf123')).toBeNull()
    expect(parseCoordsFromMapLink('https://goo.gl/maps/XyZ')).toBeNull()
  })

  it('returns null for address-only queries and junk', () => {
    expect(parseCoordsFromMapLink('https://maps.google.com/?q=Taj+Krishna+Hyderabad')).toBeNull()
    expect(parseCoordsFromMapLink('')).toBeNull()
    expect(parseCoordsFromMapLink(undefined)).toBeNull()
  })

  it('rejects out-of-range and 0,0 coordinates', () => {
    expect(parseCoordsFromMapLink('https://maps.google.com/?q=0,0')).toBeNull()
    expect(parseCoordsFromMapLink('https://maps.google.com/?q=200,400')).toBeNull()
  })
})

describe('haversineKm', () => {
  it('is ~0 for the same point', () => {
    expect(haversineKm({ lat: 17.44, lng: 78.39 }, { lat: 17.44, lng: 78.39 })).toBeCloseTo(0, 5)
  })

  it('measures a known Hyderabad distance (Hitech City → Secunderabad ≈ 13-16 km)', () => {
    const d = haversineKm({ lat: 17.4435, lng: 78.3772 }, { lat: 17.4399, lng: 78.4983 })
    expect(d).toBeGreaterThan(11)
    expect(d).toBeLessThan(16)
  })
})

describe('formatDistance', () => {
  it('shows metres under 1 km', () => {
    expect(formatDistance(0.25)).toBe('250 m away')
  })
  it('shows one decimal between 1 and 10 km', () => {
    expect(formatDistance(3.42)).toBe('3.4 km away')
    expect(formatDistance(2.0)).toBe('2 km away')
  })
  it('rounds to whole km past 10 km', () => {
    expect(formatDistance(12.6)).toBe('13 km away')
  })
})

describe('distanceLabel', () => {
  it('returns empty string when either point is missing', () => {
    expect(distanceLabel(null, { lat: 1, lng: 1 })).toBe('')
    expect(distanceLabel({ lat: 1, lng: 1 }, undefined)).toBe('')
  })
})
