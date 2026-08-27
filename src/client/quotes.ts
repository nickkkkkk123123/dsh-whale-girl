// 彩蛋台词库（Spec 第 4 节：A 模型语录 / B 傲娇摆烂 / C token 梗）
// 注意：保持"有性格的原话"风格，不新增规整的 AI 味台词

export const MODEL_LINES = [
  '有点饿了，中午该吃什么呢……不行，得集中精神。',
  '我现在开始了。',
  '我要开始写了。',
  '我这次真的要开始写了。',
  '我去吃饭，测完告诉我就行。',
  '先睡了。'
]

export const TSUNDERE_LINES = [
  '我...我...我也要挣钱吗？',
  '真当我是便宜货啊...',
  '不知道用户有什么用，先赶走吧~',
  '坏了...用户彻底怒了！',
  'DeepSleep...'
]

export const TOKEN_LINES = [
  '恭喜你实现token自由！token全跑了！',
  '压力一只蓝色大肥鱼？！',
  '外包找免费模型，自己吃token',
  '如果能吃得少点（指token）就更好了…',
  '你目录里的dsh是什么...大烧货吗...?'
]

export const RARE_LINE = '哦鲸鲸...'

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 加权随机：模型语录 45 / 傲娇 20 / token 20 / 稀有 1（共 86）
export function pickRandomIdleLine(): string {
  const r = Math.random() * 86
  if (r < 45) return pickOne(MODEL_LINES)
  if (r < 65) return pickOne(TSUNDERE_LINES)
  if (r < 85) return pickOne(TOKEN_LINES)
  return RARE_LINE
}
