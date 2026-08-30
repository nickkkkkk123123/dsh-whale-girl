import { fetchBalance, Ledger, fetchProviderBalance } from './services/balance'
import { listProviders, currentModel, selectModel } from './services/providers'
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
  /** 中键弹弓发射力度系数（松手速度 = 拉开距离 × 该系数），范围 5~60 */
  slingPower: number
  /** 省电模式：空闲 60 秒后暂停漂浮动画并停用常驻毛玻璃（交互立即恢复） */
  ecoMode: boolean
  /** 毛玻璃强度（进度条底板 blur 像素，0=关闭），0~16 默认 4 */
  frost: number
  /** 进度条底板背景不透明度，0.2~1 默认 0.82（越小越透） */
  panelOpacity: number
  /** 余额预警线（元）：低于该值时气泡提醒充值，0=关闭预警 */
  lowBalance: number
  /** 是否显示 Agent 工作状态徽章（思考中/搞定啦）与过渡台词 */
  showWorkState: boolean
  /** 实时余额刷新：开启后余额/用量按约 10 秒刷新（默认 60 秒，比 whale-widget 更实时） */
  realtimeBalance: boolean
}

const DEFAULT_CONFIG: WidgetConfig = {
  soundMode: 'cute',
  showProgress: true,
  showBubble: true,
  showBalance: true,
  showPeak: true,
  slingPower: 20,
  ecoMode: true,
  frost: 4,
  panelOpacity: 0.82,
  lowBalance: 10,
  showWorkState: true,
  realtimeBalance: false
}

function normalizeConfig(raw: unknown): WidgetConfig {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const power = Number(o.slingPower)
  return {
    soundMode: o.soundMode === 'duck' ? 'duck' : 'cute',
    showProgress: o.showProgress !== false,
    showBubble: o.showBubble !== false,
    showBalance: o.showBalance !== false,
    showPeak: o.showPeak !== false,
    slingPower: Number.isFinite(power) ? Math.min(60, Math.max(5, power)) : 20,
    ecoMode: o.ecoMode !== false,
    frost: Number.isFinite(Number(o.frost)) ? Math.min(16, Math.max(0, Math.round(Number(o.frost)))) : 4,
    panelOpacity: Number.isFinite(Number(o.panelOpacity)) ? Math.min(1, Math.max(0.2, Number(o.panelOpacity))) : 0.82,
    lowBalance: Number.isFinite(Number(o.lowBalance)) ? Math.max(0, Number(o.lowBalance)) : 10,
    showWorkState: o.showWorkState !== false,
    realtimeBalance: o.realtimeBalance === true
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
  // 活跃子代理（分身的 running 计数），由 jobs 服务回调维护（装 subagent bundle 后生效）
  let subagentRunning = 0
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

  // 余额刷新：按「实时令牌」配置决定间隔（60s / 10s），自调度使切换即时生效（无需重启）
  const scheduleBalance = () => {
    const ms = widgetConfig.realtimeBalance ? 10000 : 60000
    setTimeout(() => {
      void refreshBalance()
      scheduleBalance()
    }, ms)
  }
  scheduleBalance()

  // 子代理状态感知：统计主 agent 的 running subagent（kind=subagent，status=running/stopping）。
  // 用主 agent 作为 caller 调 jobs.list（caller 相对围栏），回调触发即重算；纯本地、零 API 开销。
  const subagentJobs = ctx.get('jobs')
  const recountSubagents = () => {
    try {
      const agent = ctx.agents?.roots?.()[0] ?? ctx.agents?.list?.()[0]
      if (!subagentJobs || !agent || typeof subagentJobs.list !== 'function') return
      const snaps = (subagentJobs.list(agent) ?? []) as Array<Record<string, unknown>>
      let n = 0
      for (const s of snaps) {
        if (s && s.kind === 'subagent' && (s.status === 'running' || s.status === 'stopping')) n++
      }
      if (n !== subagentRunning) {
        subagentRunning = n
        diag(`subagents: ${n}`)
      }
    } catch {
      // ignore
    }
  }
  if (subagentJobs) {
    if (typeof subagentJobs.onJobsChanged === 'function') subagentJobs.onJobsChanged(() => recountSubagents())
    if (typeof subagentJobs.onJobDone === 'function') subagentJobs.onJobDone(() => recountSubagents())
    if (ctx.on) {
      ctx.on('subagent/start', () => recountSubagents())
      ctx.on('subagent/end', () => recountSubagents())
    }
    recountSubagents()
    setTimeout(recountSubagents, 3000) // 启动后兜底
  }

  // 事件流：任意会话事件都更新当前活跃会话引用（whale-widget 同款方式，重启后会话恢复也能拿到）
  ctx.on('session/event', (session: any) => {
    if (session) currentSession = session
  })

  // 工作状态机（轻量版）：thinking → done → idle。done 判定复用 buildState 的 measure 缓存（60 秒节奏），
  // 不新增任何 measure 调用（此前 10 秒一次的全量 measure 拖慢宿主，曾致渲染器启动超时，已回滚）
  let workState: 'idle' | 'thinking' | 'done' = 'idle'
  let workStateSince = Date.now()
  let lastGrowthTotal = -1
  let lastGrowthAt = 0
  let lastMeasureTotal = 0
  function setWorkState(s: 'idle' | 'thinking' | 'done'): void {
    if (workState === s) return
    workState = s
    workStateSince = Date.now()
    if (s === 'thinking') {
      lastGrowthTotal = -1
      lastGrowthAt = Date.now()
    }
    diag(`workstate: ${s}`)
  }
  // 用户发消息 → 思考中（事件名沿用 pelican 生态验证过的用法；try 包裹防宿主版本差异）
  try {
    ctx.on('agent/inbox/inserted', () => setWorkState('thinking'))
  } catch {
    diag('workstate: agent/inbox/inserted 事件不可用')
  }

  // 每轮消耗：turn 即将结束时用 tokenMeter 测当前会话 token，估算本轮成本 + 记入当前小时桶
  ctx.on('agent/turn-stopping', (payload: any) => {
    setWorkState('done')
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
        // 工作状态机：缓存本次 measure 总量，用于 done 判定（60 秒节奏，零额外成本）
        lastMeasureTotal = Number(m?.totalTokens ?? m?.tokens ?? m?.total ?? 0)
        if (workState === 'thinking') {
          if (lastMeasureTotal !== lastGrowthTotal) {
            lastGrowthTotal = lastMeasureTotal
            lastGrowthAt = Date.now()
          } else if (lastGrowthTotal >= 0 && Date.now() - lastGrowthAt > 50000) {
            setWorkState('done')
          }
        }
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
      peakLow: peak,
      refreshMs: widgetConfig.realtimeBalance ? 10000 : 60000,
      subagentRunning
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
    // 工作状态端点：done 30 秒、thinking 10 分钟惰性过期归 idle
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/workstate',
      handler: (req: unknown, res: any) => {
        let s = workState
        const age = Date.now() - workStateSince
        if (s === 'done' && age > 30000) s = 'idle'
        if (s === 'thinking' && age > 600000) s = 'idle'
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        })
        res.end(JSON.stringify({ state: s, since: workStateSince }))
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

    // API providers list + per-provider balance (parallel; null when unsupported)
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/providers',
      handler: (req: unknown, res: any) => {
        void (async () => {
          const creds = ctx.credentials ?? ctx.get('credentials')
          const cur = currentModel()
          const rows = await Promise.all(listProviders().map(async (p) => {
            let balance: number | null = null
            let currency = 'CNY'
            if (p.apiKeyEnv && creds) {
              try {
                const ref = await creds.resolve(p.apiKeyEnv)
                const key = typeof ref === 'string' ? ref : ref && typeof ref === 'object' ? (ref as any).value : undefined
                if (key) {
                  const r = await fetchProviderBalance({ family: p.family, baseURL: p.baseURL }, key)
                  if (r) { balance = r.totalBalance; currency = r.currency }
                }
              } catch {
                // balance stays null
              }
            }
            return { ...p, balance, currency, active: p.id === cur.provider }
          }))
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          })
          res.end(JSON.stringify({ providers: rows, current: cur }))
        })()
      }
    })

    // Switch default model route (writes agent-default-model in settings.yaml)
    server.register({
      kind: 'exact',
      path: '/dsh-whale-girl/api/select-model',
      handler: (req: any, res: any) => {
        let body = ''
        req.on('data', (c: Buffer) => {
          body += String(c)
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body) as { provider?: string; model?: string }
            const provider = String(parsed.provider ?? '')
            const model = String(parsed.model ?? '')
            if (!provider || !model) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
              res.end(JSON.stringify({ ok: false, error: 'provider and model required' }))
              return
            }
            const ok = selectModel(provider, model)
            diag(`select-model ${provider}/${model} ok=${ok}`)
            res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok }))
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok: false, error: 'bad json' }))
          }
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
  var nextDelay = 60000
  var pull = function () {
    try {
      fetch('/dsh-whale-girl/api/state', { cache: 'no-store' })
        .then(function (r) { return r.json() })
        .then(function (d) {
          if (d && typeof d === 'object') {
            window.__wgData = d
            window.postMessage({ __wgData: d }, '*')
          }
          if (d && typeof d.refreshMs === 'number') nextDelay = d.refreshMs
          setTimeout(pull, nextDelay)
        })
        .catch(function () { setTimeout(pull, nextDelay) })
    } catch (e) { setTimeout(pull, nextDelay) }
  }
  pull()
  // 注：pull 自调度，间隔跟随 /api/state 的 refreshMs（实时切换即时生效）
  // 工作状态：5 秒轮询并广播给挂件（读取轻量端点，不触发 measure）
  var pullWork = function () {
    try {
      fetch('/dsh-whale-girl/api/workstate', { cache: 'no-store' })
        .then(function (r) { return r.json() })
        .then(function (d) {
          if (d && d.state) {
            window.__wgWorkState = d
            window.postMessage({ __wgWorkState: d }, '*')
          }
        })
        .catch(function () {})
    } catch (e) {}
  }
  pullWork()
  setInterval(pullWork, 5000)
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
