import { describe, it, expect } from 'vitest'
import { useStore } from '@/lib/store'
import type { OnboardingData } from '@/lib/types'

describe('demo onboarding preserves Photography rateCard', () => {
  it('store.vendors photographers keep rateCard after completeOnboarding', () => {
    const data: OnboardingData = {
      partner1: 'A', partner2: 'B',
      events: ['Pelli (Wedding)'], customEvents: [],
      eventDates: {}, eventGuests: {},
      budget: 2000000, style: 'Traditional',
    }
    useStore.getState().completeOnboarding(data)
    const vendors = useStore.getState().vendors
    // Base photographer vendors keep their pricing model (hourly rate card,
    // guest packages, or event-based packages — not all use a rate card now).
    const photogs = Object.values(vendors).filter(v => v.id.startsWith('v-photo'))
    expect(photogs.length).toBeGreaterThan(0)
    for (const p of photogs) {
      const hasPricing = !!p.rateCard || !!p.guestPackages || (p.eventPackages?.length ?? 0) > 0
      expect(hasPricing, `${p.id} should keep a pricing model`).toBe(true)
    }
    // …and so do the design listings the boards actually select (this was the bug:
    // the couple board shows a d-photo design, which must inherit the rate card).
    // Event-based designs (d-photo-4*) instead carry their single event package.
    const designs = Object.values(vendors).filter(v => v.id.startsWith('d-photo'))
    expect(designs.length).toBeGreaterThan(0)
    for (const d of designs) {
      if ((d.eventPackages?.length ?? 0) > 0) {
        expect(d.eventPackages, `${d.id} should carry one event package`).toHaveLength(1)
        expect(d.photographyPricingModels).toEqual(['eventBased'])
      } else {
        expect(d.rateCard, `${d.id} design should inherit rateCard`).toBeDefined()
        expect(d.availableHours, `${d.id} design should inherit availableHours`).toBeDefined()
      }
    }
    // The event-based demo photographer's packages are present as their own listings.
    expect(vendors['d-photo-4a']?.eventPackages?.[0]?.events).toContain('Pelli (Wedding)')
    expect(vendors['d-photo-4b']?.eventPackages?.[0]?.events).toContain('Haldi')
  })
})
