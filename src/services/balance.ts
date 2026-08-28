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

/** 硅基流动余额：GET /v1/user/info → data.balance（CNY）。 */
export async function fetchSiliconflowBalance(
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<BalanceResult> {
  const res = await fetchImpl('https://api.siliconflow.cn/v1/user/info', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`siliconflow balance failed: ${res.status}`)
  const json = (await res.json()) as { data?: { balance?: string } }
  const raw = json.data?.balance
  if (raw === undefined) throw new Error('siliconflow balance missing')
  return { totalBalance: Number(raw), currency: 'CNY' }
}

/**
 * 从任意 OpenAI 兼容响应里尽力提取余额数字。
 * 兼容多种字段命名（balance / total_balance / credit / remaining 等常见拼写）。
 */
function extractBalance(json: unknown): number | null {
  if (json === null || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  // 直接数字字段
  for (const k of ['balance', 'total_balance', 'totalBalance', 'credit', 'credits', 'remaining', 'quota']) {
    const v = o[k]
    if (typeof v === 'number' && isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))) return Number(v)
  }
  // 常见嵌套：data.{...} / balance_infos[0].total_balance（DeepSeek 形态）
  if (o.data && typeof o.data === 'object') {
    const inner = extractBalance(o.data)
    if (inner !== null) return inner
  }
  if (Array.isArray(o.balance_infos)) {
    const first = o.balance_infos[0] as { total_balance?: string; currency?: string } | undefined
    if (first && first.total_balance !== undefined && isFinite(Number(first.total_balance))) {
      return Number(first.total_balance)
    }
  }
  return null
}

/**
 * 通用余额探测链：对任意的 OpenAI 兼容 baseURL，依次尝试各平台常见的
 * 余额/账户端点；返回第一个给出可解析余额的结果。没有公开余额 API 的
 * 平台（如智谱）会全部失败，调用方据此显示"余额未知"。
 */
const GENERIC_BALANCE_PATHS = [
  '/dashboard/billing/credit_grants', // OpenAI 旧版
  '/dashboard/billing/subscription', // OpenAI 旧版
  '/user/balance', // DeepSeek
  '/v1/user/info', // 硅基流动
  '/v1/dashboard/billing/credit_grants',
  '/api/user/balance',
  '/account/balance'
]

export async function probeGenericBalance(
  baseURL: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<BalanceResult | null> {
  const base = baseURL.replace(/\/+$/, '')
  const auth = { Authorization: `Bearer ${apiKey}` }
  for (const p of GENERIC_BALANCE_PATHS) {
    // 已知端点带固定 host 的（user/balance、v1/user/info 在不同平台 host 不同），
    // 这里一律基于 provider 自己的 baseURL 拼接探测
    try {
      const res = await fetchImpl(`${base}${p}`, { headers: auth })
      if (!res.ok) continue
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('json')) continue
      const balance = extractBalance(await res.json())
      if (balance !== null) return { totalBalance: balance, currency: 'CNY' }
    } catch {
      // try next
    }
  }
  return null
}

/** 已知提供方家族的专用实现（优先于通用探测）。 */
export const BALANCE_FETCHERS: Record<string, (key: string, f: typeof fetch) => Promise<BalanceResult>> = {
  deepseek: fetchBalance,
  siliconflow: fetchSiliconflowBalance
}

export interface ProviderBalanceQuery {
  /** 余额查询家族标识（deepseek / siliconflow / zhipu / 其他）。 */
  family: string
  /** provider 的 OpenAI 兼容 baseURL（用于通用探测；可为空）。 */
  baseURL?: string
}

/** 查任意提供方余额：先按已知家族的专用 API，再退回通用端点探测链。 */
export async function fetchProviderBalance(
  query: ProviderBalanceQuery,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<BalanceResult | null> {
  const known = BALANCE_FETCHERS[query.family]
  if (known) {
    try {
      return await known(apiKey, fetchImpl)
    } catch {
      // fall through to generic probe
    }
  }
  if (query.baseURL) {
    return probeGenericBalance(query.baseURL, apiKey, fetchImpl)
  }
  return null
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
