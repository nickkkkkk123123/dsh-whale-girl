import React, { useRef, useState, useCallback } from 'react'
import { WIDGET_CSS } from './styles'

// DSH 运行时 Builtin（Client 侧），Package-private RPC 到宿主
declare const host: {
  call(method: string, args?: unknown): Promise<unknown>
}

export function WhaleWidget() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(0, window.innerWidth - 220),
    y: Math.max(0, window.innerHeight - 260)
  }))
  const [pressed, setPressed] = useState(false)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    setPressed(true)
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
    dragRef.current = null
    setPressed(false)
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
      </div>
    </>
  )
}
