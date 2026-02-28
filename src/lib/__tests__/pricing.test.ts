import { describe, it, expect } from 'vitest'
import { calculateDealerPrice } from '../pricing'

describe('calculateDealerPrice', () => {
  it('applies percentage discount to MSRP', () => {
    expect(calculateDealerPrice(100, 40)).toBe(60)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateDealerPrice(99.99, 33.33)).toBe(66.66)
  })

  it('returns MSRP when discount is 0', () => {
    expect(calculateDealerPrice(549, 0)).toBe(549)
  })

  it('returns 0 when discount is 100', () => {
    expect(calculateDealerPrice(549, 100)).toBe(0)
  })
})
