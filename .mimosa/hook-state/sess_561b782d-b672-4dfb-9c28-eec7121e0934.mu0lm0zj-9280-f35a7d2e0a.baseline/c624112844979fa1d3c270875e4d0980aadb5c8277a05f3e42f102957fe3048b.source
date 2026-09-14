import { describe, it, expect } from 'vitest'
import { estimateCost } from '../src/services/turnCost'

describe('estimateCost', () => {
  it('computes cost from token split', () => {
    const cost = estimateCost(1000, { input: 0.5, output: 2, inputTokens: 600, outputTokens: 400 })
    // 600 * 0.5 / 1e6 + 400 * 2 / 1e6 = 0.0003 + 0.0008 = 0.0011
    expect(cost).toBeCloseTo(0.0011, 6)
  })
  it('returns 0 for zero tokens', () => {
    expect(estimateCost(0, { input: 0.5, output: 2, inputTokens: 0, outputTokens: 0 })).toBe(0)
  })
  it('handles all-input tokens', () => {
    expect(estimateCost(500, { input: 1, output: 2, inputTokens: 1000, outputTokens: 0 })).toBeCloseTo(0.0005, 6)
  })
})
