import { useState, useEffect, useMemo } from 'react'
import { Row, Col, Button, Input, Checkbox, Empty, message, Calendar, Badge, Typography, Statistic, DatePicker, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, BulbOutlined, LeftOutlined, RightOutlined, FileTextOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { SUBJECT_NAMES, SUBJECT_COLORS, CHAPTER_NAMES } from '../../utils/helpers'
import { getToday } from '../../utils/date'
import { evaluateTask } from '../../services/task-evaluation-service'
import { getDailySummary, generateDailySummary } from '../../services/daily-summary-service'
import type { DailyTask } from '../../types'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem, CountUp, ProgressRing } from '../../components/Animations'

const { Text } = Typography

const PHASE_INFO = {
  foundation: { name: '基础阶段', period: '3-6月', desc: '系统学习，通读教材，构建知识框架', color: 'var(--color-accent)' },
  intensive: { name: '强化阶段', period: '7-9月', desc: '专项突破，大量刷题，深化重难点', color: '#6B8DAD' },
  sprint: { name: '冲刺阶段', period: '10-12月', desc: '真题模拟，查漏补缺，背诵记忆', color: 'var(--color-error)' },
}

export default function StudyPlanPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [newTask, setNewTask] = useState('')
  const [focusTime, setFocusTime] = useState(0)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null)
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null)
  const today = getToday()
  const [selectedDate, setSelectedDate] = useState(today)
  const [allTasks, setAllTasks] = useState<DailyTask[]>([])
  const [dailySummary, setDailySummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const isToday = selectedDate === today

  useEffect(() => { loadAllTasks(); loadTodayFocus() }, [])
  useEffect(() => { loadTasksForDate(selectedDate); loadSummaryForDate(selectedDate) }, [selectedDate])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = getToday()
      if (now !== today) {
        loadAllTasks(); loadTodayFocus()
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
        generateDailySummary(yesterday).then(() => { if (selectedDate === yesterday) loadSummaryForDate(yesterday) })
      }
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const savedStart = sessionStorage.getItem('pomodoro_start')
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000)
      const remaining = 25 * 60 - elapsed
      if (remaining > 0) {
        setPomodoroRunning(true); setPomodoroTime(remaining)
        const id = setInterval(() => {
          setPomodoroTime((t) => {
            if (t <= 1) {
              clearInterval(id); setPomodoroRunning(false); sessionStorage.removeItem('pomodoro_start')
              db.focusRecords.add({ duration: 25 * 60, createdAt: new Date() }); loadTodayFocus(); message.success('番茄钟完成！休息一下吧~'); return 25 * 60
            }
            return t - 1
          })
        }, 1000)
        setTimerId(id)
      } else {
        sessionStorage.removeItem('pomodoro_start'); db.focusRecords.add({ duration: 25 * 60, createdAt: new Date() }); loadTodayFocus()
      }
    }
  }, [])

  async function loadAllTasks() { try { setAllTasks(await db.dailyTasks.toArray()) } catch {} }
  async function loadTasksForDate(date: string) { try { setTasks(await db.dailyTasks.where('date').equals(date).toArray()) } catch {} }
  async function loadTodayFocus() {
    try {
      const records = await db.focusRecords.where('createdAt').above(dayjs().startOf('day').toDate()).toArray()
      setFocusTime(records.reduce((s, r) => s + r.duration, 0))
    } catch {}
  }
  async function loadSummaryForDate(date: string) { setSummaryLoading(true); const s = await getDailySummary(date); setDailySummary(s); setSummaryLoading(false) }
  async function handleGenerateSummary() {
    setGeneratingSummary(true); const s = await generateDailySummary(selectedDate)
    if (s) { setDailySummary(s); message.success('AI学习日报已生成！') } else { message.error('生成失败，请先配置AI模型') }
    setGeneratingSummary(false)
  }
  async function addTask() {
    if (!newTask.trim()) return
    try {
      await db.dailyTasks.add({ date: isToday ? today : selectedDate, content: newTask, isCompleted: false })
      setNewTask(''); await loadTasksForDate(selectedDate); await loadAllTasks()
    } catch {}
  }
  async function toggleTask(task: DailyTask) {
    if (!task.id) return
    const newCompleted = !task.isCompleted
    await db.dailyTasks.update(task.id, {
      isCompleted: newCompleted, completedAt: newCompleted ? new Date() : undefined,
      aiReflection: newCompleted ? undefined : task.aiReflection, aiGrowthPoints: newCompleted ? undefined : task.aiGrowthPoints,
      aiReflectionAt: newCompleted ? undefined : task.aiReflectionAt, aiCategory: newCompleted ? undefined : task.aiCategory,
      subject: newCompleted ? undefined : task.subject, chapter: newCompleted ? undefined : task.chapter,
    })
    await loadTasksForDate(selectedDate); await loadAllTasks()
  }
  async function handleAIEvaluate(task: DailyTask) {
    if (!task.id) return; setEvaluatingId(task.id)
    const result = await evaluateTask(task)
    await db.dailyTasks.update(task.id, { aiReflection: result.reflection, aiGrowthPoints: result.growthPoints, aiReflectionAt: new Date(), aiCategory: result.category, subject: result.subject, chapter: result.chapter })
    setEvaluatingId(null); await loadTasksForDate(selectedDate); await loadAllTasks(); message.success(`+${result.growthPoints} 成长分: ${result.reflection}`)
  }
  async function deleteTask(task: DailyTask) { if (task.id) { await db.dailyTasks.delete(task.id); await loadTasksForDate(selectedDate); await loadAllTasks() } }

  function startPomodoro() {
    setPomodoroRunning(true); setPomodoroTime(25 * 60); sessionStorage.setItem('pomodoro_start', String(Date.now()))
    const id = setInterval(() => {
      setPomodoroTime((t) => {
        if (t <= 1) { clearInterval(id); setPomodoroRunning(false); sessionStorage.removeItem('pomodoro_start'); db.focusRecords.add({ duration: 25 * 60, createdAt: new Date() }); loadTodayFocus(); message.success('番茄钟完成！休息一下吧~'); return 25 * 60 }
        return t - 1
      })
    }, 1000); setTimerId(id)
  }
  function stopPomodoro() {
    if (timerId) clearInterval(timerId); setPomodoroRunning(false); sessionStorage.removeItem('pomodoro_start')
    const elapsed = 25 * 60 - pomodoroTime; if (elapsed > 60) { db.focusRecords.add({ duration: elapsed, createdAt: new Date() }); loadTodayFocus() }
  }

  function dateCellRender(value: Dayjs) {
    const dateStr = value.format('YYYY-MM-DD')
    const dayTasks = allTasks.filter(t => t.date === dateStr)
    if (dayTasks.length === 0) return null
    const done = dayTasks.filter(t => t.isCompleted).length
    const total = dayTasks.length
    const color = done === total ? 'var(--color-success)' : done > 0 ? 'var(--color-warning)' : 'var(--color-accent)'
    return <Badge count={`${done}/${total}`} style={{ backgroundColor: color, fontSize: 10 }} />
  }

  const completedCount = tasks.filter((t) => t.isCompleted).length
  const stats = useMemo(() => {
    const dateMap = new Map<string, { total: number; done: number }>()
    for (const t of allTasks) { const cur = dateMap.get(t.date) || { total: 0, done: 0 }; cur.total++; if (t.isCompleted) cur.done++; dateMap.set(t.date, cur) }
    let streak = 0; const checkDate = dayjs(today)
    for (let i = 0; i < 365; i++) {
      const d = checkDate.subtract(i, 'day').format('YYYY-MM-DD'); const info = dateMap.get(d)
      if (info && info.done > 0) { if (i === 0 || streak === i) streak++ } else break
    }
    let totalTasks = 0; let totalDone = 0
    for (const v of dateMap.values()) { totalTasks += v.total; totalDone += v.done }
    return { totalDays: dateMap.size, totalTasks, totalDone, streak }
  }, [allTasks])

  const currentMonth = dayjs().month() + 1
  const currentPhase = currentMonth >= 3 && currentMonth <= 6 ? 'foundation' : currentMonth >= 7 && currentMonth <= 9 ? 'intensive' : 'sprint'

  function goPrevDay() { setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD')) }
  function goNextDay() { setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD')) }
  function goToday() { setSelectedDate(today) }

  const dateLabel = isToday ? `今日 (${today})` : selectedDate

  const statItems = [
    { label: '累计打卡天数', value: stats.totalDays },
    { label: '连续打卡', value: stats.streak, suffix: '天' },
    { label: '累计完成任务', value: `${stats.totalDone}/${stats.totalTasks}` },
    { label: '今日专注时长', value: Math.round(focusTime / 60), suffix: '分钟' },
  ]

  return (
    <div>
      {/* Phase cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {Object.entries(PHASE_INFO).map(([key, info]) => (
          <Col xs={24} sm={8} key={key}>
            <div style={{
              padding: '16px 20px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
              border: `1px solid ${currentPhase === key ? info.color : 'var(--border-light)'}`,
              borderWidth: currentPhase === key ? 2 : 1,
              transition: 'all var(--transition-fast)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Tag color={info.color}>{info.name}</Tag>
                {currentPhase === key && <Tag color="processing" style={{ margin: 0 }}>当前阶段</Tag>}
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>{info.period}</Text>
              <p style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>{info.desc}</p>
            </div>
          </Col>
        ))}
      </Row>

      {/* Stats */}
      <StaggerContainer staggerDelay={0.06}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {statItems.map((s, i) => (
            <Col xs={12} sm={6} key={i}>
              <StaggerItem>
                <motion.div whileHover={{ y: -2 }} style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {typeof s.value === 'number' ? <CountUp target={s.value} duration={1.2} /> : s.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
                </motion.div>
              </StaggerItem>
            </Col>
          ))}
        </Row>
      </StaggerContainer>

      <Row gutter={[16, 16]}>
        {/* Tasks */}
        <Col xs={24} lg={14}>
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{dateLabel}</span>
              <Statistic title="已完成" value={`${completedCount}/${tasks.length}`} valueStyle={{ fontSize: 14 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Button size="small" icon={<LeftOutlined />} onClick={goPrevDay} />
              <DatePicker value={dayjs(selectedDate)} onChange={(d) => { if (d) setSelectedDate(d.format('YYYY-MM-DD')) }} allowClear={false} size="small" style={{ flex: 1 }} />
              <Button size="small" icon={<RightOutlined />} onClick={goNextDay} />
              {!isToday && <Button size="small" type="link" onClick={goToday}>回到今天</Button>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} onPressEnter={addTask} placeholder="添加新任务..." />
              <Button type="primary" icon={<PlusOutlined />} onClick={addTask}>添加</Button>
            </div>

            {tasks.length === 0 ? <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
              <StaggerContainer staggerDelay={0.04}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {tasks.map((task) => (
                    <StaggerItem key={task.id}>
                      <motion.div whileHover={{ x: 2 }} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                        background: task.isCompleted ? 'var(--color-success-bg)' : 'var(--bg-sunken)',
                        borderRadius: 'var(--radius-sm)',
                      }}>
                        <Checkbox checked={task.isCompleted} onChange={() => toggleTask(task)} />
                        <Text style={{ flex: 1, textDecoration: task.isCompleted ? 'line-through' : undefined, color: task.isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{task.content}</Text>
                        {task.isCompleted && !task.aiReflection && (
                          <Button type="link" size="small" icon={<BulbOutlined />} loading={evaluatingId === task.id} onClick={() => handleAIEvaluate(task)}>AI评估</Button>
                        )}
                        {task.subject && task.subject !== 'general' && <Tag color={SUBJECT_COLORS[task.subject]}>{SUBJECT_NAMES[task.subject]}</Tag>}
                        {task.chapter && <Tag>{CHAPTER_NAMES[task.chapter] || task.chapter}</Tag>}
                        {task.aiCategory && task.aiCategory !== '评估失败' && task.aiCategory !== '未评估' && <Tag color="cyan">{task.aiCategory}</Tag>}
                        {task.aiGrowthPoints !== undefined && task.aiGrowthPoints > 0 && <Tag color="gold">+{task.aiGrowthPoints}分</Tag>}
                        <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteTask(task)} />
                      </motion.div>
                      {task.aiReflection && (
                        <div style={{ padding: '4px 12px 4px 36px', fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {task.aiReflection}
                        </div>
                      )}
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            )}
          </div>
        </Col>

        {/* Calendar + Pomodoro + Summary */}
        <Col xs={24} lg={10}>
          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 20, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>任务日历</span>
            <Calendar fullscreen={false} value={dayjs(selectedDate)} onSelect={(d) => setSelectedDate(d.format('YYYY-MM-DD'))} cellRender={(current, info) => { if (info.type === 'date') return dateCellRender(current as Dayjs); return null }} />
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 20, marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 16 }}>番茄钟</span>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <ProgressRing
                  progress={((25 * 60 - pomodoroTime) / (25 * 60)) * 100}
                  size={160}
                  strokeWidth={4}
                  color={pomodoroTime < 300 ? 'var(--color-error)' : 'var(--color-accent)'}
                />
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontFamily: 'var(--font-mono)', fontWeight: 700, color: pomodoroTime < 300 ? 'var(--color-error)' : 'var(--color-accent)', letterSpacing: 2 }}>
                    {Math.floor(pomodoroTime / 60).toString().padStart(2, '0')}:{(pomodoroTime % 60).toString().padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{pomodoroRunning ? '专注中' : '准备就绪'}</div>
                </div>
              </div>
              <div>
                {!pomodoroRunning ? (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button type="primary" size="large" onClick={startPomodoro}>开始专注</Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button size="large" danger onClick={stopPomodoro}>停止</Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 20 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
              <FileTextOutlined style={{ marginRight: 6 }} />AI 学习日报
            </span>
            {dailySummary ? (
              <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{dailySummary}</div>
            ) : generatingSummary ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Text type="secondary">AI正在分析今天的学习数据...</Text></div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">{isToday ? '今天的学习日报将在明天生成' : '暂无该日期的学习日报'}</Text>
                {!isToday && (
                  <div style={{ marginTop: 12 }}>
                    <Button type="primary" icon={<FileTextOutlined />} onClick={handleGenerateSummary} loading={generatingSummary}>生成AI学习日报</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}
