import React, { useEffect } from 'react'

interface Props {
  text: string
  onClose: () => void
  /** 挂件吸附在窗口左部时，气泡镜像翻转，右端对齐改为左端对齐，贴合窗口边缘 */
  flip?: boolean
}

export function Bubble({ text, onClose, flip }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(t)
  }, [text, onClose])
  return (
    <div className={flip ? 'wg-bubble wg-bubble-flip' : 'wg-bubble'} onClick={(e) => { e.stopPropagation(); onClose() }}>
      <span>{text}</span>
    </div>
  )
}
