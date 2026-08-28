import React, { useRef, useState, useCallback, useEffect } from 'react'
import { WIDGET_CSS } from './styles'
import { ContextBar, WhaleState } from './ContextBar'
import { Bubble } from './Bubble'
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
  peakLow: null
}

/** 本地兜底配置 key（宿主 api/config 不可达时使用）。 */
const CONFIG_KEY = 'whale-girl-config'

/** 中键弹弓功能提示气泡（只提示一次）。 */
const SLING_HINT = '悄悄告诉你：按住中键拖拽再松手，我会像弹弓一样发射！右键菜单可以调发射力度哦～'

const WIDGET_W = 170
const WIDGET_H = 180
/** 松手速度（px/s）超过此值进入甩抛弹跳模式。 */
const FLING_SPEED = 800

function normalizeConfig(o: unknown): MenuConfig {
  const any = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>
  const power = Number(any.slingPower)
  return {
    soundMode: any.soundMode === 'duck' ? 'duck' : 'cute',
    showProgress: any.showProgress !== false,
    showBubble: any.showBubble !== false,
    showBalance: any.showBalance !== false,
    showPeak: any.showPeak !== false,
    slingPower: Number.isFinite(power) ? Math.min(60, Math.max(5, power)) : 20
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
    x: Math.max(0, window.innerWidth - WIDGET_W - 8),
    y: Math.max(0, window.innerHeight - WIDGET_H - 8)
  }))
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
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  // 中键弹弓状态
  const middleModeRef = useRef(false)
  const slingOriginRef = useRef<{ x: number; y: number } | null>(null)
  const trackerRef = useRef(new FlingTracker())
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
      flingRef.current?.cancel()
    }
  }, [])

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
      x: Math.max(0, window.innerWidth - WIDGET_W - 8),
      y: Math.max(0, window.innerHeight - WIDGET_H - 8)
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
    const left = x + WIDGET_W / 2 < vw / 2 ? 8 : vw - WIDGET_W - 8
    const top = Math.max(8, Math.min(window.innerHeight - WIDGET_H - 8, y))
    setPos({ x: Math.max(8, left), y: top })
  }, [])

  // 交互诊断上报：通过 postMessage 发给页面顶层 bridge，由 bridge 用带认证的 fetch 上报宿主写日志
  const reportEvent = useCallback((type: string, extra?: Record<string, unknown>) => {
    try {
      window.postMessage({ __wgEvent: { type, ...extra, t: Date.now() } }, '*')
    } catch {
      // ignore
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = rootRef.current
      if (!el) return
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
    [stopFling, reportEvent]
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
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
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - WIDGET_W, e.clientX - dragRef.current.dx)),
      y: Math.max(0, Math.min(window.innerHeight - WIDGET_H, e.clientY - dragRef.current.dy))
    })
  }, [])

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
        className={`wg-root${dragging ? ' wg-dragging' : ''}${flinging ? ' wg-flinging' : ''}${bounce ? ' wg-bounce' : ''}${bounceAxis === 'x' ? ' wg-squash-x' : ''}${bounceAxis === 'y' ? ' wg-squash-y' : ''}${petted ? ' wg-pet' : ''}${pos.x + WIDGET_W / 2 < window.innerWidth / 2 ? ' wg-flip' : ''}`}
        style={{ left: pos.x, top: pos.y, transform: pressed ? 'scaleY(0.9)' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={onContextMenu}
        data-pressed={pressed}
      >
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
