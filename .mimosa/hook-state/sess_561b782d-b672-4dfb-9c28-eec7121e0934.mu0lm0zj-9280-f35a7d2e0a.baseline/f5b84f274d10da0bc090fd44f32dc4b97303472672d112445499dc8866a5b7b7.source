import { describe, it, expect } from 'vitest'
import { computeContextPct } from '../src/services/context'

describe('computeContextPct', () => {
  it('computes ratio', () => {
    expect(computeContextPct(64000, 128000)).toBeCloseTo(0.5, 5)
  })
  it('clamps at 1', () => {
    expect(computeContextPct(200000, 128000)).toBe(1)
  })
  it('returns 0 for zero tokens', () => {
    expect(computeContextPct(0, 128000)).toBe(0)
  })
  it('returns 0 for invalid limit', () => {
    expect(computeContextPct(1000, 0)).toBe(0)
  })
})
