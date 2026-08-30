import React, { useEffect, useRef } from 'react'

/** 挂件配置（音效 + 显示模块开关 + 弹弓力度）。持久化到 ~/.dsh/.whale-girl-config.json */
export interface MenuConfig {
  soundMode: 'cute' | 'duck'
  showProgress: boolean
  showBubble: boolean
  showBalance: boolean
  showPeak: boolean
  /** 中键弹弓发射力度系数（松手速度 = 拉开距离 × 该系数），范围 5~60 */
  slingPower: number
  /** 省电模式：空闲 60 秒后暂停漂浮动画并停用常驻毛玻璃 */
  ecoMode: boolean
  /** 毛玻璃强度（进度条底板 blur 像素，0=关闭），0~16 默认 4 */
  frost: number
  /** 进度条底板背景不透明度，0.2~1 默认 0.82（越小越透） */
  panelOpacity: number
  /** 余额预警线（元）：低于该值时气泡提醒充值，0=关闭预警 */
  lowBalance: number
  /** 是否显示 Agent 工作状态徽章与过渡台词 */
  showWorkState: boolean
  /** 实时余额刷新（10 秒，默认关闭用 60 秒） */
  realtimeBalance: boolean
  /** 是否显示信息面板（时间/系统资源） */
  showInfo: boolean
  /** 信息面板跟随距离阈值（超过则脱钩独立）px */
  followThreshold: number
  /** 信息面板高斯模糊强度（backdrop-filter blur，0=关闭），0~16 默认 4；与进度条独立 */
  infoFrost: number
  /** DSH 输出/思考（thinking）时是否暂停信息面板物理循环（省主线程，默认开） */
  pauseOnThinking: boolean
  /** 挂件整体缩放（visual scale），0.6~1.5 默认 1 */
  widgetScale: number
  /** 信息面板大小（visual scale），0.6~1.5 默认 1；锁定同步则跟随挂件大小 */
  infoScale: number
  /** 锁定角色与面板大小同步（面板大小=挂件大小） */
  linkScale: boolean
}

/** API 提供方条目（host /api/providers 返回）。 */
export interface ProviderRow {
  id: string
  name: string
  family: string
  apiKeyEnv?: string
  balance: number | null
  currency: string
  active: boolean
  /** 该 provider 声明的模型 id 列表（切换时默认选第一个）。 */
  models?: string[]
}

export const DEFAULT_MENU_CONFIG: MenuConfig = {
  soundMode: 'cute',
  showProgress: true,
  showBubble: true,
  showBalance: true,
  showPeak: true,
  slingPower: 20,
  ecoMode: true,
  frost: 4,
  panelOpacity: 0.82,
  lowBalance: 10,
  showWorkState: true,
  realtimeBalance: false,
  showInfo: false,
  followThreshold: 180,
  infoFrost: 4,
  pauseOnThinking: true,
  widgetScale: 1,
  infoScale: 1,
  linkScale: false
}

interface Props {
  x: number
  y: number
  config: MenuConfig
  onChange: (next: MenuConfig) => void
  onResetPosition: () => void
  onClose: () => void
  /** API 提供方列表（null = 尚未加载）。 */
  providers: ProviderRow[] | null
  /** 切换默认模型提供方。 */
  onSwitchProvider: (id: string) => void
  /** 切换中的 provider id（防止重复点击）。 */
  switching: string | null
}

export function WidgetMenu({ x, y, config, onChange, onResetPosition, onClose, providers, onSwitchProvider, switching }: Props) {
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

  const menuW = 210
  const left = Math.max(8, Math.min(x, window.innerWidth - menuW - 8))
  const top = Math.max(8, Math.min(y, window.innerHeight - 600))

  const set = (patch: Partial<MenuConfig>) => onChange({ ...config, ...patch })

  return (
    <div
      className="wg-menu"
      style={{ left, top, width: menuW, '--wg-panel-alpha': config.panelOpacity } as React.CSSProperties}
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="wg-menu-title">API 提供方</div>
      {providers === null ? (
        <div className="wg-menu-item wg-menu-muted">加载中…</div>
      ) : providers.length === 0 ? (
        <div className="wg-menu-item wg-menu-muted">未配置提供方</div>
      ) : (
        providers.map((p) => (
          <div
            key={p.id}
            className={`wg-menu-item${p.active ? ' wg-menu-active' : ''}`}
            onClick={() => {
              if (p.active || switching) return
              onSwitchProvider(p.id)
            }}
            title={p.active ? '当前使用中' : switching === p.id ? '切换中…' : '点击切换为此提供方'}
          >
            <span className={`wg-menu-radio${p.active ? ' on' : ''}`} />
            <span className="wg-menu-col">
              <span>{p.name}{switching === p.id ? ' …' : ''}</span>
              <span className="wg-menu-balance">
                {p.balance === null ? '余额未知' : `¥${p.balance.toFixed(2)}`}
              </span>
            </span>
          </div>
        ))
      )}
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">音效</div>
      <div className="wg-menu-item" onClick={() => set({ soundMode: 'cute' })}>
        <span className={`wg-menu-radio${config.soundMode === 'cute' ? ' on' : ''}`} /> 可爱合成音
      </div>
      <div className="wg-menu-item" onClick={() => set({ soundMode: 'duck' })}>
        <span className={`wg-menu-radio${config.soundMode === 'duck' ? ' on' : ''}`} /> 鸭叫
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">
        弹弓发射力度 <span className="wg-menu-power">×{config.slingPower}</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={5}
          max={60}
          step={5}
          value={config.slingPower}
          onChange={(e) => set({ slingPower: Number(e.target.value) })}
          title="中键拖拽松手时的发射力度（拉开距离 × 力度）"
        />
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">
        毛玻璃强度 <span className="wg-menu-power">{config.frost === 0 ? '关' : `×${config.frost}`}</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={0}
          max={16}
          step={1}
          value={config.frost}
          onChange={(e) => set({ frost: Number(e.target.value) })}
          title="进度条底板的毛玻璃模糊强度（0 = 关闭，更省资源）"
        />
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">
        信息跟随阈值 <span className="wg-menu-power">{config.followThreshold}px</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={60}
          max={360}
          step={20}
          value={config.followThreshold}
          onChange={(e) => set({ followThreshold: Number(e.target.value) })}
          title="信息面板与角色距离超过该值就脱钩独立（越小越容易脱开）"
        />
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">
        面板模糊 <span className="wg-menu-power">{config.infoFrost === 0 ? '关' : `×${config.infoFrost}`}</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={0}
          max={16}
          step={1}
          value={config.infoFrost}
          onChange={(e) => set({ infoFrost: Number(e.target.value) })}
          title="信息面板高斯模糊强度（0 = 关闭；越高越模糊、GPU 越高）"
        />
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-title">
        底板透明度 <span className="wg-menu-power">{Math.round((1 - config.panelOpacity) * 100)}%</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={0}
          max={80}
          step={5}
          value={Math.round((1 - config.panelOpacity) * 100)}
          onChange={(e) => set({ panelOpacity: (100 - Number(e.target.value)) / 100 })}
          title="进度条底板的透明度：拉得越高越透，透出挂件背后的页面内容（上限 80% 以保证文字可读）"
        />
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
      <div className="wg-menu-item" onClick={() => set({ realtimeBalance: !config.realtimeBalance })}>
        <span className={`wg-menu-check${config.realtimeBalance ? ' on' : ''}`} /> 实时余额刷新(10秒)
      </div>
      <div className="wg-menu-item" onClick={() => set({ showPeak: !config.showPeak })}>
        <span className={`wg-menu-check${config.showPeak ? ' on' : ''}`} /> 峰谷提醒
      </div>
      <div className="wg-menu-item" onClick={() => set({ showInfo: !config.showInfo })}>
        <span className={`wg-menu-check${config.showInfo ? ' on' : ''}`} /> 信息面板
      </div>
      <div className="wg-menu-item" onClick={() => set({ pauseOnThinking: !config.pauseOnThinking })}>
        <span className={`wg-menu-check${config.pauseOnThinking ? ' on' : ''}`} /> 思考时暂停信息面板
      </div>
      <div className="wg-menu-item" onClick={() => set({ ecoMode: !config.ecoMode })}>
        <span className={`wg-menu-check${config.ecoMode ? ' on' : ''}`} /> 省电模式（空闲暂停动画）
      </div>
      <div className="wg-menu-item" onClick={() => set({ showWorkState: !config.showWorkState })}>
        <span className={`wg-menu-check${config.showWorkState ? ' on' : ''}`} /> 工作状态徽章
      </div>
      <div className="wg-menu-title">
        挂件大小 <span className="wg-menu-power">{Math.round(config.widgetScale * 100)}%</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={0.6}
          max={1.5}
          step={0.05}
          value={config.widgetScale}
          onChange={(e) => set({ widgetScale: Number(e.target.value) })}
          title="挂件整体大小（60%~150%，默认100%）"
        />
      </div>
      <div className="wg-menu-title">
        面板大小 <span className="wg-menu-power">{Math.round((config.linkScale ? config.widgetScale : config.infoScale) * 100)}%</span>
      </div>
      <div className="wg-menu-slider-row">
        <input
          className="wg-menu-slider"
          type="range"
          min={0.6}
          max={1.5}
          step={0.05}
          value={config.linkScale ? config.widgetScale : config.infoScale}
          onChange={(e) => set({ infoScale: Number(e.target.value) })}
          disabled={config.linkScale}
          title="信息面板大小（60%~150%，默认100%；锁定时随挂件）"
        />
      </div>
      <div className="wg-menu-item" onClick={() => set({ linkScale: !config.linkScale })}>
        <span className={`wg-menu-check${config.linkScale ? ' on' : ''}`} /> 锁定角色与面板大小同步
      </div>
      <div className="wg-menu-divider" />
      <div className="wg-menu-item" onClick={onResetPosition}>↺ 恢复默认位置</div>
    </div>
  )
}
