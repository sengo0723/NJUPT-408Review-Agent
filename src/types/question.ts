export type SubjectType = 'data-structure' | 'computer-organization' | 'os' | 'network'
export type QuestionType = 'choice' | 'short-answer' | 'code'
export type Difficulty = 1 | 2 | 3 | 4 | 5

export interface Question {
  id?: number
  subject: SubjectType
  chapter: string
  section?: string
  type: QuestionType
  difficulty: Difficulty
  content: string
  options?: string[]
  answer: string
  explanation: string
  source: string
  tags: string[]
  year?: number
}

export interface AnswerRecord {
  id?: number
  questionId: number
  userAnswer: string
  isCorrect: boolean
  timeSpent: number
  createdAt: Date
  note?: string
}

export interface ErrorBookItem {
  id?: number
  questionId: number
  errorCount: number
  lastReviewAt?: Date
  nextReviewAt?: Date
  errorTags: string[]
  masteryStatus: 'unmastered' | 'reviewing' | 'mastered'
  note?: string
}

export interface QuestionFilter {
  subject?: SubjectType
  chapter?: string
  section?: string
  type?: QuestionType
  difficulty?: Difficulty
  source?: string
  keyword?: string
  page?: number
  pageSize?: number
}
