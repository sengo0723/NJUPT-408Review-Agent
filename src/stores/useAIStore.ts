import { create } from 'zustand'
import { getLocalStorage, setLocalStorage } from '../utils/storage'
import type { AIProviderConfig } from '../types'
import { v4 as uuidv4 } from 'uuid'

const DEFAULT_SYSTEM_PROMPT = `你是一位资深的408计算机考研辅导专家，精通数据结构、计算机组成原理、操作系统和计算机网络四门核心科目。

你的回答应该：
1. 准确、专业，紧扣408考研大纲
2. 用通俗易懂的方式讲解复杂概念，善用类比
3. 在回答中标注相关知识点的重要程度（高频/中频/低频考点）
4. 如果涉及公式，使用LaTeX格式
5. 如果涉及代码，给出清晰的代码示例
6. 适时提醒易错点和常见陷阱`

const defaultProvider: AIProviderConfig = {
  id: uuidv4(),
  name: '默认配置',
  providerType: 'openai',
  apiEndpoint: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
}

interface AIState {
  providers: AIProviderConfig[]
  activeProviderId: string
  addProvider: (config: Omit<AIProviderConfig, 'id'>) => void
  updateProvider: (id: string, config: Partial<AIProviderConfig>) => void
  removeProvider: (id: string) => void
  setActiveProvider: (id: string) => void
  getActiveProvider: () => AIProviderConfig | null
}

export const useAIStore = create<AIState>((set, get) => ({
  providers: getLocalStorage<AIProviderConfig[]>('ai_providers', [defaultProvider]),
  activeProviderId: getLocalStorage<string>('ai_activeProviderId', defaultProvider.id),

  addProvider: (config) => {
    const newProvider: AIProviderConfig = { ...config, id: uuidv4() }
    set((state) => {
      const providers = [...state.providers, newProvider]
      setLocalStorage('ai_providers', providers)
      return { providers }
    })
  },

  updateProvider: (id, config) => {
    set((state) => {
      const providers = state.providers.map((p) =>
        p.id === id ? { ...p, ...config } : p
      )
      setLocalStorage('ai_providers', providers)
      return { providers }
    })
  },

  removeProvider: (id) => {
    set((state) => {
      if (state.providers.length <= 1) return state
      const providers = state.providers.filter((p) => p.id !== id)
      setLocalStorage('ai_providers', providers)
      let activeProviderId = state.activeProviderId
      if (activeProviderId === id) {
        activeProviderId = providers[0].id
        setLocalStorage('ai_activeProviderId', activeProviderId)
      }
      return { providers, activeProviderId }
    })
  },

  setActiveProvider: (id) => {
    setLocalStorage('ai_activeProviderId', id)
    set({ activeProviderId: id })
  },

  getActiveProvider: () => {
    const { providers, activeProviderId } = get()
    return providers.find((p) => p.id === activeProviderId) || null
  },
}))
