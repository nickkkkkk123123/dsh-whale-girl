import React, { useEffect, useState } from 'react'

export interface WhaleState {
  balance: number | null
  currency: string
  todayUsage: number
  contextPct: number
  contextTokens: number
  contextLimit: number
  lastTurnCost: number | null
  peakLow: 'high' | 'low' | null
}

interface Props {
  pct: number
  tokens: number
  limit: number
  balance: number | null
  currency: string
  todayUsage: number
  lastTurnCost: number | null
  peakLow: 'high' | 'low' | null
  showBalance: boolean
  showPeak: boolean
}

export function ContextBar({
  pct,
  tokens,
  limit,
  balance,
  currency,
  todayUsage,
  lastTurnCost,
  peakLow,
  showBalance,
  showPeak
}: Props) {
  const [open, setOpen] = useState(false)

  // 详情展开后 6 秒自动收起
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => setOpen(false), 6000)
    return () => window.clearTimeout(t)
  }, [open])

  const p = Math.round(pct * 100)
  const color = p < 60 ? '#4ade80' : p < 80 ? '#fbbf24' : '#f87171'
  const balLow = balance !== null && balance < 10
  return (
    <div className="wg-context" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
      <div className="wg-context-head">
        <span className="wg-context-pct">上下文 {p}%</span>
        {showBalance && balance !== null && (
          <span className={`wg-context-bal${balLow ? ' wg-context-bal-low' : ''}`}>
            {currency} ¥{balance.toFixed(2)}
          </span>
        )}
      </div>
      <div className="wg-context-track">
        <div className="wg-context-fill" style={{ width: `${Math.min(100, p)}%`, background: color }} />
      </div>
      {open && (
        <div className="wg-context-detail" onClick={(e) => e.stopPropagation()}>
          <div className="wg-context-row">上下文占用 <strong>{p}%</strong></div>
          <div className="wg-context-row">{tokens.toLocaleString()} / {limit.toLocaleString()} tokens</div>
          {lastTurnCost !== null && <div className="wg-context-row">上轮消耗 <strong>¥{lastTurnCost.toFixed(4)}</strong></div>}
          {showBalance && (
            <div className="wg-context-row">当前余额 <strong>{balance === null ? '不可用' : `${currency} ¥${balance.toFixed(2)}`}</strong></div>
          )}
          {showBalance && todayUsage > 0 && <div className="wg-context-row">今日用量 <strong>¥{todayUsage.toFixed(2)}</strong></div>}
          {showPeak && peakLow === 'high' && <div className="wg-badge wg-badge-high">🔺 高峰时段</div>}
          {showPeak && peakLow === 'low' && <div className="wg-badge wg-badge-low">🔻 空闲时段</div>}
          {p >= 80 && <div className="wg-warn">⚠️ 快满啦，建议开新会话</div>}
        </div>
      )}
    </div>
  )
}
