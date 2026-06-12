import { useState, useEffect } from 'react'
import { Row, Col, Typography, Button, Empty } from 'antd'
import { EditOutlined, WarningOutlined, TagsOutlined, RobotOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'
import { getDaysUntil } from '../../utils/date'
import { db } from '../../db'
import ReactEChartsCore from 'echarts-for-react'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { ScrollReveal, StaggerContainer, StaggerItem, HoverCard, CountUp, PulseDot } from '../../components/Animations'

const { Text, Paragraph } = Typography

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
    const recentHistory = Object.entries(dailyMap).map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date))

    const allQ = await db.questions.toArray()
    const randomQ = allQ.length > 0 ? allQ[Math.floor(Math.random() * allQ.length)] : null

    setData({ todayPractice, todayCorrect, pendingErrors, pendingCards, recentHistory, randomQuestion: randomQ ? { content: randomQ.content, id: randomQ.id! } : null })
  }

  const daysLeft = examDate ? getDaysUntil(examDate) : null

  const statCards = [
    { icon: <EditOutlined style={{ fontSize: 18 }} />, label: '今日刷题', value: data.todayPractice, suffix: '题', sub: data.todayPractice > 0 ? `正确率 ${Math.round((data.todayCorrect / data.todayPractice) * 100)}%` : undefined, onClick: () => navigate('/practice'), accent: '#C4956A' },
    { icon: <WarningOutlined style={{ fontSize: 18 }} />, label: '待复习错题', value: data.pendingErrors, onClick: () => navigate('/error-book'), accent: '#C45D5D' },
    { icon: <TagsOutlined style={{ fontSize: 18 }} />, label: '待复习卡片', value: data.pendingCards, onClick: () => navigate('/flashcard'), accent: '#D4A574' },
    { icon: <RobotOutlined style={{ fontSize: 18 }} />, label: 'AI助手', value: -1, displayValue: '问一问', onClick: () => navigate('/ai-assistant'), accent: '#6B8DAD' },
  ]

  return (
    <div>
      {/* Hero countdown */}
      {daysLeft !== null && daysLeft >= 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            marginBottom: 32,
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background image */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'brightness(0.35) saturate(0.8)',
          }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(196,149,106,0.3) 0%, rgba(0,0,0,0.4) 100%)' }} />

          <div style={{ position: 'relative', textAlign: 'center', padding: '40px 24px' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, letterSpacing: 4, fontWeight: 300, marginBottom: 8 }}
            >
              距离考试还有
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.7, type: 'spring', bounce: 0.3 }}
              style={{ color: 'white', fontSize: 80, fontFamily: 'var(--font-serif)', fontWeight: 200, lineHeight: 1, margin: '4px 0' }}
            >
              <CountUp target={daysLeft} duration={1.8} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 2 }}
            >
              天
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Stats cards */}
      <StaggerContainer staggerDelay={0.08}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((card, i) => (
            <Col xs={12} sm={6} key={i}>
              <StaggerItem>
                <HoverCard onClick={card.onClick} style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-light)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${card.accent}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12, color: card.accent,
                  }}>
                    {card.icon}
                  </div>
                  <Text style={{ color: 'var(--text-tertiary)', fontSize: 12, letterSpacing: 1 }}>{card.label}</Text>
                  <div style={{ fontSize: 28, fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, marginTop: 4 }}>
                    {card.displayValue || <CountUp target={card.value} duration={1.2} />}
                  </div>
                  {card.sub && <Text style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{card.sub}</Text>}
                </HoverCard>
              </StaggerItem>
            </Col>
          ))}
        </Row>
      </StaggerContainer>

      {/* Charts + daily question */}
      <ScrollReveal delay={0.2}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>近7天刷题趋势</span>
              </div>
              {data.recentHistory.length === 0 ? <Empty description="暂无数据，开始刷题吧！" /> : (
                <ReactEChartsCore option={{
                  grid: { top: 20, right: 20, bottom: 30, left: 40 },
                  xAxis: { type: 'category', data: data.recentHistory.map((d) => d.date), axisLine: { lineStyle: { color: 'var(--border-default)' } }, axisTick: { show: false }, axisLabel: { color: 'var(--text-tertiary)', fontSize: 12 } },
                  yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: 'var(--border-light)' } }, axisLabel: { color: 'var(--text-tertiary)', fontSize: 12 } },
                  series: [{ type: 'bar', data: data.recentHistory.map((d) => d.count), name: '刷题量', itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#C4956A' }, { offset: 1, color: '#D4A574' }] }, borderRadius: [4, 4, 0, 0] }, barWidth: 24, animationDuration: 1200, animationEasing: 'cubicOut' }],
                  tooltip: { trigger: 'axis', backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-default)', textStyle: { color: 'var(--text-primary)' } },
                }} style={{ height: 240 }} />
              )}
            </div>
          </Col>

          <Col xs={24} lg={8}>
            <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 16 }}>每日一题</span>
              {data.randomQuestion ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Paragraph ellipsis={{ rows: 6 }} style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                    {data.randomQuestion.content}
                  </Paragraph>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="primary" onClick={() => {
                      sessionStorage.setItem('practice_session', JSON.stringify({ ids: [data.randomQuestion!.id], mode: 'single', index: 0 }))
                      navigate('/practice/session')
                    }} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                      去作答
                    </Button>
                  </motion.div>
                </div>
              ) : <Empty description="暂无题目" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </div>
          </Col>
        </Row>
      </ScrollReveal>

      {/* Quote */}
      <ScrollReveal delay={0.3}>
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.2 }}
          style={{
            marginTop: 24,
            padding: '20px 24px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent-light)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 120, height: 120,
            background: 'radial-gradient(circle, rgba(196,149,106,0.15) 0%, transparent 70%)',
            borderRadius: '50%', transform: 'translate(30%, -30%)',
          }} />
          <Text style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, position: 'relative' }}>
            "{quote}"
          </Text>
        </motion.div>
      </ScrollReveal>
    </div>
  )
}
