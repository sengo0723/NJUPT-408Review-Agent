import { db } from './index'
import dsQuestions from '../data/questions/data-structure.json'
import coQuestions from '../data/questions/computer-organization.json'
import osQuestions from '../data/questions/os.json'
import netQuestions from '../data/questions/network.json'
import examQuestions from '../data/questions/past-exams.json'
import flashcardsData from '../data/flashcards.json'
import type { Question, Flashcard } from '../types'

const SEED_VERSION_KEY = 'seed_version'
const CURRENT_SEED_VERSION = 4

export async function seedDatabase() {
  const storedVersion = Number(localStorage.getItem(SEED_VERSION_KEY) || '0')
  const allSeeds = [
    ...dsQuestions,
    ...coQuestions,
    ...osQuestions,
    ...netQuestions,
    ...examQuestions,
  ] as Question[]

  if (storedVersion === 0) {
    await db.questions.clear()
    await db.questions.bulkAdd(allSeeds)

    await db.flashcards.clear()
    const cards: Flashcard[] = flashcardsData.map((c: any) => ({
      ...c,
      nextReviewAt: new Date(c.nextReviewAt),
    }))
    await db.flashcards.bulkAdd(cards)
  } else if (storedVersion < CURRENT_SEED_VERSION) {
    const existing = await db.questions.toArray()
    const existingMap = new Map(existing.map(q => [q.content, q]))

    const newQuestions: Question[] = []
    const updates: { id: number; changes: Partial<Question> }[] = []

    for (const q of allSeeds) {
      const existingQ = existingMap.get(q.content)
      if (!existingQ) {
        newQuestions.push(q)
      } else if (existingQ.id) {
        // 检测关键字段是否有更新
        if (existingQ.answer !== q.answer || existingQ.explanation !== q.explanation ||
            existingQ.difficulty !== q.difficulty || existingQ.tags.join(',') !== q.tags.join(',')) {
          updates.push({ id: existingQ.id, changes: { answer: q.answer, explanation: q.explanation, difficulty: q.difficulty, tags: q.tags } })
        }
      }
    }

    if (newQuestions.length > 0) await db.questions.bulkAdd(newQuestions)
    for (const u of updates) await db.questions.update(u.id, u.changes)

    // flashcards 同理
    const existingCards = await db.flashcards.toArray()
    const existingFronts = new Map(existingCards.map(c => [c.front, c]))
    const newCards: Flashcard[] = []
    const cardUpdates: { id: number; changes: Partial<Flashcard> }[] = []

    for (const c of flashcardsData as any[]) {
      const existingC = existingFronts.get(c.front)
      if (!existingC) {
        newCards.push({ ...c, nextReviewAt: new Date(c.nextReviewAt) })
      } else if (existingC.id) {
        if (existingC.back !== c.back) {
          cardUpdates.push({ id: existingC.id, changes: { back: c.back } })
        }
      }
    }

    if (newCards.length > 0) await db.flashcards.bulkAdd(newCards)
    for (const u of cardUpdates) await db.flashcards.update(u.id, u.changes)
  }

  localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}
