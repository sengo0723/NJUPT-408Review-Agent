import { useState, useEffect } from 'react'
import { Tree, Tag, Input, Badge, Typography, Empty, Button, Divider } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import knowledgeTreeData from '../../data/knowledge-tree.json'
import { SUBJECT_COLORS } from '../../utils/helpers'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { motion, AnimatePresence } from 'framer-motion'

const { Text, Title } = Typography

interface KnowledgePoint {
  id: string
  name: string
  frequency: string
  description: string
}

const FREQ_MAP: Record<string, { color: string; label: string }> = {
  high: { color: 'red', label: '高频' },
  medium: { color: 'orange', label: '中频' },
  low: { color: 'green', label: '低频' },
}

export default function KnowledgePage() {
  const navigate = useNavigate()
  const [selectedKP, setSelectedKP] = useState<KnowledgePoint | null>(null)
  const [searchText, setSearchText] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  const knowledgeTree = knowledgeTreeData.subjects

  useEffect(() => {
    if (!searchText) {
      setExpandedKeys([])
      return
    }
    const keysToExpand: React.Key[] = []
    knowledgeTree.forEach((subject) => {
      let subjectMatch = false
      subject.chapters.forEach((chapter) => {
        let chapterMatch = false
        chapter.sections.forEach((section) => {
          const hasMatch = section.knowledgePoints.some(
            (kp) => kp.name.includes(searchText) || kp.description.includes(searchText)
          )
          if (hasMatch) {
            chapterMatch = true
            keysToExpand.push(section.id)
          }
        })
        if (chapterMatch) {
          subjectMatch = true
          keysToExpand.push(chapter.id)
        }
      })
      if (subjectMatch) keysToExpand.push(subject.id)
    })
    setExpandedKeys(keysToExpand)
  }, [searchText, knowledgeTree])

  const filteredTreeData = knowledgeTree.map((subject) => ({
    title: <span><Badge color={SUBJECT_COLORS[subject.id]} /> {subject.name} ({subject.score}分)</span>,
    key: subject.id,
    children: subject.chapters
      .map((chapter) => ({
        title: chapter.name,
        key: chapter.id,
        children: chapter.sections
          .map((section) => {
            const filteredKPs = section.knowledgePoints.filter(
              (kp) => !searchText || kp.name.includes(searchText) || kp.description.includes(searchText)
            )
            if (searchText && filteredKPs.length === 0) return null
            return {
              title: section.name,
              key: section.id,
              children: filteredKPs.map((kp) => ({
                title: <span onClick={() => setSelectedKP(kp)} style={{ cursor: 'pointer' }}>{kp.name} <Tag color={FREQ_MAP[kp.frequency]?.color} style={{ fontSize: 10, marginLeft: 4 }}>{FREQ_MAP[kp.frequency]?.label}</Tag></span>,
                key: kp.id,
                isLeaf: true,
              })),
            }
          })
          .filter(Boolean) as any[],
      }))
      .filter((ch) => !searchText || ch.children.length > 0),
  })).filter((s) => !searchText || s.children.length > 0) as any[]

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 104px)' }}>
      {/* Left: Tree */}
      <div style={{
        width: 380, flexShrink: 0, overflow: 'auto',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-light)',
        padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
            知识点树
          </span>
          <Input.Search
            placeholder="搜索知识点"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 160 }}
          />
        </div>
        <Tree
          treeData={filteredTreeData}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          defaultExpandAll={false}
          blockNode
        />
      </div>

      {/* Right: Detail */}
      <div style={{
        flex: 1, overflow: 'auto',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-light)',
        padding: 24,
      }}>
        <AnimatePresence mode="wait">
          {selectedKP ? (
            <motion.div
              key={selectedKP.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Title level={3} style={{ fontFamily: 'var(--font-serif)', marginBottom: 12 }}>
                {selectedKP.name}
              </Title>
              <div style={{ marginBottom: 16 }}>
                <Tag color={FREQ_MAP[selectedKP.frequency]?.color}>{FREQ_MAP[selectedKP.frequency]?.label}考点</Tag>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <MarkdownRenderer content={selectedKP.description} />
              <Divider style={{ margin: '16px 0' }} />
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={() => {
                  navigate('/ai-assistant', { state: { question: `请详细讲解知识点：${selectedKP.name}\n\n${selectedKP.description}\n\n请包括：1.核心概念 2.常见考法 3.易错点 4.记忆技巧` } })
                }}
              >
                AI讲解此知识点
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
            >
              <Empty description="选择左侧知识点查看详情" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
