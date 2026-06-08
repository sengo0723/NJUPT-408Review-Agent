import { useState, useEffect } from 'react'
import { Card, Button, Space, Tag, Typography, Empty, Progress, Select, Modal, Input, message, Row, Col, Statistic, Popconfirm } from 'antd'
import { CheckOutlined, CloseOutlined, QuestionOutlined, ThunderboltOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { SUBJECT_NAMES, SUBJECT_COLORS } from '../../utils/helpers'
import type { Flashcard } from '../../types'

const { Text, Title } = Typography

export default function FlashcardPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [mode, setMode] = useState<'review' | 'manage'>('review')
  const [addModal, setAddModal] = useState(false)
  const [newCard, setNewCard] = useState({ subject: 'data-structure', knowledgePoint: '', front: '', back: '' })

  useEffect(() => { loadCards() }, [subjectFilter])

  async function loadCards() {
    const today = new Date()
    let all = await db.flashcards.toArray()
    if (subjectFilter !== 'all') all = all.filter((c) => c.subject === subjectFilter)
    all = all.filter((c) => new Date(c.nextReviewAt) <= today)
    all.sort((a, b) => a.masteryLevel - b.masteryLevel)
    setCards(all)
    setCurrentIdx(0)
    setFlipped(false)
  }

  async function handleRate(level: number) {
    const card = cards[currentIdx]
    if (!card?.id) return
    let newMastery = card.masteryLevel + level
    newMastery = Math.max(0, Math.min(5, newMastery))

    // 间隔计算考虑"连续不认识"：masteryLevel 停留在 0 表示极弱
    const intervalsMs = [
      12 * 60 * 60 * 1000,    // 0.5 天 = 12 小时
      24 * 60 * 60 * 1000,    // 1 天
      2 * 24 * 60 * 60 * 1000,  // 2 天
      4 * 24 * 60 * 60 * 1000,  // 4 天
      7 * 24 * 60 * 60 * 1000,  // 7 天
      15 * 24 * 60 * 60 * 1000, // 15 天
      30 * 24 * 60 * 60 * 1000, // 30 天
    ]
    const intervalIdx = Math.max(0, newMastery)
    const nextDate = new Date(Date.now() + intervalsMs[intervalIdx])
    // 对于 masteryLevel=0 且点了不认识的情况，使用 12 小时间隔（已在 intervalsMs[0] 中处理）

    await db.flashcards.update(card.id, { masteryLevel: newMastery, nextReviewAt: nextDate, reviewCount: card.reviewCount + 1 })
    setFlipped(false)
    if (currentIdx < cards.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      message.success('本轮复习完成！')
      loadCards()
    }
  }

  async function handleAddCard() {
    if (!newCard.front.trim() || !newCard.back.trim()) { message.warning('请填写卡片内容'); return }
    await db.flashcards.add({ ...newCard, masteryLevel: 0, nextReviewAt: new Date(), reviewCount: 0 })
    setAddModal(false)
    setNewCard({ subject: 'data-structure', knowledgePoint: '', front: '', back: '' })
    loadCards()
    message.success('卡片已添加')
  }

  async function handleDeleteCard(id: number) {
    await db.flashcards.delete(id)
    loadCards()
  }

  const currentCard = cards[currentIdx]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select value={mode} onChange={setMode} options={[{ value: 'review', label: '复习模式' }, { value: 'manage', label: '管理卡片' }]} />
          <Select value={subjectFilter} onChange={setSubjectFilter} options={[{ value: 'all', label: '全部科目' }, ...Object.entries(SUBJECT_NAMES).map(([k, v]) => ({ value: k, label: v }))]} />
          <Button icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加卡片</Button>
          <Tag>待复习: {cards.length} 张</Tag>
        </Space>
      </Card>

      {mode === 'review' ? (
        currentCard ? (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Card style={{ textAlign: 'center', minHeight: 300, cursor: 'pointer' }} onClick={() => setFlipped(!flipped)} styles={{ body: { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 280 } }}>
              <Tag color={SUBJECT_COLORS[currentCard.subject]} style={{ marginBottom: 16 }}>{SUBJECT_NAMES[currentCard.subject]}</Tag>
              <Title level={4}>{flipped ? '答案' : '问题'}</Title>
              <Text style={{ fontSize: 16, whiteSpace: 'pre-wrap' }}>{flipped ? currentCard.back : currentCard.front}</Text>
              <div style={{ marginTop: 16 }}><Text type="secondary">点击卡片翻转</Text></div>
              <Progress percent={(currentCard.masteryLevel / 5) * 100} size="small" style={{ marginTop: 8 }} />
            </Card>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <Button size="large" danger icon={<CloseOutlined />} onClick={() => handleRate(-1)}>不认识</Button>
              <Button size="large" icon={<QuestionOutlined />} onClick={() => handleRate(0)}>模糊</Button>
              <Button size="large" type="primary" icon={<CheckOutlined />} onClick={() => handleRate(1)}>认识</Button>
              <Button size="large" style={{ background: '#52c41a', color: 'white' }} icon={<ThunderboltOutlined />} onClick={() => handleRate(2)}>太简单</Button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Text type="secondary">第 {currentIdx + 1}/{cards.length} 张</Text>
            </div>
          </div>
        ) : <Empty description="没有待复习的卡片" />
      ) : (
        <Row gutter={[16, 16]}>
          {cards.map((card) => (
            <Col key={card.id} xs={24} sm={12} md={8}>
              <Card size="small" actions={[
                <Popconfirm title="确认删除此卡片？" description="删除后无法恢复" onConfirm={() => handleDeleteCard(card.id!)} okText="删除" cancelText="取消" key="del">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ]}>
                <Tag color={SUBJECT_COLORS[card.subject]}>{SUBJECT_NAMES[card.subject]}</Tag>
                <p style={{ margin: '8px 0' }}><strong>Q:</strong> {card.front}</p>
                <p><strong>A:</strong> {card.back}</p>
                <Progress percent={(card.masteryLevel / 5) * 100} size="small" />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal title="添加卡片" open={addModal} onOk={handleAddCard} onCancel={() => setAddModal(false)}>
        <Select value={newCard.subject} onChange={(v) => setNewCard({ ...newCard, subject: v })} style={{ width: '100%', marginBottom: 12 }} options={Object.entries(SUBJECT_NAMES).map(([k, v]) => ({ value: k, label: v }))} />
        <Input placeholder="知识点（可选）" value={newCard.knowledgePoint} onChange={(e) => setNewCard({ ...newCard, knowledgePoint: e.target.value })} style={{ marginBottom: 12 }} />
        <Input.TextArea placeholder="卡片正面（问题）" value={newCard.front} onChange={(e) => setNewCard({ ...newCard, front: e.target.value })} rows={3} style={{ marginBottom: 12 }} />
        <Input.TextArea placeholder="卡片背面（答案）" value={newCard.back} onChange={(e) => setNewCard({ ...newCard, back: e.target.value })} rows={3} />
      </Modal>
    </div>
  )
}
