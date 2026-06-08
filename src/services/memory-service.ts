import { db } from '../db'
import type { AIMemory, MemoryCategory } from '../types'
import { MEMORY_CATEGORY_LABELS } from '../utils/helpers'

export async function addMemory(memory: Omit<AIMemory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>): Promise<number> {
  const id = await db.aiMemories.add({
    ...memory,
    createdAt: new Date(),
    lastAccessedAt: new Date(),
    accessCount: 0,
  } as AIMemory)
  return id as number
}

export async function getMemories(filters?: { category?: MemoryCategory; knowledgePoint?: string }): Promise<AIMemory[]> {
  let memories = await db.aiMemories.toArray()
  if (filters?.category) {
    memories = memories.filter((m) => m.category === filters.category)
  }
  if (filters?.knowledgePoint) {
    memories = memories.filter((m) => m.relatedKnowledgePoint === filters.knowledgePoint)
  }
  return memories.sort((a, b) => b.weight - a.weight)
}

export async function updateMemory(id: number, updates: Partial<AIMemory>): Promise<void> {
  await db.aiMemories.update(id, updates)
}

export async function deleteMemory(id: number): Promise<void> {
  await db.aiMemories.delete(id)
}

export async function getRelevantMemories(context: string): Promise<AIMemory[]> {
  const memories = await db.aiMemories.toArray()
  if (memories.length === 0) return []

  // 动态衰减：基于 lastAccessedAt 与当前时间的差值
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const decayedMemories = memories.map((m) => {
    let weight = m.weight
    if (m.lastAccessedAt && new Date(m.lastAccessedAt) < thirtyDaysAgo) {
      const daysSinceAccess = Math.floor((now.getTime() - new Date(m.lastAccessedAt).getTime()) / (24 * 60 * 60 * 1000))
      const decayCycles = Math.floor(daysSinceAccess / 30)
      weight = weight * Math.pow(0.9, decayCycles)
    }
    return { ...m, weight }
  })

  const keywords = context.replace(/[，。？！、；：""''（）【】《》]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)

  const scored = decayedMemories.map((m) => {
    let score = m.weight
    for (const kw of keywords) {
      if (m.content.includes(kw)) score += 1
      if (m.relatedKnowledgePoint?.includes(kw)) score += 2
    }
    return { memory: m, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const relevant = scored.filter((s) => s.score > 0).slice(0, 10).map((s) => s.memory)

  // 异步持久化衰减后的权重（不阻塞返回）
  for (const m of relevant) {
    if (m.id) {
      const decayed = decayedMemories.find((d) => d.id === m.id)
      if (decayed && decayed.weight !== m.weight) {
        db.aiMemories.update(m.id, { weight: decayed.weight })
      }
      db.aiMemories.update(m.id, {
        lastAccessedAt: new Date(),
        accessCount: (m.accessCount || 0) + 1,
      })
    }
  }

  return relevant
}

export function formatMemoriesForPrompt(memories: AIMemory[]): string {
  if (memories.length === 0) return ''
  const lines = memories.map((m) => {
    const label = MEMORY_CATEGORY_LABELS[m.category] || m.category
    return `- [${label}] ${m.content}`
  })
  return `以下是该考生的学习记忆，请根据这些信息针对性地回答问题：\n${lines.join('\n')}`
}

export async function decayMemoryWeights(): Promise<void> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const memories = await db.aiMemories.toArray()
  for (const m of memories) {
    if (m.lastAccessedAt && new Date(m.lastAccessedAt) < thirtyDaysAgo && m.id) {
      await db.aiMemories.update(m.id, { weight: (m.weight || 1) * 0.9 })
    }
  }
}
