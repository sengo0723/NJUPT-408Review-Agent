import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Tag, Button, Space, Progress, Empty } from 'antd'
import { CalendarOutlined, EditOutlined, WarningOutlined, TagsOutlined, RobotOutlined, AimOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { getDaysUntil } from '../../utils/date'
import { db } from '../../db'
import { SUBJECT_NAMES } from '../../utils/helpers'
import ReactEChartsCore from 'echarts-for-react'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const QUOTES = [
  '考研不是百米冲刺，而是一场马拉松。坚持到最后的人，就是胜利者。',
  '今天的努力，是明天上岸的底气。',
  '408虽难，但每一分努力都不会被辜负。',
  '把每一个知识点都吃透，高分自然水到渠成。',
  '不积跬步，无以至千里；不积小流，无以成江海。',
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { examDate } = useAppStore()
  const [data, setData] = useState({
    todayPractice: 0, todayCorrect: 0, pendingErrors: 0, pendingCards: 0,
    recentHistory: [] as { date: string; count: number; correct: number }[],
    randomQuestion: null as { content: string; id: number } | null,
  })
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)])

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    const today = dayjs().format('YYYY-MM-DD')
    const todayRecords = await db.answerRecords.where('createdAt').above(dayjs().startOf('day').toDate()).toArray()
    const todayPractice = todayRecords.length
    const todayCorrect = todayRecords.filter((r) => r.isCorrect).length

    const pendingErrors = await db.errorBook.where('masteryStatus').anyOf(['unmastered', 'reviewing']).count()

    const allCards = await db.flashcards.toArray()
    const pendingCards = allCards.filter((c) => new Date(c.nextReviewAt) <= new Date()).length

    const allRecords = await db.answerRecords.toArray()
    const dailyMap: Record<string, { count: number; correct: number }> = {}
    const sevenDaysAgo = dayjs().subtract(7, 'day').startOf('day')
    for (const r of allRecords) {
      if (dayjs(r.createdAt).isBefore(sevenDaysAgo)) continue
      const date = dayjs(r.createdAt).format('MM/DD')
      if (!dailyMap[date]) dailyMap[date] = { count: 0, correct: 0 }
      dailyMap[date].count++
      if (r.isCorrect) dailyMap[date].correct++
    }
    const recentHistory = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const allQ = await db.questions.toArray()
    const randomQ = allQ.length > 0 ? allQ[Math.floor(Math.random() * allQ.length)] : null

    setData({
      todayPractice, todayCorrect, pendingErrors, pendingCards,
      recentHistory,
      randomQuestion: randomQ ? { content: randomQ.content, id: randomQ.id! } : null,
    })
  }

  const daysLeft = examDate ? getDaysUntil(examDate) : null

  return (
    <div>
      {daysLeft !== null && daysLeft >= 0 && (
        <Card style={{ marginBottom: 16, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>距离考试还有</Title>
          <Title level={1} style={{ color: 'white', fontSize: 64, margin: '8px 0' }}>{daysLeft}</Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>天</Text>
        </Card>
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/practice')}>
            <Statistic title="今日刷题" value={data.todayPractice} prefix={<EditOutlined />} suffix="题" />
            {data.todayPractice > 0 && <Text type="secondary">正确率 {Math.round((data.todayCorrect / data.todayPractice) * 100)}%</Text>}
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/error-book')}>
            <Statistic title="待复习错题" value={data.pendingErrors} prefix={<WarningOutlined />} valueStyle={{ color: data.pendingErrors > 0 ? '#ff4d4f' : '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/flashcard')}>
            <Statistic title="待复习卡片" value={data.pendingCards} prefix={<TagsOutlined />} valueStyle={{ color: data.pendingCards > 0 ? '#faad14' : '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/ai-assistant')}>
            <Statistic title="AI助手" value="问一问" prefix={<RobotOutlined />} valueStyle={{ fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="近7天刷题趋势" style={{ marginBottom: 16 }}>
            {data.recentHistory.length === 0 ? <Empty description="暂无数据，开始刷题吧！" /> : (
              <ReactEChartsCore option={{
                xAxis: { type: 'category', data: data.recentHistory.map((d) => d.date) },
                yAxis: { type: 'value' },
                series: [
                  { type: 'bar', data: data.recentHistory.map((d) => d.count), name: '刷题量', itemStyle: { color: '#1677ff' } },
                ],
                tooltip: { trigger: 'axis' },
              }} style={{ height: 250 }} />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="每日一题" style={{ marginBottom: 16 }}>
            {data.randomQuestion ? (
              <>
                <Paragraph ellipsis={{ rows: 4 }}>{data.randomQuestion.content}</Paragraph>
                <Button type="primary" size="small" onClick={() => {
                  sessionStorage.setItem('practice_session', JSON.stringify({ ids: [data.randomQuestion!.id], mode: 'single', index: 0 }))
                  navigate('/practice/session')
                }}>去作答</Button>
              </>
            ) : <Empty description="暂无题目" />}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16, background: '#f6ffed' }}>
        <Text type="secondary" italic>"{quote}"</Text>
      </Card>
    </div>
  )
}
