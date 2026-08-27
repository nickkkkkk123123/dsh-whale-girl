import { fetchBalance, Ledger } from './services/balance'
import { computeContextPct, DEFAULT_CONTEXT_LIMIT } from './services/context'
import { estimateCost } from './services/turnCost'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-whale-girl'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const USAGE_FILE = path.join(DSH_HOME, '.whale-girl-usage.json')
const CONFIG_FILE = path.join(DSH_HOME, '.whale-girl-config.json')
const ASSET_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets')

// 静态资源：图片 + 音效（给客户端挂件用，带缓存头）
function registerAssetRoutes(ctx: any): void {
  const webServer = ctx.get('webServer')
  if (!webServer) return
  for (const f of ['whale-girl.png', 'Ya1.mp3', 'Ya2.mp3']) {
    webServer.register({
      kind: 'exact',
      path: `/dsh-whale-girl/${f}`,
      handler: (req: unknown, res: any) => {
        try {
          const buf = fs.readFileSync(path.join(ASSET_ROOT, f))
          res.writeHead(200, {
            'Content-Type': f.endsWith('.mp3') ? 'audio/mpeg' : 'image/png',
            'Cache-Control': 'public, max-age=86400, immutable',
            'Content-Length': String(buf.length)
          })
          res.end(buf)
        } catch {
          res.writeHead(404)
          res.end()
        }
      }
    })
  }
}

export function apply(ctx: any) {
  registerAssetRoutes(ctx)

  const ledger = new Ledger()
  try {
    ledger.load(fs.readFileSync(USAGE_FILE, 'utf8'))
  } catch {
    // first run
  }

  let cachedBalance: number | null = null
  let cachedCurrency = 'CNY'
  let lastTurnCost: number | null = null

  async function refreshBalance(): Promise<void> {
    try {
      const creds = ctx.get('credentials')
      if (!creds) return
      const ref = await creds.resolve({ key: 'DEEPSEEK_API_KEY' })
      const key = typeof ref === 'string' ? ref : ref?.value
      if (!key) return
      const { totalBalance, currency } = await fetchBalance(key)
      cachedBalance = totalBalance
      cachedCurrency = currency
      ledger.observe(totalBalance)
      try {
        fs.writeFileSync(USAGE_FILE, JSON.stringify(ledger.state))
      } catch {
        // storage not writable
      }
    } catch {
      // keep last values
    }
  }

  void refreshBalance()

  const timer = ctx.get('timer')
  if (timer) {
    timer.interval(refreshBalance, 60000)
  }

  // 每轮消耗：turn 即将结束时用 tokenMeter 测当前会话 token，估算本轮成本
  ctx.on('agent/turn-stopping', (payload: any) => {
    try {
      const agent = payload?.agent
      const session =
        agent?.session ??
        (agent?.sessionId ? ctx.sessions?.get?.(agent.sessionId) : undefined)
      if (!session) return
      const tm = ctx.get('tokenMeter')
      if (!tm) return
      const m = tm.measure(session)
      const total = Number(m?.totalTokens ?? m?.tokens ?? m?.total ?? 0)
      if (total > 0) {
        lastTurnCost = estimateCost(total, { input: 0.5, output: 2, inputTokens: total, outputTokens: 0 })
      }
    } catch {
      // ignore measurement errors
    }
  })

  // 数据接口：webServer JSON 路由（npm 编译插件用 webServer，不用 Builtin harness）
  function buildState(): object {
    let contextTokens = 0
    try {
      const tm = ctx.get('tokenMeter')
      const session = ctx.sessions?.list?.()[0] ?? ctx.sessions?.get?.()
      if (tm && session) {
        const m = tm.measure(session)
        contextTokens = Number(m?.totalTokens ?? m?.tokens ?? m?.total ?? 0)
      }
    } catch {
      // ignore
    }
    return {
      balance: cachedBalance,
      currency: cachedCurrency,
      todayUsage: ledger.state.todayUsage,
      contextPct: computeContextPct(contextTokens, DEFAULT_CONTEXT_LIMIT),
      contextTokens,
      contextLimit: DEFAULT_CONTEXT_LIMIT,
      lastTurnCost
    }
  }

  function registerApiRoutes(server: any): void {
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/state',
      handler: (req: unknown, res: any) => {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        })
        res.end(JSON.stringify(buildState()))
      }
    })
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/config',
      handler: (req: any, res: any) => {
        let body = ''
        req.on('data', (c: Buffer) => {
          body += String(c)
        })
        req.on('end', () => {
          try {
            fs.writeFileSync(CONFIG_FILE, body)
          } catch {
            // ignore
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end('{"ok":true}')
        })
      }
    })
  }

  const apiServer = ctx.get('webServer')
  if (apiServer) registerApiRoutes(apiServer)
}
