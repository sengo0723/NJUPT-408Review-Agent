import { create } from 'zustand'
import { getLocalStorage, setLocalStorage } from '../utils/storage'

interface SubjectProficiency {
  'data-structure': number
  'computer-organization': number
  'os': number
  'network': number
}

interface ProfileInfo {
  name: string
  undergradSchool: string
  undergradMajor: string
  dailyStudyHours: number
  weakPoints: string
  notes: string
}

interface AppState {
  examDate: string | null
  targetSchool: string
  targetScore: number
  theme: 'light' | 'dark'
  dailyReminder: { enabled: boolean; time: string }
  sidebarCollapsed: boolean
  lastBackupDate: string | null
  subjectProficiency: SubjectProficiency
  profile: ProfileInfo

  setExamDate: (date: string | null) => void
  setTargetSchool: (school: string) => void
  setTargetScore: (score: number) => void
  setTheme: (theme: 'light' | 'dark') => void
  setDailyReminder: (reminder: { enabled: boolean; time: string }) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setLastBackupDate: (date: string) => void
  setSubjectProficiency: (p: SubjectProficiency) => void
  setProfile: (p: ProfileInfo) => void
}

export const useAppStore = create<AppState>((set) => ({
  examDate: getLocalStorage<string | null>('app_examDate', null),
  targetSchool: getLocalStorage<string>('app_targetSchool', ''),
  targetScore: getLocalStorage<number>('app_targetScore', 120),
  theme: getLocalStorage<'light' | 'dark'>('app_theme', 'light'),
  dailyReminder: getLocalStorage('app_dailyReminder', { enabled: false, time: '09:00' }),
  sidebarCollapsed: getLocalStorage('app_sidebarCollapsed', false),
  lastBackupDate: getLocalStorage<string | null>('app_lastBackupDate', null),
  subjectProficiency: getLocalStorage<SubjectProficiency>('app_subjectProficiency', { 'data-structure': 3, 'computer-organization': 3, 'os': 3, 'network': 3 }),
  profile: getLocalStorage<ProfileInfo>('app_profile', { name: '', undergradSchool: '', undergradMajor: '', dailyStudyHours: 4, weakPoints: '', notes: '' }),

  setExamDate: (date) => { setLocalStorage('app_examDate', date); set({ examDate: date }) },
  setTargetSchool: (school) => { setLocalStorage('app_targetSchool', school); set({ targetSchool: school }) },
  setTargetScore: (score) => { setLocalStorage('app_targetScore', score); set({ targetScore: score }) },
  setTheme: (theme) => { setLocalStorage('app_theme', theme); set({ theme }) },
  setDailyReminder: (reminder) => { setLocalStorage('app_dailyReminder', reminder); set({ dailyReminder: reminder }) },
  setSidebarCollapsed: (collapsed) => { setLocalStorage('app_sidebarCollapsed', collapsed); set({ sidebarCollapsed: collapsed }) },
  setLastBackupDate: (date) => { setLocalStorage('app_lastBackupDate', date); set({ lastBackupDate: date }) },
  setSubjectProficiency: (p) => { setLocalStorage('app_subjectProficiency', p); set({ subjectProficiency: p }) },
  setProfile: (p) => { setLocalStorage('app_profile', p); set({ profile: p }) },
}))
