import { create } from 'zustand'

interface PracticeSession {
  mode: string
  subjectFilter?: string
  questionIds: number[]
  currentIndex: number
  startTime: number
}

interface StudyState {
  currentSession: PracticeSession | null
  setSession: (session: PracticeSession | null) => void
  setCurrentIndex: (index: number) => void
  advanceQuestion: () => void
}

export const useStudyStore = create<StudyState>((set) => ({
  currentSession: null,

  setSession: (session) => set({ currentSession: session }),

  setCurrentIndex: (index) =>
    set((state) => {
      if (!state.currentSession) return state
      return { currentSession: { ...state.currentSession, currentIndex: index } }
    }),

  advanceQuestion: () =>
    set((state) => {
      if (!state.currentSession) return state
      const next = state.currentSession.currentIndex + 1
      if (next >= state.currentSession.questionIds.length) return state
      return { currentSession: { ...state.currentSession, currentIndex: next } }
    }),
}))
