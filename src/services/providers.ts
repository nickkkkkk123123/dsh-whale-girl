import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** 一个可切换的 API 提供方（模型路由）。 */
export interface ProviderEntry {
  /** settings.yaml 里的 provider key（如 zai-coding-cn / siliconflow）。 */
  id: string
  /** 展示名。 */
  name: string
  /** 余额查询用家族标识（决定用哪个余额 API）。 */
  family: string
  /** 读取 API key 的凭据引用（apiKeyEnv）。 */
  apiKeyEnv?: string
  /** OpenAI 兼容 baseURL（用于通用余额探测）。 */
  baseURL?: string
}

function settingsPath(): string {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'settings.yaml')
}

/** 从 provider key 推断余额查询家族。 */
function familyOf(id: string): string {
  if (id.includes('deepseek')) return 'deepseek'
  if (id.includes('siliconflow')) return 'siliconflow'
  if (id.includes('zai') || id.includes('zhipu') || id.includes('glm') || id.includes('bigmodel')) return 'zhipu'
  return id
}

function displayNameOf(id: string): string {
  const NAMES: Record<string, string> = {
    'deepseek-official': 'DeepSeek 官方',
    siliconflow: '硅基流动',
    'zai-coding-cn': '智谱 GLM'
  }
  return NAMES[id] ?? id
}

/**
 * 轻量行级 YAML 提取（settings.yaml 结构简单且可预测，避免引入 js-yaml 依赖）。
 * 提取 1) 两个 provider 段的 key 列表及其 apiKeyEnv/baseURL  2) agent-default-model。
 */
function parseSettings(text: string): {
  providers: ProviderEntry[]
  current: { provider: string; model: string }
} {
  const lines = text.split(/\r?\n/)
  const providers: ProviderEntry[] = []
  let current = { provider: '', model: '' }

  // 当前所属段（llm-pi-ai / llm-openai-compatible / agent-default-model）
  let section: 'pi' | 'oc' | 'adm' | null = null
  // provider 子段层级：section 下的 providers: → 其下的 key:
  let inProviders = false
  let activeId: string | null = null

  const pushProvider = (id: string) => {
    if (id && !providers.some(p => p.id === id)) {
      providers.push({ id, name: displayNameOf(id), family: familyOf(id) })
    }
  }

  for (const line of lines) {
    const m = /^(\s*)([A-Za-z0-9_-]+):/.exec(line)
    if (!m) continue
    const indent = m[1].length
    const key = m[2]

    if (indent === 0) {
      // 顶层段切换
      section = key === 'llm-pi-ai' ? 'pi' : key === 'llm-openai-compatible' ? 'oc' : key === 'agent-default-model' ? 'adm' : null
      inProviders = false
      activeId = null
      continue
    }
    if (section === 'adm') {
      if (key === 'provider') current.provider = line.split(':')[1]?.trim() ?? ''
      if (key === 'model') current.model = line.split(':')[1]?.trim() ?? ''
      continue
    }
    if (section === 'pi' || section === 'oc') {
      if (indent === 2 && key === 'providers') { inProviders = true; activeId = null; continue }
      if (inProviders && indent === 4 && line.includes(':') && !line.trim().startsWith('-')) {
        // provider key 行（4 空格缩进）；内联对象 { apiKeyEnv: X, baseURL: Y } 也在此捕获
        const inline = line.split(':').slice(1).join(':')
        activeId = key
        pushProvider(key)
        const p = providers.find(x => x.id === activeId)
        if (p) {
          const env = /apiKeyEnv\s*:\s*([A-Z0-9_]+)/.exec(inline)
          if (env) p.apiKeyEnv = env[1]
          const bu = /baseURL\s*:\s*['"]?([^'"}\s]+)/.exec(inline)
          if (bu) p.baseURL = bu[1].trim()
        }
        continue
      }
      if (inProviders && activeId && indent >= 6) {
        const p = providers.find(x => x.id === activeId)
        if (!p) continue
        if (key === 'apiKeyEnv') {
          p.apiKeyEnv = line.split(':')[1]?.trim()
          continue
        }
        if (key === 'baseURL') {
          p.baseURL = line.split(':').slice(1).join(':').trim()
          continue
        }
      }
    }
  }
  return { providers, current }
}

/** 读取 settings.yaml，返回可切换的提供方列表。始终包含内置的 DeepSeek 官方。 */
export function listProviders(): ProviderEntry[] {
  let providers: ProviderEntry[] = []
  try {
    providers = parseSettings(fs.readFileSync(settingsPath(), 'utf8')).providers
  } catch {
    providers = []
  }
  // deepseek-official 是 DSH 内置 provider，不在 settings.yaml 里声明；
  // 始终加入列表（放在最前），否则从它切走后就无法在菜单里切回来。
  if (!providers.some(p => p.id === 'deepseek-official')) {
    providers.unshift({
      id: 'deepseek-official',
      name: displayNameOf('deepseek-official'),
      family: 'deepseek',
      apiKeyEnv: 'DEEPSEEK_API_KEY'
    })
  }
  return providers
}

/** 当前默认模型路由（settings.yaml 的 agent-default-model）。 */
export function currentModel(): { provider: string; model: string } {
  try {
    return parseSettings(fs.readFileSync(settingsPath(), 'utf8')).current
  } catch {
    return { provider: '', model: '' }
  }
}

/**
 * 切换全局默认模型路由（写 settings.yaml 的 agent-default-model）。
 * 用行级替换保持文件其余部分不动；返回是否成功。
 */
export function selectModel(provider: string, model: string): boolean {
  try {
    const p = settingsPath()
    const text = fs.readFileSync(p, 'utf8')
    const lines = text.split(/\r?\n/)
    const out: string[] = []
    let inAdm = false
    let wroteProvider = false
    let wroteModel = false
    for (const line of lines) {
      const top = /^([A-Za-z0-9_-]+):/.exec(line)
      if (top) {
        inAdm = top[1] === 'agent-default-model'
        out.push(line)
        continue
      }
      if (inAdm && /^\s+provider:/.test(line)) {
        out.push(line.replace(/provider:.*/, `provider: ${provider}`))
        wroteProvider = true
        continue
      }
      if (inAdm && /^\s+model:/.test(line)) {
        out.push(line.replace(/model:.*/, `model: ${model}`))
        wroteModel = true
        continue
      }
      out.push(line)
    }
    if (!wroteProvider || !wroteModel) return false
    fs.writeFileSync(p, out.join('\n'), 'utf8')
    return true
  } catch {
    return false
  }
}
