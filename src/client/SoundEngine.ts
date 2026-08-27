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
  onPlayResult?: (ok: boolean, err?: string) => void

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

  /** 诊断：返回音频状态，用于排查音效不发声 */
  debug(): { actxState: string | null; duckPressReady: number | null; duckReleaseReady: number | null } {
    return {
      actxState: this.actx ? this.actx.state : null,
      duckPressReady: this.duckPress ? this.duckPress.readyState : null,
      duckReleaseReady: this.duckRelease ? this.duckRelease.readyState : null
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
    this.cute(520, 0.09, 'square', 0.32)
  }

  release() {
    if (this.mode === 'duck') {
      this.ensureDuck()
      this.play(this.duckRelease)
      return
    }
    this.cute(760, 0.08, 'sine', 0.28)
  }

  /** 撞边反馈音：用 HTMLAudioElement（duck 松手音）播放——不依赖 AudioContext（弹跳在非用户手势下 ctx 会被挂起、resume 被拒导致无声） */
  bounce() {
    this.ensureDuck()
    this.play(this.duckRelease)
  }

  private play(a: HTMLAudioElement | null) {
    if (!a) return
    try {
      a.currentTime = 0
      a.volume = 1
      void a.play()
        .then(() => this.onPlayResult?.(true))
        .catch((e) => this.onPlayResult?.(false, String(e?.message || e)))
    } catch (e) {
      this.onPlayResult?.(false, String(e))
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
        this.onPlayResult?.(true)
      } catch (e) {
        this.onPlayResult?.(false, String(e))
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
