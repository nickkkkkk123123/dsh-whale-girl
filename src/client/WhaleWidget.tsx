import React, { useRef, useState, useCallback, useEffect } from 'react'
import { WIDGET_CSS } from './styles'
import { ContextBar, WhaleState } from './ContextBar'
import { Bubble } from './Bubble'
import { EasterEgg } from './EasterEgg'
import { pickRandomIdleLine } from './quotes'
import { SoundEngine } from './SoundEngine'
import { FlingTracker, startFling } from './PhysicsFling'

const EMPTY_STATE: WhaleState = {
  balance: null,
  currency: 'CNY',
  todayUsage: 0,
  contextPct: 0,
  contextTokens: 0,
  contextLimit: 128000,
  lastTurnCost: null
}

const WIDGET_W = 170
const WIDGET_H = 180
/** 松手速度（px/s）超过此值进入甩抛弹跳模式。 */
const FLING_SPEED = 1200

export function WhaleWidget() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(0, window.innerWidth - WIDGET_W - 8),
    y: Math.max(0, window.innerHeight - WIDGET_H - 8)
  }))
  const [pressed, setPressed] = useState(false)
  const [flinging, setFlinging] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [state, setState] = useState<WhaleState>(EMPTY_STATE)
  const [bubble, setBubble] = useState<string | null>(null)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  const trackerRef = useRef(new FlingTracker())
  const flingRef = useRef<{ cancel: () => void } | null>(null)
  const bounceTimerRef = useRef(0)
  const eggRef = useRef(new EasterEgg())
  const soundRef = useRef<SoundEngine | null>(null)
  if (soundRef.current === null) soundRef.current = new SoundEngine()

  // 数据轮询（60s）：通过宿主 webServer JSON 接口
  useEffect(() => {
    let alive = true
    const load = () => {
      fetch('/dsh-whale-girl/api/state', { cache: 'no-store' })
        .then((r) => r.json())
        .then((s) => {
          if (alive && s && typeof s === 'object') setState(s as WhaleState)
        })
        .catch(() => {
          // 宿主接口未就绪
        })
    }
    load()
    const t = window.setInterval(load, 60000)
    return () => {
      alive = false
      window.clearInterval(t)
    }
  }, [])

  // 时机彩蛋：上下文 >80% 触发一次吐槽
  useEffect(() => {
    const line = eggRef.current.onContextHigh(state.contextPct)
    if (line) setBubble(line)
  }, [state.contextPct])

  // 卸载时清理弹跳循环与抖动画计时
  useEffect(() => {
    return () => {
      window.clearTimeout(bounceTimerRef.current)
      flingRef.current?.cancel()
    }
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
      soundRef.current?.release()

      // 点击（非拖拽）：触发彩蛋/随机台词
      if (!moved) {
        const r = eggRef.current.onPress()
        setBubble(r.kind === 'quote' ? r.text : pickRandomIdleLine())
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
    [shake, snap]
  )

  return (
    <>
      <style>{WIDGET_CSS}</style>
      <div
        ref={rootRef}
        className={`wg-root${flinging ? ' wg-flinging' : ''}${bounce ? ' wg-bounce' : ''}`}
        style={{ left: pos.x, top: pos.y, transform: pressed ? 'scale(0.9)' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        data-pressed={pressed}
      >
        <img className="wg-img" src="/dsh-whale-girl/whale-girl.png" alt="鲸鱼娘" draggable={false} />
        <ContextBar pct={state.contextPct} tokens={state.contextTokens} limit={state.contextLimit} />
        {bubble && <Bubble text={bubble} onClose={() => setBubble(null)} />}
      </div>
    </>
  )
}