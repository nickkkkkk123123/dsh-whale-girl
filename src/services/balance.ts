import fs from 'node:fs'

export interface BalanceResult {
  totalBalance: number
  currency: string
}

export interface LedgerState {
  date: string
  lastBalance: number | null
  todayUsage: number
  history: { date: string; usage: number }[]
}

export async function fetchBalance(
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<BalanceResult> {
  const res = await fetchImpl('https://api.deepseek.com/user/balance', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`balance api failed: ${res.status}`)
  const json = (await res.json()) as { balance_infos?: { total_balance?: string; currency?: string }[] }
  const info = json.balance_infos?.[0]
  if (!info || info.total_balance === undefined) throw new Error('balance response malformed')
  return { totalBalance: Number(info.total_balance), currency: info.currency ?? 'CNY' }
}

export function todayStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export class Ledger {
  state: LedgerState = { date: todayStr(), lastBalance: null, todayUsage: 0, history: [] }

  observe(balance: number, date: string = todayStr()): LedgerState {
    if (this.state.date !== date) {
      if (this.state.todayUsage > 0) {
        this.state.history.push({ date: this.state.date, usage: this.state.todayUsage })
        if (this.state.history.length > 30) this.state.history.shift()
      }
      this.state.date = date
      this.state.todayUsage = 0
      this.state.lastBalance = null
    }
    if (this.state.lastBalance !== null && balance < this.state.lastBalance) {
      this.state.todayUsage += this.state.lastBalance - balance
    }
    this.state.lastBalance = balance
    return this.state
  }

  load(raw: string): void {
    try {
      const parsed = JSON.parse(raw) as Partial<LedgerState>
      this.state = {
        date: typeof parsed.date === 'string' ? parsed.date : this.state.date,
        lastBalance: typeof parsed.lastBalance === 'number' ? parsed.lastBalance : null,
        todayUsage: typeof parsed.todayUsage === 'number' ? parsed.todayUsage : 0,
        history: Array.isArray(parsed.history) ? parsed.history : []
      }
    } catch {
      // keep default state
    }
  }

  save(path: string): void {
    fs.writeFileSync(path, JSON.stringify(this.state))
  }
}
