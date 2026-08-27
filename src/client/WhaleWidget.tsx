import React, { useRef, useState, useCallback, useEffect } from 'react'
import { WIDGET_CSS } from './styles'
import { ContextBar, WhaleState } from './ContextBar'
import { Bubble } from './Bubble'
import { EasterEgg } from './EasterEgg'
import { pickRandomIdleLine } from './quotes'
import { SoundEngine } from './SoundEngine'
import { FlingTracker, startFling } from './PhysicsFling'
import { WHALE_GIRL_DATA_URL } from './whaleDataUrl'
import { WidgetMenu, MenuConfig, DEFAULT_MENU_CONFIG } from './WidgetMenu'

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

const WIDGET_W = 170
const WIDGET_H = 180
/** 松手速度（px/s）超过此值进入甩抛弹跳模式。 */
const FLING_SPEED = 1200

function normalizeConfig(o: unknown): MenuConfig {
  const any = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>
  return {
    soundMode: any.soundMode === 'duck' ? 'duck' : 'cute',
    showProgress: any.showProgress !== false,
    showBubble: any.showBubble !== false,
    showBalance: any.showBalance !== false,
    showPeak: any.showPeak !== false
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
  const [state, setState] = useState<WhaleState>(EMPTY_STATE)
  const [bubble, setBubble] = useState<string | null>(null)
  const [imgSrc] = useState<string>(WHALE_GIRL_DATA_URL)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [config, setConfig] = useState<MenuConfig>(loadLocalConfig)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  const trackerRef = useRef(new FlingTracker())
  const flingRef = useRef<{ cancel: () => void } | null>(null)
  const bounceTimerRef = useRef(0)
  const eggRef = useRef(new EasterEgg())
  const soundRef = useRef<SoundEngine | null>(null)
  if (soundRef.current === null) soundRef.current = new SoundEngine()

  // 应用音效模式
  useEffect(() => {
    soundRef.current?.setMode(config.soundMode)
  }, [config.soundMode])

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
      flingRef.current?.cancel()
    }
  }, [])

  // 右键菜单
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])

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

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = rootRef.current
      if (!el) return
      stopFling()
      const rect = el.getBoundingClientRect()
      dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
      pressStartRef.current = { x: e.clientX, y: e.clientY }
      trackerRef.current.clear()
      setPressed(true)
      setDragging(true)
      soundRef.current?.unlock()
      soundRef.current?.press()
      try {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    },
    [stopFling]
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    trackerRef.current.push(e.clientX, e.clientY)
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - WIDGET_W, e.clientX - dragRef.current.dx)),
      y: Math.max(0, Math.min(window.innerHeight - WIDGET_H, e.clientY - dragRef.current.dy))
    })
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pressStartRef.current
      const moved = start !== null && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6
      const vel = trackerRef.current.velocity()
      trackerRef.current.clear()
      dragRef.current = null
      pressStartRef.current = null
      setPressed(false)
      setDragging(false)
      soundRef.current?.release()

      // 点击（非拖拽）：触发彩蛋/随机台词（仅当气泡模块开启）
      if (!moved) {
        if (config.showBubble) {
          const r = eggRef.current.onPress()
          setBubble(r.kind === 'quote' ? r.text : pickRandomIdleLine())
        }
      } else if (vel && Math.hypot(vel.vx, vel.vy) >= FLING_SPEED) {
        // 快速甩抛：进入弹跳模式
        const el = rootRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          setFlinging(true)
          flingRef.current = startFling({
            x: rect.left,
            y: rect.top,
            vx: vel.vx,
            vy: vel.vy,
            width: WIDGET_W,
            height: WIDGET_H,
            onMove: (x, y) => setPos({ x, y }),
            onBounce: () => {
              soundRef.current?.bounce()
              shake()
            },
            onDone: (x, y) => {
              flingRef.current = null
              setFlinging(false)
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
    [shake, snap, config.showBubble]
  )

  return (
    <>
      <style>{WIDGET_CSS}</style>
      <div
        ref={rootRef}
        className={`wg-root${dragging ? ' wg-dragging' : ''}${flinging ? ' wg-flinging' : ''}${bounce ? ' wg-bounce' : ''}`}
        style={{ left: pos.x, top: pos.y, transform: pressed ? 'scale(0.9)' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={onContextMenu}
        data-pressed={pressed}
      >
        <img className="wg-img" src={imgSrc || '/dsh-whale-girl/whale-girl.png'} alt="鲸鱼娘" draggable={false} />
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
          <Bubble text={bubble} onClose={() => setBubble(null)} rootRef={rootRef} />
        )}
      </div>
      {menu && (
        <WidgetMenu
          x={menu.x}
          y={menu.y}
          config={config}
          onChange={persistConfig}
          onResetPosition={resetPosition}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}
