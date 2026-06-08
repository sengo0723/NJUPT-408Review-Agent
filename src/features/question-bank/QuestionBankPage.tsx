import { useState, useEffect } from 'react'
import { Card, Select, Input, Tag, Pagination, List, Button, Space, Rate, Empty, Spin, Segmented, Row, Col, Statistic, message } from 'antd'
import { PlayCircleOutlined, StarOutlined, StarFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getQuestions, getQuestionStats, getBatchQuestionStats } from '../../services/question-service'
import { SUBJECT_NAMES, SUBJECT_COLORS, DIFFICULTY_LABELS } from '../../utils/helpers'
import { db } from '../../db'
import type { Question, SubjectType, QuestionType, Difficulty } from '../../types'

export default function QuestionBankPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState<SubjectType | 'all'>('all')
  const [type, setType] = useState<QuestionType | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState<Record<number, { isCorrect: boolean | null; isCollected: boolean }>>({})

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300)
    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => { loadQuestions() }, [subject, type, debouncedKeyword, page])
  useEffect(() => { loadQuestionStats() }, [questions])

  async function loadQuestions() {
    setLoading(true)
    const filter = {
      subject: subject === 'all' ? undefined : subject,
      type: type === 'all' ? undefined : type as QuestionType,
      keyword: debouncedKeyword || undefined,
      page, pageSize: 20,
    }
    const result = await getQuestions(filter)
    setQuestions(result.data)
    setTotal(result.total)
    setLoading(false)
  }

  async function loadQuestionStats() {
    const questionIds = questions.map((q) => q.id!).filter(Boolean)
    const batchStats = await getBatchQuestionStats(questionIds)
    const newStats: Record<number, { isCorrect: boolean | null; isCollected: boolean }> = {}
    for (const q of questions) {
      if (q.id && batchStats[q.id]) {
        const s = batchStats[q.id]
        newStats[q.id] = {
          isCorrect: s.attemptCount === 0 ? null : s.correctCount > 0,
          isCollected: s.isCollected,
        }
      }
    }
    setStats(newStats)
  }

  async function handleStartPractice() {
    const filter = {
      subject: subject === 'all' ? undefined : subject,
      type: type === 'all' ? undefined : type as QuestionType,
      keyword: debouncedKeyword || undefined,
    }
    const result = await getQuestions({ ...filter, page: 1, pageSize: 1000 })
    if (result.data.length === 0) { message.warning('当前筛选条件下没有题目'); return }
    const ids = result.data.map((q) => q.id!).filter(Boolean)
    sessionStorage.setItem('practice_session', JSON.stringify({ ids, mode: 'sequential', index: 0 }))
    navigate('/practice/session')
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space wrap>
              <Segmented options={[{ value: 'all', label: '全部' }, ...Object.entries(SUBJECT_NAMES).map(([k, v]) => ({ value: k, label: v }))]} value={subject} onChange={(v) => { setSubject(v as SubjectType | 'all'); setPage(1) }} />
              <Select style={{ width: 100 }} value={type} onChange={(v) => { setType(v); setPage(1) }} options={[{ value: 'all', label: '全部题型' }, { value: 'choice', label: '选择题' }, { value: 'short-answer', label: '简答题' }, { value: 'code', label: '代码题' }]} />
              <Input.Search placeholder="搜索题目..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} onSearch={() => { setPage(1); loadQuestions() }} style={{ width: 200 }} allowClear />
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartPractice}>开始刷题</Button>
          </Col>
        </Row>
        <div style={{ marginTop: 8 }}>
          <Space>
            <Tag>共 {total} 题</Tag>
            <Tag>第 {page}/{Math.ceil(total / 20) || 1} 页</Tag>
          </Space>
        </div>
      </Card>

      <Card>
        <Spin spinning={loading}>
          {questions.length === 0 ? <Empty description="暂无题目" /> : (
            <List
              dataSource={questions}
              renderItem={(q) => (
                <List.Item
                  actions={[
                    <Button key="do" type="link" onClick={() => {
                      sessionStorage.setItem('practice_session', JSON.stringify({ ids: [q.id!], mode: 'single', index: 0 }))
                      navigate('/practice/session')
                    }}>做题</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {stats[q.id!]?.isCorrect === true && <Tag color="success">✓</Tag>}
                        {stats[q.id!]?.isCorrect === false && <Tag color="error">✗</Tag>}
                        {stats[q.id!]?.isCorrect === null && <Tag>未做</Tag>}
                        <Tag color={SUBJECT_COLORS[q.subject]}>{SUBJECT_NAMES[q.subject]}</Tag>
                        <Tag>{q.source}</Tag>
                        <Rate disabled count={5} value={q.difficulty} style={{ fontSize: 12 }} />
                      </Space>
                    }
                    description={<span>{q.content.length > 80 ? q.content.slice(0, 80) + '...' : q.content}</span>}
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
        {total > 20 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination current={page} total={total} pageSize={20} onChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  )
}
