import Dexie, { type EntityTable } from 'dexie'
import type { Question, AnswerRecord, ErrorBookItem, AIConversation, AIMessage, AIMemory, StudyPlan, DailyTask, Flashcard, MockExamRecord, Favorite, Note, FocusRecord, KnowledgeProgress, DailySummary } from '../types'

const db = new Dexie('Review408DB') as Dexie & {
  questions: EntityTable<Question, 'id'>
  answerRecords: EntityTable<AnswerRecord, 'id'>
  errorBook: EntityTable<ErrorBookItem, 'id'>
  aiConversations: EntityTable<AIConversation, 'id'>
  aiMessages: EntityTable<AIMessage, 'id'>
  aiMemories: EntityTable<AIMemory, 'id'>
  studyPlans: EntityTable<StudyPlan, 'id'>
  dailyTasks: EntityTable<DailyTask, 'id'>
  flashcards: EntityTable<Flashcard, 'id'>
  mockExamRecords: EntityTable<MockExamRecord, 'id'>
  favorites: EntityTable<Favorite, 'id'>
  notes: EntityTable<Note, 'id'>
  focusRecords: EntityTable<FocusRecord, 'id'>
  knowledgeProgress: EntityTable<KnowledgeProgress, 'id'>
  dailySummaries: EntityTable<DailySummary, 'id'>
}

db.version(1).stores({
  questions: '++id, subject, chapter, type, difficulty, year, *tags',
  answerRecords: '++id, questionId, createdAt',
  errorBook: '++id, questionId, masteryStatus, nextReviewAt',
  aiConversations: '++id, subjectTag, createdAt, isPinned',
  aiMessages: '++id, conversationId, createdAt',
  aiMemories: '++id, category, relatedKnowledgePoint, weight',
  studyPlans: '++id, phase',
  dailyTasks: '++id, date, isCompleted',
  flashcards: '++id, subject, knowledgePoint, nextReviewAt, masteryLevel',
  mockExamRecords: '++id, date',
  favorites: '++id, type, targetId',
  notes: '++id, targetType, targetId, updatedAt',
  focusRecords: '++id, createdAt',
  knowledgeProgress: '++id, knowledgePointId, status',
})

db.version(2).stores({
  aiConversations: '++id, subjectTag, createdAt, isPinned, updatedAt',
}).upgrade(tx => {
  return tx.table('aiConversations').toCollection().modify(conv => {
    if (!conv.updatedAt) conv.updatedAt = conv.createdAt
  })
})

db.version(3).stores({
  dailySummaries: '++id, date',
})

export { db }
