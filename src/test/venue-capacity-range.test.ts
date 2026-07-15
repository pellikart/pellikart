import { describe, it, expect } from 'vitest'
import { getListingConfig } from '@/lib/vendor-category-config'
import { parseGuestBucket, parseCapacityRange, venueFitsGuestBucket } from '@/lib/helpers'

// ── Venue guest-capacity range ──────────────────────────────────────────────
// The venue listing captures capacity as a min–max range (stored as [min, max]
// in categoryFields) so couples whose guest count lands inside it can be
// matched to the venue.

function capacityField() {
  const cfg = getListingConfig('Venue')
  for (const step of cfg!.steps) {
    const f = step.fields.find(f => f.key === 'capacity')
    if (f) return f
  }
  return undefined
}

describe('Venue capacity range field', () => {
  it('is a range field with sane bounds', () => {
    const f = capacityField()
    expect(f).toBeDefined()
    expect(f!.type).toBe('range')
    expect(f!.numberMin).toBeDefined()
    expect(f!.numberMax).toBeDefined()
    expect(f!.numberMax!).toBeGreaterThan(f!.numberMin!)
    expect(f!.numberUnit).toBe('guests')
  })

  // The overlap rule a couple-side match would use: a couple's guest count is
  // served when it falls within [min, max]. Pinned here so the stored shape and
  // the matching intent stay in sync.
  it('a stored [min, max] covers guest counts inside the range', () => {
    const [min, max] = [300, 800]
    const covers = (guests: number) => guests >= min && guests <= max
    expect(covers(300)).toBe(true)
    expect(covers(550)).toBe(true)
    expect(covers(800)).toBe(true)
    expect(covers(299)).toBe(false)
    expect(covers(801)).toBe(false)
  })
})

describe('venue ↔ guest-count soft matching', () => {
  it('parses couple guest buckets', () => {
    expect(parseGuestBucket('100-200')).toEqual([100, 200])
    expect(parseGuestBucket('200-500')).toEqual([200, 500])
    expect(parseGuestBucket('1000+')).toEqual([1000, Infinity])
    expect(parseGuestBucket(undefined)).toBeNull()
  })

  it('parses stored capacity, including legacy single values', () => {
    expect(parseCapacityRange(['300', '800'])).toEqual([300, 800])
    // legacy single value = "holds up to N"
    expect(parseCapacityRange('800')).toEqual([0, 800])
    expect(parseCapacityRange(undefined)).toBeNull()
    expect(parseCapacityRange([])).toBeNull()
  })

  it('fits when the venue range overlaps the couple bucket', () => {
    // Venue 300–800 vs couple 200–500 → overlap
    expect(venueFitsGuestBucket(['300', '800'], '200-500')).toBe(true)
    // Venue 300–800 vs couple 100–200 → venue min (300) above couple max (200)
    expect(venueFitsGuestBucket(['300', '800'], '100-200')).toBe(false)
    // Venue 1000–3000 vs couple 1000+ → overlap at the open top end
    expect(venueFitsGuestBucket(['1000', '3000'], '1000+')).toBe(true)
    // Small venue 50–150 vs couple 500–1000 → no overlap
    expect(venueFitsGuestBucket(['50', '150'], '500-1000')).toBe(false)
  })

  it('does not fit when data is missing', () => {
    expect(venueFitsGuestBucket(undefined, '200-500')).toBe(false)
    expect(venueFitsGuestBucket(['300', '800'], undefined)).toBe(false)
  })
})
