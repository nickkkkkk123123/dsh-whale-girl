import React, { useEffect, useState } from 'react'

interface Props {
  sys: { memPct: number; memUsed: number; memTotal: number; cpu: number }
}

/** 信息面板：时间/日期 + 系统资源（内存/CPU）。纯展示，数据来自 host。 */
export function InfoPanel({ sys }: Props) {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const fmt = () => {
      const now = new Date()
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      )
      const wd = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
      setDate(`${now.getMonth() + 1}月${now.getDate()}日 周${wd}`)
    }
    fmt()
    const t = window.setInterval(fmt, 1000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="wg-info">
      <div className="wg-info-time">{time}</div>
      <div className="wg-info-date">{date}</div>
      <div className="wg-info-row">
        <span className="wg-info-label">CPU</span>
        <div className="wg-info-bar">
          <div className="wg-info-fill" style={{ width: `${Math.min(100, sys.cpu)}%` }} />
        </div>
        <span className="wg-info-val">{sys.cpu}%</span>
      </div>
      <div className="wg-info-row">
        <span className="wg-info-label">内存</span>
        <div className="wg-info-bar">
          <div className="wg-info-fill" style={{ width: `${Math.min(100, sys.memPct)}%` }} />
        </div>
        <span className="wg-info-val">{sys.memUsed}G/{sys.memTotal}G</span>
      </div>
    </div>
  )
}
