import { useState, useEffect, useRef } from 'react'
import { Card, Button, Space, Tag, Progress, Row, Col, Statistic, InputNumber, Input, Pagination, message, Modal, List, Select, Empty, Typography, Divider } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { getQuestions } from '../../services/question-service'
import { SUBJECT_NAMES, SUBJECT_COLORS } from '../../utils/helpers'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import ReactEChartsCore from 'echarts-for-react'
import type { Question, MockExamRecord, MockExamDetail } from '../../types'
import dayjs from 'dayjs'

const { Text, Title } = Typography

export default function MockExamPage() {
  const [mode, setMode] = useState<'list' | 'setup' | 'exam' | 'result'>('list')
  const [records, setRecords] = useState<MockExamRecord[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(180 * 60)
  const [currentIdx, setCurrentIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [examStartTime, setExamStartTime] = useState(0)
  const handleSubmitRef = useRef<(() => Promise<void>) | null>(null)
  const [reviewPage, setReviewPage] = useState(0)
  const REVIEW_PAGE_SIZE = 10

  useEffect(() => { loadRecords() }, [])
  useEffect(() => {
    if (mode === 'exam') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) return 0
          return t - 1
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'exam' && timeLeft === 0 && handleSubmitRef.current) {
      handleSubmitRef.current()
    }
  }, [timeLeft, mode])

  async function loadRecords() {
    const r = await db.mockExamRecords.orderBy('date').reverse().toArray()
    setRecords(r)
  }

  async function handleStartExam() {
    const subjects = ['data-structure', 'computer-organization', 'os', 'network']
    // 408真实题量：选择题40道（每题2分=80分），综合应用题7道（约70分），总分150
    const choiceCounts = [11, 11, 10, 8] // 各科选择题分配
    const shortAnswerCounts = [2, 2, 2, 1] // 各科简答题分配
    let allQ: Question[] = []
    for (let i = 0; i < subjects.length; i++) {
      const result = await getQuestions({ subject: subjects[i] as 'data-structure', type: 'choice', page: 1, pageSize: 100 })
      const shuffled = result.data.sort(() => Math.random() - 0.5)
      allQ = [...allQ, ...shuffled.slice(0, choiceCounts[i])]
    }
    for (let i = 0; i < subjects.length; i++) {
      const result = await getQuestions({ subject: subjects[i] as 'data-structure', type: 'short-answer', page: 1, pageSize: 100 })
      const shuffled = result.data.sort(() => Math.random() - 0.5)
      allQ = [...allQ, ...shuffled.slice(0, shortAnswerCounts[i])]
    }
    if (allQ.length < 20) { message.warning('题库题目不足，请导入更多题目'); return }
    setQuestions(allQ)
    setAnswers({})
    setTimeLeft(180 * 60)
    setCurrentIdx(0)
    setExamStartTime(Date.now())
    setMode('exam')
  }

  function getQuestionScore(q: Question, isCorrect: boolean): number {
    if (!isCorrect) return 0
    if (q.type === 'choice') return 2
    if (q.type === 'short-answer') return 10
    if (q.type === 'code') return 10
    return 0
  }

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current)
    const timeSpent = Math.round((Date.now() - examStartTime) / 1000)
    const details: MockExamDetail[] = questions.map((q) => {
      const isCorrect = (answers[q.id!] || '').trim().toUpperCase() === q.answer.trim().toUpperCase()
      return {
        questionId: q.id!,
        userAnswer: answers[q.id!] || '',
        isCorrect,
        score: getQuestionScore(q, isCorrect),
      }
    })
    const totalScore = details.reduce((s, d) => s + d.score, 0)
    await db.mockExamRecords.add({ date: new Date(), totalScore, timeSpent, details })
    setMode('result')
    loadRecords()
  }

  handleSubmitRef.current = handleSubmit

  const formatTime = (s: number) => `${Math.floor(s / 3600)}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (mode === 'exam' && questions.length > 0) {
    const q = questions[currentIdx]
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Space><Tag color={SUBJECT_COLORS[q.subject]}>{SUBJECT_NAMES[q.subject]}</Tag><Text>第{currentIdx + 1}/{questions.length}题</Text></Space>
            <Space><ClockCircleOutlined /><Text type={timeLeft < 600 ? 'danger' : undefined} strong>{formatTime(timeLeft)}</Text></Space>
          </div>
          <Progress percent={((currentIdx + 1) / questions.length) * 100} showInfo={false} size="small" />
          <div style={{ margin: '20px 0' }}><MarkdownRenderer content={q.content} /></div>
          {q.options ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx)
                return (
                  <div key={letter} onClick={() => setAnswers({ ...answers, [q.id!]: letter })} style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${answers[q.id!] === letter ? '#1677ff' : '#d9d9d9'}`, background: answers[q.id!] === letter ? '#e6f4ff' : '#fff' }}>
                    {letter}. {opt}
                  </div>
                )
              })}
            </div>
          ) : q.type === 'short-answer' ? (
            <Input.TextArea value={answers[q.id!] || ''} onChange={(e) => setAnswers({ ...answers, [q.id!]: e.target.value })} rows={4} placeholder="输入你的答案..." />
          ) : q.type === 'code' ? (
            <Input.TextArea value={answers[q.id!] || ''} onChange={(e) => setAnswers({ ...answers, [q.id!]: e.target.value })} rows={10} placeholder="在此编写代码..." style={{ fontFamily: 'monospace' }} />
          ) : null}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)}>上一题</Button>
            <Space>
              <Button onClick={() => setCurrentIdx(currentIdx + 1)} disabled={currentIdx === questions.length - 1}>下一题</Button>
              <Button type="primary" danger onClick={() => Modal.confirm({ title: '确定交卷？', onOk: handleSubmit })}>交卷</Button>
            </Space>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {questions.map((qq, idx) => (
              <div key={qq.id} onClick={() => setCurrentIdx(idx)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', fontSize: 12, background: idx === currentIdx ? '#1677ff' : answers[qq.id!] ? '#52c41a' : '#f0f0f0', color: idx === currentIdx || answers[qq.id!] ? 'white' : 'black' }}>{idx + 1}</div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (mode === 'result') {
    const lastRecord = records[0]
    const correct = lastRecord?.details.filter((d) => d.isCorrect).length || 0
    return (
      <Card title="考试结果">
        <Row gutter={16}>
          <Col span={8}><Statistic title="总分" value={lastRecord?.totalScore || 0} suffix="/150" /></Col>
          <Col span={8}><Statistic title="正确率" value={lastRecord ? Math.round((correct / lastRecord.details.length) * 100) : 0} suffix="%" /></Col>
          <Col span={8}><Statistic title="用时" value={formatTime(lastRecord?.timeSpent || 0)} /></Col>
        </Row>
        <Divider />
        <h3>题目回顾</h3>
        {lastRecord && (
          <div>
            <Row gutter={[8, 8]}>
              {questions.map((q, idx) => {
                const d = lastRecord.details[idx]
                if (idx < reviewPage * REVIEW_PAGE_SIZE || idx >= (reviewPage + 1) * REVIEW_PAGE_SIZE) return null
                return (
                  <Col span={24} key={q.id}>
                    <Card size="small" style={{ borderLeft: `3px solid ${d?.isCorrect ? '#52c41a' : '#ff4d4f'}` }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Tag color={d?.isCorrect ? 'success' : 'error'}>{d?.isCorrect ? '正确' : '错误'}</Tag>
                          <Text>第{idx + 1}题 ({q.type === 'choice' ? '选择' : q.type === 'short-answer' ? '简答' : '代码'})</Text>
                        </div>
                        <Text>{q.content.slice(0, 100)}...</Text>
                        <div>
                          <Text type="secondary">你的答案：</Text>
                          <Text type={d?.isCorrect ? 'success' : 'danger'}>{d?.userAnswer || '未作答'}</Text>
                        </div>
                        <div>
                          <Text type="secondary">正确答案：</Text>
                          <Text type="success">{q.answer}</Text>
                        </div>
                        {q.explanation && (
                          <Text type="secondary" style={{ fontSize: 12 }}>解析：{q.explanation.slice(0, 100)}...</Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                )
              })}
            </Row>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination current={reviewPage + 1} total={questions.length} pageSize={REVIEW_PAGE_SIZE} onChange={(p) => setReviewPage(p - 1)} showSizeChanger={false} />
            </div>
          </div>
        )}
        <Button type="primary" onClick={() => setMode('list')} style={{ marginTop: 16 }}>返回列表</Button>
      </Card>
    )
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>模拟考试</Title>
        <p>严格按照408考试规格：180分钟、40道选择题、150分制。</p>
        <Button type="primary" size="large" onClick={handleStartExam}>开始全真模考</Button>
      </Card>

      <Card title="历次模考记录">
        {records.length === 0 ? <Empty description="暂无模考记录" /> : (
          <>
            <div style={{ height: 300, marginBottom: 24 }}>
              <ReactEChartsCore option={{
                xAxis: { type: 'category', data: records.map((r) => dayjs(r.date).format('MM/DD')).reverse() },
                yAxis: { type: 'value', max: 150 },
                series: [{ type: 'line', data: records.map((r) => r.totalScore).reverse(), smooth: true, areaStyle: {} }],
                tooltip: { trigger: 'axis' },
              }} style={{ height: '100%' }} />
            </div>
            <List dataSource={records} renderItem={(r) => (
              <List.Item>
                <Space>
                  <Text>{dayjs(r.date).format('YYYY-MM-DD HH:mm')}</Text>
                  <Tag color={r.totalScore >= 100 ? 'green' : r.totalScore >= 70 ? 'orange' : 'red'}>{r.totalScore}分</Tag>
                  <Text type="secondary">用时{formatTime(r.timeSpent)}</Text>
                  <Text type="secondary">正确{r.details.filter((d) => d.isCorrect).length}/{r.details.length}</Text>
                </Space>
              </List.Item>
            )} />
          </>
        )}
      </Card>
    </div>
  )
}
