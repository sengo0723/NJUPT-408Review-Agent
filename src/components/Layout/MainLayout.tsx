import { Layout, Menu, Badge, Button, Typography, Tooltip } from 'antd'
import {
  BookOutlined, EditOutlined, WarningOutlined, AimOutlined,
  RobotOutlined, CalendarOutlined, BarChartOutlined, TagsOutlined,
  SettingOutlined, DashboardOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { getDaysUntil } from '../../utils/date'
import { useState, useEffect } from 'react'
import { db } from '../../db'
import { startReminder, stopReminder } from '../../services/notification-service'

const { Sider, Content, Header } = Layout
const { Text } = Typography

const menuItems = [
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
  const { sidebarCollapsed, setSidebarCollapsed, examDate, dailyReminder } = useAppStore()
  const [errorCount, setErrorCount] = useState(0)
  const [todayTasks, setTodayTasks] = useState({ done: 0, total: 0 })

  useEffect(() => {
    loadCounts()
  }, [location.pathname]) // 路由变化时重新加载计数

  // 页面可见性变化时刷新计数（用户切换 tab 回来）
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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
        trigger={null}
      >
        <div style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Text strong style={{ fontSize: sidebarCollapsed ? 14 : 18 }}>
            {sidebarCollapsed ? '408' : '408考研助手'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey === '/' ? '/' : selectedKey]}
          items={menuItems.map((item) => ({
            ...item,
            label: item.key === '/error-book' ? (
              <span>{item.label}{errorCount > 0 && <Badge count={errorCount} size="small" offset={[6, 0]} />}</span>
            ) : item.label,
          }))}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0', height: 56,
        }}>
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {daysLeft !== null && daysLeft >= 0 && (
              <Tooltip title="距离考试天数">
                <Text type="danger" strong>
                  距考试 {daysLeft} 天
                </Text>
              </Tooltip>
            )}
            {todayTasks.total > 0 && (
              <Tooltip title="今日任务">
                <Text type="success">
                  今日: {todayTasks.done}/{todayTasks.total}
                </Text>
              </Tooltip>
            )}
          </div>
        </Header>

        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
