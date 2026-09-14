import { pickOne, TSUNDERE_LINES, TOKEN_LINES, MODEL_LINES } from './quotes'

export type PressResult = { kind: 'none' } | { kind: 'quote'; text: string }

export class EasterEgg {
  private presses = 0
  private lastPressAt = 0
  private contextTriggered = false

  onPress(now: number = Date.now()): PressResult {
    this.presses = now - this.lastPressAt < 800 ? this.presses + 1 : 1
    this.lastPressAt = now
    if (this.presses === 5) return { kind: 'quote', text: pickOne(TSUNDERE_LINES) }
    if (this.presses === 10) {
      this.presses = 0
      return { kind: 'quote', text: pickOne(TSUNDERE_LINES) }
    }
    return { kind: 'none' }
  }

  onContextHigh(pct: number): string | null {
    if (pct >= 0.8) {
      if (!this.contextTriggered) {
        this.contextTriggered = true
        return pickOne(TOKEN_LINES)
      }
      return null
    }
    this.contextTriggered = false
    return null
  }

  onTurnEnd(): string | null {
    return pickOne(MODEL_LINES)
  }

  onBalanceChange(): string | null {
    return pickOne(TOKEN_LINES)
  }
}
