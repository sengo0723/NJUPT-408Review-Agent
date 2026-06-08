import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/Layout/MainLayout'
import DashboardPage from './features/dashboard/DashboardPage'
import KnowledgePage from './features/knowledge/KnowledgePage'
import QuestionBankPage from './features/question-bank/QuestionBankPage'
import PracticeSession from './features/question-bank/PracticeSession'
import ErrorBookPage from './features/error-book/ErrorBookPage'
import MockExamPage from './features/mock-exam/MockExamPage'
import AIAssistantPage from './features/ai-assistant/AIAssistantPage'
import StudyPlanPage from './features/study-plan/StudyPlanPage'
import StatisticsPage from './features/statistics/StatisticsPage'
import FlashcardPage from './features/flashcard/FlashcardPage'
import SettingsPage from './features/settings/SettingsPage'
import { useAppStore } from './stores/useAppStore'

export default function App() {
  const { theme: themeMode } = useAppStore()

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: '#1677ff', borderRadius: 6 },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/practice" element={<QuestionBankPage />} />
            <Route path="/practice/session" element={<PracticeSession />} />
            <Route path="/error-book" element={<ErrorBookPage />} />
            <Route path="/mock-exam" element={<MockExamPage />} />
            <Route path="/ai-assistant" element={<AIAssistantPage />} />
            <Route path="/study-plan" element={<StudyPlanPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/flashcard" element={<FlashcardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
