import React, { useRef, useState, useCallback, useEffect } from 'react'
import { WIDGET_CSS } from './styles'
import { ContextBar, WhaleState } from './ContextBar'
import { Bubble } from './Bubble'
import { EasterEgg } from './EasterEgg'
import { pickRandomIdleLine } from './quotes'
import { SoundEngine } from './SoundEngine'

// DSH 运行时 Builtin（Client 侧），Package-private RPC 到宿主
declare const host: {
  call(method: string, args?: unknown): Promise<unknown>
}

const EMPTY_STATE: WhaleState = {
  balance: null,
  currency: 'CNY',
  todayUsage: 0,
  contextPct: 0,
  contextTokens: 0,
  contextLimit: 128000,
  lastTurnCost: null
}

export function WhaleWidget() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(0, window.innerWidth - 220),
    y: Math.max(0, window.innerHeight - 260)
  }))
  const [pressed, setPressed] = useState(false)
  const [state, setState] = useState<WhaleState>(EMPTY_STATE)
  const [bubble, setBubble] = useState<string | null>(null)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  const eggRef = useRef(new EasterEgg())
  const soundRef = useRef<SoundEngine | null>(null)
  if (soundRef.current === null) soundRef.current = new SoundEngine()

  // 数据轮询（60s）
  useEffect(() => {
    let alive = true
    const load = () => {
      host
        .call('whale.getState')
        .then((s) => {
          if (alive && s && typeof s === 'object') setState(s as WhaleState)
        })
        .catch(() => {
          // host 未就绪
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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    pressStartRef.current = { x: e.clientX, y: e.clientY }
    setPressed(true)
    soundRef.current?.press()
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 170, e.clientX - dragRef.current.dx)),
      y: Math.max(0, Math.min(window.innerHeight - 180, e.clientY - dragRef.current.dy))
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const start = pressStartRef.current
    const moved =
      start !== null && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6
    dragRef.current = null
    pressStartRef.current = null
    setPressed(false)
    soundRef.current?.release()
    // 点击（非拖拽）：触发彩蛋/随机台词
    if (!moved) {
      const r = eggRef.current.onPress()
      setBubble(r.kind === 'quote' ? r.text : pickRandomIdleLine())
    }
    const el = rootRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const left = rect.left + rect.width / 2 < vw / 2 ? 8 : vw - rect.width - 8
      const top = Math.max(8, Math.min(vh - rect.height - 8, rect.top))
      setPos({ x: Math.max(8, left), y: top })
      try {
        ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      } catch {
        // ignore
      }
    }
  }, [])

  return (
    <>
      <style>{WIDGET_CSS}</style>
      <div
        ref={rootRef}
        className="wg-root"
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
