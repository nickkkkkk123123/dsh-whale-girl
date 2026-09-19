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
  onMove: (x: number, y: number, vx?: number, vy?: number) => void
  onBounce?: (axis: 'x' | 'y') => void
  onDone?: (x: number, y: number) => void
  /** 障碍（信息面板）矩形；角色甩抛撞到它时角色反弹，并回调 onObstacleHit 让面板获得角色的入射动量。 */
  getObstacle?: () => { x: number; y: number; w: number; h: number } | null
  onObstacleHit?: (invx: number, invy: number) => void
  /** 反弹弹性 0~1（1=完全弹性反射，0.5=损失一半法向速度）。默认 1。 */
  bounceE?: number
  /** 重力模式下落地滑行的地面摩擦（每帧系数，0.85 很滑 ~ 0.99 很涩）。默认 0.95。 */
  groundFriction?: number
  /** 重力加速度（px/s²）。设置后进入重力模式：自然下落、软着陆（反弹衰减、落地摩擦滑行）。不设=悬浮模式。 */
  gravity?: number
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
  const gravity = opts.gravity ?? 0
  const bounceE = opts.bounceE ?? 1
  const groundFriction = opts.groundFriction ?? 0.95
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

    if (gravity > 0) {
      vy += gravity * dt
      const gb = bounds()
      if (y >= gb.bottom - 0.5) {
        // 落地滑行：地面摩擦可调 + 速度足够小则结束
        vx *= Math.pow(groundFriction, dt * 60)
        if (Math.hypot(vx, vy) < STOP_SPEED) {
          opts.onDone?.(x, y)
          return
        }
      }
    } else if (Math.hypot(vx, vy) < STOP_SPEED) {
      opts.onDone?.(x, y)
      return
    }

    if (!(gravity > 0)) {
      // 摩擦：按 60fps 基准折算每帧 ×FRICTION，帧率越高每秒减速越平滑（仅悬浮模式）
      const f = Math.pow(FRICTION_PER_FRAME, dt * 60)
      vx *= f
      vy *= f
    }

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
      const invx = vx
      const invy = vy
      const dot = vx * nx + vy * ny
      if (dot < 0) {
        // 弹性反射：法向分量按 bounceE 恢复（1=完全弹性）
        vx = vx - (1 + bounceE) * dot * nx
        vy = vy - (1 + bounceE) * dot * ny
      }
      // 最小穿透轴推出：角色被挡在面板一侧，避免瞬移到固定位置
      const overlapW = Math.min(x + opts.width - ob.x, ob.x + ob.w - x)
      const overlapH = Math.min(y + opts.height - ob.y, ob.y + ob.h - y)
      if (overlapW < overlapH) {
        x = x < ob.x ? ob.x - opts.width : ob.x + ob.w
      } else {
        y = y < ob.y ? ob.y - opts.height : ob.y + ob.h
      }
      opts.onObstacleHit?.(invx, invy)
    }

    const b = bounds()
    // 边缘反弹：仅当入射速度足够大（>120px/s）才翻转速度并触发反弹事件，
    // 低速贴边时直接归零速度停在边上——修复贴边时反复触发反弹（音效/特效刷屏）的 bug
    if (x <= b.left) {
      x = b.left
      if (vx < -120) { vx = -vx * bounceE; opts.onBounce?.('x') } else if (vx < 0) vx = 0
    } else if (x >= b.right) {
      x = b.right
      if (vx > 120) { vx = -vx * bounceE; opts.onBounce?.('x') } else if (vx > 0) vx = 0
    }
    if (y <= b.top) {
      y = b.top
      if (vy < -120) { vy = -vy * bounceE; opts.onBounce?.('y') } else if (vy < 0) vy = 0
    } else if (y >= b.bottom) {
      y = b.bottom
      if (gravity > 0) {
        // 软着陆：反弹按弹性衰减，速度过小直接停（不再重复触发）
        if (vy > 150) { vy = -vy * 0.25 * bounceE; opts.onBounce?.('y') } else vy = 0
      } else {
        if (vy > 120) { vy = -vy * bounceE; opts.onBounce?.('y') } else if (vy > 0) vy = 0
      }
    }

    opts.onMove(x, y, vx, vy)
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