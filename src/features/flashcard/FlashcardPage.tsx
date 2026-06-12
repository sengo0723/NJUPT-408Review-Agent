import { useState, useEffect } from 'react'
import { Button, Space, Tag, Typography, Empty, Progress, Select, Modal, Input, message, Row, Col, Popconfirm } from 'antd'
import { CheckOutlined, CloseOutlined, QuestionOutlined, ThunderboltOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { SUBJECT_NAMES, SUBJECT_COLORS } from '../../utils/helpers'
import type { Flashcard } from '../../types'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '../../components/Animations'

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
    setCards(all); setCurrentIdx(0); setFlipped(false)
  }

  async function handleRate(level: number) {
    const card = cards[currentIdx]
    if (!card?.id) return
    let newMastery = Math.max(0, Math.min(5, card.masteryLevel + level))
    const intervalsMs = [12*60*60*1000, 24*60*60*1000, 2*24*60*60*1000, 4*24*60*60*1000, 7*24*60*60*1000, 15*24*60*60*1000, 30*24*60*60*1000]
    const nextDate = new Date(Date.now() + intervalsMs[Math.max(0, newMastery)])
    await db.flashcards.update(card.id, { masteryLevel: newMastery, nextReviewAt: nextDate, reviewCount: card.reviewCount + 1 })
    setFlipped(false)
    if (currentIdx < cards.length - 1) { setCurrentIdx(currentIdx + 1) } else { message.success('本轮复习完成！'); loadCards() }
  }

  async function handleAddCard() {
    if (!newCard.front.trim() || !newCard.back.trim()) { message.warning('请填写卡片内容'); return }
    await db.flashcards.add({ ...newCard, masteryLevel: 0, nextReviewAt: new Date(), reviewCount: 0 })
    setAddModal(false); setNewCard({ subject: 'data-structure', knowledgePoint: '', front: '', back: '' }); loadCards(); message.success('卡片已添加')
  }

  async function handleDeleteCard(id: number) { await db.flashcards.delete(id); loadCards() }

  const currentCard = cards[currentIdx]

  return (
    <div>
      {/* Toolbar */}
      <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 16, marginBottom: 16 }}>
        <Space wrap>
          <Select value={mode} onChange={setMode} options={[{ value: 'review', label: '复习模式' }, { value: 'manage', label: '管理卡片' }]} />
          <Select value={subjectFilter} onChange={setSubjectFilter} options={[{ value: 'all', label: '全部科目' }, ...Object.entries(SUBJECT_NAMES).map(([k, v]) => ({ value: k, label: v }))]} />
          <Button icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加卡片</Button>
          <Tag>待复习: {cards.length} 张</Tag>
        </Space>
      </div>

      {mode === 'review' ? (
        currentCard ? (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {/* Flashcard with 3D flip */}
            <div style={{ perspective: 1200, minHeight: 320, cursor: 'pointer' }} onClick={() => setFlipped(!flipped)}>
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.2 }}
                style={{ transformStyle: 'preserve-3d', minHeight: 320, position: 'relative' }}
              >
                {/* Front face */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-light)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 32, textAlign: 'center',
                }}>
                  <Tag color={SUBJECT_COLORS[currentCard.subject]} style={{ marginBottom: 16 }}>{SUBJECT_NAMES[currentCard.subject]}</Tag>
                  <Title level={4} style={{ fontFamily: 'var(--font-serif)', marginBottom: 12, color: 'var(--text-tertiary)' }}>问题</Title>
                  <Text style={{ fontSize: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                    {currentCard.front}
                  </Text>
                  <div style={{ marginTop: 16 }}><Text type="secondary" style={{ fontSize: 12 }}>点击卡片翻转</Text></div>
                  <Progress percent={(currentCard.masteryLevel / 5) * 100} size="small" strokeColor="var(--color-accent)" style={{ marginTop: 8, width: 200 }} />
                </div>
                {/* Back face */}
                <div style={{
                  position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-accent-bg)',
                  border: '1px solid var(--color-accent-light)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 32, textAlign: 'center',
                }}>
                  <Tag color={SUBJECT_COLORS[currentCard.subject]} style={{ marginBottom: 16 }}>{SUBJECT_NAMES[currentCard.subject]}</Tag>
                  <Title level={4} style={{ fontFamily: 'var(--font-serif)', marginBottom: 12, color: 'var(--color-accent)' }}>答案</Title>
                  <Text style={{ fontSize: 16, whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)' }}>
                    {currentCard.back}
                  </Text>
                  <div style={{ marginTop: 16 }}><Text type="secondary" style={{ fontSize: 12 }}>点击卡片翻转</Text></div>
                  <Progress percent={(currentCard.masteryLevel / 5) * 100} size="small" strokeColor="var(--color-accent)" style={{ marginTop: 8, width: 200 }} />
                </div>
              </motion.div>
            </div>

            {/* Rating buttons */}
            <StaggerContainer staggerDelay={0.06}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                {[
                  { icon: <CloseOutlined />, label: '不认识', danger: true, onClick: () => handleRate(-1) },
                  { icon: <QuestionOutlined />, label: '模糊', onClick: () => handleRate(0) },
                  { icon: <CheckOutlined />, label: '认识', type: 'primary' as const, onClick: () => handleRate(1) },
                  { icon: <ThunderboltOutlined />, label: '太简单', style: { background: 'var(--color-success)', color: 'white', borderColor: 'var(--color-success)' }, onClick: () => handleRate(2) },
                ].map((btn, i) => (
                  <StaggerItem key={i}>
                    <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                      <Button size="large" {...btn} icon={btn.icon} onClick={btn.onClick}>{btn.label}</Button>
                    </motion.div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Text type="secondary">第 {currentIdx + 1}/{cards.length} 张</Text>
            </div>
          </div>
        ) : <Empty description="没有待复习的卡片" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <StaggerContainer staggerDelay={0.05}>
          <Row gutter={[16, 16]}>
            {cards.map((card) => (
              <Col key={card.id} xs={24} sm={12} md={8}>
                <StaggerItem>
                  <motion.div
                    whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border-light)',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color={SUBJECT_COLORS[card.subject]}>{SUBJECT_NAMES[card.subject]}</Tag>
                      <Popconfirm title="确认删除此卡片？" onConfirm={() => handleDeleteCard(card.id!)} okText="删除" cancelText="取消">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}><strong>Q:</strong> {card.front}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}><strong>A:</strong> {card.back}</p>
                    <Progress percent={(card.masteryLevel / 5) * 100} size="small" strokeColor="var(--color-accent)" />
                  </motion.div>
                </StaggerItem>
              </Col>
            ))}
          </Row>
        </StaggerContainer>
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
