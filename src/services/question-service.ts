import { db } from '../db'
import type { Question, QuestionFilter } from '../types'

export async function getQuestions(filter: QuestionFilter): Promise<{ data: Question[]; total: number }> {
  let collection = db.questions.toCollection()

  if (filter.subject) {
    collection = db.questions.where('subject').equals(filter.subject)
  }

  let filtered = await collection.toArray()

  if (filter.chapter) {
    filtered = filtered.filter((q) => q.chapter === filter.chapter)
  }
  if (filter.type) {
    filtered = filtered.filter((q) => q.type === filter.type)
  }
  if (filter.difficulty) {
    filtered = filtered.filter((q) => q.difficulty === filter.difficulty)
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase()
    filtered = filtered.filter((q) => q.content.toLowerCase().includes(kw) || q.tags.some((t) => t.includes(kw)))
  }
  if (filter.source) {
    filtered = filtered.filter((q) => q.source.includes(filter.source!))
  }

  const total = filtered.length
  const page = filter.page || 1
  const pageSize = filter.pageSize || 20
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)

  return { data, total }
}

export async function getQuestionById(id: number): Promise<Question | undefined> {
  return db.questions.get(id)
}

export async function getQuestionsByIds(ids: number[]): Promise<Question[]> {
  const results = await db.questions.where('id').anyOf(ids).toArray()
  const map = new Map(results.map((q) => [q.id, q]))
  return ids.map((id) => map.get(id)).filter(Boolean) as Question[]
}

export async function getQuestionStats(questionId: number) {
  const records = await db.answerRecords.where('questionId').equals(questionId).toArray()
  const fav = await db.favorites.where('targetId').equals(questionId as number).first()
  return {
    attemptCount: records.length,
    correctCount: records.filter((r) => r.isCorrect).length,
    avgTimeSpent: records.length ? Math.round(records.reduce((s, r) => s + r.timeSpent, 0) / records.length) : 0,
    isCollected: !!fav,
  }
}

export async function getBatchQuestionStats(questionIds: number[]): Promise<Record<number, { attemptCount: number; correctCount: number; isCollected: boolean }>> {
  const records = await db.answerRecords.where('questionId').anyOf(questionIds).toArray()
  const favs = await db.favorites.where('targetId').anyOf(questionIds).toArray()
  const favSet = new Set(favs.map((f) => f.targetId))

  const statsMap: Record<number, { attemptCount: number; correctCount: number; isCollected: boolean }> = {}
  for (const id of questionIds) {
    const qRecords = records.filter((r) => r.questionId === id)
    statsMap[id] = {
      attemptCount: qRecords.length,
      correctCount: qRecords.filter((r) => r.isCorrect).length,
      isCollected: favSet.has(id),
    }
  }
  return statsMap
}

export async function getRandomQuestions(count: number, subject?: string, difficulty?: number): Promise<Question[]> {
  let pool = await db.questions.toArray()
  if (subject) pool = pool.filter((q) => q.subject === subject)
  if (difficulty) pool = pool.filter((q) => q.difficulty === difficulty)
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
