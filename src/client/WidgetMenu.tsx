import React, { useEffect, useRef } from 'react'

/** 挂件配置（音效 + 显示模块开关）。持久化到 ~/.dsh/.whale-girl-config.json */
export interface MenuConfig {
  soundMode: 'cute' | 'duck'
  showProgress: boolean
  showBubble: boolean
  showBalance: boolean
  showPeak: boolean
}

export const DEFAULT_MENU_CONFIG: MenuConfig = {
  soundMode: 'cute',
  showProgress: true,
  showBubble: true,
  showBalance: true,
  showPeak: true
}

interface Props {
  x: number
  y: number
  config: MenuConfig
  onChange: (next: MenuConfig) => void
  onResetPosition: () => void
  onClose: () => void
}

export function WidgetMenu({ x, y, config, onChange, onResetPosition, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const menuW = 190
  const left = Math.max(8, Math.min(x, window.innerWidth - menuW - 8))
  const top = Math.max(8, Math.min(y, window.innerHeight - 280))

  const set = (patch: Partial<MenuConfig>) => onChange({ ...config, ...patch })

  return (
    <div
      className="wg-menu"
      style={{ left, top }}
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="wg-menu-title">音效</div>
      <div className="wg-menu-item" onClick={() => set({ soundMode: 'cute' })}>
        <span className={`wg-menu-radio${config.soundMode === 'cute' ? ' on' : ''}`} /> 可爱合成音
      </div>
      <div className="wg-menu-item" onClick={() => set({ soundMode: 'duck' })}>
        <span className={`wg-menu-radio${config.soundMode === 'duck' ? ' on' : ''}`} /> 鸭叫
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">显示模块</div>
      <div className="wg-menu-item" onClick={() => set({ showProgress: !config.showProgress })}>
        <span className={`wg-menu-check${config.showProgress ? ' on' : ''}`} /> 上下文进度条
      </div>
      <div className="wg-menu-item" onClick={() => set({ showBubble: !config.showBubble })}>
        <span className={`wg-menu-check${config.showBubble ? ' on' : ''}`} /> 彩蛋气泡
      </div>
      <div className="wg-menu-item" onClick={() => set({ showBalance: !config.showBalance })}>
        <span className={`wg-menu-check${config.showBalance ? ' on' : ''}`} /> 余额信息
      </div>
      <div className="wg-menu-item" onClick={() => set({ showPeak: !config.showPeak })}>
        <span className={`wg-menu-check${config.showPeak ? ' on' : ''}`} /> 峰谷提醒
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-item" onClick={onResetPosition}>↺ 恢复默认位置</div>
    </div>
  )
}
