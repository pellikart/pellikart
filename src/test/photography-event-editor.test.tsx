import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import PhotographyEventPackagesEditor from '@/components/PhotographyEventPackagesEditor'
import type { PhotographyEventPackage } from '@/lib/vendor-category-config'

// Thin stateful host so onChange actually updates the rendered value.
function Host() {
  const [value, setValue] = useState<PhotographyEventPackage[]>([])
  return <PhotographyEventPackagesEditor value={value} onChange={setValue} />
}

describe('PhotographyEventPackagesEditor', () => {
  it('creates a card, and the card exposes events + all service price rows', () => {
    render(<Host />)
    // No cards yet — only the create button.
    fireEvent.click(screen.getByText('+ Create pricing card'))

    expect(screen.getByText('Pricing card 1')).toBeTruthy()
    // A standard event chip and every service label render.
    expect(screen.getByText('Haldi')).toBeTruthy()
    for (const label of [
      'Traditional Photography', 'Traditional Videography',
      'Candid Photography', 'Candid Videography',
      'LED Screens', 'Drone', 'Album', 'Live Streaming',
    ]) {
      expect(screen.getByText(label), `service row: ${label}`).toBeTruthy()
    }
  })

  it('supports adding a custom event and removing the card', () => {
    render(<Host />)
    fireEvent.click(screen.getByText('+ Create pricing card'))

    const input = screen.getByPlaceholderText('Add a custom event…') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Cocktail Night' } })
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getByText('✓ Cocktail Night')).toBeTruthy()

    fireEvent.click(screen.getByText('Remove'))
    expect(screen.queryByText('Pricing card 1')).toBeNull()
  })
})
