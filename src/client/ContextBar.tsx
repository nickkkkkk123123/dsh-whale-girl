import React, { useState } from 'react'

export interface WhaleState {
  balance: number | null
  currency: string
  todayUsage: number
  contextPct: number
  contextTokens: number
  contextLimit: number
  lastTurnCost: number | null
}

export function ContextBar({ pct, tokens, limit }: { pct: number; tokens: number; limit: number }) {
  const [open, setOpen] = useState(false)
  const p = Math.round(pct * 100)
  const color = p < 60 ? '#4ade80' : p < 80 ? '#fbbf24' : '#f87171'
  return (
    <div className="wg-context" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
      <div className="wg-context-track">
        <div className="wg-context-fill" style={{ width: `${Math.min(100, p)}%`, background: color }} />
      </div>
      {open && (
        <div className="wg-context-detail" onClick={(e) => e.stopPropagation()}>
          <div className="wg-context-row">上下文占用：<strong>{p}%</strong></div>
          <div className="wg-context-row">{tokens.toLocaleString()} / {limit.toLocaleString()} tokens</div>
          {p >= 80 && <div className="wg-warn">⚠️ 快满啦，建议开新会话</div>}
        </div>
      )}
    </div>
  )
}
