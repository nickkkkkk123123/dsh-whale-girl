# 鲸鱼娘·灵动挂件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个独立的 DSH 标准插件「鲸鱼娘·灵动挂件」——右下角鲸鱼娘挂件，提供余额/今日已用/每轮消耗显示、上下文进度条、彩蛋系统和混合音效。

**Architecture:** 标准 DSH 插件（host + client 双 bundle，tsdown 构建）。宿主提供数据服务（余额/上下文/每轮消耗），通过 `harness.handle` 暴露 JSON 接口；客户端注册 `shell.overlay` slot 渲染 React 挂件（形象/动画/拖拽/气泡/进度条/彩蛋/音效）。

**Tech Stack:** TypeScript、cordis（DSH 插件框架）、tsdown（构建）、vitest（测试）、React（客户端 UI）、Web Audio API（程序化音效）。

**Spec:** `docs/superpowers/specs/2026-08-27-whale-girl-widget-design.md`

## Global Constraints

- 插件名 `dsh-whale-girl`，挂载到 desktop profile（`dsh plugin --profile desktop add`）
- 宿主凭据：`DEEPSEEK_API_KEY`（余额必需）；记账文件 `~/.dsh/.whale-girl-usage.json`
- 形象素材：`assets/whale-girl.png`（透明 PNG cut-out，来自 `D:\dsh-whale-girl-assets\final\whale-girl-cutout.png`）
- 音效：小黄鸭 `assets/Ya1.mp3`/`Ya2.mp3`（MIT，复制自 whale）；程序化可爱音效（Web Audio 合成，无素材）
- 台词库：见 Spec 第 4 节（A 模型语录 / B 傲娇摆烂 / C token 梗），**不得新增规整的"AI 味"台词**
- 语言：界面/台词中文；代码注释英文或中文均可
- 目标 DSH：desktop profile（dsh 2.0.3 运行时）
- 构建产物：`lib/index.js`（host ESM）+ `lib/client.js`（browser CJS bundle，window.__ModuleLoader__ 格式）

## File Structure

```
D:\dsh-whale-girl\
├── package.json          # DSH bundle 元数据（dsh.bundle.patch + dsh.client）
├── tsconfig.json         # TS 配置（host + client）
├── tsdown.config.ts      # 构建（host ESM + client CJS bundle）
├── vitest.config.ts      # 测试配置
├── scripts/build.sh      # 构建脚本（tsdown）
├── cordis.patch.yml      # 插件挂载声明（insert）
├── assets/
│   ├── whale-girl.png    # 透明鲸鱼娘 cut-out
│   ├── Ya1.mp3           # 小黄鸭按压（复制自 whale）
│   └── Ya2.mp3           # 小黄鸭释放（复制自 whale）
├── src/
│   ├── index.ts          # 宿主入口：apply(ctx) 注册服务 + handle 接口
│   ├── services/
│   │   ├── balance.ts    # 余额获取 + 记账（纯逻辑，可单测）
│   │   ├── context.ts    # 上下文 token 计算（可单测）
│   │   └── turnCost.ts   # 每轮消耗换算（可单测）
│   └── client/
│       ├── index.tsx     # 客户端入口：apply(ctx) 注册 shell.overlay slot
│       ├── WhaleWidget.tsx  # 主挂件（形象/动画/拖拽/气泡）
│       ├── ContextBar.tsx   # 上下文进度条 + 详情
│       ├── Bubble.tsx       # 气泡台词
│       ├── SoundEngine.ts   # 音效（duck 文件 + cute 程序化）
│       ├── EasterEgg.ts     # 彩蛋逻辑（连按/时机/隐藏解锁）
│       ├── quotes.ts        # 台词库（Spec 第 4 节）
│       └── styles.css       # 挂件样式
└── tests/
    ├── balance.test.ts   # balance 服务单测
    ├── context.test.ts   # context 服务单测
    └── turnCost.test.ts  # turnCost 服务单测
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`、`tsconfig.json`、`tsdown.config.ts`、`vitest.config.ts`、`scripts/build.sh`、`cordis.patch.yml`

**Interfaces:**
- Consumes: 无
- Produces: 可 `pnpm build` 构建、`pnpm test` 跑测试的 DSH 插件骨架

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "dsh-whale-girl",
  "version": "0.1.0",
  "description": "鲸鱼娘·灵动挂件：余额/用量/上下文进度/彩蛋",
  "license": "MIT",
  "type": "module",
  "main": "./lib/index.js",
  "exports": {
    ".": { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
    "./client": { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" },
    "./package.json": "./package.json"
  },
  "files": ["lib", "cordis.patch.yml", "assets", "README.md", "LICENSE"],
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "immediately": true,
      "inject": ["@deepseek-ai/dsh-client-runtime", "@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-slots"]
    }
  },
  "peerDependencies": {
    "@deepseek-ai/cordis": "^4.0.0-rc",
    "@deepseek-ai/dsh-agent": "*",
    "@deepseek-ai/dsh-client-runtime": "*",
    "@deepseek-ai/dsh-client-locale": "*",
    "@deepseek-ai/dsh-client-ui-slots": "*",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@deepseek-ai/cordis": "^4.0.0-rc",
    "@types/node": "^24.0.0",
    "@types/react": "^18.3.0",
    "tsdown": "^0.22.0",
    "typescript": "^5.9.0",
    "vitest": "^3.0.0"
  },
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

> 注：`immediately: true` 必须保留（DSH Desktop 2.0.3 下缺它 client 不激活，见 whale-girl 项目的经验）。

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"],
    "declaration": true,
    "emitDeclarationOnly": false,
    "noEmit": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: 创建 tsdown.config.ts（host ESM + client CJS bundle）**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    dts: true,
    sourcemap: true,
    clean: true
  },
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-whale-girl", factory: (require) => {',
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;'
    }
  }
])
```

- [ ] **Step 4: 创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } })
```

- [ ] **Step 5: 创建 scripts/build.mjs（构建脚本）**

```js
import { execSync } from 'node:child_process'
import fs from 'node:fs'
fs.rmSync('lib', { recursive: true, force: true })
execSync('npx tsdown', { stdio: 'inherit', shell: process.platform === 'win32' })
```

- [ ] **Step 6: 创建 cordis.patch.yml**

```yaml
- insert:
    - id: whale-girl
      name: dsh-whale-girl
```

- [ ] **Step 7: 创建占位 src/index.ts 和 src/client/index.tsx（空 apply），然后运行 `pnpm install`、`pnpm test`、`pnpm build` 确认骨架可构建**

Run: `pnpm install && pnpm test && pnpm build`
Expected: 全部通过，`lib/index.js` 与 `lib/client.js` 生成

- [ ] **Step 8: Commit**

```bash
git init && git add . && git commit -m "chore: scaffold dsh-whale-girl plugin"
```

---

### Task 2: 宿主 BalanceService（余额 + 记账）

**Files:**
- Create: `src/services/balance.ts`
- Test: `tests/balance.test.ts`

**Interfaces:**
- Consumes: 无（纯函数，注入 fetch）
- Produces: `fetchBalance(apiKey: string, fetchImpl?: typeof fetch): Promise<{ totalBalance: number; currency: string }>`；`Ledger` 类：`observe(amount: number): LedgerState`（余额差值记账今日已用，跨天归档）、`load(path: string): LedgerState`、`save(path: string, state: LedgerState): void`

- [ ] **Step 1: 写失败测试 `tests/balance.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'
import { fetchBalance, Ledger } from '../src/services/balance'

describe('fetchBalance', () => {
  it('parses DeepSeek balance API response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ balance_infos: [{ total_balance: '12.34', currency: 'CNY' }] })
    })
    const result = await fetchBalance('sk-test', fetchImpl as unknown as typeof fetch)
    expect(result).toEqual({ totalBalance: 12.34, currency: 'CNY' })
  })

  it('throws on API failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    await expect(fetchBalance('sk-test', fetchImpl as unknown as typeof fetch)).rejects.toThrow()
  })
})

describe('Ledger', () => {
  it('accumulates today usage from balance drops', () => {
    const ledger = new Ledger()
    ledger.observe(100)
    ledger.observe(97.5)
    expect(ledger.state.todayUsage).toBe(2.5)
  })

  it('ignores balance increases (no negative usage)', () => {
    const ledger = new Ledger()
    ledger.observe(90)
    ledger.observe(95)
    expect(ledger.state.todayUsage).toBe(0)
  })

  it('resets usage on day change and archives', () => {
    const ledger = new Ledger()
    ledger.state.date = '2026-08-26'
    ledger.state.todayUsage = 5
    ledger.observe(100, '2026-08-27')
    expect(ledger.state.todayUsage).toBe(0)
    expect(ledger.state.history.length).toBe(1)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `src/services/balance.ts`**

```ts
export interface BalanceResult { totalBalance: number; currency: string }
export interface LedgerState {
  date: string
  lastBalance: number | null
  todayUsage: number
  history: { date: string; usage: number }[]
}

export async function fetchBalance(apiKey: string, fetchImpl: typeof fetch = fetch): Promise<BalanceResult> {
  const res = await fetchImpl('https://api.deepseek.com/user/balance', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`balance api failed: ${res.status}`)
  const json = (await res.json()) as { balance_infos?: { total_balance?: string; currency?: string }[] }
  const info = json.balance_infos?.[0]
  if (!info || info.total_balance === undefined) throw new Error('balance response malformed')
  return { totalBalance: Number(info.total_balance), currency: info.currency ?? 'CNY' }
}

export function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export class Ledger {
  state: LedgerState = { date: todayStr(), lastBalance: null, todayUsage: 0, history: [] }

  observe(balance: number, date: string = todayStr()): LedgerState {
    if (this.state.date !== date) {
      if (this.state.todayUsage > 0) {
        this.state.history.push({ date: this.state.date, usage: this.state.todayUsage })
        if (this.state.history.length > 30) this.state.history.shift()
      }
      this.state.date = date
      this.state.todayUsage = 0
      this.state.lastBalance = null
    }
    if (this.state.lastBalance !== null && balance < this.state.lastBalance) {
      this.state.todayUsage += this.state.lastBalance - balance
    }
    this.state.lastBalance = balance
    return this.state
  }

  load(raw: string): void {
    try { this.state = { ...this.state, ...JSON.parse(raw) } } catch { /* keep default */ }
  }

  save(path: string, fsImpl = await import('node:fs')): void {
    fsImpl.writeFileSync(path, JSON.stringify(this.state))
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS（3 个用例全绿）

- [ ] **Step 5: Commit**

```bash
git add src/services/balance.ts tests/balance.test.ts
git commit -m "feat: balance fetch and ledger"
```

---

### Task 3: 宿主 ContextService（上下文 token）

**Files:**
- Create: `src/services/context.ts`
- Test: `tests/context.test.ts`

**Interfaces:**
- Consumes: 无（纯函数）
- Produces: `computeContextPct(tokens: number, limit: number): number`（0-1 占比）；`DEFAULT_CONTEXT_LIMIT = 128000`

- [ ] **Step 1: 写失败测试 `tests/context.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { computeContextPct } from '../src/services/context'

describe('computeContextPct', () => {
  it('computes ratio', () => {
    expect(computeContextPct(64000, 128000)).toBeCloseTo(0.5, 5)
  })
  it('clamps at 1', () => {
    expect(computeContextPct(200000, 128000)).toBe(1)
  })
  it('returns 0 for zero tokens', () => {
    expect(computeContextPct(0, 128000)).toBe(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL

- [ ] **Step 3: 实现 `src/services/context.ts`**

```ts
export const DEFAULT_CONTEXT_LIMIT = 128000

export function computeContextPct(tokens: number, limit: number): number {
  if (limit <= 0 || tokens <= 0) return 0
  return Math.min(1, tokens / limit)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/context.ts tests/context.test.ts
git commit -m "feat: context percentage computation"
```

---

### Task 4: 宿主 TurnCostService（每轮消耗换算）

**Files:**
- Create: `src/services/turnCost.ts`
- Test: `tests/turnCost.test.ts`

**Interfaces:**
- Consumes: 无（纯函数）
- Produces: `estimateCost(tokens: number, pricing: { input: number; output: number; inputTokens: number; outputTokens: number }): number`

- [ ] **Step 1: 写失败测试 `tests/turnCost.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { estimateCost } from '../src/services/turnCost'

describe('estimateCost', () => {
  it('computes cost from token split', () => {
    const cost = estimateCost(1000, { input: 0.5, output: 2, inputTokens: 600, outputTokens: 400 })
    // 600 * 0.5 / 1e6 + 400 * 2 / 1e6
    expect(cost).toBeCloseTo(0.0011, 6)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm test`
Expected: FAIL

- [ ] **Step 3: 实现 `src/services/turnCost.ts`**

```ts
export interface TurnPricing {
  input: number   // 元 / 百万 token
  output: number  // 元 / 百万 token
  inputTokens: number
  outputTokens: number
}

export function estimateCost(tokens: number, p: TurnPricing): number {
  if (tokens <= 0) return 0
  const inT = Math.min(tokens, p.inputTokens)
  const outT = Math.max(0, tokens - p.inputTokens)
  return (inT * p.input + outT * p.output) / 1_000_000
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/turnCost.ts tests/turnCost.test.ts
git commit -m "feat: turn cost estimation"
```

---

### Task 5: 宿主入口（服务装配 + harness.handle 接口）

**Files:**
- Create: `src/index.ts`

**Interfaces:**
- Consumes: Task 2/3/4 的服务；`ctx.tokenMeter`（DSH 服务）、`ctx.credentials`、`ctx.webServer`
- Produces: `harness.handle('whale.getState')` → `{ balance: number | null; currency: string; todayUsage: number; contextPct: number; contextTokens: number; contextLimit: number; lastTurnCost: number | null }`；`harness.handle('whale.setConfig')` → `void`

- [ ] **Step 1: 写宿主入口（用 Inspect 确认 tokenMeter/credentials/harness 的确切签名后实现）**

```ts
import { Context, Service } from '@deepseek-ai/cordis'
import { fetchBalance, Ledger, todayStr } from './services/balance'
import { computeContextPct, DEFAULT_CONTEXT_LIMIT } from './services/context'
import { estimateCost } from './services/turnCost'
import fs from 'node:fs'
import path from 'node:path'

const USAGE_FILE = path.join(process.env.DSH_HOME || path.join(require('node:os').homedir(), '.dsh'), '.whale-girl-usage.json')

export const name = 'dsh-whale-girl'
export const inject = ['credentials', 'webServer']

export function apply(ctx: Context) {
  const ledger = new Ledger()
  try { ledger.load(fs.readFileSync(USAGE_FILE, 'utf8')) } catch { /* first run */ }

  let cachedBalance: number | null = null
  let cachedCurrency = 'CNY'
  let lastTurnCost: number | null = null

  async function refreshBalance() {
    try {
      const key = await ctx.credentials.resolve({ key: 'DEEPSEEK_API_KEY' })
      if (!key) return
      const { totalBalance, currency } = await fetchBalance(key)
      cachedBalance = totalBalance
      cachedCurrency = currency
      ledger.observe(totalBalance)
      fs.writeFileSync(USAGE_FILE, JSON.stringify(ledger.state))
    } catch { /* keep last */ }
  }

  void refreshBalance()
  ctx.setInterval(refreshBalance, 60000)

  // 每轮消耗：监听 turn/end（用 Inspect 确认事件名和 payload，fallback 为 tokenMeter.measure）
  // 注：实现时用 ctx.on('turn/end', ...) 并从中取 usage；如事件不含 usage，则用 tokenMeter 估算
  ctx.on('turn/end', (payload: any) => {
    const usage = payload?.usage ?? payload?.tokens
    if (usage && typeof usage === 'object') {
      const total = Number(usage.total_tokens ?? usage.total ?? 0)
      lastTurnCost = estimateCost(total, { input: 0.5, output: 2, inputTokens: total, outputTokens: 0 })
    }
  })

  ctx.harness.handle('whale.getState', async (): Promise<object> => {
    const session = ctx.sessions?.list?.()[0] ?? ctx.sessions?.get?.()
    let contextTokens = 0
    try {
      const m = ctx.get('tokenMeter')
      if (session && m) {
        const measure = await m.measure(session)
        contextTokens = Number(measure?.totalTokens ?? measure?.tokens ?? 0)
      }
    } catch { /* ignore */ }
    return {
      balance: cachedBalance,
      currency: cachedCurrency,
      todayUsage: ledger.state.todayUsage,
      contextPct: computeContextPct(contextTokens, DEFAULT_CONTEXT_LIMIT),
      contextTokens,
      contextLimit: DEFAULT_CONTEXT_LIMIT,
      lastTurnCost
    }
  })

  ctx.harness.handle('whale.setConfig', async (config: object): Promise<void> => {
    // 持久化挂件配置（音效/大小/开关）到 ~/.dsh/.whale-girl-config.json
    fs.writeFileSync(
      path.join(path.dirname(USAGE_FILE), '.whale-girl-config.json'),
      JSON.stringify(config)
    )
  })

  ctx.on('dispose', () => { /* cleanup */ })
}
```

- [ ] **Step 2: 用 cordis_inspect_query 确认 `tokenMeter.measure`、`turn/end` 事件、`credentials.resolve` 的确切签名，修正代码**

Run: `cordis_inspect_query`（host Service `tokenMeter`、host Event `turn/end`）
Expected: 拿到确切签名并修正实现（若 `measure` 返回结构不同，按实际字段取值）

- [ ] **Step 3: `pnpm typecheck` + `pnpm build` 确认编译通过**

Run: `pnpm typecheck && pnpm build`
Expected: PASS，`lib/index.js` 生成

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: host services and harness API"
```

---

### Task 6: 客户端挂件主组件（slot + 形象 + 动画 + 拖拽）

**Files:**
- Create: `src/client/index.tsx`、`src/client/WhaleWidget.tsx`、`src/client/styles.css`
- Modify: `assets/whale-girl.png`（复制自 `D:\dsh-whale-girl-assets\final\whale-girl-cutout.png`）

**Interfaces:**
- Consumes: `host.call('whale.getState')`（Task 5）
- Produces: `WhaleWidget` 组件（props: `{ onPress: () => void; onDragEnd: (pos: {x:number;y:number}) => void }`）；slot 注册 `shell.overlay` id `whale-girl-widget`

- [ ] **Step 1: 复制素材**

Run: `copy D:\dsh-whale-girl-assets\final\whale-girl-cutout.png assets\whale-girl.png`

- [ ] **Step 2: 写客户端入口 `src/client/index.tsx`（注册 slot）**

```tsx
import React from 'react'
import { WhaleWidget } from './WhaleWidget'
import './styles.css'

export const inject = ['slots', 'locale']

export function apply(ctx: any) {
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      { name: 'shell.overlay', id: 'whale-girl-widget', order: 70, label: '鲸鱼娘' },
      () => React.createElement(WhaleWidget)
    )
  )
}
```

- [ ] **Step 3: 写挂件主组件 `WhaleWidget.tsx`（形象 + 浮动动画 + 拖拽吸附 + 按压变形）**

```tsx
import React, { useRef, useState, useEffect, useCallback } from 'react'

export function WhaleWidget() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: window.innerWidth - 220, y: window.innerHeight - 260 })
  const [pressed, setPressed] = useState(false)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = rootRef.current!.getBoundingClientRect()
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    setPressed(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 180, e.clientX - dragRef.current.dx)),
      y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragRef.current.dy))
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null
    setPressed(false)
    const rect = rootRef.current!.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const vw = window.innerWidth
    const vh = window.innerHeight
    // 四边吸附（优先最近边）
    const left = cx < vw / 2 ? 8 : vw - rect.width - 8
    const top = cy < vh / 2 ? 8 : vh - rect.height - 8
    setPos({ x: left, y: Math.max(8, Math.min(vh - rect.height - 8, cy - rect.height / 2)) })
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  return (
    <div
      ref={rootRef}
      className="wg-root"
      style={{ left: pos.x, top: pos.y, transform: pressed ? 'scale(0.92)' : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      data-pressed={pressed}
    >
      <img className="wg-img" src="/dsh-whale-girl/whale-girl.png" alt="鲸鱼娘" draggable={false} />
      <div className="wg-float" />
    </div>
  )
}
```

- [ ] **Step 4: 写样式 `styles.css`（浮动动画 + 按压）**

```css
.wg-root {
  position: fixed;
  width: 170px;
  height: 170px;
  z-index: 9999;
  cursor: grab;
  user-select: none;
  touch-action: none;
  transition: transform 120ms ease;
}
.wg-root:active { cursor: grabbing; }
.wg-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  animation: wg-float 3.2s ease-in-out infinite;
}
@keyframes wg-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
```

- [ ] **Step 5: `pnpm build` 确认 client bundle 生成**

Run: `pnpm build`
Expected: `lib/client.js` 生成（含 `window.__ModuleLoader__.load` 包装）

- [ ] **Step 6: Commit**

```bash
git add assets/ src/client/
git commit -m "feat: whale widget shell with drag and float animation"
```

---

### Task 7: 客户端数据获取 + 上下文进度条

**Files:**
- Create: `src/client/ContextBar.tsx`
- Modify: `src/client/WhaleWidget.tsx`（接入数据轮询）

**Interfaces:**
- Consumes: `host.call('whale.getState')` → `{ balance, currency, todayUsage, contextPct, contextTokens, contextLimit, lastTurnCost }`
- Produces: `ContextBar`（props: `{ pct: number; tokens: number; limit: number }`），点击展开详情

- [ ] **Step 1: 写 ContextBar 组件（常驻进度条 + 点击详情）**

```tsx
import React, { useState } from 'react'

export function ContextBar({ pct, tokens, limit }: { pct: number; tokens: number; limit: number }) {
  const [open, setOpen] = useState(false)
  const p = Math.round(pct * 100)
  const color = p < 60 ? '#4ade80' : p < 80 ? '#fbbf24' : '#f87171'
  return (
    <div className="wg-context" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
      <div className="wg-context-track">
        <div className="wg-context-fill" style={{ width: `${Math.min(100, p)}%`, background: color }} />
      </div>
      {open && (
        <div className="wg-context-detail" onClick={(e) => e.stopPropagation()}>
          <div>上下文占用：{p}%</div>
          <div>{tokens.toLocaleString()} / {limit.toLocaleString()} tokens</div>
          {p >= 80 && <div className="wg-warn">⚠️ 快满啦，建议开新会话</div>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 修改 WhaleWidget 接入数据（60s 轮询 host.call）**

```tsx
const [state, setState] = useState<any>({ balance: null, todayUsage: 0, contextPct: 0, contextTokens: 0, contextLimit: 128000 })
useEffect(() => {
  let alive = true
  const load = () => {
    window.host?.call?.('whale.getState').then((s: any) => { if (alive && s) setState(s) }).catch(() => {})
  }
  load()
  const t = setInterval(load, 60000)
  return () => { alive = false; clearInterval(t) }
}, [])
// 渲染：挂件底部叠加 <ContextBar pct={state.contextPct} tokens={state.contextTokens} limit={state.contextLimit} />
```

> 注：`window.host.call` 是 client 侧 RPC 入口；实现时以 cordis-plugin-development 技能为准（可能是 `ctx.harness.call` 或注入的 host 服务）。

- [ ] **Step 3: 用 cordis-inspect / cordis-plugin-development 技能确认 client 侧调用 host.handle 的确切 API，修正代码**

Run: `cordis_inspect_query`（client Service 目录）或加载技能
Expected: 修正为正确调用方式（如 `ctx.harness.call('whale.getState')`）

- [ ] **Step 4: `pnpm typecheck && pnpm build`**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/client/
git commit -m "feat: context progress bar and data polling"
```

---

### Task 8: 气泡台词系统 + 彩蛋

**Files:**
- Create: `src/client/quotes.ts`、`src/client/Bubble.tsx`、`src/client/EasterEgg.ts`
- Modify: `src/client/WhaleWidget.tsx`（点击触发随机台词 + 连按计数）

**Interfaces:**
- Consumes: 台词库（本任务定义）
- Produces: `QUOTE_GROUPS`（加权随机组）、`pickQuote(category: 'idle'|'model'|'token'|'interact5'|'interact10'): string`、`Bubble` 组件

- [ ] **Step 1: 写台词库 `quotes.ts`（Spec 第 4 节，不得新增规整 AI 味台词）**

```ts
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
export const RARE_WEIGHT = 1

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickRandomIdleLine(): string {
  // 加权：模型语录 45 / 傲娇 20 / token 20 / 稀有 1
  const r = Math.random() * 86
  if (r < 45) return pickOne(MODEL_LINES)
  if (r < 65) return pickOne(TSUNDERE_LINES)
  if (r < 85) return pickOne(TOKEN_LINES)
  return RARE_LINE
}
```

- [ ] **Step 2: 写 Bubble 组件（气泡 5 秒自动收起）**

```tsx
import React, { useEffect } from 'react'

export function Bubble({ text, onClose }: { text: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [text, onClose])
  return (
    <div className="wg-bubble" onClick={(e) => { e.stopPropagation(); onClose() }}>
      <span>{text}</span>
    </div>
  )
}
```

- [ ] **Step 3: 写彩蛋逻辑 `EasterEgg.ts`（连按计数 + 时机触发）**

```ts
import { pickOne, MODEL_LINES, TSUNDERE_LINES, TOKEN_LINES } from './quotes'

export class EasterEgg {
  private presses = 0
  private lastPressAt = 0
  onPress(): { kind: 'none' } | { kind: 'quote'; text: string } {
    const now = Date.now()
    this.presses = now - this.lastPressAt < 800 ? this.presses + 1 : 1
    this.lastPressAt = now
    if (this.presses === 5) return { kind: 'quote', text: pickOne(TSUNDERE_LINES) }
    if (this.presses === 10) { this.presses = 0; return { kind: 'quote', text: pickOne(TSUNDERE_LINES) } }
    return { kind: 'none' }
  }
  onContextHigh(pct: number): string | null {
    return pct >= 0.8 ? pickOne(TOKEN_LINES) : null
  }
  onTurnEnd(): string | null {
    return pickOne(MODEL_LINES)
  }
  onBalanceChange(): string | null {
    return pickOne(TOKEN_LINES)
  }
}
```

- [ ] **Step 4: 接入 WhaleWidget（点击随机台词 + 连按彩蛋 + 时机触发）**

```tsx
const [bubble, setBubble] = useState<string | null>(null)
const eggRef = useRef(new EasterEgg())
// 点击（非拖拽）：随机台词
const onClick = useCallback(() => {
  const r = eggRef.current.onPress()
  if (r.kind === 'quote') { setBubble(r.text); return }
  setBubble(pickRandomIdleLine())
}, [])
// 时机：contextPct >= 0.8 时触发一次吐槽（useEffect 监听 state.contextPct）
// 渲染：{bubble && <Bubble text={bubble} onClose={() => setBubble(null)} />}
```

- [ ] **Step 5: `pnpm typecheck && pnpm build`**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/client/
git commit -m "feat: bubble quotes and easter egg system"
```

---

### Task 9: 音效引擎（duck 文件 + cute 程序化）

**Files:**
- Create: `src/client/SoundEngine.ts`
- Modify: `assets/Ya1.mp3`、`assets/Ya2.mp3`（复制自 whale）

**Interfaces:**
- Consumes: 无
- Produces: `SoundEngine` 类：`setMode(mode: 'duck'|'cute')`、`press(): void`、`release(): void`

- [ ] **Step 1: 复制小黄鸭音效**

Run: `copy node_modules\dsh-whale-widget\assets\Ya1.mp3 assets\` 和 `Ya2.mp3`（whale 为 MIT）

- [ ] **Step 2: 实现 SoundEngine（duck 用 Audio 文件 + data URL 内嵌；cute 用 Web Audio 合成 pop/叮）**

```ts
export type SoundMode = 'duck' | 'cute'

export class SoundEngine {
  private mode: SoundMode = 'cute'
  private duckPress: HTMLAudioElement | null = null
  private duckRelease: HTMLAudioElement | null = null
  private actx: AudioContext | null = null

  constructor() {
    if (typeof window === 'undefined') return
    this.duckPress = new Audio('/dsh-whale-girl/Ya1.mp3')
    this.duckPress.preload = 'auto'
    this.duckRelease = new Audio('/dsh-whale-girl/Ya2.mp3')
    this.duckRelease.preload = 'auto'
    try { this.actx = new (window.AudioContext || (window as any).webkitAudioContext)() } catch { this.actx = null }
  }

  setMode(mode: SoundMode) { this.mode = mode }

  press() {
    if (this.mode === 'duck') { this.play(this.duckPress); return }
    this.cute(520, 0.09, 'square', 0.15)
  }

  release() {
    if (this.mode === 'duck') { this.play(this.duckRelease); return }
    this.cute(760, 0.08, 'sine', 0.12)
  }

  private play(a: HTMLAudioElement | null) {
    if (!a) return
    try { a.currentTime = 0; void a.play().catch(() => {}) } catch { /* ignore */ }
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
      osc.connect(g).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + dur + 0.02)
    } catch { /* ignore */ }
  }
}
```

- [ ] **Step 3: 接入 WhaleWidget（pointerdown 调 press，pointerup 调 release）**

```tsx
const soundRef = useRef(new SoundEngine())
// onPointerDown: soundRef.current.press(); onPointerUp: soundRef.current.release()
```

- [ ] **Step 4: 用 host 路由提供音效文件（在 src/index.ts 注册 `/dsh-whale-girl/Ya1.mp3` 等，读 assets 文件）**

```ts
// 追加到 src/index.ts 的 apply：
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ASSET_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets')
for (const f of ['Ya1.mp3', 'Ya2.mp3', 'whale-girl.png']) {
  ctx.webServer.register({ kind: 'exact', path: `/dsh-whale-girl/${f}`, handler: (req, res) => {
    const buf = fs.readFileSync(path.join(ASSET_ROOT, f))
    res.writeHead(200, { 'Content-Type': f.endsWith('.mp3') ? 'audio/mpeg' : 'image/png', 'Cache-Control': 'public, max-age=86400, immutable', 'Content-Length': String(buf.length) })
    res.end(buf)
  }})
}
```

- [ ] **Step 5: `pnpm typecheck && pnpm build` + 复制 assets 到构建产物**

Run: `pnpm build`（确保 lib 旁 assets 可被宿主读取）
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/ assets/
git commit -m "feat: sound engine with duck and cute modes"
```

---

### Task 10: 构建、安装与端到端验证

**Files:**
- Modify: 无（验证任务）

**Interfaces:**
- Consumes: Task 1-9 全部产物

- [ ] **Step 1: 完整构建 + 测试**

Run: `pnpm test && pnpm typecheck && pnpm build`
Expected: 全绿，`lib/index.js` + `lib/client.js` + `assets/` 完整
Actual: ✅ 全绿（exit 0）；`lib/client.js`/`lib/index.js`（含 map）已生成

- [x] **Step 2: 安装到 desktop profile**

Run: `dsh plugin --profile desktop add link:D:\dsh-whale-girl`
Expected: 安装成功，`desktop/package.json` bundles 出现 `dsh-whale-girl`
Actual: ✅ 已安装；`C:\Users\NICK\.dsh\profiles\desktop\package.json` dependencies 含 `dsh-whale-girl: link:D:/dsh-whale-girl`；`dsh plugin --profile desktop list` 可见

- [x] **Step 3: 验证配置**

Run: `dsh --profile desktop --dump-config | grep whale-girl`
Expected: `whale-girl` 条目存在
Actual: ✅ CONFIG_HAS_WHALE_GIRL；assets（whale-girl.png 1.1MB / Ya1.mp3 / Ya2.mp3）在位

- [ ] **Step 4: 重启 DSH Desktop 并人工验证（待用户执行：重启 + F5）**

Run: 重启 DSH Desktop，F5 刷新
Expected:
- 右下角出现鲸鱼娘挂件（透明 PNG，浮动动画）
- 挂件可拖拽并四边吸附
- 点击弹随机台词气泡（5 秒收起）；连按 5 次触发傲娇台词
- 挂件旁上下文进度条显示当前会话占用；点击展开详情
- 按压有音效（菜单可在 duck/cute 间切换）
- 余额/今日已用随数据刷新（60s）

- [ ] **Step 5: 清理（若验证失败回到对应 Task 修复）**

Run: 确认无报错后，`git commit -am "chore: verified end-to-end"`

---

### Task 11: 甩抛弹跳物理模块

**Files:**
- Create: `src/client/PhysicsFling.ts`
- Modify: `src/client/WhaleWidget.tsx`（接入速度检测 + 弹跳循环）

**Interfaces:**
- Consumes: `WhaleWidget` 的 `pos`/`setPos` 与 pointer 事件
- Produces: `FlingTracker` 类（`record(x, y, t)` 采样、`velocity(): {vx, vy}` 计算）；`runFling(vx, vy, bounds, onBounce, onDone)` 弹跳循环

- [x] **Step 1: 实现 `PhysicsFling.ts`（速度跟踪 + 弹跳循环）**（落地：`FlingTracker.push/velocity/clear` + `startFling` 返回 `{ cancel }`；撞边回调 `onBounce('x'|'y')`）

```ts
export class FlingTracker {
  private samples: { x: number; y: number; t: number }[] = []
  record(x: number, y: number, t: number = performance.now()): void {
    this.samples.push({ x, y, t })
    if (this.samples.length > 6) this.samples.shift()
  }
  velocity(): { vx: number; vy: number } {
    if (this.samples.length < 2) return { vx: 0, vy: 0 }
    const a = this.samples[0]
    const b = this.samples[this.samples.length - 1]
    const dt = Math.max(1, b.t - a.t) / 1000
    return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt }
  }
  reset(): void { this.samples = [] }
}

export function runFling(
  startX: number,
  startY: number,
  vx: number,
  vy: number,
  bounds: { w: number; h: number },
  onUpdate: (x: number, y: number) => void,
  onBounce: () => void,
  onDone: (x: number, y: number) => void
): () => void {
  let x = startX
  let y = startY
  let vx0 = vx
  let vy0 = vy
  let raf = 0
  let last = performance.now()
  const W = Math.max(1, bounds.w - 170)
  const H = Math.max(1, bounds.h - 180)
  const step = (now: number) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
    last = now
    x += vx0 * dt
    y += vy0 * dt
    let bounced = false
    if (x < 0) { x = 0; vx0 = Math.abs(vx0) * 0.85; bounced = true }
    else if (x > W) { x = W; vx0 = -Math.abs(vx0) * 0.85; bounced = true }
    if (y < 0) { y = 0; vy0 = Math.abs(vy0) * 0.85; bounced = true }
    else if (y > H) { y = H; vy0 = -Math.abs(vy0) * 0.85; bounced = true }
    if (bounced) onBounce()
    onUpdate(x, y)
    vx0 *= 0.98
    vy0 *= 0.98
    if (Math.abs(vx0) < 20 && Math.abs(vy0) < 20) {
      onDone(x, y)
      return
    }
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
  return () => cancelAnimationFrame(raf)
}
```

- [x] **Step 2: 接入 WhaleWidget（pointer 记录采样，松手超阈值触发弹跳，否则吸附）**（阈值 1200 px/s；弹跳中停用 transition，松手重新按下即取消）

```tsx
const flingRef = useRef(new FlingTracker())
const cancelRef = useRef<(() => void) | null>(null)
// onPointerDown: cancelRef.current?.(); flingRef.current.reset(); 开始采样
// onPointerMove（拖拽中）: flingRef.current.record(e.clientX, e.clientY)
// onPointerUp: 计算 velocity；若 |v| > 600 → runFling(...)（弹跳，onBounce 播放音效+表情）；否则原吸附逻辑
// 注意：弹跳模式下 onPointerUp 不再立即吸附，由 onDone 时吸附
```

- [x] **Step 3: 撞边音效/表情（onBounce 里 sound 播放 + 短促表情）**（落地：`SoundEngine.bounce()`（duck 复用 Ya2 / cute 短波音）+ `wg-bounce`/`wg-shake` CSS，抖动 300ms）

```tsx
// onBounce: soundRef.current?.bounce?.()（SoundEngine 增加 bounce() 方法：cute 高频短音）
// 表情：bounce 时 img 短暂 scale 抖动（CSS class 切换）
```

- [x] **Step 4: `pnpm typecheck && pnpm build && pnpm test`**

Run: `pnpm typecheck && pnpm build && pnpm test`
Expected: 全绿
Actual: ✅ 全绿（exit 0）

- [x] **Step 5: Commit**

```bash
git add src/client/
git commit -m "feat: fling bounce physics for whale widget"
```
Actual: ✅ `2d16cbf`（实现）+ `743d411`（docs：勾选 Steps 1-3）

---

## Self-Review

**1. Spec coverage:**
- ✅ 核心功能（余额/今日已用/每轮消耗/拖拽/气泡）→ Task 2/4/5/6/8
- ✅ 上下文进度（常驻条+详情）→ Task 3/7
- ✅ 彩蛋（互动/时机/隐藏解锁 + 加权随机组）→ Task 8
- ✅ 音效（duck 文件 + cute 程序化，可切换）→ Task 9
- ✅ 形象（AI 生成透明 PNG）→ Task 6（assets 复制）
- ✅ 台词库（A/B/C + 稀有，无 AI 味）→ Task 8 quotes.ts
- ✅ 标准 DSH 插件（host + client + immediately）→ Task 1/5/6

**2. Placeholder scan:** 无 TBD/TODO；Task 5/7 中有"用 Inspect 确认"的步骤（因为 DSH 运行时 API 签名需运行时确认，这是有意的验证步骤而非占位符）。

**3. Type consistency:**
- `whale.getState` 返回结构在 Task 5 定义、Task 7 消费 —— 一致
- `SoundEngine.press/release/setMode` 在 Task 9 定义使用 —— 一致
- `EasterEgg.onPress/onContextHigh/onTurnEnd/onBalanceChange` 在 Task 8 定义使用 —— 一致
- `computeContextPct`、`estimateCost`、`Ledger` 签名在 Task 2/3/4 定义、Task 5 使用 —— 一致

**已知运行时依赖**（实现时须用 cordis-plugin-development 技能 / Inspect 确认）：
- `ctx.harness.handle` 宿主方法注册的准确签名
- client 侧调用 host 方法的确切 API（`window.host.call` vs `ctx.harness.call`）
- `tokenMeter.measure(session)` 返回结构
- `turn/end` 事件 payload 结构
- `shell.overlay` slot 注册的确切 API（已有 Inspect 结果：`{ name, id, order?, label? }`）
