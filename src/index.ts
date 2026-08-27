import { fetchBalance, Ledger } from './services/balance'
import { computeContextPct, DEFAULT_CONTEXT_LIMIT } from './services/context'
import { estimateCost } from './services/turnCost'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-whale-girl'
export const inject = ['webServer', 'credentials', 'timer', 'tokenMeter', 'sessions', 'agents']

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const USAGE_FILE = path.join(DSH_HOME, '.whale-girl-usage.json')
const CONFIG_FILE = path.join(DSH_HOME, '.whale-girl-config.json')
const DIAG_FILE = path.join(DSH_HOME, '.whale-girl-diag.log')
const ASSET_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets')

/** 诊断记录（排查 client 数据是否到达、host 数据是否就绪）。用完可删除该日志文件。 */
function diag(line: string): void {
  try {
    fs.appendFileSync(DIAG_FILE, `[${new Date().toISOString()}] ${line}\n`)
  } catch {
    // ignore
  }
}

// 挂件配置默认值（也是"自定义接口"的字段说明：直接编辑 ~/.dsh/.whale-girl-config.json 即可自定义显示组合）
export interface WidgetConfig {
  /** 音效：'cute' 可爱合成音 / 'duck' 鸭叫（需要 mp3，可能被 webserver 403 拦截时无声） */
  soundMode: 'cute' | 'duck'
  /** 是否显示底部上下文进度条 */
  showProgress: boolean
  /** 是否显示彩蛋/随机台词气泡 */
  showBubble: boolean
  /** 是否在进度条详情里显示余额 */
  showBalance: boolean
  /** 是否在进度条详情里显示峰谷提醒 */
  showPeak: boolean
}

const DEFAULT_CONFIG: WidgetConfig = {
  soundMode: 'cute',
  showProgress: true,
  showBubble: true,
  showBalance: true,
  showPeak: true
}

function normalizeConfig(raw: unknown): WidgetConfig {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    soundMode: o.soundMode === 'duck' ? 'duck' : 'cute',
    showProgress: o.showProgress !== false,
    showBubble: o.showBubble !== false,
    showBalance: o.showBalance !== false,
    showPeak: o.showPeak !== false
  }
}

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
  diag('apply-ok')
  registerAssetRoutes(ctx)

  const ledger = new Ledger()
  try {
    ledger.load(fs.readFileSync(USAGE_FILE, 'utf8'))
  } catch {
    // first run
  }

  // 挂件配置（读取/写入 CONFIG_FILE；client 通过 api/config GET/POST 读写）
  let widgetConfig: WidgetConfig = DEFAULT_CONFIG
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    widgetConfig = normalizeConfig(JSON.parse(raw))
  } catch {
    // use defaults on first run / malformed config
  }

  let cachedBalance: number | null = null
  let cachedCurrency = 'CNY'
  let lastTurnCost: number | null = null
  // 当前活跃会话（turn-stopping 时记录；ctx.sessions.list()[0] 不稳定）
  let currentSession: any = null
  // 缓存最近一次成功获取的会话，避免 buildState 轮询时会话引用短暂丢失导致上下文闪 0
  let lastKnownSession: any = null

  // DeepSeek 官方峰谷时段（北京时间）：工作日 9-12 点与 14-18 点为高峰，其余为低谷；周末全天低谷。
  // 依据系统时间判断（与 dsh-whale-widget 的 isPeakTime 一致）。
  function isPeakTime(timeSec: number): boolean {
    if (!isFinite(timeSec)) return false
    const bj = new Date(timeSec * 1000 + 8 * 3600 * 1000)
    const dow = bj.getUTCDay() // 0=周日 6=周六（按北京时间读 UTC 即北京日历日）
    if (dow === 0 || dow === 6) return false
    const hour = bj.getUTCHours()
    return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18)
  }

  /** 当前时段峰谷：官方时段总是高峰或低谷。 */
  function computePeak(now: Date): 'high' | 'low' {
    return isPeakTime(Math.floor(now.getTime() / 1000)) ? 'high' : 'low'
  }

  async function refreshBalance(): Promise<void> {
    try {
      const creds = ctx.credentials ?? ctx.get('credentials')
      if (!creds) {
        diag('refresh: no-credentials')
        return
      }
      let ref: unknown
      try {
        ref = await creds.resolve('DEEPSEEK_API_KEY')
      } catch (e: any) {
        diag(`refresh: resolve-err ${e?.message ?? String(e)}`)
        return
      }
      const key = typeof ref === 'string' ? ref : ref && typeof ref === 'object' ? (ref as any).value : undefined
      if (!key) {
        diag('refresh: no-key')
        return
      }
      const { totalBalance, currency } = await fetchBalance(key)
      cachedBalance = totalBalance
      cachedCurrency = currency
      ledger.observe(totalBalance)
      diag(`refresh-ok balance=${totalBalance} currency=${currency}`)
      try {
        fs.writeFileSync(USAGE_FILE, JSON.stringify(ledger.state))
      } catch {
        // storage not writable
      }
    } catch (err: any) {
      diag(`refresh-fail ${err?.message ?? String(err)}`)
      // keep last values
    }
  }

  void refreshBalance()

  const timer = ctx.get('timer')
  if (timer) {
    timer.interval(refreshBalance, 60000)
  }

  // 事件流：任意会话事件都更新当前活跃会话引用（whale-widget 同款方式，重启后会话恢复也能拿到）
  ctx.on('session/event', (session: any) => {
    if (session) currentSession = session
  })

  // 每轮消耗：turn 即将结束时用 tokenMeter 测当前会话 token，估算本轮成本 + 记入当前小时桶
  ctx.on('agent/turn-stopping', (payload: any) => {
    try {
      const agent = payload?.agent
      const session =
        agent?.session ??
        (agent?.sessionId ? ctx.sessions?.get?.(agent.sessionId) : undefined)
      if (!session) return
      currentSession = session
      const tm = ctx.tokenMeter ?? ctx.get('tokenMeter')
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
      const tm = ctx.tokenMeter ?? ctx.get('tokenMeter')
      const agent = ctx.agents?.roots?.()[0] ?? ctx.agents?.list?.()[0]
      const session =
        currentSession ??
        lastKnownSession ??
        agent?.session ??
        ctx.sessions?.list?.()[0] ??
        ctx.sessions?.get?.()
      if (session) lastKnownSession = session
      if (tm && session) {
        const m = tm.measure(session)
        try {
          diag(`measure-keys: ${Object.keys(m).join(',')}`)
          diag(`measure: ${JSON.stringify(m).slice(0, 800)}`)
        } catch (e: any) {
          diag(`measure-err: ${String(e)}`)
        }
        // surfaceTokens = 会话表面稳定占用（对话结束不清零）；totalTokens = 请求压力（对话结束归 0）
        contextTokens = Number(m?.surfaceTokens ?? m?.totalTokens ?? m?.tokens ?? m?.total ?? 0)
      } else {
        diag(`measure: tm=${!!tm} session=${!!session}`)
      }
    } catch {
      // ignore
    }
    const peak = computePeak(new Date())
    diag(`peak: ${peak}`)
    diag(
      `state: ctxTokens=${contextTokens} balance=${cachedBalance} currency=${cachedCurrency} todayUsage=${ledger.state.todayUsage} lastTurnCost=${lastTurnCost}`
    )
    return {
      balance: cachedBalance,
      currency: cachedCurrency,
      todayUsage: ledger.state.todayUsage,
      contextPct: computeContextPct(contextTokens, DEFAULT_CONTEXT_LIMIT),
      contextTokens,
      contextLimit: DEFAULT_CONTEXT_LIMIT,
      lastTurnCost,
      peakLow: peak
    }
  }

  function registerApiRoutes(server: any): void {
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/state',
      handler: (req: unknown, res: any) => {
        diag('state-hit')
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        })
        res.end(JSON.stringify(buildState()))
      }
    })
    // JSONP 端点：client 用动态 <script> 加载（script 资源请求与 client.js 同通道，可透过 webserver 认证；普通 fetch 会被 403 拦）
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/state.js',
      handler: (req: unknown, res: any) => {
        diag('state-jsonp-hit')
        res.writeHead(200, {
          'Content-Type': 'text/javascript; charset=utf-8',
          'Cache-Control': 'no-store'
        })
        res.end(`window.__wgState=${JSON.stringify(buildState())};`)
      }
    })
    // GET：返回挂件配置；POST：保存挂件配置
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/config',
      handler: (req: any, res: any) => {
        const method = (req.method ?? 'GET').toUpperCase()
        if (method === 'POST' || method === 'PUT') {
          let body = ''
          req.on('data', (c: Buffer) => {
            body += String(c)
          })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              widgetConfig = normalizeConfig(parsed)
              fs.writeFileSync(CONFIG_FILE, JSON.stringify(widgetConfig, null, 2))
            } catch {
              // keep current on malformed body
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok: true, config: widgetConfig }))
          })
          return
        }
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        })
        res.end(JSON.stringify(widgetConfig))
      }
    })
    // 交互诊断回流：bridge 脚本收到挂件事件后上报，供宿主写诊断日志（我读日志即可确认弹跳/点击等交互发生）
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/diag-event',
      handler: (req: any, res: any) => {
        let body = ''
        req.on('data', (c: Buffer) => {
          body += String(c)
        })
        req.on('end', () => {
          diag(`event: ${body.slice(0, 200)}`)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end('{"ok":true}')
        })
      }
    })
  }

  const apiServer = ctx.get('webServer')
  if (apiServer) {
    registerApiRoutes(apiServer)
    // 数据桥：把桥接脚本注入主页面顶层（主页面 fetch 带认证，能拿数据），脚本定期拉取并 postMessage 广播给 slots 挂件。
    // slots 组件运行在 iframe/隔离上下文，其自身 fetch 不带认证会被 webserver 403 拦。
    const BRIDGE_JS = `(function () {
  if (window.__wgBridge) return
  window.__wgBridge = true
  var pull = function () {
    try {
      fetch('/dsh-whale-girl/api/state', { cache: 'no-store' })
        .then(function (r) { return r.json() })
        .then(function (d) {
          if (d && typeof d === 'object') {
            window.__wgData = d
            window.postMessage({ __wgData: d }, '*')
          }
        })
        .catch(function () {})
    } catch (e) {}
  }
  pull()
  setInterval(pull, 60000)
  // 交互诊断回流：slots 挂件触发交互时 postMessage 事件，此处接收并上报宿主写日志
  window.addEventListener('message', function (ev) {
    var d = ev.data
    if (d && d.__wgEvent) {
      try {
        fetch('/dsh-whale-girl/api/diag-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d.__wgEvent)
        }).catch(function () {})
      } catch (err) {}
    }
  })
})()`
    // 用 index-inject 事件注入桥接脚本（DSH Desktop 页面经 collectIndexInjections 生成，tapIndex 不生效）
    ctx.on('webserver/index-inject', (table: any[]) => {
      const has = Array.isArray(table) && table.some(
        (row) => row && typeof row === 'object' && typeof row.text === 'string' && row.text.indexOf('__wgBridge') !== -1
      )
      if (!has) {
        diag('index-inject-called')
        table.push({ kind: 'script', placement: 'head', text: BRIDGE_JS })
      }
    })
  }
}
