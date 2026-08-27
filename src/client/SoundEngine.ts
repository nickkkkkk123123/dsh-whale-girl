// 音效引擎：duck（小黄鸭文件）+ cute（Web Audio 程序化合成），可切换
export type SoundMode = 'duck' | 'cute'

export class SoundEngine {
  private mode: SoundMode = 'cute'
  private duckPress: HTMLAudioElement | null = null
  private duckRelease: HTMLAudioElement | null = null
  private actx: AudioContext | null = null

  constructor() {
    if (typeof window === 'undefined') return
    try {
      this.duckPress = new Audio('/dsh-whale-girl/Ya1.mp3')
      this.duckPress.preload = 'auto'
      this.duckRelease = new Audio('/dsh-whale-girl/Ya2.mp3')
      this.duckRelease.preload = 'auto'
    } catch {
      this.duckPress = null
      this.duckRelease = null
    }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AC) this.actx = new AC()
    } catch {
      this.actx = null
    }
  }

  setMode(mode: SoundMode) {
    this.mode = mode
  }

  press() {
    if (this.mode === 'duck') {
      this.play(this.duckPress)
      return
    }
    this.cute(520, 0.09, 'square', 0.14)
  }

  release() {
    if (this.mode === 'duck') {
      this.play(this.duckRelease)
      return
    }
    this.cute(760, 0.08, 'sine', 0.11)
  }

  /** 撞边反馈音：duck 复用小黄鸭松手声，cute 用短促"波"音。 */
  bounce() {
    if (this.mode === 'duck') {
      this.play(this.duckRelease)
      return
    }
    this.cute(300, 0.07, 'triangle', 0.1)
  }

  private play(a: HTMLAudioElement | null) {
    if (!a) return
    try {
      a.currentTime = 0
      void a.play().catch(() => {
        // autoplay 被拒则静默
      })
    } catch {
      // ignore
    }
  }

  private cute(freq: number, dur: number, type: OscillatorType, gain: number) {
    if (!this.actx) return
    try {
      const ctx = this.actx
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq * 0.6, t)
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.03)
      g.gain.setValueAtTime(gain, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    } catch {
      // ignore
    }
  }
}
