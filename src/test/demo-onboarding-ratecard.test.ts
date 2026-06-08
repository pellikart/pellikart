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
    // Base photographer vendors keep their rate card…
    const photogs = Object.values(vendors).filter(v => v.id.startsWith('v-photo'))
    expect(photogs.length).toBeGreaterThan(0)
    for (const p of photogs) {
      expect(p.rateCard, `${p.id} should keep rateCard`).toBeDefined()
    }
    // …and so do the design listings the boards actually select (this was the bug:
    // the couple board shows a d-photo design, which must inherit the rate card).
    const designs = Object.values(vendors).filter(v => v.id.startsWith('d-photo'))
    expect(designs.length).toBeGreaterThan(0)
    for (const d of designs) {
      expect(d.rateCard, `${d.id} design should inherit rateCard`).toBeDefined()
      expect(d.availableHours, `${d.id} design should inherit availableHours`).toBeDefined()
    }
  })
})
