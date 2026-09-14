import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
// 用命名导入（而非 default）：js-yaml 的 ESM 没有 default 导出，
// default 导入在 tsdown 某些产物下会运行时报 "does not provide an export named 'default'"。
import { load } from 'js-yaml'

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
  /** 该 provider 声明的模型 id 列表（切换时默认选第一个）。 */
  models?: string[]
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

/** 从一个 provider 配置对象里提取 apiKeyEnv / baseURL / models。 */
function entryFromConfig(id: string, cfg: unknown): ProviderEntry {
  const o = (cfg && typeof cfg === 'object' ? cfg : {}) as Record<string, unknown>
  let models: string[] | undefined
  if (Array.isArray(o.models)) {
    models = o.models
      .map((m) => (m && typeof m === 'object' ? String((m as Record<string, unknown>).id ?? '') : String(m)))
      .filter((s) => s !== '')
  }
  return {
    id,
    name: displayNameOf(id),
    family: familyOf(id),
    apiKeyEnv: typeof o.apiKeyEnv === 'string' ? o.apiKeyEnv : undefined,
    baseURL: typeof o.baseURL === 'string' ? o.baseURL : undefined,
    models: models && models.length > 0 ? models : undefined
  }
}

/**
 * 读取 settings.yaml，返回可切换的提供方列表。
 * 用完整 YAML 解析（js-yaml），覆盖任意书写风格；始终包含内置的 DeepSeek 官方。
 */
export function listProviders(): ProviderEntry[] {
  let providers: ProviderEntry[] = []
  try {
    const doc = (load(fs.readFileSync(settingsPath(), 'utf8')) ?? {}) as Record<string, any>
    const sections = [doc['llm-pi-ai']?.providers, doc['llm-openai-compatible']?.providers]
    for (const section of sections) {
      if (section && typeof section === 'object') {
        for (const [id, cfg] of Object.entries(section as Record<string, unknown>)) {
          if (!providers.some(p => p.id === id)) providers.push(entryFromConfig(id, cfg))
        }
      }
    }
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
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      models: ['deepseek-v4-flash', 'deepseek-v4-pro']
    })
  }
  return providers
}

/** 当前默认模型路由（settings.yaml 的 agent-default-model）。 */
export function currentModel(): { provider: string; model: string } {
  try {
    const doc = (load(fs.readFileSync(settingsPath(), 'utf8')) ?? {}) as Record<string, any>
    const m = doc['agent-default-model']
    return {
      provider: typeof m?.provider === 'string' ? m.provider : '',
      model: typeof m?.model === 'string' ? m.model : ''
    }
  } catch {
    return { provider: '', model: '' }
  }
}

/**
 * 切换全局默认模型路由（写 settings.yaml 的 agent-default-model）。
 * 用行级替换保持文件其余部分（注释、格式）不动；返回是否成功。
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
