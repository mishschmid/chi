import { describe, expect, it } from 'vitest'
import { calculateCost } from '../../../server/utils/llm/pricing'

describe('token cost calculation', () => {
  it('calculates gpt-4o pricing accurately', () => {
    // gpt-4o: $2.50 / 1M prompt, $10.00 / 1M completion
    // 1,000 prompt tokens = $0.0025
    // 500 completion tokens = $0.005
    // Total = $0.0075
    const cost = calculateCost('gpt-4o', 1000, 500)
    expect(cost).toBe(0.0075)
  })

  it('calculates gpt-4o-mini pricing accurately', () => {
    // gpt-4o-mini: $0.15 / 1M prompt, $0.60 / 1M completion
    // 10,000 prompt tokens = $0.0015
    // 1,000 completion tokens = $0.0006
    // Total = $0.0021
    const cost = calculateCost('gpt-4o-mini', 10000, 1000)
    expect(cost).toBe(0.0021)
  })
})
