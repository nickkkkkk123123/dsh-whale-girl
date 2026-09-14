// 上下文窗口容量线（对齐 DSH 显示的占用：约 60 万 token 窗口）。
// 如与实际模型窗口不符，可自行调整。
export const DEFAULT_CONTEXT_LIMIT = 600000

export function computeContextPct(tokens: number, limit: number): number {
  if (limit <= 0 || tokens <= 0) return 0
  return Math.min(1, tokens / limit)
}
