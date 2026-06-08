import { useState, useEffect } from 'react'
import { Card, Tree, Tag, Input, Select, Badge, Typography, Empty, Space, Button, Divider } from 'antd'
import { BookOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import knowledgeTreeData from '../../data/knowledge-tree.json'
import { SUBJECT_COLORS } from '../../utils/helpers'
import MarkdownRenderer from '../../components/MarkdownRenderer'

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
                title: <span onClick={() => setSelectedKP(kp)} style={{ cursor: 'pointer' }}>{kp.name} <Tag color={FREQ_MAP[kp.frequency]?.color} style={{ fontSize: 10 }}>{FREQ_MAP[kp.frequency]?.label}</Tag></span>,
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
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>
      <Card style={{ width: 400, overflow: 'auto' }} title="知识点树" extra={<Input.Search placeholder="搜索知识点" size="small" value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 180 }} />}>
        <Tree treeData={filteredTreeData} expandedKeys={expandedKeys} onExpand={(keys) => setExpandedKeys(keys)} defaultExpandAll={false} blockNode />
      </Card>

      <Card style={{ flex: 1, overflow: 'auto' }}>
        {selectedKP ? (
          <>
            <Title level={4}>{selectedKP.name}</Title>
            <Space style={{ marginBottom: 16 }}>
              <Tag color={FREQ_MAP[selectedKP.frequency]?.color}>{FREQ_MAP[selectedKP.frequency]?.label}考点</Tag>
            </Space>
            <Divider />
            <MarkdownRenderer content={selectedKP.description} />
            <Divider />
            <Button type="primary" icon={<RobotOutlined />} onClick={() => {
              navigate('/ai-assistant', { state: { question: `请详细讲解知识点：${selectedKP.name}\n\n${selectedKP.description}\n\n请包括：1.核心概念 2.常见考法 3.易错点 4.记忆技巧` } })
            }}>AI讲解此知识点</Button>
          </>
        ) : (
          <Empty description="选择左侧知识点查看详情" />
        )}
      </Card>
    </div>
  )
}
