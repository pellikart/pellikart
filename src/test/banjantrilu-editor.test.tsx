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
  it('renders a card per default event with a selected event chip + artists/hours/price', () => {
    render(<Host />)
    expect(screen.getByText('Event 1')).toBeTruthy()
    expect(screen.getByText('Event 2')).toBeTruthy()
    // Each card's own event shows as the selected (✓) chip — no echo text box.
    expect(screen.queryByPlaceholderText('Event name')).toBeNull()
    expect(screen.getByRole('button', { name: /✓\s*Pelli \(Wedding\)/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /✓\s*Pelli Koduku\/Pellikuthuru Function/ })).toBeTruthy()
    expect(screen.getAllByText('Number of artists')).toHaveLength(2)
    expect(screen.getAllByText('Number of hours')).toHaveLength(2)
    expect(screen.getAllByText('Price')).toHaveLength(2)
  })

  it('adds another event card via the custom input, shown as a selected chip', () => {
    render(<Host />)
    const input = screen.getByPlaceholderText('Add another event…') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Baraat' } })
    fireEvent.click(screen.getByText('+ Add'))
    expect(screen.getByText('Event 3')).toBeTruthy()
    // The custom event appears as its card's selected chip.
    expect(screen.getByRole('button', { name: /✓\s*Baraat/ })).toBeTruthy()
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
