import { useState, useEffect } from 'react'
import { Table, Tag, Button, Select, Space, Row, Col, Modal, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { db } from '../../db'
import { getQuestionById, getQuestionsByIds } from '../../services/question-service'
import { SUBJECT_NAMES, SUBJECT_COLORS, ERROR_TAG_OPTIONS } from '../../utils/helpers'
import { calculateNextReview } from '../../utils/spaced-repetition'
import type { ErrorBookItem, Question } from '../../types'
import dayjs from 'dayjs'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem, CountUp } from '../../components/Animations'

export default function ErrorBookPage() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<(ErrorBookItem & { question?: Question })[]>([])
  const [loading, setLoading] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [currentError, setCurrentError] = useState<ErrorBookItem | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, unmastered: 0, reviewing: 0, mastered: 0, todayReview: 0 })

  useEffect(() => { loadErrors() }, [subjectFilter, statusFilter])

  async function loadErrors() {
    setLoading(true)
    let items = await db.errorBook.toArray()
    if (statusFilter !== 'all') items = items.filter((e) => e.masteryStatus === statusFilter)
    const questionIds = items.map((e) => e.questionId)
    const questionList = await getQuestionsByIds(questionIds)
    const questionMap = new Map(questionList.map((q) => [q.id, q]))
    const withQuestions = items.map((e) => ({ ...e, question: questionMap.get(e.questionId) }))
    const filtered = subjectFilter === 'all' ? withQuestions : withQuestions.filter((e) => e.question?.subject === subjectFilter)
    setErrors(filtered)
    const all = await db.errorBook.toArray()
    const today = dayjs().startOf('day')
    setStats({
      total: all.length,
      unmastered: all.filter((e) => e.masteryStatus === 'unmastered').length,
      reviewing: all.filter((e) => e.masteryStatus === 'reviewing').length,
      mastered: all.filter((e) => e.masteryStatus === 'mastered').length,
      todayReview: all.filter((e) => e.masteryStatus !== 'mastered' && e.nextReviewAt && dayjs(e.nextReviewAt).isBefore(dayjs().endOf('day'))).length,
    })
    setLoading(false)
  }

  async function handleRedo(item: ErrorBookItem) {
    const q = await getQuestionById(item.questionId)
    if (!q?.id) return
    sessionStorage.setItem('practice_session', JSON.stringify({ ids: [q.id], mode: 'redo', index: 0, errorBookId: item.id }))
    navigate('/practice/session')
  }

  async function handleMaster(item: ErrorBookItem) {
    await db.errorBook.update(item.id!, { masteryStatus: 'mastered' })
    message.success('已标记为掌握')
    loadErrors()
  }

  function openTagModal(item: ErrorBookItem) {
    setCurrentError(item)
    setSelectedTags(item.errorTags)
    setTagModalOpen(true)
  }

  async function saveTags() {
    if (!currentError?.id) return
    await db.errorBook.update(currentError.id, { errorTags: selectedTags })
    setTagModalOpen(false)
    loadErrors()
  }

  const statItems = [
    { label: '总错题', value: stats.total, color: 'var(--text-primary)' },
    { label: '未掌握', value: stats.unmastered, color: 'var(--color-error)' },
    { label: '复习中', value: stats.reviewing, color: 'var(--color-warning)' },
    { label: '已掌握', value: stats.mastered, color: 'var(--color-success)' },
    { label: '今日待复习', value: stats.todayReview, color: 'var(--color-accent)' },
  ]

  const columns = [
    { title: '科目', key: 'subject', width: 100, render: (_: unknown, r: { question?: Question }) => r.question ? <Tag color={SUBJECT_COLORS[r.question.subject]}>{SUBJECT_NAMES[r.question.subject]}</Tag> : '-' },
    { title: '题目', key: 'content', ellipsis: true, render: (_: unknown, r: { question?: Question }) => r.question?.content?.slice(0, 60) + '...' || '-' },
    { title: '错误次数', key: 'errorCount', width: 80, dataIndex: 'errorCount', sorter: (a: ErrorBookItem, b: ErrorBookItem) => a.errorCount - b.errorCount },
    { title: '状态', key: 'status', width: 80, render: (_: unknown, r: ErrorBookItem) => ({ unmastered: <Tag color="error">未掌握</Tag>, reviewing: <Tag color="warning">复习中</Tag>, mastered: <Tag color="success">已掌握</Tag> }[r.masteryStatus]) },
    { title: '下次复习', key: 'next', width: 100, render: (_: unknown, r: ErrorBookItem) => r.nextReviewAt ? dayjs(r.nextReviewAt).format('MM/DD') : '-' },
    {
      title: '操作', key: 'action', width: 200, render: (_: unknown, r: ErrorBookItem) => (
        <Space>
          <Button size="small" onClick={() => handleRedo(r)}>重做</Button>
          <Button size="small" onClick={() => openTagModal(r)}>标签</Button>
          {r.masteryStatus !== 'mastered' && <Button size="small" type="link" onClick={() => handleMaster(r)}>掌握</Button>}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Stats */}
      <StaggerContainer staggerDelay={0.06}>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          {statItems.map((s, i) => (
            <Col xs={12} sm={8} md={4} key={i}>
              <StaggerItem>
                <motion.div whileHover={{ y: -2 }} style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-light)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-serif)', fontWeight: 700, color: s.color }}><CountUp target={s.value} duration={1.2} /></div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</div>
                </motion.div>
              </StaggerItem>
            </Col>
          ))}
        </Row>
      </StaggerContainer>

      {/* Table */}
      <div style={{
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-light)',
        padding: 16,
      }}>
        <Space style={{ marginBottom: 16 }}>
          <Select style={{ width: 140 }} value={subjectFilter} onChange={setSubjectFilter} options={[{ value: 'all', label: '全部科目' }, ...Object.entries(SUBJECT_NAMES).map(([k, v]) => ({ value: k, label: v }))]} />
          <Select style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: '全部状态' }, { value: 'unmastered', label: '未掌握' }, { value: 'reviewing', label: '复习中' }, { value: 'mastered', label: '已掌握' }]} />
        </Space>
        <Table dataSource={errors} columns={columns} rowKey="id" loading={loading} size="small" pagination={{ pageSize: 15 }} />
      </div>

      <Modal title="错因标签" open={tagModalOpen} onOk={saveTags} onCancel={() => setTagModalOpen(false)}>
        <Select mode="multiple" style={{ width: '100%' }} value={selectedTags} onChange={setSelectedTags} options={ERROR_TAG_OPTIONS.map((t) => ({ value: t, label: t }))} placeholder="选择错因标签" />
      </Modal>
    </div>
  )
}
