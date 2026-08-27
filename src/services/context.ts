export const DEFAULT_CONTEXT_LIMIT = 128000

export function computeContextPct(tokens: number, limit: number): number {
  if (limit <= 0 || tokens <= 0) return 0
  return Math.min(1, tokens / limit)
}
