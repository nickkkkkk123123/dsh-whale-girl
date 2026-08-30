// 甩抛弹跳：拖拽速度跟踪 + 窗口内物理弹跳（摩擦减速 → 平滑吸附边缘）
// 设计文档 2.4：松手速度超阈值进入弹跳模式，撞窗边速度反向并触发小反馈。

export interface FlingVelocity {
  vx: number
  vy: number
}

const MAX_SAMPLES = 10
const WINDOW_MS = 120
const MIN_SAMPLES = 3

/** 拖拽期间采样位置+时间戳，松手时按最后一小段窗口估出速度向量（px/s）。 */
export class FlingTracker {
  private samples: { x: number; y: number; t: number }[] = []

  push(x: number, y: number) {
    const t = performance.now()
    this.samples.push({ x, y, t })
    while (this.samples.length > MAX_SAMPLES) this.samples.shift()
    const cutoff = t - WINDOW_MS
    while (this.samples.length > 1 && this.samples[0].t < cutoff) this.samples.shift()
  }

  clear() {
    this.samples = []
  }

  velocity(): FlingVelocity | null {
    const s = this.samples
    if (s.length < MIN_SAMPLES) return null
    const first = s[0]
    const last = s[s.length - 1]
    const dt = (last.t - first.t) / 1000
    if (dt <= 0) return null
    return {
      vx: (last.x - first.x) / dt,
      vy: (last.y - first.y) / dt
    }
  }
}

export interface FlingOptions {
  /** 起始位置（挂件左上角）。 */
  x: number
  y: number
  vx: number
  vy: number
  /** 挂件尺寸（用于边缘碰撞检测和边界计算）。 */
  width: number
  height: number
  onMove: (x: number, y: number) => void
  onBounce?: (axis: 'x' | 'y') => void
  onDone?: (x: number, y: number) => void
  /** 障碍（信息面板）矩形；角色甩抛撞到它时角色反弹，并回调 onObstacleHit 让面板获得动量。 */
  getObstacle?: () => { x: number; y: number; w: number; h: number } | null
  onObstacleHit?: (nx: number, ny: number) => void
}

const STOP_SPEED = 34
const FRICTION_PER_FRAME = 0.985
const MAX_DT = 0.05

/** 启动弹跳循环；返回句柄，可随时 cancel（例如用户重新按下）。 */
export function startFling(opts: FlingOptions): { cancel: () => void } {
  let x = opts.x
  let y = opts.y
  let vx = opts.vx
  let vy = opts.vy
  let raf = 0
  let last = performance.now()
  let cancelled = false

  const bounds = () => ({
    left: 8,
    top: 8,
    right: Math.max(8, window.innerWidth - opts.width - 8),
    bottom: Math.max(8, window.innerHeight - opts.height - 8)
  })

  const step = (now: number) => {
    if (cancelled) return
    const dt = Math.min(MAX_DT, (now - last) / 1000)
    last = now

    if (Math.hypot(vx, vy) < STOP_SPEED) {
      opts.onDone?.(x, y)
      return
    }

    // 摩擦：按 60fps 基准折算每帧 ×FRICTION，帧率越高每秒减速越平滑
    const f = Math.pow(FRICTION_PER_FRAME, dt * 60)
    vx *= f
    vy *= f

    x += vx * dt
    y += vy * dt

    // 撞障碍（信息面板）：角色沿离开面板方向反弹，并通知面板获得动量
    const ob = opts.getObstacle?.()
    if (ob && x < ob.x + ob.w && x + opts.width > ob.x && y < ob.y + ob.h && y + opts.height > ob.y) {
      const ccx = x + opts.width / 2
      const ccy = y + opts.height / 2
      const ocx = ob.x + ob.w / 2
      const ocy = ob.y + ob.h / 2
      const ang = Math.atan2(ccy - ocy, ccx - ocx)
      const nx = Math.cos(ang)
      const ny = Math.sin(ang)
      const dot = vx * nx + vy * ny
      if (dot < 0) {
        vx = vx - 2 * dot * nx
        vy = vy - 2 * dot * ny
      }
      x = ocx + nx * (ob.w / 2 + opts.width / 2 + 2)
      y = ocy + ny * (ob.h / 2 + opts.height / 2 + 2)
      opts.onObstacleHit?.(nx, ny)
    }

    const b = bounds()
    if (x <= b.left) {
      x = b.left
      vx = Math.abs(vx)
      opts.onBounce?.('x')
    } else if (x >= b.right) {
      x = b.right
      vx = -Math.abs(vx)
      opts.onBounce?.('x')
    }
    if (y <= b.top) {
      y = b.top
      vy = Math.abs(vy)
      opts.onBounce?.('y')
    } else if (y >= b.bottom) {
      y = b.bottom
      vy = -Math.abs(vy)
      opts.onBounce?.('y')
    }

    opts.onMove(x, y)
    raf = requestAnimationFrame(step)
  }

  raf = requestAnimationFrame(step)

  return {
    cancel() {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }
}