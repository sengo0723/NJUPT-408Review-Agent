import { Badge, Button, Drawer, Tooltip } from 'antd'
import {
  BookOutlined, EditOutlined, WarningOutlined, AimOutlined,
  RobotOutlined, CalendarOutlined, BarChartOutlined, TagsOutlined,
  SettingOutlined, DashboardOutlined, MenuOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { getDaysUntil } from '../../utils/date'
import { useState, useEffect } from 'react'
import { db } from '../../db'
import { startReminder, stopReminder } from '../../services/notification-service'

const navItems = [
  { key: '/', icon: <DashboardOutlined />, label: '首页' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/practice', icon: <EditOutlined />, label: '刷题中心' },
  { key: '/error-book', icon: <WarningOutlined />, label: '错题本' },
  { key: '/mock-exam', icon: <AimOutlined />, label: '模拟考试' },
  { key: '/ai-assistant', icon: <RobotOutlined />, label: 'AI助手' },
  { key: '/study-plan', icon: <CalendarOutlined />, label: '复习计划' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '数据统计' },
  { key: '/flashcard', icon: <TagsOutlined />, label: '背诵卡片' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { examDate, dailyReminder } = useAppStore()
  const [errorCount, setErrorCount] = useState(0)
  const [todayTasks, setTodayTasks] = useState({ done: 0, total: 0 })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    loadCounts()
  }, [location.pathname])

  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) loadCounts()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (dailyReminder.enabled) {
      startReminder(dailyReminder.time)
    } else {
      stopReminder()
    }
    return () => stopReminder()
  }, [dailyReminder.enabled, dailyReminder.time])

  async function loadCounts() {
    const today = new Date().toISOString().split('T')[0]
    const pendingErrors = await db.errorBook.where('masteryStatus').anyOf(['unmastered', 'reviewing']).count()
    setErrorCount(pendingErrors)

    const tasks = await db.dailyTasks.where('date').equals(today).toArray()
    setTodayTasks({ done: tasks.filter((t) => t.isCompleted).length, total: tasks.length })
  }

  const daysLeft = examDate ? getDaysUntil(examDate) : null
  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Top Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(250, 248, 245, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32, flexShrink: 0 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #C4956A 0%, #D4A574 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: 14,
          }}>
            408
          </div>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            fontSize: 16,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            考研助手
          </span>
        </div>

        {/* Desktop Nav */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flex: 1,
          overflowX: 'auto',
        }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = (item.key === '/' && selectedKey === '/') || (item.key !== '/' && selectedKey === item.key)
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--color-accent-light)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                  lineHeight: '20px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-hover)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.key === '/error-book' && errorCount > 0 && (
                  <Badge count={errorCount} size="small" style={{ marginLeft: 2 }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, marginLeft: 16 }}>
          {daysLeft !== null && daysLeft >= 0 && (
            <Tooltip title="距离考试天数">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-error-bg)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-error)',
              }}>
                <span>距考试</span>
                <span style={{ fontSize: 16, fontFamily: 'var(--font-serif)' }}>{daysLeft}</span>
                <span>天</span>
              </div>
            </Tooltip>
          )}
          {todayTasks.total > 0 && (
            <Tooltip title="今日任务完成情况">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-success-bg)',
                fontSize: 13,
                color: 'var(--color-success)',
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                }} />
                今日 {todayTasks.done}/{todayTasks.total}
              </div>
            </Tooltip>
          )}

          {/* Mobile menu button */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuOpen(true)}
            className="mobile-menu-btn"
            style={{ display: 'none' }}
          />
        </div>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width={260}
        styles={{ body: { padding: 0, background: 'var(--bg-raised)' } }}
      >
        <div style={{ padding: '16px 12px' }}>
          {navItems.map((item) => {
            const isActive = (item.key === '/' && selectedKey === '/') || (item.key !== '/' && selectedKey === item.key)
            return (
              <button
                key={item.key}
                onClick={() => { navigate(item.key); setMobileMenuOpen(false) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'var(--color-accent-light)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.key === '/error-book' && errorCount > 0 && (
                  <Badge count={errorCount} size="small" style={{ marginLeft: 'auto' }} />
                )}
              </button>
            )
          })}
        </div>
      </Drawer>

      {/* Content */}
      <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 56px)' }}>
        <div key={location.pathname} style={{ animation: 'pageEnter 0.35s ease-out' }}>
          <Outlet />
        </div>
      </main>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
