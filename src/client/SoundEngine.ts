// 音效引擎：duck（小黄鸭文件）+ cute（Web Audio 程序化合成），可切换
// 默认 cute 不依赖任何网络资源，构造零开销；duck 的 mp3 走惰性创建。
export type SoundMode = 'duck' | 'cute'

import { YA1_DATA_URL, YA2_DATA_URL } from './audioDataUrl'

export class SoundEngine {
  private mode: SoundMode = 'cute'
  private duckPress: HTMLAudioElement | null = null
  private duckRelease: HTMLAudioElement | null = null
  private actx: AudioContext | null = null
  private bounceBuf: AudioBuffer | null = null

  constructor() {
    if (typeof window === 'undefined') return
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AC) this.actx = new AC()
    } catch {
      this.actx = null
    }
  }

  /** 在用户手势内调用，解锁 AudioContext（规避浏览器 autoplay 策略）。 */
  unlock() {
    const ctx = this.actx
    if (ctx && ctx.state === 'suspended') {
      try {
        void ctx.resume()
      } catch {
        // ignore
      }
    }
  }

  setMode(mode: SoundMode) {
    this.mode = mode
    if (mode === 'duck') this.ensureDuck()
  }

  private ensureDuck() {
    if (this.duckPress && this.duckRelease) return
    try {
      this.duckPress = new Audio(YA1_DATA_URL)
      this.duckRelease = new Audio(YA2_DATA_URL)
    } catch {
      this.duckPress = null
      this.duckRelease = null
    }
  }

  press() {
    if (this.mode === 'duck') {
      this.ensureDuck()
      this.play(this.duckPress)
      return
    }
    this.cute(520, 0.09, 'square', 0.14)
  }

  release() {
    if (this.mode === 'duck') {
      this.ensureDuck()
      this.play(this.duckRelease)
      return
    }
    this.cute(760, 0.08, 'sine', 0.11)
  }

  /** 撞边反馈音：duck 复用小黄鸭松手声，cute 用短促"boing"波。 */
  bounce() {
    if (this.mode === 'duck') {
      this.ensureDuck()
      this.play(this.duckRelease)
      return
    }
    const ctx = this.actx
    if (!ctx) return
    const doPlay = () => {
      try {
        // 预生成一次短促"boing"音采样，之后每次用 BufferSource 播放（比反复新建振荡器更省资源、更稳，避免多次弹跳后声音消失）
        if (!this.bounceBuf) {
          const sr = ctx.sampleRate
          const len = Math.floor(sr * 0.15)
          const buf = ctx.createBuffer(1, len, sr)
          const data = buf.getChannelData(0)
          for (let i = 0; i < len; i++) {
            const t = i / len
            const f = 420 * Math.pow(0.55, t)
            data[i] = Math.sin(2 * Math.PI * f * (i / sr)) * (1 - t) * 0.24
          }
          this.bounceBuf = buf
        }
        const src = ctx.createBufferSource()
        src.buffer = this.bounceBuf
        src.connect(ctx.destination)
        src.start()
      } catch {
        // ignore
      }
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().then(doPlay).catch(() => {})
    } else {
      doPlay()
    }
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
    const ctx = this.actx
    if (!ctx) return
    const doPlay = () => {
      try {
        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(freq * 0.6, t)
        osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04)
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
    // 若 AudioContext 处于 suspended（浏览器音频策略/空闲挂起），先 resume 完成再播放，避免连续音效丢声
    if (ctx.state === 'suspended') {
      void ctx.resume().then(doPlay).catch(() => {})
    } else {
      doPlay()
    }
  }
}
