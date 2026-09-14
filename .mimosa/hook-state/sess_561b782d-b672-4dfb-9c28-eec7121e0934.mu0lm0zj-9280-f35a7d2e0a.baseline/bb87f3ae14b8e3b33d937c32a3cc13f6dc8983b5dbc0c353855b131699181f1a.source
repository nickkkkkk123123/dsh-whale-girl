import { describe, it, expect, vi } from 'vitest'
import { fetchBalance, Ledger, todayStr } from '../src/services/balance'

describe('fetchBalance', () => {
  it('parses DeepSeek balance API response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ balance_infos: [{ total_balance: '12.34', currency: 'CNY' }] })
    })
    const result = await fetchBalance('sk-test', fetchImpl as unknown as typeof fetch)
    expect(result).toEqual({ totalBalance: 12.34, currency: 'CNY' })
  })

  it('throws on API failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    await expect(fetchBalance('sk-test', fetchImpl as unknown as typeof fetch)).rejects.toThrow()
  })

  it('throws on malformed response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    await expect(fetchBalance('sk-test', fetchImpl as unknown as typeof fetch)).rejects.toThrow()
  })
})

describe('todayStr', () => {
  it('formats date as YYYY-MM-DD', () => {
    expect(todayStr(new Date('2026-08-27T12:00:00Z'))).toBe('2026-08-27')
  })
})

describe('Ledger', () => {
  it('accumulates today usage from balance drops', () => {
    const ledger = new Ledger()
    ledger.observe(100)
    ledger.observe(97.5)
    expect(ledger.state.todayUsage).toBeCloseTo(2.5, 5)
  })

  it('ignores balance increases (no negative usage)', () => {
    const ledger = new Ledger()
    ledger.observe(90)
    ledger.observe(95)
    expect(ledger.state.todayUsage).toBe(0)
  })

  it('resets usage on day change and archives', () => {
    const ledger = new Ledger()
    ledger.state.date = '2026-08-26'
    ledger.state.todayUsage = 5
    ledger.observe(100, '2026-08-27')
    expect(ledger.state.todayUsage).toBe(0)
    expect(ledger.state.history.length).toBe(1)
    expect(ledger.state.history[0]).toEqual({ date: '2026-08-26', usage: 5 })
  })

  it('load and save round-trips', () => {
    const ledger = new Ledger()
    ledger.observe(100)
    ledger.observe(98)
    const json = JSON.stringify(ledger.state)
    const ledger2 = new Ledger()
    ledger2.load(json)
    expect(ledger2.state.todayUsage).toBeCloseTo(2, 5)
    expect(ledger2.state.lastBalance).toBe(98)
  })
})
