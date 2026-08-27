import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface Props {
  text: string
  onClose: () => void
  /** 挂件根元素引用，气泡实时跟随它的位置（拖动也不错位），并钳制在视口内 */
  rootRef: React.RefObject<HTMLDivElement | null>
}

export function Bubble({ text, onClose, rootRef }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  useEffect(() => {
    const t = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(t)
  }, [text, onClose])

  // rAF 跟随：每帧读取挂件实时位置，气泡贴在其上方居中，并钳制到视口内（不超屏）
  // 用 useLayoutEffect 并在绘制前先同步定位一次，避免首帧闪到 (0,0)
  useLayoutEffect(() => {
    let raf = 0
    const update = () => {
      const root = rootRef.current
      const el = ref.current
      if (root && el) {
        const rect = root.getBoundingClientRect()
        const anchorX = rect.left + rect.width / 2
        const anchorY = rect.top
        const w = el.offsetWidth
        const h = el.offsetHeight
        const left = Math.max(8, Math.min(anchorX - w / 2, window.innerWidth - w - 8))
        const top = Math.max(8, anchorY - h - 8)
        setStyle((prev) =>
          prev && prev.left === left && prev.top === top ? prev : { left, top }
        )
      }
      raf = requestAnimationFrame(update)
    }
    update()
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [rootRef, text])

  const w = ref.current ? ref.current.offsetWidth : 360
  const rootRect = rootRef.current?.getBoundingClientRect()
  const anchorCenterX = rootRect ? rootRect.left + rootRect.width / 2 : style.left + w / 2
  const arrowX = Math.max(10, Math.min(anchorCenterX - style.left, w - 10))
  return (
    <div
      ref={ref}
      className="wg-bubble"
      style={{ left: style.left, top: style.top, ['--arrow-x' as string]: `${arrowX}px` }}
      onClick={(e) => { e.stopPropagation(); onClose() }}
    >
      <span>{text}</span>
    </div>
  )
}
