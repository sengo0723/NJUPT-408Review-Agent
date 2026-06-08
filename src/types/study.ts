export interface StudyPlan {
  id?: number
  title: string
  startDate: string
  endDate: string
  phase: 'foundation' | 'intensive' | 'sprint'
  tasks: PlanTask[]
}

export interface PlanTask {
  id: string
  content: string
  subject?: string
}

export interface DailyTask {
  id?: number
  planId?: number
  date: string
  content: string
  isCompleted: boolean
  completedAt?: Date
  aiReflection?: string
  aiGrowthPoints?: number
  aiReflectionAt?: Date
  aiCategory?: string
  subject?: string
  chapter?: string
}

export interface Flashcard {
  id?: number
  subject: string
  knowledgePoint: string
  front: string
  back: string
  masteryLevel: number
  nextReviewAt: Date
  reviewCount: number
}

export interface MockExamRecord {
  id?: number
  date: Date
  totalScore: number
  timeSpent: number
  details: MockExamDetail[]
}

export interface MockExamDetail {
  questionId: number
  userAnswer: string
  isCorrect: boolean
  score: number
}

export interface Favorite {
  id?: number
  type: 'question' | 'conversation' | 'knowledge-point'
  targetId: number | string
  note?: string
  createdAt: Date
}

export interface Note {
  id?: number
  targetType: 'knowledge-point' | 'question'
  targetId: number | string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface FocusRecord {
  id?: number
  subject?: string
  duration: number
  createdAt: Date
}

export interface KnowledgeProgress {
  id?: number
  knowledgePointId: string
  status: 'learned' | 'weak' | 'unlearned'
  updatedAt: Date
}

export interface DailySummary {
  id?: number
  date: string
  summary: string
  createdAt: Date
}
