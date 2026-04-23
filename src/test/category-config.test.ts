import { describe, it, expect } from 'vitest'
import {
  ONBOARDING_CONFIG, LISTING_CONFIG, RITUALS,
  getListingConfig, getOnboardingConfig,
} from '@/lib/vendor-category-config'

const ALL_CATEGORIES = ['Venue', 'Catering', 'Photography', 'Decor', 'Makeup', 'Mehendi', 'DJ / Music', 'Pandit', 'Invitations']

describe('Vendor Category Config', () => {
  describe('Onboarding Config', () => {
    it('has config for all categories', () => {
      for (const cat of ALL_CATEGORIES) {
        expect(ONBOARDING_CONFIG[cat]).toBeDefined()
        expect(ONBOARDING_CONFIG[cat].title).toBeTruthy()
        expect(ONBOARDING_CONFIG[cat].fields.length).toBeGreaterThan(0)
      }
    })

    it('every field has key, label, and type', () => {
      for (const cat of ALL_CATEGORIES) {
        for (const field of ONBOARDING_CONFIG[cat].fields) {
          expect(field.key).toBeTruthy()
          expect(field.label).toBeTruthy()
          expect(['single', 'multi', 'toggle', 'slider']).toContain(field.type)
        }
      }
    })

    it('single/multi fields have options', () => {
      for (const cat of ALL_CATEGORIES) {
        for (const field of ONBOARDING_CONFIG[cat].fields) {
          if (field.type === 'single' || field.type === 'multi') {
            expect(field.options).toBeDefined()
            expect(field.options!.length).toBeGreaterThan(0)
          }
        }
      }
    })

    it('slider fields have min/max/step', () => {
      for (const cat of ALL_CATEGORIES) {
        for (const field of ONBOARDING_CONFIG[cat].fields) {
          if (field.type === 'slider') {
            expect(field.sliderMin).toBeDefined()
            expect(field.sliderMax).toBeDefined()
            expect(field.sliderStep).toBeDefined()
            expect(field.sliderMax!).toBeGreaterThan(field.sliderMin!)
          }
        }
      }
    })

    it('getOnboardingConfig returns correct config', () => {
      expect(getOnboardingConfig('Venue')?.title).toBe('About your venue')
      expect(getOnboardingConfig('Photography')?.title).toBe('About your photography')
    })

    it('getOnboardingConfig returns null for unknown category', () => {
      expect(getOnboardingConfig('Unknown')).toBeNull()
    })
  })

  describe('Listing Config', () => {
    it('has config for all categories', () => {
      for (const cat of ALL_CATEGORIES) {
        expect(LISTING_CONFIG[cat]).toBeDefined()
        expect(LISTING_CONFIG[cat].styles.length).toBeGreaterThan(0)
        expect(LISTING_CONFIG[cat].inclusions.length).toBeGreaterThan(0)
        expect(LISTING_CONFIG[cat].steps.length).toBeGreaterThan(0)
      }
    })

    it('price ranges are valid', () => {
      for (const cat of ALL_CATEGORIES) {
        const pr = LISTING_CONFIG[cat].priceRange
        expect(pr.min).toBeGreaterThan(0)
        expect(pr.max).toBeGreaterThan(pr.min)
        expect(pr.step).toBeGreaterThan(0)
      }
    })

    it('every step has fields', () => {
      for (const cat of ALL_CATEGORIES) {
        for (const step of LISTING_CONFIG[cat].steps) {
          expect(step.title).toBeTruthy()
          expect(step.fields.length).toBeGreaterThan(0)
        }
      }
    })

    it('getListingConfig returns fallback for unknown category', () => {
      const config = getListingConfig('NonExistent')
      expect(config).toBeDefined()
      expect(config.styles.length).toBeGreaterThan(0)
    })

    it('no duplicate field keys within a category', () => {
      for (const cat of ALL_CATEGORIES) {
        const allKeys: string[] = []
        for (const step of LISTING_CONFIG[cat].steps) {
          for (const field of step.fields) {
            allKeys.push(field.key)
          }
        }
        const unique = new Set(allKeys)
        expect(unique.size).toBe(allKeys.length)
      }
    })
  })

  describe('Rituals', () => {
    it('has Telugu event names', () => {
      expect(RITUALS).toContain('Nischitartham')
      expect(RITUALS).toContain('Pelli Choopulu')
      expect(RITUALS).toContain('Nalugu')
      expect(RITUALS).toContain('Sangeeth')
      expect(RITUALS).toContain('Pelli (Wedding)')
    })

    it('does not have Hindi event names', () => {
      expect(RITUALS).not.toContain('Engagement')
      expect(RITUALS).not.toContain('Haldi')
      expect(RITUALS).not.toContain('Sangeet')
    })

    it('has correct count', () => {
      expect(RITUALS.length).toBe(7)
    })
  })

  describe('Pandit — Telugu terminology', () => {
    it('onboarding uses Telugu traditions', () => {
      const pandit = ONBOARDING_CONFIG['Pandit']
      const traditions = pandit.fields.find(f => f.key === 'traditions')
      expect(traditions?.options).toContain('Telugu Brahmin')
      expect(traditions?.options).toContain('Arya Vysya')
      expect(traditions?.options).not.toContain('Bengali')
      expect(traditions?.options).not.toContain('Marwari')
    })

    it('listing uses Telugu ceremonies', () => {
      const pandit = LISTING_CONFIG['Pandit']
      const ceremonies = pandit.steps[0].fields.find(f => f.key === 'ceremonies')
      expect(ceremonies?.options).toContain('Talambralu')
      expect(ceremonies?.options).toContain('Jeelakarra Bellam')
      expect(ceremonies?.options).toContain('Mangalsutra Dharana')
      expect(ceremonies?.options).not.toContain('Pheras')
      expect(ceremonies?.options).not.toContain('Varmala')
    })

    it('listing inclusions use Telugu terms', () => {
      const pandit = LISTING_CONFIG['Pandit']
      expect(pandit.inclusions).toContain('Homam Setup')
      expect(pandit.inclusions).toContain('Muhurtham Consultation')
      expect(pandit.inclusions).toContain('Talambralu')
      expect(pandit.inclusions).not.toContain('Havan Setup')
      expect(pandit.inclusions).not.toContain('Muhurat Consultation')
    })
  })
})
