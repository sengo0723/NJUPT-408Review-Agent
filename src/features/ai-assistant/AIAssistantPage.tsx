import { useState, useEffect, useRef } from 'react'
import { Button, Input, Space, Tag, Modal, Select, Tooltip, Drawer, message, Empty, Popconfirm, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined, PushpinOutlined, PushpinFilled, SearchOutlined, StarOutlined, StarFilled, ExportOutlined, MessageOutlined, BulbOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { useAIStore } from '../../stores/useAIStore'
import { sendMessage } from '../../services/ai-service'
import { getRelevantMemories, addMemory } from '../../services/memory-service'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { SUBJECT_NAMES, MEMORY_CATEGORY_LABELS, MEMORY_CATEGORY_COLORS } from '../../utils/helpers'
import type { AIConversation, AIMessage, AIMemory, MemoryCategory } from '../../types'
import { formatDateTime } from '../../utils/date'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TypingCursor, StaggerContainer, StaggerItem } from '../../components/Animations'

const MAX_HISTORY_ROUNDS = 10

export default function AIAssistantPage() {
  const location = useLocation()
  const { getActiveProvider } = useAIStore()
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [currentConvId, setCurrentConvId] = useState<number | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<AIMessage[]>([])
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false)
  const [memories, setMemories] = useState<AIMemory[]>([])
  const [addMemoryModal, setAddMemoryModal] = useState(false)
  const [newMemoryText, setNewMemoryText] = useState('')
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryCategory>('weakness')
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initStateHandledRef = useRef(false)

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { if (currentConvId) loadMessages(currentConvId) }, [currentConvId])
  useEffect(() => { scrollToBottom() }, [messages, streamingContent])
  useEffect(() => { return () => { abortRef.current?.abort() } }, [])
  useEffect(() => {
    if (initStateHandledRef.current) return
    initStateHandledRef.current = true
    const state = location.state as { context?: string; question?: string } | null
    if (state?.question) {
      const fullText = state.context ? `${state.context}\n\n${state.question}` : state.question
      handleNewConversation(fullText)
    }
  }, [location.state])

  async function loadConversations() {
    try {
      const convs = await db.aiConversations.orderBy('updatedAt').reverse().toArray()
      setConversations(convs)
    } catch {
      const convs = await db.aiConversations.toArray()
      convs.sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
      setConversations(convs)
    }
  }

  async function loadMessages(convId: number) {
    const msgs = await db.aiMessages.where('conversationId').equals(convId).sortBy('createdAt')
    setMessages(msgs.filter((m) => m.role !== 'system'))
  }

  function scrollToBottom() { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }

  async function handleNewConversation(initialMessage?: string) {
    const id = await db.aiConversations.add({ title: initialMessage ? initialMessage.slice(0, 30) : '新对话', createdAt: new Date(), updatedAt: new Date(), isPinned: false })
    if (!id) return
    setCurrentConvId(id)
    setMessages([])
    setInputText('')
    setStreamingContent('')
    loadConversations()
    if (initialMessage) await handleSend(id, initialMessage)
  }

  async function handleSend(convIdOverride?: number, textOverride?: string) {
    const text = textOverride || inputText.trim()
    if (!text || streaming) return
    const provider = getActiveProvider()
    if (!provider?.apiKey) { message.error('请先在设置中配置AI模型'); return }
    const convId = convIdOverride || currentConvId
    if (!convId) return
    setInputText('')

    const userMsgId = await db.aiMessages.add({ conversationId: convId, role: 'user', content: text, createdAt: new Date(), isBookmarked: false })
    const newMsg: AIMessage = { id: userMsgId, conversationId: convId, role: 'user', content: text, createdAt: new Date(), isBookmarked: false }
    setMessages((prev) => [...prev, newMsg])

    const allHistory = [...messages, newMsg].map((m) => ({ role: m.role, content: m.content }))
    const maxMessages = MAX_HISTORY_ROUNDS * 2
    const history = allHistory.length > maxMessages ? allHistory.slice(allHistory.length - maxMessages) : allHistory
    const relevantMemories = await getRelevantMemories(text)

    setStreaming(true)
    setStreamingContent('')
    const abort = new AbortController()
    abortRef.current = abort
    let fullContent = ''
    await sendMessage(provider, history, relevantMemories,
      (chunk) => { fullContent += chunk; setStreamingContent(fullContent) },
      async () => {
        if (!abortRef.current) return
        const assistantMsgId = await db.aiMessages.add({ conversationId: convId, role: 'assistant', content: fullContent, createdAt: new Date(), isBookmarked: false })
        const assistantMsg: AIMessage = { id: assistantMsgId, conversationId: convId, role: 'assistant', content: fullContent, createdAt: new Date(), isBookmarked: false }
        setMessages((prev) => [...prev, assistantMsg])
        setStreamingContent('')
        setStreaming(false)
        const existingMsgCount = await db.aiMessages.where('conversationId').equals(convId).count()
        if (existingMsgCount <= 2) {
          await db.aiConversations.update(convId, { title: text.slice(0, 30), updatedAt: new Date() })
        } else {
          await db.aiConversations.update(convId, { updatedAt: new Date() })
        }
        loadConversations()
      },
      (err) => { setStreaming(false); setStreamingContent(''); message.error(`AI回复失败: ${err.message}`) },
      abort.signal
    )
  }

  function handleStopStreaming() { abortRef.current?.abort() }

  async function handleDeleteConversation(id: number) {
    await db.aiConversations.delete(id)
    await db.aiMessages.where('conversationId').equals(id).delete()
    if (currentConvId === id) { setCurrentConvId(null); setMessages([]) }
    loadConversations()
  }

  async function handleTogglePin(conv: AIConversation) {
    if (conv.id) { await db.aiConversations.update(conv.id, { isPinned: !conv.isPinned }); loadConversations() }
  }

  async function handleToggleBookmark(msg: AIMessage) {
    if (msg.id) {
      await db.aiMessages.update(msg.id, { isBookmarked: !msg.isBookmarked })
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isBookmarked: !m.isBookmarked } : m))
    }
  }

  async function handleSaveAsMemory(content: string) { setNewMemoryText(content.slice(0, 200)); setAddMemoryModal(true) }

  async function handleAddMemory() {
    if (!newMemoryText.trim()) return
    await addMemory({ content: newMemoryText, category: newMemoryCategory, weight: 1, sourceConversationId: currentConvId || undefined })
    setAddMemoryModal(false); setNewMemoryText(''); message.success('已保存到长期记忆')
  }

  async function handleSearch(keyword: string) {
    if (!keyword.trim()) { setSearchResults([]); return }
    const all = await db.aiMessages.toArray()
    setSearchResults(all.filter((m) => m.content.toLowerCase().includes(keyword.toLowerCase())).slice(0, 20))
  }

  async function handleExportConversation() {
    if (!currentConvId) return
    const conv = conversations.find((c) => c.id === currentConvId)
    const md = `# ${conv?.title || '对话'}\n\n` + messages.map((m) => `**${m.role === 'user' ? '用户' : 'AI助手'}** (${formatDateTime(m.createdAt)}):\n${m.content}\n\n---\n`).join('\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${conv?.title || '对话'}.md`; a.click(); URL.revokeObjectURL(url)
  }

  async function loadMemories() { setMemories(await db.aiMemories.toArray()) }
  async function handleDeleteMemory(id: number) { await db.aiMemories.delete(id); loadMemories() }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 104px)', gap: 16 }}>
      {/* Left: Conversation list */}
      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} block onClick={() => handleNewConversation()}>新对话</Button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)', padding: 8, display: 'flex', flexDirection: 'column' }}>
          <Input prefix={<SearchOutlined />} placeholder="搜索对话..." size="small" style={{ marginBottom: 8 }} onPressEnter={(e) => { const val = (e.target as HTMLInputElement).value; handleSearch(val); setSearchOpen(!!val.trim()) }} onChange={(e) => { if (!e.target.value) { setSearchOpen(false); setSearchResults([]) } }} />
          {searchOpen && searchResults.length > 0 && (
            <div style={{ maxHeight: 200, overflow: 'auto', marginBottom: 8, background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)', padding: 8 }}>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>搜索结果 ({searchResults.length})</Typography.Text>
              {searchResults.map((r) => (
                <div key={r.id} onClick={() => { setCurrentConvId(r.conversationId); setSearchOpen(false) }} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4, fontSize: 12, marginBottom: 2 }}>
                  <Typography.Text type="secondary">{r.role === 'user' ? '用户' : 'AI'}: </Typography.Text>
                  <Typography.Text style={{ fontSize: 12 }}>{r.content.slice(0, 50)}...</Typography.Text>
                </div>
              ))}
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <StaggerContainer staggerDelay={0.03}>
              {conversations.map((c) => (
                <StaggerItem key={c.id}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    onClick={() => setCurrentConvId(c.id!)} style={{
                    padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 2,
                    background: currentConvId === c.id ? 'var(--color-accent-light)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: currentConvId === c.id ? 'var(--color-accent)' : 'var(--text-secondary)' }}>
                      {c.isPinned && <PushpinFilled style={{ color: 'var(--color-accent)', marginRight: 4 }} />}
                      {c.title}
                    </div>
                    <Space size={2} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={c.isPinned ? '取消置顶' : '置顶'}><Button type="text" size="small" icon={c.isPinned ? <PushpinFilled /> : <PushpinOutlined />} onClick={() => handleTogglePin(c)} /></Tooltip>
                      <Popconfirm title="删除此对话？" onConfirm={() => handleDeleteConversation(c.id!)}><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                    </Space>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
            {conversations.length === 0 && <Empty description="暂无对话" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </div>
        </div>
      </div>

      {/* Right: Chat area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden',
        borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)',
      }}>
        {currentConvId ? (
          <>
            {/* Chat header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <Space>
                <MessageOutlined style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontWeight: 500 }}>{conversations.find((c) => c.id === currentConvId)?.title || '对话'}</span>
                {conversations.find((c) => c.id === currentConvId)?.subjectTag && <Tag>{SUBJECT_NAMES[conversations.find((c) => c.id === currentConvId)?.subjectTag || ''] || conversations.find((c) => c.id === currentConvId)?.subjectTag}</Tag>}
              </Space>
              <Space>
                <Tooltip title="导出对话"><Button size="small" icon={<ExportOutlined />} onClick={handleExportConversation} /></Tooltip>
                <Tooltip title="记忆管理"><Button size="small" icon={<BulbOutlined />} onClick={() => { setMemoryDrawerOpen(true); loadMemories() }} /></Tooltip>
              </Space>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 20, minWidth: 0, minHeight: 0 }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ marginBottom: 16, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', minWidth: 0 }}
                >
                  <div style={{
                    maxWidth: '80%', minWidth: 0, padding: '12px 16px', borderRadius: 12,
                    background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--bg-sunken)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    overflow: 'hidden', overflowWrap: 'break-word', wordBreak: 'break-word',
                  }}>
                    {msg.role === 'assistant' ? <MarkdownRenderer content={msg.content} /> : <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{msg.content}</div>}
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', opacity: 0.7, fontSize: 12 }}>
                      <span>{formatDateTime(msg.createdAt)}</span>
                      <Button type="text" size="small" style={{ padding: 0, color: 'inherit' }} icon={msg.isBookmarked ? <StarFilled style={{ color: 'var(--color-accent)' }} /> : <StarOutlined />} onClick={() => handleToggleBookmark(msg)} />
                      {msg.role === 'assistant' && <Button type="text" size="small" style={{ padding: 0, color: 'inherit', fontSize: 12 }} onClick={() => handleSaveAsMemory(msg.content)}>记住</Button>}
                    </div>
                  </div>
                </motion.div>
              ))}
              {streaming && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start', minWidth: 0 }}
                >
                  <div style={{ maxWidth: '80%', minWidth: 0, padding: '12px 16px', borderRadius: 12, background: 'var(--bg-sunken)', overflow: 'hidden', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {streamingContent ? <MarkdownRenderer content={streamingContent} /> : <span style={{ color: 'var(--text-tertiary)' }}>思考中<TypingCursor /></span>}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 16, borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input.TextArea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="输入问题... (Enter发送, Shift+Enter换行)" autoSize={{ minRows: 1, maxRows: 4 }} onPressEnter={(e) => { if (e.nativeEvent.isComposing) return; if (!e.shiftKey) { e.preventDefault(); handleSend() } }} disabled={streaming} />
                {streaming ? (
                  <Button danger onClick={handleStopStreaming}>停止</Button>
                ) : (
                  <Button type="primary" onClick={() => handleSend()} disabled={!inputText.trim()}>发送</Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="选择或创建一个对话开始" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>

      {/* Memory Drawer */}
      <Drawer title="AI长期记忆管理" open={memoryDrawerOpen} onClose={() => setMemoryDrawerOpen(false)} width={500}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddMemoryModal(true)} style={{ marginBottom: 16 }}>添加记忆</Button>
        {memories.length === 0 ? <Empty description="暂无记忆" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
          <div>
            {memories.map((m) => (
              <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Tag color={MEMORY_CATEGORY_COLORS[m.category]}>{MEMORY_CATEGORY_LABELS[m.category]}</Tag>
                  <Button size="small" danger onClick={() => handleDeleteMemory(m.id!)}>删除</Button>
                </div>
                <Typography.Text style={{ fontSize: 13 }}>{m.content}</Typography.Text>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <Modal title="保存为长期记忆" open={addMemoryModal} onOk={handleAddMemory} onCancel={() => setAddMemoryModal(false)}>
        <Select value={newMemoryCategory} onChange={setNewMemoryCategory} style={{ width: '100%', marginBottom: 12 }} options={Object.entries(MEMORY_CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
        <Input.TextArea value={newMemoryText} onChange={(e) => setNewMemoryText(e.target.value)} rows={3} />
      </Modal>
    </div>
  )
}
