import React, { useRef, useState, useCallback, useEffect } from 'react'
import { WIDGET_CSS } from './styles'
import { ContextBar, WhaleState } from './ContextBar'
import { Bubble } from './Bubble'
import { InfoPanel } from './InfoPanel'
import { EasterEgg } from './EasterEgg'
import { pickRandomIdleLine } from './quotes'
import { SoundEngine } from './SoundEngine'
import { FlingTracker, startFling } from './PhysicsFling'
import { WHALE_GIRL_DATA_URL } from './whaleDataUrl'
import { RUA_GIF_URL } from './ruaDataUrl'
import { WidgetMenu, MenuConfig, DEFAULT_MENU_CONFIG, ProviderRow } from './WidgetMenu'

const EMPTY_STATE: WhaleState = {
  balance: null,
  currency: 'CNY',
  todayUsage: 0,
  contextPct: 0,
  contextTokens: 0,
  contextLimit: 128000,
  lastTurnCost: null,
  peakLow: null,
  subagentRunning: 0,
  sysInfo: { memPct: 0, memUsed: 0, memTotal: 0, cpu: 0 }
}

/** 本地兜底配置 key（宿主 api/config 不可达时使用）。 */
const CONFIG_KEY = 'whale-girl-config'

/** 中键弹弓功能提示气泡（只提示一次）。 */
const SLING_HINT = '悄悄告诉你：按住中键拖拽再松手，我会像弹弓一样发射！右键菜单可以调发射力度哦～'

const WIDGET_W = 170
const WIDGET_H = 180
/** 松手速度（px/s）超过此值进入甩抛弹跳模式。 */
const FLING_SPEED = 800
/** 信息面板（独立窗口）尺寸。 */
const INFO_W = 132
const INFO_H = 66
/** 信息面板圆角矩形碰撞箱的圆角半径（与视觉 border-radius 一致）。 */
const INFO_RADIUS = 10
/** 角色中心距屏幕水平边超过该值则不吸附（屏幕中间保持自由状态）。 */
const EDGE_SNAP_MARGIN = 120
/** 信息面板独立状态维持时长（ms），之后尝试回归。 */
const FREE_MS = 4000
/** 信息面板当前矩形（共享给角色甩抛做障碍反馈）。 */
let __wgInfoGlobal: { x: number; y: number; w: number; h: number } | null = null
/** 矩形(rx,ry,rw,rh) 与圆(cx,cy,cr) 是否相交。 */
function circleRectHit(rx: number, ry: number, rw: number, rh: number, cx: number, cy: number, cr: number): boolean {
  // 面板用圆角核矩形（四角内缩圆角半径）近似圆角矩形碰撞箱
  const ix = rx + INFO_RADIUS
  const iy = ry + INFO_RADIUS
  const iw = rw - 2 * INFO_RADIUS
  const ih = rh - 2 * INFO_RADIUS
  const nx = Math.max(ix, Math.min(cx, ix + iw))
  const ny = Math.max(iy, Math.min(cy, iy + ih))
  const dx = cx - nx
  const dy = cy - ny
  return dx * dx + dy * dy <= cr * cr
}
/** 面板矩形与角色圆碰撞时的法线（圆中心 → 面板最近点方向 = 面板推开方向）；null=不碰。 */
function panelRoleNormal(px: number, py: number, pW: number, pH: number, cx: number, cy: number, cr: number): { x: number; y: number; depth: number } | null {
  // 面板圆角核矩形（四角内缩圆角半径）作为碰撞箱，角色圆碰内核才算碰撞
  const ix = px + INFO_RADIUS
  const iy = py + INFO_RADIUS
  const iw = pW - 2 * INFO_RADIUS
  const ih = pH - 2 * INFO_RADIUS
  const qx = Math.max(ix, Math.min(cx, ix + iw))
  const qy = Math.max(iy, Math.min(cy, iy + ih))
  let nx = qx - cx
  let ny = qy - cy
  const d2 = nx * nx + ny * ny
  if (d2 > cr * cr) return null
  if (d2 === 0) {
    nx = cx < ix + iw / 2 ? -1 : 1
    ny = cy < iy + ih / 2 ? -1 : 1
  }
  const d = Math.hypot(nx, ny) || 1
  return { x: nx / d, y: ny / d, depth: cr - d }
}

function normalizeConfig(o: unknown): MenuConfig {
  const any = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>
  const power = Number(any.slingPower)
  return {
    soundMode: any.soundMode === 'duck' ? 'duck' : 'cute',
    showProgress: any.showProgress !== false,
    showBubble: any.showBubble !== false,
    showBalance: any.showBalance !== false,
    showPeak: any.showPeak !== false,
    slingPower: Number.isFinite(power) ? Math.min(60, Math.max(5, power)) : 20,
    ecoMode: any.ecoMode !== false,
    frost: Number.isFinite(Number(any.frost)) ? Math.min(16, Math.max(0, Math.round(Number(any.frost)))) : 4,
    panelOpacity: Number.isFinite(Number(any.panelOpacity)) ? Math.min(1, Math.max(0.2, Number(any.panelOpacity))) : 0.82,
    lowBalance: Number.isFinite(Number(any.lowBalance)) ? Math.max(0, Number(any.lowBalance)) : 10,
    showWorkState: any.showWorkState !== false,
    realtimeBalance: any.realtimeBalance === true,
    showInfo: any.showInfo !== false,
    followThreshold: Number.isFinite(Number(any.followThreshold)) ? Math.min(360, Math.max(60, Math.round(Number(any.followThreshold)))) : 180,
    infoFrost: Number.isFinite(Number(any.infoFrost)) ? Math.min(16, Math.max(0, Math.round(Number(any.infoFrost)))) : 4
  }
}

function loadLocalConfig(): MenuConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_MENU_CONFIG
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return DEFAULT_MENU_CONFIG
  }
}

export function WhaleWidget() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(8, window.innerWidth - WIDGET_W - 8),
    y: Math.max(8, window.innerHeight - WIDGET_H - INFO_H - 42)
  }))
  // 信息面板：独立窗口（默认跟随角色；距离超阈值或直接拖拽则脱离）
  const [infoPos] = useState<{ x: number; y: number }>(() => {
    const rw = window.innerWidth
    const rh = window.innerHeight
    const rx = rw - WIDGET_W - 8
    const ry = rh - WIDGET_H - 8
    return {
      x: Math.max(8, Math.min(rw - INFO_W - 8, rx + WIDGET_W / 2 - INFO_W / 2)),
      y: Math.max(8, Math.min(rh - INFO_H - 8, ry + WIDGET_H + 12))
    }
  })
  const [pressed, setPressed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [flinging, setFlinging] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [bounceAxis, setBounceAxis] = useState<'x' | 'y' | null>(null)
  const [petted, setPetted] = useState(false)
  const [petKey, setPetKey] = useState(0)
  const [state, setState] = useState<WhaleState>(EMPTY_STATE)
  const [bubble, setBubble] = useState<string | null>(null)
  const [imgSrc] = useState<string>(WHALE_GIRL_DATA_URL)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [providers, setProviders] = useState<ProviderRow[] | null>(null)
  const [switching, setSwitching] = useState<string | null>(null)
  const [config, setConfig] = useState<MenuConfig>(loadLocalConfig)
  // 中键弹弓：线（原位置中心 → 当前中心），null = 未激活
  const [sling, setSling] = useState<{ fx: number; fy: number; tx: number; ty: number } | null>(null)
  // 省电模式：空闲（挂件无交互）超过 60 秒 = true，暂停漂浮动画/毛玻璃
  const [ecoIdle, setEcoIdle] = useState(false)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  // 中键弹弓状态
  const middleModeRef = useRef(false)
  const slingOriginRef = useRef<{ x: number; y: number } | null>(null)
  // 省电模式空闲计时器
  const ecoTimerRef = useRef(0)
  // 实用提醒状态：上下文 90% 每页面提醒一次；余额跟踪上次值（跨阈值向下才提醒）
  const ctxWarnedRef = useRef(false)
  const prevBalanceRef = useRef<number | null>(null)
  // 空闲彩蛋计时器
  const idleEggTimerRef = useRef(0)
  const trackerRef = useRef(new FlingTracker())
  const infoPosRef = useRef(infoPos)
  const infoElRef = useRef<HTMLDivElement>(null)
  const infoModeRef = useRef<'follow' | 'free' | 'returning'>('follow')
  const infoVelRef = useRef({ x: 0, y: 0 })
  const freeStartRef = useRef(0)
  const lastRolePosRef = useRef({ x: 0, y: 0 })
  const infoDragRef = useRef<{ dx: number; dy: number } | null>(null)
  const infoMoveLastRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const flingRef = useRef<{ cancel: () => void } | null>(null)
  const bounceTimerRef = useRef(0)
  const petTimerRef = useRef(0)
  const posRef = useRef(pos)
  const eggRef = useRef(new EasterEgg())
  const soundRef = useRef<SoundEngine | null>(null)
  if (soundRef.current === null) soundRef.current = new SoundEngine()

  // 应用音效模式
  useEffect(() => {
    soundRef.current?.setMode(config.soundMode)
  }, [config.soundMode])

  // Agent 工作状态（thinking/done/idle）：由桥接的 workstate 广播驱动
  const [workState, setWorkState] = useState<'idle' | 'thinking' | 'done'>('idle')
  const prevWorkRef = useRef<'idle' | 'thinking' | 'done'>('idle')

  // 省电模式：挂件交互刷新空闲计时，60 秒无交互 → 暂停漂浮动画/停用毛玻璃（.wg-eco）
  const markActive = useCallback(() => {
    setEcoIdle(false)
    window.clearTimeout(ecoTimerRef.current)
    ecoTimerRef.current = window.setTimeout(() => setEcoIdle(true), 60000)
  }, [])

  // 省电模式开关变化时（含加载时）启动空闲计时：60 秒无交互 → 暂停动画/毛玻璃；关闭则立即恢复
  useEffect(() => {
    if (!config.ecoMode) {
      window.clearTimeout(ecoTimerRef.current)
      setEcoIdle(false)
      return
    }
    markActive()
  }, [config.ecoMode, markActive])

  // 彩蛋提示：首次加载 3 秒后用气泡介绍中键弹弓功能（localStorage 记忆，只提示一次）
  useEffect(() => {
    if (!config.showBubble) return
    let hinted = false
    try {
      hinted = localStorage.getItem('wg-sling-hinted') === '1'
    } catch {
      hinted = false
    }
    if (hinted) return
    let hideTimer = 0
    const showTimer = window.setTimeout(() => {
      try {
        localStorage.setItem('wg-sling-hinted', '1')
      } catch {
        // ignore
      }
      setBubble(SLING_HINT)
      hideTimer = window.setTimeout(() => setBubble((b) => (b === SLING_HINT ? null : b)), 9000)
    }, 3000)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [config.showBubble])

  // 实用提醒：上下文 ≥90% 建议开新会话（每次页面加载只提醒一次）
  useEffect(() => {
    if (!config.showBubble || ctxWarnedRef.current) return
    if (state.contextPct >= 0.9) {
      ctxWarnedRef.current = true
      setBubble(
        `上下文已经 ${Math.round(state.contextPct * 100)}% 啦，快满了！建议开个新会话，不然回复会被截断哦～`
      )
    }
  }, [state.contextPct, config.showBubble])

  // 实用提醒：余额跌破预警线（config.lowBalance，0=关闭）；充值回升后再次跌破会重新提醒
  useEffect(() => {
    if (!config.showBubble || config.lowBalance <= 0) return
    const bal = state.balance
    if (bal === null || bal < 0) return
    const prev = prevBalanceRef.current
    prevBalanceRef.current = bal
    if ((prev === null || prev >= config.lowBalance) && bal < config.lowBalance) {
      setBubble(`余额只剩 ¥${bal.toFixed(2)} 啦，记得去充一点哦～`)
    }
  }, [state.balance, config.showBubble, config.lowBalance])

  // 空闲彩蛋：2~5 分钟（随机）无交互时自己说一句；说话即唤醒动画，说完继续省电
  useEffect(() => {
    if (!config.showBubble) return
    const schedule = () => {
      window.clearTimeout(idleEggTimerRef.current)
      idleEggTimerRef.current = window.setTimeout(
        () => {
          setBubble(pickRandomIdleLine())
          markActive()
          schedule()
        },
        120000 + Math.floor(Math.random() * 180000)
      )
    }
    schedule()
    return () => window.clearTimeout(idleEggTimerRef.current)
  }, [config.showBubble, markActive])

  // 数据：宿主在页面顶层注入桥接脚本拉取数据并 postMessage 广播（slots 组件自身 fetch 会被 webserver 403 拦）
  useEffect(() => {
    let alive = true
    const onMsg = (e: MessageEvent) => {
      const d = (e.data || {}) as { __wgData?: unknown }
      if (alive && d.__wgData && typeof d.__wgData === 'object') {
        setState(d.__wgData as WhaleState)
      }
    }
    // 同窗口场景直接读初始值
    const w = window as unknown as { __wgData?: unknown }
    if (w.__wgData && typeof w.__wgData === 'object') {
      setState(w.__wgData as WhaleState)
    }
    window.addEventListener('message', onMsg)
    return () => {
      alive = false
      window.removeEventListener('message', onMsg)
    }
  }, [])

  // 配置：从宿主 GET 加载（失败则保持本地配置）
  useEffect(() => {
    let alive = true
    fetch('/dsh-whale-girl/api/config', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((o) => {
        if (alive && o && typeof o === 'object') setConfig(normalizeConfig(o))
      })
      .catch(() => {
        // 宿主不可达，使用本地配置
      })
    return () => {
      alive = false
    }
  }, [])

  // 保存配置：立即生效 + 本地兜底，并异步写回宿主
  const persistConfig = useCallback((next: MenuConfig) => {
    setConfig(next)
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
    fetch('/dsh-whale-girl/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {
      // 宿主不可达则本地已保存
    })
  }, [])

  // 图片：内嵌 dataURL（不依赖网络请求，避免 webserver 对子资源请求的 403 拦截）

  // 时机彩蛋：上下文 >80% 触发一次吐槽（仅当气泡模块开启）
  useEffect(() => {
    if (!config.showBubble) return
    const line = eggRef.current.onContextHigh(state.contextPct)
    if (line) setBubble(line)
  }, [state.contextPct, config.showBubble])

  // 卸载时清理弹跳循环与抖动画计时
  useEffect(() => {
    return () => {
      window.clearTimeout(bounceTimerRef.current)
      window.clearTimeout(petTimerRef.current)
      window.clearTimeout(ecoTimerRef.current)
      window.clearTimeout(idleEggTimerRef.current)
      flingRef.current?.cancel()
    }
  }, [])

  // 信息面板物理：滞后跟随角色；距离超阈值→独立（自由惯性+撞边界/角色反弹+倒计时）；超时→回归（角色静止则跟随）
  useEffect(() => {
    if (!config.showInfo) return
    if (workState === 'thinking') return
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.max(0.001, Math.min(0.05, (now - last) / 1000))
      last = now
      const p = posRef.current
      // 锚点=角色下方；角色太靠边时 clamp 进视口，避免信息面板跑出屏幕
      const vw = window.innerWidth
      const vh = window.innerHeight
      const cX = (v: number) => Math.max(8, Math.min(vw - INFO_W - 8, v))
      const cY = (v: number) => Math.max(8, Math.min(vh - INFO_H - 8, v))
      const anchor = { x: cX(p.x + WIDGET_W / 2 - INFO_W / 2), y: cY(p.y + WIDGET_H + 12) }
      // 角色圆形碰撞箱（视觉区域，避免矩形含下方空白）
      const roleH = WIDGET_H * 0.78
      const roleCx = p.x + WIDGET_W / 2
      const roleCy = p.y + roleH / 2
      const roleR = Math.max(22, Math.min(WIDGET_W, roleH) / 2 * 0.9)
      if (infoModeRef.current === 'follow') {
        const k = 0.12
        const nx = infoPosRef.current.x + (anchor.x - infoPosRef.current.x) * k
        const ny = infoPosRef.current.y + (anchor.y - infoPosRef.current.y) * k
        const dist = Math.hypot(anchor.x - nx, anchor.y - ny)
        if (dist > config.followThreshold) {
          infoModeRef.current = 'free'
          infoVelRef.current = { x: (nx - infoPosRef.current.x) / dt, y: (ny - infoPosRef.current.y) / dt }
          freeStartRef.current = now
        } else {
          // 跟随时：面板贴角色下方，角色撞面板由甩抛物理(fling)处理（角色反弹+面板动量），这里不主动把面板弹开/瞬移
          infoPosRef.current = { x: nx, y: ny }
        }
      } else if (infoModeRef.current === 'free') {
        // 用户正在直接拖动信息面板 → 交给 onInfoMove，不做惯性
        if (infoDragRef.current) {
          // 保持独立：拖拽中，位置由 onInfoMove 控制
        } else {
          const q = infoPosRef.current
          const v = infoVelRef.current
          infoPosRef.current = { x: q.x + v.x * dt, y: q.y + v.y * dt }
          infoVelRef.current = { x: v.x * 0.997, y: v.y * 0.997 }
          const vw = window.innerWidth
          const vh = window.innerHeight
          if (infoPosRef.current.x < 8) { infoPosRef.current.x = 8; infoVelRef.current.x = Math.abs(infoVelRef.current.x) * 0.8 }
          if (infoPosRef.current.x > vw - INFO_W - 8) { infoPosRef.current.x = vw - INFO_W - 8; infoVelRef.current.x = -Math.abs(infoVelRef.current.x) * 0.8 }
          if (infoPosRef.current.y < 8) { infoPosRef.current.y = 8; infoVelRef.current.y = Math.abs(infoVelRef.current.y) * 0.8 }
          if (infoPosRef.current.y > vh - INFO_H - 8) { infoPosRef.current.y = vh - INFO_H - 8; infoVelRef.current.y = -Math.abs(infoVelRef.current.y) * 0.8 }
          // 与角色（圆）碰撞：沿法线推离**穿透深度**（平滑、不瞬移到固定位置）并反射速度
          const n = panelRoleNormal(infoPosRef.current.x, infoPosRef.current.y, INFO_W, INFO_H, roleCx, roleCy, roleR)
          if (n) {
            infoPosRef.current.x = cX(infoPosRef.current.x + n.x * (n.depth + 2))
            infoPosRef.current.y = cY(infoPosRef.current.y + n.y * (n.depth + 2))
            const dot = infoVelRef.current.x * n.x + infoVelRef.current.y * n.y
            // 标准反射（保持能量）；面板撞角色后至少沿法线弹开，避免特定速度/角度下卡停
            infoVelRef.current = { x: infoVelRef.current.x - 2 * dot * n.x, y: infoVelRef.current.y - 2 * dot * n.y }
            const sp = Math.hypot(infoVelRef.current.x, infoVelRef.current.y)
            if (sp < 40) {
              infoVelRef.current = { x: n.x * 60, y: n.y * 60 }
            }
            // 对称：角色静止被面板撞到 → 角色进入甩抛（被撞飞，带面板动量）
            if (!dragging && !flinging) {
              const pvx = infoVelRef.current.x
              const pvy = infoVelRef.current.y
              if (Math.hypot(pvx, pvy) > 60) {
                setFlinging(true)
                flingRef.current?.cancel()
                let bounced = false
                flingRef.current = startFling({
                  x: p.x,
                  y: p.y,
                  vx: pvx * 0.7,
                  vy: pvy * 0.7,
                  width: WIDGET_W,
                  height: WIDGET_H,
                  getObstacle,
                  onObstacleHit: handleObstacleHit,
                  onMove: (x, y) => setPos({ x, y }),
                  onBounce: (axis) => {
                    bounced = true
                    soundRef.current?.bounce()
                    shake()
                    setBounceAxis(axis)
                    window.clearTimeout(bounceTimerRef.current)
                    bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260)
                  },
                  onDone: (x, y) => {
                    flingRef.current = null
                    setFlinging(false)
                    if (!bounced) soundRef.current?.bounce()
                    snap(x, y)
                  }
                })
              }
            }
          }
          if (now - freeStartRef.current > FREE_MS) infoModeRef.current = 'returning'
        }
      } else {
        // returning：向角色下方移动；到达且角色静止则跟随，否则继续追
        const dx = anchor.x - infoPosRef.current.x
        const dy = anchor.y - infoPosRef.current.y
        const d = Math.hypot(dx, dy)
        if (d < 8) {
          const speed = Math.hypot(p.x - lastRolePosRef.current.x, p.y - lastRolePosRef.current.y) / dt
          if (speed < 4) {
            infoModeRef.current = 'follow'
            infoVelRef.current = { x: 0, y: 0 }
          }
        } else {
          infoPosRef.current = { x: infoPosRef.current.x + dx * 0.15, y: infoPosRef.current.y + dy * 0.15 }
        }
      }
      lastRolePosRef.current = { x: p.x, y: p.y }
      // 直接写 DOM（不每帧 setState，避免 60fps 全量 re-render 卡住渲染器导致 boot 失败）
      const iel = infoElRef.current
      if (iel) {
        iel.style.transform = `translate3d(${infoPosRef.current.x}px,${infoPosRef.current.y}px,0)`
      }
      __wgInfoGlobal = { x: infoPosRef.current.x, y: infoPosRef.current.y, w: INFO_W, h: INFO_H }
      // 减负：改为低频调度（约 20fps），面板跟随/碰撞足够平滑，显著降 CPU
    }
    // 位置用 rAF 高频顺滑更新（直接写 DOM 轻量），避免降频导致"一帧一帧走"
    let raf = 0
    const loop = (now: number) => {
      step(now)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [config.showInfo, config.followThreshold, workState])

  // 右键菜单
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
    setProviders(null)
    fetch('/dsh-whale-girl/api/providers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d && Array.isArray(d.providers)) setProviders(d.providers)
        else setProviders([])
      })
      .catch(() => setProviders([]))
  }, [])

  // 信息面板拖拽：直接拖动信息面板 → 进入独立状态（跟手移动；松手后自由+倒计时回归）
  const onInfoDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      infoModeRef.current = 'free'
      freeStartRef.current = performance.now()
      infoDragRef.current = { dx: e.clientX - infoPosRef.current.x, dy: e.clientY - infoPosRef.current.y }
      infoVelRef.current = { x: 0, y: 0 }
      infoMoveLastRef.current = { x: infoPosRef.current.x, y: infoPosRef.current.y, t: performance.now() }
      try {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    []
  )
  const onInfoMove = useCallback(
    (e: React.PointerEvent) => {
      if (!infoDragRef.current) return
      let nx = e.clientX - infoDragRef.current.dx
      let ny = e.clientY - infoDragRef.current.dy
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (nx < 8) nx = 8
      if (nx > vw - INFO_W - 8) nx = vw - INFO_W - 8
      if (ny < 8) ny = 8
      if (ny > vh - INFO_H - 8) ny = vh - INFO_H - 8
      infoPosRef.current = { x: nx, y: ny }
      // 记录拖拽速度（松手后作为甩抛惯性）
      const now = performance.now()
      const lastM = infoMoveLastRef.current
      if (lastM) {
        const dts = Math.max(8, now - lastM.t)
        infoVelRef.current = { x: ((nx - lastM.x) / dts) * 1000, y: ((ny - lastM.y) / dts) * 1000 }
        infoMoveLastRef.current = { x: nx, y: ny, t: now }
      } else {
        infoVelRef.current = { x: 0, y: 0 }
      }
      if (infoElRef.current) {
        infoElRef.current.style.transform = `translate3d(${nx}px,${ny}px,0)`
      }
      // 拖拽面板撞到静止/吸附角色 → 角色获得动量（被撞飞）
      if (!dragging && !flinging) {
        const roleH = WIDGET_H * 0.78
        const roleCx = posRef.current.x + WIDGET_W / 2
        const roleCy = posRef.current.y + roleH / 2
        const roleR = Math.max(22, Math.min(WIDGET_W, roleH) / 2 * 0.9)
        if (circleRectHit(infoPosRef.current.x, infoPosRef.current.y, INFO_W, INFO_H, roleCx, roleCy, roleR)) {
          const pvx = infoVelRef.current.x
          const pvy = infoVelRef.current.y
          if (Math.hypot(pvx, pvy) > 60) {
            setFlinging(true)
            flingRef.current?.cancel()
            let bounced = false
            flingRef.current = startFling({
              x: posRef.current.x,
              y: posRef.current.y,
              vx: pvx * 0.7,
              vy: pvy * 0.7,
              width: WIDGET_W,
              height: WIDGET_H,
              getObstacle,
              onObstacleHit: handleObstacleHit,
              onMove: (x, y) => setPos({ x, y }),
              onBounce: (axis) => {
                bounced = true
                soundRef.current?.bounce()
                shake()
                setBounceAxis(axis)
                window.clearTimeout(bounceTimerRef.current)
                bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260)
              },
              onDone: (x, y) => {
                flingRef.current = null
                setFlinging(false)
                if (!bounced) soundRef.current?.bounce()
                snap(x, y)
              }
            })
          }
        }
      }
    },
    []
  )
  const getObstacle = useCallback(() => __wgInfoGlobal, [])
  const handleObstacleHit = useCallback((invx: number, invy: number) => {
    // 角色撞到面板：面板获得角色入射动量（被撞飞，速度 = 角色速度 * 0.8）
    infoModeRef.current = 'free'
    infoVelRef.current = { x: invx * 0.8, y: invy * 0.8 }
    freeStartRef.current = performance.now()
  }, [])
  const onInfoUp = useCallback(
    (e: React.PointerEvent) => {
      if (!infoDragRef.current) return
      infoDragRef.current = null
      freeStartRef.current = performance.now()
      try {
        ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      } catch {
        // ignore
      }
    },
    []
  )

  // Switch default API provider (writes agent-default-model in settings.yaml)
  const handleSwitchProvider = useCallback((id: string) => {
    const row = providers?.find((p) => p.id === id)
    if (!row || switching) return
    setSwitching(id)
    // 优先用该 provider 在 settings.yaml 里声明的第一个模型；未声明时回退已知映射
    const FALLBACK_MODEL: Record<string, string> = {
      'zai-coding-cn': 'glm-5.3-flash',
      siliconflow: 'deepseek-ai/DeepSeek-V4-Flash',
      'deepseek-official': 'deepseek-v4-flash'
    }
    const model = row.models && row.models.length > 0 ? row.models[0] : (FALLBACK_MODEL[id] ?? '')
    fetch('/dsh-whale-girl/api/select-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: id, model })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.ok) {
          setBubble('已切换到 ' + (row.name || id))
        } else {
          setBubble('切换失败，请检查模型配置')
        }
      })
      .catch(() => setBubble('切换失败，网络错误'))
      .finally(() => {
        setSwitching(null)
        window.setTimeout(() => setBubble(null), 3000)
      })
  }, [providers, switching])

  const resetPosition = useCallback(() => {
    setPos({
      x: Math.max(8, window.innerWidth - WIDGET_W - 8),
      y: Math.max(8, window.innerHeight - WIDGET_H - INFO_H - 42)
    })
    setMenu(null)
  }, [])

  const stopFling = useCallback(() => {
    if (flingRef.current) {
      flingRef.current.cancel()
      flingRef.current = null
    }
    setFlinging(false)
  }, [])

  const shake = useCallback(() => {
    setBounce(true)
    window.clearTimeout(bounceTimerRef.current)
    bounceTimerRef.current = window.setTimeout(() => setBounce(false), 300)
  }, [])

  /** 弹跳结束后：平滑吸附到最近侧边（保留当前垂直位置）。 */
  const snap = useCallback((x: number, y: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const px = Math.max(8, Math.min(vw - WIDGET_W - 8, x))
    const py = Math.max(8, Math.min(vh - WIDGET_H - 8, y))
    // 用角色窗口边缘距最近水平边判断（角色贴边才吸附，不因角色宽而误判）
    const edgeDist = Math.min(x, vw - (x + WIDGET_W))
    if (edgeDist > EDGE_SNAP_MARGIN) {
      setPos({ x: px, y: py })
      return
    }
    const left = x + WIDGET_W / 2 < vw / 2 ? 8 : vw - WIDGET_W - 8
    setPos({ x: Math.max(8, left), y: Math.max(8, Math.min(vh - WIDGET_H - 8, y)) })
  }, [])

  // 交互诊断上报：通过 postMessage 发给页面顶层 bridge，由 bridge 用带认证的 fetch 上报宿主写日志
  const reportEvent = useCallback((type: string, extra?: Record<string, unknown>) => {
    try {
      window.postMessage({ __wgEvent: { type, ...extra, t: Date.now() } }, '*')
    } catch {
      // ignore
    }
  }, [])

  // Agent 工作状态：桥接 5 秒轮询广播（同窗口场景直接读初始值）
  useEffect(() => {
    const onWork = (e: MessageEvent) => {
      const d = (e.data || {}) as { __wgWorkState?: { state?: 'idle' | 'thinking' | 'done' } }
      if (d.__wgWorkState?.state) setWorkState(d.__wgWorkState.state)
    }
    window.addEventListener('message', onWork)
    const w = window as unknown as { __wgWorkState?: { state?: 'idle' | 'thinking' | 'done' } }
    if (w.__wgWorkState?.state) setWorkState(w.__wgWorkState.state)
    return () => window.removeEventListener('message', onWork)
  }, [])

  // 状态过渡台词与庆祝：进入 thinking → 「让我想想…」；进入 done → 「搞定啦」+ 摸头动画 + 音效
  useEffect(() => {
    const prev = prevWorkRef.current
    if (prev === workState) return
    prevWorkRef.current = workState
    if (workState === 'thinking' && config.showBubble && config.showWorkState) {
      setBubble('让我想想…')
    }
    if (workState === 'done' && config.showWorkState) {
      if (config.showBubble) setBubble('任务搞定啦！🎉')
      setPetted(true)
      setPetKey((k) => k + 1)
      window.clearTimeout(petTimerRef.current)
      petTimerRef.current = window.setTimeout(() => setPetted(false), 260)
      soundRef.current?.bounce()
      reportEvent('workstate', { state: 'done' })
    }
  }, [workState, config.showBubble, config.showWorkState, reportEvent])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = rootRef.current
      if (!el) return
      markActive()
      stopFling()
      const rect = el.getBoundingClientRect()
      // 中键：弹弓模式（记录原位置，画连接线；松开时沿原位置→当前位置方向抛掷）
      if (e.button === 1) {
        e.preventDefault()
        e.stopPropagation()
        const ox = posRef.current.x
        const oy = posRef.current.y
        middleModeRef.current = true
        slingOriginRef.current = { x: ox, y: oy }
        dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
        setSling({
          fx: ox + WIDGET_W / 2,
          fy: oy + WIDGET_H / 2,
          tx: ox + WIDGET_W / 2,
          ty: oy + WIDGET_H / 2
        })
        setPressed(true)
        setDragging(true)
        soundRef.current?.unlock()
        try {
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        } catch {
          // ignore
        }
        return
      }
      dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
      pressStartRef.current = { x: e.clientX, y: e.clientY }
      trackerRef.current.clear()
      setPressed(true)
      setDragging(true)
      soundRef.current?.unlock()
      if (soundRef.current) soundRef.current.onPlayResult = (ok, err) => reportEvent('play', { ok, err })
      soundRef.current?.press()
      reportEvent('sound', { kind: 'press' })
      reportEvent('audio-debug', soundRef.current?.debug() as Record<string, unknown>)
      try {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    [stopFling, markActive, reportEvent]
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    markActive()
    if (!dragRef.current) return
    // 中键弹弓：挂件跟手，更新连接线（原位置中心 → 当前位置中心）
    if (middleModeRef.current) {
      const nx = Math.max(0, Math.min(window.innerWidth - WIDGET_W, e.clientX - dragRef.current.dx))
      const ny = Math.max(0, Math.min(window.innerHeight - WIDGET_H, e.clientY - dragRef.current.dy))
      setPos({ x: nx, y: ny })
      const o = slingOriginRef.current
      if (o) {
        setSling({ fx: o.x + WIDGET_W / 2, fy: o.y + WIDGET_H / 2, tx: nx + WIDGET_W / 2, ty: ny + WIDGET_H / 2 })
      }
      return
    }
    trackerRef.current.push(e.clientX, e.clientY)
    let nx = Math.max(0, Math.min(window.innerWidth - WIDGET_W, e.clientX - dragRef.current.dx))
    let ny = Math.max(0, Math.min(window.innerHeight - WIDGET_H, e.clientY - dragRef.current.dy))
    // 拖拽角色撞到信息面板：角色始终跟随鼠标（不挡回），面板被角色有力推开让位
    const ob = __wgInfoGlobal
    if (ob && nx < ob.x + ob.w && nx + WIDGET_W > ob.x && ny < ob.y + ob.h && ny + WIDGET_H > ob.y) {
      const rv = trackerRef.current.velocity()
      if (rv) {
        infoModeRef.current = 'free'
        infoVelRef.current = { x: rv.vx * 1.0, y: rv.vy * 1.0 }
        freeStartRef.current = performance.now()
      }
    }
    setPos({ x: nx, y: ny })
  }, [markActive])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      // 中键弹弓：松开时沿「原位置 → 当前位置」方向赋予动能抛掷
      if (middleModeRef.current) {
        middleModeRef.current = false
        const origin = slingOriginRef.current
        slingOriginRef.current = null
        const el = rootRef.current
        const rect = el?.getBoundingClientRect()
        dragRef.current = null
        pressStartRef.current = null
        setPressed(false)
        setDragging(false)
        setSling(null)
        try {
          ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
        } catch {
          // ignore
        }
        if (origin && rect) {
          const fromX = origin.x + WIDGET_W / 2
          const fromY = origin.y + WIDGET_H / 2
          const toX = rect.left + WIDGET_W / 2
          const toY = rect.top + WIDGET_H / 2
          // 弹弓：松手后弹回「原位置」方向（橡皮筋拉回），与拖动方向相反
          const dx = fromX - toX
          const dy = fromY - toY
          const dist = Math.hypot(dx, dy)
          if (dist > 10) {
            // 速度与拉开的距离成正比（弹弓手感），系数可在右键菜单调节，不设上限
            const speed = dist * (config.slingPower || 20)
            const vx = (dx / dist) * speed
            const vy = (dy / dist) * speed
            setFlinging(true)
            let bounced = false
            reportEvent('sling', { vx, vy, dist })
            flingRef.current = startFling({
              x: rect.left,
              y: rect.top,
              vx,
              vy,
              width: WIDGET_W,
              height: WIDGET_H,
              getObstacle,
              onObstacleHit: handleObstacleHit,
              onMove: (x, y) => setPos({ x, y }),
              onBounce: (axis) => {
                bounced = true
                reportEvent('bounce', { axis })
                reportEvent('sound', { kind: 'bounce' })
                soundRef.current?.bounce()
                shake()
                setBounceAxis(axis)
                window.clearTimeout(bounceTimerRef.current)
                bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260)
              },
              onDone: (x, y) => {
                flingRef.current = null
                setFlinging(false)
                if (!bounced) soundRef.current?.bounce()
                snap(x, y)
              }
            })
          } else {
            snap(rect.left, rect.top)
          }
        }
        return
      }
      const start = pressStartRef.current
      const moved = start !== null && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6
      const vel = trackerRef.current.velocity()
      trackerRef.current.clear()
      dragRef.current = null
      pressStartRef.current = null
      setPressed(false)
      setDragging(false)
      soundRef.current?.release()
      reportEvent('sound', { kind: 'release' })

      // 点击（非拖拽）：触发彩蛋/随机台词（仅当气泡模块开启）
      if (!moved) {
        reportEvent('click')
        setPetted(true)
        setPetKey((k) => k + 1)
        window.clearTimeout(petTimerRef.current)
        petTimerRef.current = window.setTimeout(() => setPetted(false), 260)
        if (config.showBubble) {
          const r = eggRef.current.onPress()
          setBubble(r.kind === 'quote' ? r.text : pickRandomIdleLine())
        }
      } else if (vel && Math.hypot(vel.vx, vel.vy) >= FLING_SPEED) {
        reportEvent('fling', { vx: vel.vx, vy: vel.vy })
        // 快速甩抛：进入弹跳模式
        const el = rootRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          setFlinging(true)
          let bounced = false
          flingRef.current = startFling({
            x: rect.left,
            y: rect.top,
            vx: vel.vx,
            vy: vel.vy,
            width: WIDGET_W,
            height: WIDGET_H,
            getObstacle,
            onObstacleHit: handleObstacleHit,
            onMove: (x, y) => setPos({ x, y }),
            onBounce: (axis) => {
              bounced = true
              reportEvent('bounce', { axis })
              reportEvent('sound', { kind: 'bounce' })
              soundRef.current?.bounce()
              shake()
              setBounceAxis(axis)
              window.clearTimeout(bounceTimerRef.current)
              bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260)
            },
            onDone: (x, y) => {
              flingRef.current = null
              setFlinging(false)
              // 未撞边（低速）也播一次弹跳完成音
              if (!bounced) {
                soundRef.current?.bounce()
                reportEvent('sound', { kind: 'bounce' })
              }
              snap(x, y)
            }
          })
        }
      } else {
        // 慢速拖拽：正常吸附
        const el = rootRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          snap(rect.left, rect.top)
        }
      }

      try {
        ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      } catch {
        // ignore
      }
    },
    [shake, snap, config.showBubble, config.slingPower, reportEvent]
  )

  // 窗口变化：把挂件 clamp 回窗口内，并依据相对位移给动量，让它在窗口内反弹
  useEffect(() => {
    posRef.current = pos
  }, [pos])
  useEffect(() => {
    const onResize = () => {
      const nw = window.innerWidth
      const nh = window.innerHeight
      const prev = posRef.current
      const nx = Math.max(0, Math.min(prev.x, nw - WIDGET_W - 8))
      const ny = Math.max(0, Math.min(prev.y, nh - WIDGET_H - 8))
      const dx = prev.x - nx
      const dy = prev.y - ny
      setPos({ x: nx, y: ny })
      if (Math.hypot(dx, dy) > 6) {
        setFlinging(true)
        let bounced = false
        flingRef.current = startFling({
          x: nx,
          y: ny,
          vx: dx * 5,
          vy: dy * 5,
          width: WIDGET_W,
          height: WIDGET_H,
          getObstacle,
          onObstacleHit: handleObstacleHit,
          onMove: (x, y) => setPos({ x, y }),
          onBounce: (axis) => {
            bounced = true
            reportEvent('bounce', { axis })
            reportEvent('sound', { kind: 'bounce' })
            soundRef.current?.bounce()
            shake()
            setBounceAxis(axis)
            window.clearTimeout(bounceTimerRef.current)
            bounceTimerRef.current = window.setTimeout(() => setBounceAxis(null), 260)
          },
          onDone: (x, y) => {
            flingRef.current = null
            setFlinging(false)
            // 未撞边（低速）也播一次弹跳完成音
            if (!bounced) soundRef.current?.bounce()
            snap(x, y)
          }
        })
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [reportEvent, shake, snap])

  return (
    <>
      <style>{WIDGET_CSS}</style>
      <div
        ref={rootRef}
        className={`wg-root${dragging ? ' wg-dragging' : ''}${flinging ? ' wg-flinging' : ''}${bounce ? ' wg-bounce' : ''}${bounceAxis === 'x' ? ' wg-squash-x' : ''}${bounceAxis === 'y' ? ' wg-squash-y' : ''}${petted ? ' wg-pet' : ''}${config.ecoMode && ecoIdle ? ' wg-eco' : ''}${pos.x + WIDGET_W / 2 < window.innerWidth / 2 ? ' wg-flip' : ''}`}
        style={
          {
            left: 0,
            top: 0,
            transform: `translate3d(${pos.x}px,${pos.y}px,0)${pressed ? ' scaleY(0.9)' : ''}`,
            '--wg-frost': config.frost,
            '--wg-panel-alpha': config.panelOpacity
          } as React.CSSProperties
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={onContextMenu}
        data-pressed={pressed}
      >
        {config.showWorkState && workState !== 'idle' && (
          <div className={`wg-workstate${workState === 'done' ? ' wg-ws-done' : ''}`} key={workState}>
            {workState === 'thinking' ? '思考中…' : '搞定啦！'}
          </div>
        )}
        {config.showWorkState && state.subagentRunning > 0 && (
          <div className="wg-subagent">分身×{state.subagentRunning}</div>
        )}
        <img className="wg-img" src={imgSrc || '/dsh-whale-girl/whale-girl.png'} alt="鲸鱼娘" draggable={false} />
        {petted && (
          <div className="wg-rua" key={petKey}>
            <img src={RUA_GIF_URL} alt="" draggable={false} />
          </div>
        )}
        {config.showProgress && (
          <ContextBar
            pct={state.contextPct}
            tokens={state.contextTokens}
            limit={state.contextLimit}
            balance={state.balance}
            currency={state.currency}
            todayUsage={state.todayUsage}
            lastTurnCost={state.lastTurnCost}
            peakLow={state.peakLow}
            showBalance={config.showBalance}
            showPeak={config.showPeak}
          />
        )}
        {config.showBubble && bubble && (
          <Bubble
            text={bubble}
            onClose={() => setBubble(null)}
            flip={pos.x + WIDGET_W / 2 < window.innerWidth / 2}
          />
        )}
      </div>
      {config.showInfo && (
        <div
          ref={infoElRef}
          style={{ position: 'fixed', zIndex: 2147483646, ['--wg-frost' as any]: `${config.infoFrost}px` }}
          onPointerDown={onInfoDown}
          onPointerMove={onInfoMove}
          onPointerUp={onInfoUp}
        >
          <InfoPanel sys={state.sysInfo} />
        </div>
      )}
      {sling &&
        (() => {
          const fx = sling.fx
          const fy = sling.fy
          const tx = sling.tx
          const ty = sling.ty
          // 水滴连接带：两端圆 + 中间细腰（果冻/拉长的液滴造型）
          const ang = Math.atan2(ty - fy, tx - fx)
          const nx = -Math.sin(ang)
          const ny = Math.cos(ang)
          const r1 = 11 // 起点圆半径
          const r2 = 11 // 终点圆半径
          const waist = 4 // 中间细腰内凹量
          const a1x = fx + nx * r1, a1y = fy + ny * r1
          const a2x = fx - nx * r1, a2y = fy - ny * r1
          const b1x = tx + nx * r2, b1y = ty + ny * r2
          const b2x = tx - nx * r2, b2y = ty - ny * r2
          const mx = (fx + tx) / 2, my = (fy + ty) / 2
          const c1x = mx - nx * waist, c1y = my - ny * waist
          const c2x = mx + nx * waist, c2y = my + ny * waist
          const dripPath = `M ${a1x.toFixed(1)} ${a1y.toFixed(1)} Q ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${b1x.toFixed(1)} ${b1y.toFixed(1)} A ${r2} ${r2} 0 0 1 ${b2x.toFixed(1)} ${b2y.toFixed(1)} Q ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${a2x.toFixed(1)} ${a2y.toFixed(1)} A ${r1} ${r1} 0 0 1 ${a1x.toFixed(1)} ${a1y.toFixed(1)} Z`
          return (
            <svg
              className="wg-slingshot"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 2147483646,
                overflow: 'visible'
              }}
            >
              <defs>
                <linearGradient id="wg-drip-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(120,170,255,0.9)" />
                  <stop offset="100%" stopColor="rgba(74,108,247,0.9)" />
                </linearGradient>
                <filter id="wg-drip-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* 柔光层 */}
              <path
                d={dripPath}
                fill="rgba(74,108,247,0.3)"
                filter="url(#wg-drip-glow)"
              />
              {/* 主水滴连接带 */}
              <path d={dripPath} fill="url(#wg-drip-grad)" />
              {/* 两端圆点（发光核心，统一 DeepSeek 蓝） */}
              <circle cx={fx} cy={fy} r={7} fill="rgba(120,170,255,0.9)" filter="url(#wg-drip-glow)" />
              <circle cx={tx} cy={ty} r={7} fill="rgba(74,108,247,0.9)" filter="url(#wg-drip-glow)" />
              <circle cx={fx} cy={fy} r={3} fill="#fff" />
              <circle cx={tx} cy={ty} r={3} fill="#fff" />
            </svg>
          )
        })()}
      {menu && (
        <WidgetMenu
          x={menu.x}
          y={menu.y}
          config={config}
          onChange={persistConfig}
          onResetPosition={resetPosition}
          onClose={() => setMenu(null)}
          providers={providers}
          onSwitchProvider={handleSwitchProvider}
          switching={switching}
        />
      )}
    </>
  )
}
