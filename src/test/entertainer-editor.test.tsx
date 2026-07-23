import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import EntertainerPricingEditor from '@/components/EntertainerPricingEditor'
import { emptyEntertainerPricing, type EntertainerPricing } from '@/lib/vendor-category-config'

// Thin stateful host so onChange actually updates the rendered value.
function Host() {
  const [value, setValue] = useState<EntertainerPricing>(emptyEntertainerPricing())
  return <EntertainerPricingEditor value={value} onChange={setValue} />
}

describe('EntertainerPricingEditor', () => {
  it('renders the default event rows, duration/hour controls, and languages', () => {
    render(<Host />)
    for (const event of ['Pelli (Wedding)', 'Engagement', 'Reception', 'Sangeeth', 'Haldi']) {
      expect(screen.getByText(event), `event row: ${event}`).toBeTruthy()
    }
    expect(screen.getByText('Additional-hour charge')).toBeTruthy()
    for (const lang of ['Hindi', 'Telugu', 'English']) {
      expect(screen.getByText(lang), `language: ${lang}`).toBeTruthy()
    }
  })

  it('supports custom-adding an event and toggling a language', () => {
    render(<Host />)
    const input = screen.getByPlaceholderText('Add another event…') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Cocktail Night' } })
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText('Cocktail Night')).toBeTruthy()

    // Toggle a language chip on (its label gains a ✓ prefix when selected).
    fireEvent.click(screen.getByRole('button', { name: /Hindi/ }))
    expect(screen.getByRole('button', { name: /✓\s*Hindi/ })).toBeTruthy()
  })
})
