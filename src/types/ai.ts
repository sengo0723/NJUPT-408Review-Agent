export type ProviderType = 'openai' | 'anthropic' | 'custom'

export interface AIProviderConfig {
  id: string
  name: string
  providerType: ProviderType
  apiEndpoint: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export interface AIConversation {
  id?: number
  title: string
  subjectTag?: string
  createdAt: Date
  updatedAt: Date
  isPinned: boolean
}

export interface AIMessage {
  id?: number
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  isBookmarked: boolean
  relatedQuestionId?: number
}

export type MemoryCategory = 'weakness' | 'mastered' | 'preference' | 'error-pattern'

export interface AIMemory {
  id?: number
  content: string
  category: MemoryCategory
  weight: number
  relatedKnowledgePoint?: string
  createdAt: Date
  lastAccessedAt: Date
  accessCount: number
  sourceConversationId?: number
}
