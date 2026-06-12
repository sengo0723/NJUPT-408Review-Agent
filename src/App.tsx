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

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#C4956A',
          colorLink: '#C4956A',
          colorLinkHover: '#B38560',
          colorSuccess: '#5B9A6F',
          colorWarning: '#C4956A',
          colorError: '#C45D5D',
          colorInfo: '#6B8DAD',
          colorBgBase: '#FAF8F5',
          colorBgContainer: '#FFFFFF',
          colorBgElevated: '#FFFFFF',
          colorBorder: '#E8E4DF',
          colorBorderSecondary: '#F0EDE8',
          colorText: '#1A1A1A',
          colorTextSecondary: '#6B6560',
          colorTextTertiary: '#9C9590',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
        },
        components: {
          Menu: {
            colorItemBgSelected: '#F5EDE4',
            colorItemTextSelected: '#C4956A',
            colorItemText: '#6B6560',
            colorItemTextHover: '#1A1A1A',
          },
          Table: {
            colorBgContainer: '#FFFFFF',
            headerBg: '#F3F0EB',
            headerColor: '#6B6560',
            rowHoverBg: '#FBF6F0',
            borderColor: '#F0EDE8',
          },
          Card: {
            colorBgContainer: '#FFFFFF',
            boxShadowTertiary: '0 1px 2px rgba(0,0,0,0.04)',
          },
          Button: {
            defaultShadow: 'none',
          },
        },
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
