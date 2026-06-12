import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Radio, Space, Typography, Tag, Input, Progress, message, Divider, Modal, Statistic } from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, StarOutlined, StarFilled, RobotOutlined } from '@ant-design/icons'
import { getQuestionsByIds } from '../../services/question-service'
import { db } from '../../db'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { SUBJECT_NAMES, SUBJECT_COLORS } from '../../utils/helpers'
import { calculateNextReview } from '../../utils/spaced-repetition'
import { evaluateShortAnswer } from '../../services/short-answer-evaluation-service'
import type { Question } from '../../types'
import type { ShortAnswerEvaluation } from '../../services/short-answer-evaluation-service'

const { Text } = Typography

export default function PracticeSession() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  const [isCollected, setIsCollected] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [answerMap, setAnswerMap] = useState<Record<number, string>>({})
  const [submittedSet, setSubmittedSet] = useState<Set<number>>(new Set())
  const redoInfoRef = useRef<{ errorBookId: number } | null>(null)
  const [completed, setCompleted] = useState(false)
  const [evaluatingAI, setEvaluatingAI] = useState(false)
  const [aiEvaluations, setAiEvaluations] = useState<Record<number, ShortAnswerEvaluation>>({})

  useEffect(() => {
    loadSession()
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    const q = questions[currentIndex]
    if (!q?.id) return
    setUserAnswer(answerMap[q.id] || '')
    setShowAnswer(submittedSet.has(q.id))
    setStartTime(Date.now())
    checkCollected()
  }, [currentIndex, questions])

  useEffect(() => {
    const raw = sessionStorage.getItem('practice_session')
    if (!raw) return
    const session = JSON.parse(raw)
    session.answerMap = answerMap
    session.submittedSet = [...submittedSet]
    sessionStorage.setItem('practice_session', JSON.stringify(session))
  }, [answerMap, submittedSet])

  async function loadSession() {
    const raw = sessionStorage.getItem('practice_session')
    if (!raw) { navigate('/practice'); return }
    const session = JSON.parse(raw)
    const qs = await getQuestionsByIds(session.ids)
    setQuestions(qs)
    setCurrentIndex(session.index || 0)
    if (session.mode === 'redo' && session.errorBookId) {
      redoInfoRef.current = { errorBookId: session.errorBookId }
    }
    if (session.answerMap) {
      const restored: Record<number, string> = {}
      for (const [k, v] of Object.entries(session.answerMap)) {
        restored[Number(k)] = v as string
      }
      setAnswerMap(restored)
    }
    if (session.submittedSet) {
      setSubmittedSet(new Set(session.submittedSet as number[]))
    }
  }

  async function checkCollected() {
    const q = questions[currentIndex]
    if (!q?.id) return
    const fav = await db.favorites.where('targetId').equals(q.id as number).first()
    setIsCollected(!!fav)
  }

  async function handleSubmit() {
    const q = questions[currentIndex]
    if (!q?.id) return
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    let isCorrect: boolean

    if (q.type === 'short-answer') {
      setEvaluatingAI(true)
      const evaluation = await evaluateShortAnswer(q, userAnswer)
      setEvaluatingAI(false)
      isCorrect = evaluation.isCorrect
      setAiEvaluations(prev => ({ ...prev, [q.id!]: evaluation }))
      await db.answerRecords.add({ questionId: q.id, userAnswer, isCorrect, timeSpent, createdAt: new Date() })
    } else {
      isCorrect = userAnswer.trim().toUpperCase() === q.answer.trim().toUpperCase()
      await db.answerRecords.add({ questionId: q.id, userAnswer, isCorrect, timeSpent, createdAt: new Date() })
    }

    setAnswerMap(prev => ({ ...prev, [q.id!]: userAnswer }))
    setSubmittedSet(prev => new Set(prev).add(q.id!))

    if (isCorrect && redoInfoRef.current?.errorBookId) {
      await db.errorBook.update(redoInfoRef.current.errorBookId, { masteryStatus: 'mastered', lastReviewAt: new Date() })
      message.success('重做正确，已标记为已掌握！')
      redoInfoRef.current = null
    } else if (!isCorrect) {
      const existing = await db.errorBook.where('questionId').equals(q.id).first()
      if (existing) {
        const { nextDate } = calculateNextReview(existing.errorCount + 1, false)
        await db.errorBook.update(existing.id!, { errorCount: existing.errorCount + 1, lastReviewAt: new Date(), nextReviewAt: nextDate })
      } else {
        const { nextDate } = calculateNextReview(1, false)
        await db.errorBook.add({ questionId: q.id, errorCount: 1, lastReviewAt: new Date(), nextReviewAt: nextDate, errorTags: [], masteryStatus: 'unmastered' })
      }
    }
    setShowAnswer(true)
  }

  async function handleToggleCollect() {
    const q = questions[currentIndex]
    if (!q?.id) return
    if (isCollected) {
      await db.favorites.where('targetId').equals(q.id as number).delete()
      setIsCollected(false)
    } else {
      await db.favorites.add({ type: 'question', targetId: q.id as number, createdAt: new Date() })
      setIsCollected(true)
    }
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      const raw = sessionStorage.getItem('practice_session')
      if (raw) {
        const s = JSON.parse(raw)
        s.index = currentIndex + 1
        sessionStorage.setItem('practice_session', JSON.stringify(s))
      }
    }
  }

  function handlePrev() { if (currentIndex > 0) setCurrentIndex(currentIndex - 1) }

  function handleGoAI() {
    const q = questions[currentIndex]
    if (!q) return
    const context = `题目：${q.content}\n选项：${q.options?.join('\n') || '无'}\n我的答案：${userAnswer || '未作答'}\n正确答案：${q.answer}`
    navigate('/ai-assistant', { state: { context, question: `请详细讲解这道题：\n${q.content}` } })
  }

  function handleAnswerChange(value: string) {
    setUserAnswer(value)
    const q = questions[currentIndex]
    if (q?.id) setAnswerMap(prev => ({ ...prev, [q.id!]: value }))
  }

  if (questions.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

  const q = questions[currentIndex]
  if (!q) return null
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-light)',
        padding: 24,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Button onClick={() => navigate('/practice')}>退出</Button>
            <Tag color={SUBJECT_COLORS[q.subject]}>{SUBJECT_NAMES[q.subject]}</Tag>
            <Tag>{q.source}</Tag>
          </Space>
          <Space>
            <Text>第 {currentIndex + 1}/{questions.length} 题</Text>
            <Text type="secondary">{formatTime(elapsed)}</Text>
          </Space>
        </div>

        <Progress percent={((currentIndex + 1) / questions.length) * 100} showInfo={false} size="small" strokeColor="var(--color-accent)" />

        <div style={{ margin: '24px 0' }}>
          <MarkdownRenderer content={q.content} />
        </div>

        {/* Choice options */}
        {q.type === 'choice' && q.options && (
          <Radio.Group value={userAnswer} onChange={(e) => !showAnswer && handleAnswerChange(e.target.value)} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {q.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx)
                const isCorrect = showAnswer && letter === q.answer.trim().toUpperCase()
                const isWrong = showAnswer && userAnswer.toUpperCase() === letter && letter !== q.answer.trim().toUpperCase()
                return (
                  <Radio key={letter} value={letter} style={{ width: '100%' }}>
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: isCorrect ? 'var(--color-success-bg)' : isWrong ? 'var(--color-error-bg)' : 'var(--bg-sunken)',
                      border: `1px solid ${isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-error)' : 'var(--border-light)'}`,
                      transition: 'all var(--transition-fast)',
                    }}>
                      {letter}. {opt}
                    </div>
                  </Radio>
                )
              })}
            </Space>
          </Radio.Group>
        )}

        {q.type === 'short-answer' && (
          <Input.TextArea value={userAnswer} onChange={(e) => !showAnswer && handleAnswerChange(e.target.value)} rows={4} placeholder="输入你的答案..." disabled={showAnswer} />
        )}

        {q.type === 'code' && (
          <Input.TextArea value={userAnswer} onChange={(e) => !showAnswer && handleAnswerChange(e.target.value)} rows={10} placeholder="在此编写代码..." disabled={showAnswer} style={{ fontFamily: 'var(--font-mono)' }} />
        )}

        <Divider />

        {!showAnswer ? (
          <Button type="primary" onClick={handleSubmit} disabled={!userAnswer || evaluatingAI} loading={evaluatingAI}>
            {evaluatingAI ? 'AI评估中...' : '提交答案'}
          </Button>
        ) : q.type === 'short-answer' ? (
          <div>
            {aiEvaluations[q.id!] ? (
              <div style={{ padding: 16, background: aiEvaluations[q.id!].isCorrect ? 'var(--color-success-bg)' : 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 18 }}>
                    AI评分：<span style={{ color: aiEvaluations[q.id!].score >= 60 ? 'var(--color-success)' : 'var(--color-warning)' }}>{aiEvaluations[q.id!].score}/100</span>
                  </Text>
                  <Tag color={aiEvaluations[q.id!].isCorrect ? 'success' : 'warning'}>
                    {aiEvaluations[q.id!].isCorrect ? '基本正确' : '需要加强'}
                  </Tag>
                </div>
                <Text>{aiEvaluations[q.id!].feedback}</Text>
                {aiEvaluations[q.id!].keyPointsCovered.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">已掌握：</Text>
                    {aiEvaluations[q.id!].keyPointsCovered.map((p, i) => <Tag key={i} color="success">{p}</Tag>)}
                  </div>
                )}
                {aiEvaluations[q.id!].keyPointsMissed.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">需加强：</Text>
                    {aiEvaluations[q.id!].keyPointsMissed.map((p, i) => <Tag key={i} color="error">{p}</Tag>)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 16, background: 'var(--bg-sunken)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
                <Text type="secondary">评估结果不可用</Text>
              </div>
            )}
            <div style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-light)',
              padding: 16,
              marginBottom: 16,
            }}>
              <Text strong style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 8 }}>参考答案</Text>
              <MarkdownRenderer content={q.answer} />
            </div>
            <div style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-light)',
              padding: 16,
              marginBottom: 16,
            }}>
              <Text strong style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 8 }}>解析</Text>
              <MarkdownRenderer content={q.explanation} />
            </div>
            <Space>{q.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
          </div>
        ) : (
          <div>
            <div style={{ padding: 16, background: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <Text strong>正确答案：{q.answer}</Text>
              {userAnswer.trim().toUpperCase() === q.answer.trim().toUpperCase() ? (
                <Tag color="success" style={{ marginLeft: 8 }}>✓ 正确</Tag>
              ) : (
                <Tag color="error" style={{ marginLeft: 8 }}>✗ 错误</Tag>
              )}
            </div>
            <div style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-light)',
              padding: 16,
              marginBottom: 16,
            }}>
              <Text strong style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'block', marginBottom: 8 }}>解析</Text>
              <MarkdownRenderer content={q.explanation} />
            </div>
            <Space>{q.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handlePrev} disabled={currentIndex === 0}>上一题</Button>
          <Space>
            <Button icon={isCollected ? <StarFilled style={{ color: 'var(--color-accent)' }} /> : <StarOutlined />} onClick={handleToggleCollect}>
              {isCollected ? '已收藏' : '收藏'}
            </Button>
            <Button icon={<RobotOutlined />} onClick={handleGoAI}>AI讲解</Button>
            {currentIndex === questions.length - 1 ? (
              <Button type="primary" onClick={() => setCompleted(true)}>完成练习</Button>
            ) : (
              <Button icon={<ArrowRightOutlined />} onClick={handleNext}>下一题</Button>
            )}
          </Space>
        </div>
      </div>

      <Modal title="练习完成！" open={completed} onCancel={() => setCompleted(false)} footer={[
        <Button key="exit" onClick={() => navigate('/practice')}>返回题库</Button>,
        <Button key="review" type="primary" onClick={() => { setCompleted(false); setCurrentIndex(0) }}>回顾答案</Button>,
      ]}>
        <Statistic title="总题数" value={questions.length} />
        <Statistic
          title="正确率"
          value={submittedSet.size > 0 ? Math.round((Object.entries(answerMap).filter(([id, ans]) => {
            const question = questions.find(q => q.id === Number(id))
            if (!question) return false
            if (question.type === 'short-answer') return aiEvaluations[Number(id)]?.isCorrect ?? false
            return ans.trim().toUpperCase() === question.answer.trim().toUpperCase()
          }).length / submittedSet.size) * 100) : 0}
          suffix="%"
        />
        <Statistic title="用时" value={`${Math.floor(elapsed / 60)}分${elapsed % 60}秒`} />
      </Modal>
    </div>
  )
}
