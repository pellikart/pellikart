import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useState } from 'react'
import BanjantriluPricingEditor from '@/components/BanjantriluPricingEditor'
import { emptyBanjantriluPricing, type BanjantriluPricing } from '@/lib/vendor-category-config'

// Thin stateful host so onChange actually updates the rendered value.
function Host() {
  const [value, setValue] = useState<BanjantriluPricing>(emptyBanjantriluPricing())
  return <BanjantriluPricingEditor value={value} onChange={setValue} />
}

describe('BanjantriluPricingEditor', () => {
  it('renders a card per default event with artists/hours/price controls', () => {
    render(<Host />)
    expect(screen.getByText('Event 1')).toBeTruthy()
    expect(screen.getByText('Event 2')).toBeTruthy()
    // Both default events pre-fill the per-card event text inputs.
    const events = screen.getAllByPlaceholderText('Event name') as HTMLInputElement[]
    expect(events.map(e => e.value)).toEqual(['Pelli (Wedding)', 'Pelli Koduku/Pellikuthuru Function'])
    expect(screen.getAllByText('Number of artists')).toHaveLength(2)
    expect(screen.getAllByText('Number of hours')).toHaveLength(2)
    expect(screen.getAllByText('Price')).toHaveLength(2)
  })

  it('adds another event card via the custom input', () => {
    render(<Host />)
    const input = screen.getByPlaceholderText('Add another event…') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Baraat' } })
    fireEvent.click(screen.getByText('+ Add'))
    expect(screen.getByText('Event 3')).toBeTruthy()
    const events = screen.getAllByPlaceholderText('Event name') as HTMLInputElement[]
    expect(events.map(e => e.value)).toContain('Baraat')
  })

  it('removes a card and steps artists up', () => {
    render(<Host />)
    // Remove the second card.
    fireEvent.click(screen.getByLabelText('Remove event 2'))
    expect(screen.queryByText('Event 2')).toBeNull()

    // Bump artists on the remaining card via its +.
    const card = screen.getByText('Event 1').closest('div')!.parentElement as HTMLElement
    const plus = within(card).getAllByRole('button', { name: '+' })[0]
    fireEvent.click(plus)
    // Default artists is 2 → now 3.
    expect(within(card).getByText('3')).toBeTruthy()
  })
})
