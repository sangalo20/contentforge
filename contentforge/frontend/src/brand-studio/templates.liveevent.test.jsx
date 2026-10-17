// Live Event Bill: every design renders the whole sheet from the brand's
// seed copy — headline, agenda, price, when/where — and carries a QR code
// whose payload is the register link.
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TplLiveEvent } from './templates'
import { LIVEEVENT_VARIANTS, TEMPLATES } from './registry'
import { BRANDS, buildDefaults } from './brands'

const brand = BRANDS.find(b => b.id === 'storagemoguls')
const seed = buildDefaults(brand).liveevent

describe('TplLiveEvent', () => {
  it('is registered as a portrait sheet with a Design picker', () => {
    const row = TEMPLATES.find(t => t.id === 'liveevent')
    expect(row.res).toBe('1080x1350')
    expect(row.component).toBe(TplLiveEvent)
    expect(LIVEEVENT_VARIANTS.map(v => v.id)).toEqual(['bill', 'ticket', 'blueprint', 'receipt', 'marquee', 'door'])
  })

  it.each(LIVEEVENT_VARIANTS.map(v => v.id))('design "%s" renders the full sheet with a QR code', (variant) => {
    const { container } = render(<TplLiveEvent d={{ ...seed, variant }} brand={brand} />)
    const text = container.textContent
    expect(text).toContain('Find')
    expect(text).toContain('Close')
    expect(text).toContain('$349')
    expect(text).toContain('FRIDAY, OCTOBER 16, 2026')
    expect(text).toContain('How real storage deals get sourced and found')
    const qr = container.querySelector('svg[aria-label]')
    expect(qr).not.toBeNull()
    expect(qr.getAttribute('aria-label')).toBe('https://storagemoguls.ai/whitemarsh')
    expect(qr.querySelector('path').getAttribute('d').length).toBeGreaterThan(100)
  })

  it('falls back to https:// + url for the QR when no register link is set', () => {
    const { container } = render(<TplLiveEvent d={{ ...seed, ctaUrl: '', url: 'storagemoguls.ai/live' }} brand={brand} />)
    expect(container.querySelector('svg[aria-label]').getAttribute('aria-label')).toBe('https://storagemoguls.ai/live')
  })

  it('sets a title that is not short sentences as one block', () => {
    const { container } = render(<TplLiveEvent d={{ ...seed, title: 'The First Facility Workshop' }} brand={brand} />)
    expect(container.textContent).toContain('The First Facility Workshop')
  })
})
