export interface TurnPricing {
  input: number // 元 / 百万 token
  output: number // 元 / 百万 token
  inputTokens: number
  outputTokens: number
}

export function estimateCost(tokens: number, p: TurnPricing): number {
  if (tokens <= 0) return 0
  const inT = Math.min(tokens, p.inputTokens)
  const outT = Math.max(0, tokens - p.inputTokens)
  return (inT * p.input + outT * p.output) / 1_000_000
}
