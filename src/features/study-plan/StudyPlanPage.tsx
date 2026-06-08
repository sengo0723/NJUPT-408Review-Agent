import { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Button, Input, Checkbox, Space, Empty, message, Calendar, Badge, Typography, Statistic, DatePicker, Tag } from 'antd'
import { PlusOutlined, DeleteOutlined, BulbOutlined, LeftOutlined, RightOutlined, FileTextOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { SUBJECT_NAMES, SUBJECT_COLORS, CHAPTER_NAMES } from '../../utils/helpers'
import { getToday } from '../../utils/date'
import { evaluateTask } from '../../services/task-evaluation-service'
import { getDailySummary, generateDailySummary } from '../../services/daily-summary-service'
import type { DailyTask } from '../../types'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

const { Text } = Typography

const PHASE_INFO = {
  foundation: { name: '基础阶段', period: '3-6月', desc: '系统学习，通读教材，构建知识框架', color: '#1677ff' },
  intensive: { name: '强化阶段', period: '7-9月', desc: '专项突破，大量刷题，深化重难点', color: '#faad14' },
  sprint: { name: '冲刺阶段', period: '10-12月', desc: '真题模拟，查漏补缺，背诵记忆', color: '#ff4d4f' },
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
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [dailySummary, setDailySummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const isToday = selectedDate === today

  // 加载所有任务，用于日历打点 + 历史查看
  useEffect(() => {
    loadAllTasks()
    loadTodayFocus()
  }, [])

  // 选中日期变化时加载对应日期的任务
  useEffect(() => {
    loadTasksForDate(selectedDate)
    loadSummaryForDate(selectedDate)
  }, [selectedDate])

  // FE-12: 每分钟检查日期变化，跨天自动刷新
  useEffect(() => {
    const interval = setInterval(() => {
      const now = getToday()
      if (now !== today) {
        loadAllTasks()
        loadTodayFocus()
        // 跨天时自动生成昨天的总结
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
        generateDailySummary(yesterday).then(() => {
          if (selectedDate === yesterday) loadSummaryForDate(yesterday)
        })
      }
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // FE-16: 恢复进行中的番茄钟
  useEffect(() => {
    const savedStart = sessionStorage.getItem('pomodoro_start')
    if (savedStart) {
      const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000)
      const remaining = 25 * 60 - elapsed
      if (remaining > 0) {
        setPomodoroRunning(true)
        setPomodoroTime(remaining)
        const id = setInterval(() => {
          setPomodoroTime((t) => {
            if (t <= 1) {
              clearInterval(id)
              setPomodoroRunning(false)
              sessionStorage.removeItem('pomodoro_start')
              db.focusRecords.add({ duration: 25 * 60, createdAt: new Date() })
              loadTodayFocus()
              message.success('番茄钟完成！休息一下吧~')
              return 25 * 60
            }
            return t - 1
          })
        }, 1000)
        setTimerId(id)
      } else {
        sessionStorage.removeItem('pomodoro_start')
        db.focusRecords.add({ duration: 25 * 60, createdAt: new Date() })
        loadTodayFocus()
      }
    }
  }, [])

  async function loadAllTasks() {
    try {
      const all = await db.dailyTasks.toArray()
      setAllTasks(all)
    } catch (err) {
      console.error('加载所有任务失败:', err)
    }
  }

  async function loadTasksForDate(date: string) {
    try {
      const t = await db.dailyTasks.where('date').equals(date).toArray()
      setTasks(t)
    } catch (err) {
      console.error('加载任务失败:', err)
    }
  }

  async function loadTodayFocus() {
    try {
      const records = await db.focusRecords.where('createdAt').above(dayjs().startOf('day').toDate()).toArray()
      setFocusTime(records.reduce((s, r) => s + r.duration, 0))
    } catch (err) {
      console.error('加载专注记录失败:', err)
    }
  }

  async function loadSummaryForDate(date: string) {
    setSummaryLoading(true)
    const summary = await getDailySummary(date)
    setDailySummary(summary)
    setSummaryLoading(false)
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true)
    const summary = await generateDailySummary(selectedDate)
    if (summary) {
      setDailySummary(summary)
      message.success('AI学习日报已生成！')
    } else {
      message.error('生成失败，请先配置AI模型')
    }
    setGeneratingSummary(false)
  }

  async function addTask() {
    if (!newTask.trim()) return
    try {
      const date = isToday ? today : selectedDate
      await db.dailyTasks.add({ date, content: newTask, isCompleted: false })
      setNewTask('')
      await loadTasksForDate(selectedDate)
      await loadAllTasks()
    } catch (err) {
      console.error('添加任务失败:', err)
      message.error('添加任务失败: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function toggleTask(task: DailyTask) {
    if (!task.id) return
    const newCompleted = !task.isCompleted
    await db.dailyTasks.update(task.id, {
      isCompleted: newCompleted,
      completedAt: newCompleted ? new Date() : undefined,
      aiReflection: newCompleted ? undefined : task.aiReflection,
      aiGrowthPoints: newCompleted ? undefined : task.aiGrowthPoints,
      aiReflectionAt: newCompleted ? undefined : task.aiReflectionAt,
      aiCategory: newCompleted ? undefined : task.aiCategory,
      subject: newCompleted ? undefined : task.subject,
      chapter: newCompleted ? undefined : task.chapter,
    })
    await loadTasksForDate(selectedDate)
    await loadAllTasks()
  }

  async function handleAIEvaluate(task: DailyTask) {
    if (!task.id) return
    setEvaluatingId(task.id)
    const result = await evaluateTask(task)
    await db.dailyTasks.update(task.id, {
      aiReflection: result.reflection,
      aiGrowthPoints: result.growthPoints,
      aiReflectionAt: new Date(),
      aiCategory: result.category,
      subject: result.subject,
      chapter: result.chapter,
    })
    setEvaluatingId(null)
    await loadTasksForDate(selectedDate)
    await loadAllTasks()
    message.success(`+${result.growthPoints} 成长分: ${result.reflection}`)
  }

  async function deleteTask(task: DailyTask) {
    if (task.id) {
      await db.dailyTasks.delete(task.id)
      await loadTasksForDate(selectedDate)
      await loadAllTasks()
    }
  }

  function startPomodoro() {
    setPomodoroRunning(true)
    setPomodoroTime(25 * 60)
    sessionStorage.setItem('pomodoro_start', String(Date.now()))
    const id = setInterval(() => {
      setPomodoroTime((t) => {
        if (t <= 1) {
          clearInterval(id)
          setPomodoroRunning(false)
          sessionStorage.removeItem('pomodoro_start')
          db.focusRecords.add({ duration: 25 * 60, createdAt: new Date() })
          loadTodayFocus()
          message.success('番茄钟完成！休息一下吧~')
          return 25 * 60
        }
        return t - 1
      })
    }, 1000)
    setTimerId(id)
  }

  function stopPomodoro() {
    if (timerId) clearInterval(timerId)
    setPomodoroRunning(false)
    sessionStorage.removeItem('pomodoro_start')
    const elapsed = 25 * 60 - pomodoroTime
    if (elapsed > 60) {
      db.focusRecords.add({ duration: elapsed, createdAt: new Date() })
      loadTodayFocus()
    }
  }

  // 日历渲染：标记有任务的日期
  function dateCellRender(value: Dayjs) {
    const dateStr = value.format('YYYY-MM-DD')
    const dayTasks = allTasks.filter(t => t.date === dateStr)
    if (dayTasks.length === 0) return null
    const done = dayTasks.filter(t => t.isCompleted).length
    const total = dayTasks.length
    const color = done === total ? '#52c41a' : done > 0 ? '#faad14' : '#1677ff'
    return <Badge count={`${done}/${total}`} style={{ backgroundColor: color, fontSize: 10 }} />
  }

  // 统计数据
  const completedCount = tasks.filter((t) => t.isCompleted).length
  const stats = useMemo(() => {
    const dateMap = new Map<string, { total: number; done: number }>()
    for (const t of allTasks) {
      const cur = dateMap.get(t.date) || { total: 0, done: 0 }
      cur.total++
      if (t.isCompleted) cur.done++
      dateMap.set(t.date, cur)
    }
    const totalDays = dateMap.size
    let totalTasks = 0
    let totalDone = 0
    let streak = 0
    // 计算连续打卡天数（从今天往前推）
    const checkDate = dayjs(today)
    for (let i = 0; i < 365; i++) {
      const d = checkDate.subtract(i, 'day').format('YYYY-MM-DD')
      const info = dateMap.get(d)
      if (info && info.done > 0) {
        if (i === 0 || streak === i) streak++
      } else {
        break
      }
    }
    for (const v of dateMap.values()) {
      totalTasks += v.total
      totalDone += v.done
    }
    return { totalDays, totalTasks, totalDone, streak }
  }, [allTasks])

  const currentMonth = dayjs().month() + 1
  const currentPhase = currentMonth >= 3 && currentMonth <= 6
    ? 'foundation'
    : currentMonth >= 7 && currentMonth <= 9
      ? 'intensive'
      : currentMonth >= 10 && currentMonth <= 12
        ? 'sprint'
        : 'foundation'

  function goPrevDay() {
    setSelectedDate(dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))
  }
  function goNextDay() {
    setSelectedDate(dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD'))
  }
  function goToday() {
    setSelectedDate(today)
  }

  const dateLabel = isToday
    ? `今日 (${today})`
    : `${selectedDate}${dayjs(selectedDate).isSame(dayjs(), 'day') ? '' : dayjs(selectedDate).isBefore(dayjs(), 'day') ? ' (往日)' : ' (未来)'}`

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {Object.entries(PHASE_INFO).map(([key, info]) => (
          <Col span={8} key={key}>
            <Card style={{ borderColor: currentPhase === key ? info.color : '#d9d9d9', borderWidth: currentPhase === key ? 2 : 1 }}>
              <Tag color={info.color}>{info.name}</Tag>
              <Text type="secondary">{info.period}</Text>
              <p style={{ marginTop: 8, fontSize: 13 }}>{info.desc}</p>
              {currentPhase === key && <Tag color="processing">当前阶段</Tag>}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 统计概览 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Statistic title="累计打卡天数" value={stats.totalDays} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="连续打卡" value={stats.streak} suffix="天" /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="累计完成任务" value={`${stats.totalDone}/${stats.totalTasks}`} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Statistic title="今日专注时长" value={Math.round(focusTime / 60)} suffix="分钟" /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 左侧：任务列表 */}
        <Col span={14}>
          <Card
            title={dateLabel}
            extra={<Statistic title="已完成" value={`${completedCount}/${tasks.length}`} />}
          >
            {/* 日期导航 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Button size="small" icon={<LeftOutlined />} onClick={goPrevDay} />
              <DatePicker
                value={dayjs(selectedDate)}
                onChange={(d) => { if (d) setSelectedDate(d.format('YYYY-MM-DD')) }}
                allowClear={false}
                size="small"
                style={{ flex: 1 }}
              />
              <Button size="small" icon={<RightOutlined />} onClick={goNextDay} />
              {!isToday && <Button size="small" type="link" onClick={goToday}>回到今天</Button>}
            </div>

            {/* 添加任务（仅今天和未来的日期可以添加） */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} onPressEnter={addTask} placeholder="添加新任务..." />
              <Button type="primary" icon={<PlusOutlined />} onClick={addTask}>添加</Button>
            </div>

            {tasks.length === 0 ? <Empty description="暂无任务" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((task) => (
                  <div key={task.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: task.isCompleted ? '#f6ffed' : '#fafafa', borderRadius: 6 }}>
                      <Checkbox checked={task.isCompleted} onChange={() => toggleTask(task)} />
                      <Text style={{ flex: 1, textDecoration: task.isCompleted ? 'line-through' : undefined }}>{task.content}</Text>
                      {task.isCompleted && !task.aiReflection && (
                        <Button
                          type="link"
                          size="small"
                          icon={<BulbOutlined />}
                          loading={evaluatingId === task.id}
                          onClick={() => handleAIEvaluate(task)}
                        >
                          AI评估
                        </Button>
                      )}
                      {task.subject && task.subject !== 'general' && (
                        <Tag color={SUBJECT_COLORS[task.subject]}>{SUBJECT_NAMES[task.subject]}</Tag>
                      )}
                      {task.chapter && (
                        <Tag>{CHAPTER_NAMES[task.chapter] || task.chapter}</Tag>
                      )}
                      {task.aiCategory && task.aiCategory !== '评估失败' && task.aiCategory !== '未评估' && (
                        <Tag color="cyan">{task.aiCategory}</Tag>
                      )}
                      {task.aiGrowthPoints !== undefined && task.aiGrowthPoints > 0 && (
                        <Tag color="gold">+{task.aiGrowthPoints}分</Tag>
                      )}
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => deleteTask(task)} />
                    </div>
                    {task.aiReflection && (
                      <div style={{ padding: '4px 12px 8px 36px', fontSize: 12, color: '#666' }}>
                        <span style={{ marginRight: 4 }}>&#x1F916;</span>
                        <Text type="secondary">{task.aiReflection}</Text>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧：日历 + 番茄钟 */}
        <Col span={10}>
          <Card title="任务日历" style={{ marginBottom: 16 }}>
            <Calendar
              fullscreen={false}
              value={dayjs(selectedDate)}
              onSelect={(d) => setSelectedDate(d.format('YYYY-MM-DD'))}
              cellRender={(current, info) => {
                if (info.type === 'date') return dateCellRender(current as Dayjs)
                return null
              }}
            />
          </Card>

          <Card title="番茄钟">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontFamily: 'monospace', color: pomodoroTime < 300 ? '#ff4d4f' : '#1677ff' }}>
                {Math.floor(pomodoroTime / 60).toString().padStart(2, '0')}:{(pomodoroTime % 60).toString().padStart(2, '0')}
              </div>
              <Space>
                {!pomodoroRunning ? (
                  <Button type="primary" size="large" onClick={startPomodoro}>开始专注</Button>
                ) : (
                  <Button size="large" danger onClick={stopPomodoro}>停止</Button>
                )}
              </Space>
            </div>
          </Card>

          <Card
            title={<Space><FileTextOutlined />AI 学习日报</Space>}
            style={{ marginTop: 16 }}
            loading={summaryLoading}
          >
            {dailySummary ? (
              <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {dailySummary}
              </div>
            ) : generatingSummary ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">AI正在分析今天的学习数据...</Text>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text type="secondary">
                  {isToday ? '今天的学习日报将在明天生成' : '暂无该日期的学习日报'}
                </Text>
                {!isToday && (
                  <div style={{ marginTop: 12 }}>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={handleGenerateSummary}
                      loading={generatingSummary}
                    >
                      生成AI学习日报
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
