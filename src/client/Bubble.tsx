import React, { useEffect } from 'react'

export function Bubble({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(t)
  }, [text, onClose])
  return (
    <div className="wg-bubble" onClick={(e) => { e.stopPropagation(); onClose() }}>
      <span>{text}</span>
    </div>
  )
}
