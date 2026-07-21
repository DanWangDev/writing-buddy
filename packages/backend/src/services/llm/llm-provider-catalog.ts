export interface ProviderCatalogEntry {
  readonly id: string
  readonly name: string
  readonly adapter: 'openai-compatible' | 'claude'
  readonly baseUrl: string
  readonly models: readonly string[]
}

export const PROVIDER_CATALOG: readonly ProviderCatalogEntry[] = [
  {
    id: 'dashscope',
    name: 'DashScope (Qwen)',
    adapter: 'openai-compatible',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen3.5-flash'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'kimi',
    name: 'Kimi (Moonshot)',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  {
    id: 'glm',
    name: 'GLM (Zhipu)',
    adapter: 'openai-compatible',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4-plus', 'glm-4-flash', 'glm-4'],
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-Compatible)',
    adapter: 'openai-compatible',
    baseUrl: '',
    models: [],
  },
]

export function getCatalogEntry(id: string): ProviderCatalogEntry | undefined {
  return PROVIDER_CATALOG.find((entry) => entry.id === id)
}

export function getModelsForProvider(catalogId: string, customModels?: string[]): string[] {
  const entry = getCatalogEntry(catalogId)
  if (!entry) return customModels ?? []
  if (catalogId === 'custom') return customModels ?? []
  return [...entry.models]
}
