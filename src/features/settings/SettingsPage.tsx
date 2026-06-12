import { Tabs, Form, Input, InputNumber, DatePicker, Select, Switch, Button, Space, Slider, message, Modal, Upload, Statistic, Row, Col, Popconfirm, TimePicker, Rate, Alert, Typography } from 'antd'
import { UploadOutlined, DownloadOutlined, DeleteOutlined, ApiOutlined, PlusOutlined, SaveOutlined, UserOutlined, ImportOutlined } from '@ant-design/icons'
import { useAppStore } from '../../stores/useAppStore'
import { useAIStore } from '../../stores/useAIStore'
import { exportAllData, importAllData, getDBStats, clearAllData } from '../../services/backup-service'
import { testConnection } from '../../services/ai-service'
import { requestNotificationPermission } from '../../services/notification-service'
import { db } from '../../db'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import type { AIProviderConfig, Question } from '../../types'
import { SUBJECT_NAMES } from '../../utils/helpers'
import { motion } from 'framer-motion'
import { StaggerContainer, StaggerItem, CountUp } from '../../components/Animations'

const { Text } = Typography

const TABLE_LABELS: Record<string, string> = {
  questions: '题库', answerRecords: '做题记录', errorBook: '错题本',
  aiConversations: 'AI对话', aiMessages: 'AI消息', aiMemories: 'AI记忆',
  studyPlans: '学习计划', dailyTasks: '每日任务', flashcards: '背诵卡片',
  mockExamRecords: '模考记录', favorites: '收藏', notes: '笔记',
  focusRecords: '专注记录', knowledgeProgress: '知识进度',
}

export default function SettingsPage() {
  const { examDate, setExamDate, targetSchool, setTargetSchool, targetScore, setTargetScore, dailyReminder, setDailyReminder, subjectProficiency, setSubjectProficiency, profile, setProfile } = useAppStore()
  const { providers, activeProviderId, addProvider, updateProvider, removeProvider, setActiveProvider } = useAIStore()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [testing, setTesting] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importText, setImportText] = useState('')
  const [importSubject, setImportSubject] = useState<string>('data-structure')
  const [basicForm] = Form.useForm()
  const [profileForm] = Form.useForm()

  useEffect(() => {
    basicForm.setFieldsValue({ examDate: examDate ? dayjs(examDate) : null, targetSchool, targetScore, reminderEnabled: dailyReminder.enabled, reminderTime: dayjs(dailyReminder.time, 'HH:mm') })
    profileForm.setFieldsValue({ ...profile, dailyStudyHours: profile.dailyStudyHours })
    loadStats()
  }, [])

  async function loadStats() { setStats(await getDBStats()) }

  function handleBasicChange() {
    const values = basicForm.getFieldsValue()
    setExamDate(values.examDate ? values.examDate.format('YYYY-MM-DD') : null)
    setTargetSchool(values.targetSchool || ''); setTargetScore(values.targetScore || 120)
    const reminderEnabled = values.reminderEnabled
    setDailyReminder({ enabled: reminderEnabled, time: values.reminderTime?.format('HH:mm') || '09:00' })
    if (reminderEnabled) { requestNotificationPermission().then((granted) => { if (!granted) message.warning('通知权限未授予，每日提醒功能可能无法正常工作') }) }
  }

  function handleProfileChange() { const values = profileForm.getFieldsValue(); setProfile({ ...profile, ...values }) }

  async function handleImportQuestions() {
    try {
      const questions = JSON.parse(importText)
      if (!Array.isArray(questions)) { message.error('JSON格式错误：应为数组'); return }
      const validQuestions: Question[] = questions.map((q: any) => ({
        subject: q.subject || importSubject, chapter: q.chapter || '', type: q.type || 'choice', difficulty: q.difficulty || 3,
        content: q.content || '', options: q.options || [], answer: q.answer || '', explanation: q.explanation || '',
        source: q.source || '自定义导入', tags: q.tags || ['自定义'],
      }))
      await db.questions.bulkAdd(validQuestions); message.success(`成功导入${validQuestions.length}道题目`)
      setImportModalVisible(false); setImportText(''); loadStats()
    } catch (e: any) { message.error('导入失败：' + (e.message || 'JSON解析错误')) }
  }

  async function handleTestConnection() {
    const provider = editingProvider || providers.find((p) => p.id === activeProviderId)
    if (!provider) { message.warning('请先选择一个AI配置'); return }
    if (!provider.apiKey?.trim()) { message.warning('请填写 API Key'); return }
    if (!provider.apiEndpoint?.trim()) { message.warning('请填写 API 地址'); return }
    if (!provider.model?.trim()) { message.warning('请填写模型名称'); return }
    setTesting(true); const result = await testConnection(provider); setTesting(false)
    if (result.success) { message.success(`连接成功！延迟${result.latency}ms`) } else { message.error(`连接失败: ${result.message}`) }
  }

  async function handleExport() { await exportAllData(); message.success('导出成功'); useAppStore.getState().setLastBackupDate(dayjs().format('YYYY-MM-DD')) }
  async function handleImport(file: File) { const result = await importAllData(file); if (result.success) { message.success(result.message); loadStats() } else { message.error(result.message) }; return false }
  async function handleClearAll() { await clearAllData(); message.success('数据已清除，刷新页面生效'); setTimeout(() => window.location.reload(), 1000) }

  const tabContentStyle = { padding: '20px 0', maxWidth: 720, margin: '0 auto' }

  return (
    <div>
      <div style={{ borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-light)' }}>
        <Tabs style={{ padding: '0 24px' }}
          items={[
            {
              key: 'profile', label: '个人资料',
              children: (
                <div style={tabContentStyle}>
                  <Form form={profileForm} layout="vertical" onValuesChange={handleProfileChange}>
                    <h3 style={{ marginBottom: 16, fontSize: 16, fontFamily: 'var(--font-serif)' }}>基本信息</h3>
                    <Row>
                      <Col xs={24} sm={12} style={{ paddingRight: 8 }}>
                        <Form.Item label="姓名/昵称" name="name"><Input prefix={<UserOutlined />} placeholder="你的名字" /></Form.Item>
                      </Col>
                      <Col xs={24} sm={12} style={{ paddingLeft: 8 }}>
                        <Form.Item label="本科院校" name="undergradSchool"><Input placeholder="如：华中科技大学" /></Form.Item>
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={24} sm={12} style={{ paddingRight: 8 }}>
                        <Form.Item label="本科专业" name="undergradMajor"><Input placeholder="如：计算机科学与技术" /></Form.Item>
                      </Col>
                      <Col xs={24} sm={12} style={{ paddingLeft: 8 }}>
                        <Form.Item label="每日学习时间（小时）" name="dailyStudyHours"><InputNumber min={1} max={16} style={{ width: '100%' }} /></Form.Item>
                      </Col>
                    </Row>
                    <h3 style={{ margin: '24px 0 16px', fontSize: 16, fontFamily: 'var(--font-serif)' }}>科目自评（1-5星）</h3>
                    <Alert message="自评结果会影响AI助手的建议和学习计划推荐" type="info" showIcon style={{ marginBottom: 16 }} />
                    {(['data-structure', 'computer-organization', 'os', 'network'] as const).map((subj) => (
                      <Form.Item key={subj} label={`${SUBJECT_NAMES[subj]}（满分${subj === 'os' ? 35 : subj === 'network' ? 25 : 45}分）`}>
                        <Rate value={subjectProficiency[subj]} onChange={(val) => setSubjectProficiency({ ...subjectProficiency, [subj]: val })} />
                        <span style={{ marginLeft: 8, color: 'var(--text-tertiary)' }}>
                          {subjectProficiency[subj] <= 1 ? '基础薄弱' : subjectProficiency[subj] <= 2 ? '需要加强' : subjectProficiency[subj] <= 3 ? '中等水平' : subjectProficiency[subj] <= 4 ? '较为熟练' : '掌握良好'}
                        </span>
                      </Form.Item>
                    ))}
                    <h3 style={{ margin: '24px 0 16px', fontSize: 16, fontFamily: 'var(--font-serif)' }}>学习备注</h3>
                    <Form.Item label="我的薄弱点" name="weakPoints"><Input.TextArea rows={3} placeholder="如：数据结构的图论部分、计组的流水线计算..." /></Form.Item>
                    <Form.Item label="个人备注" name="notes"><Input.TextArea rows={3} placeholder="其他需要记录的信息..." /></Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'basic', label: '基础设置',
              children: (
                <div style={tabContentStyle}>
                  <Form form={basicForm} layout="vertical" onValuesChange={handleBasicChange}>
                    <Form.Item label="考试日期" name="examDate"><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="目标院校" name="targetSchool"><Input placeholder="如：浙江大学" /></Form.Item>
                    <Form.Item label="目标分数" name="targetScore"><InputNumber min={0} max={150} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item label="每日提醒" name="reminderEnabled" valuePropName="checked"><Switch /></Form.Item>
                    <Form.Item label="提醒时间" name="reminderTime"><TimePicker format="HH:mm" /></Form.Item>
                  </Form>
                </div>
              ),
            },
            {
              key: 'ai', label: 'AI模型配置',
              children: (
                <div style={tabContentStyle}>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {providers.map((p) => (
                      <Button key={p.id} type={p.id === activeProviderId ? 'primary' : 'default'} onClick={() => { setActiveProvider(p.id); setEditingProvider(p) }}>{p.name}</Button>
                    ))}
                    <Button icon={<PlusOutlined />} onClick={() => addProvider({ name: '新配置', providerType: 'openai' as const, apiEndpoint: '', apiKey: '', model: '', temperature: 0.7, maxTokens: 4096, systemPrompt: '' })}>新增</Button>
                  </div>
                  {providers.find((p) => p.id === activeProviderId) && (
                    <Form key={activeProviderId} layout="vertical" initialValues={providers.find((p) => p.id === activeProviderId)}
                      onValuesChange={(_, all) => { updateProvider(activeProviderId, all); setEditingProvider({ ...providers.find((p) => p.id === activeProviderId)!, ...all }) }}>
                      <Form.Item label="预设名称" name="name"><Input /></Form.Item>
                      <Form.Item label="接口类型" name="providerType"><Select options={[{ value: 'openai', label: 'OpenAI兼容' }, { value: 'anthropic', label: 'Anthropic' }, { value: 'custom', label: '自定义' }]} /></Form.Item>
                      <Form.Item label="API地址" name="apiEndpoint"><Input placeholder="如 https://api.deepseek.com/v1" /></Form.Item>
                      <Form.Item label="API Key" name="apiKey"><Input.Password /></Form.Item>
                      <Form.Item label="模型名称" name="model"><Input placeholder="如 deepseek-chat" /></Form.Item>
                      <Form.Item label="Temperature" name="temperature"><Slider min={0} max={1} step={0.1} /></Form.Item>
                      <Form.Item label="Max Tokens" name="maxTokens"><InputNumber min={1} max={32768} style={{ width: '100%' }} /></Form.Item>
                      <Form.Item label="System Prompt" name="systemPrompt"><Input.TextArea rows={4} /></Form.Item>
                      <Space>
                        <Button type="primary" icon={<ApiOutlined />} loading={testing} onClick={handleTestConnection}>测试连接</Button>
                        <Button icon={<SaveOutlined />} onClick={() => { const p = providers.find((p) => p.id === activeProviderId); if (p) { updateProvider(activeProviderId, p); message.success('保存成功') } }}>保存</Button>
                        <Popconfirm title="确定删除此预设？" onConfirm={() => removeProvider(activeProviderId)}><Button danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
                      </Space>
                    </Form>
                  )}
                </div>
              ),
            },
            {
              key: 'data', label: '数据管理',
              children: (
                <div style={tabContentStyle}>
                  <h3 style={{ fontSize: 16, marginBottom: 16, fontFamily: 'var(--font-serif)' }}>数据概览</h3>
                  <StaggerContainer staggerDelay={0.04}>
                    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                      {Object.entries(stats).map(([key, count]) => (
                        <Col key={key} xs={12} sm={8} md={6}>
                          <StaggerItem>
                            <motion.div whileHover={{ y: -2 }} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-sunken)', textAlign: 'center' }}>
                              <div style={{ fontSize: 20, fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-primary)' }}><CountUp target={count} duration={1} /></div>
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{TABLE_LABELS[key] || key}</div>
                            </motion.div>
                          </StaggerItem>
                        </Col>
                      ))}
                    </Row>
                  </StaggerContainer>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-sunken)' }}>
                      <Text strong>导出备份</Text>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 12px', fontSize: 13 }}>将所有数据导出为JSON文件，建议定期备份。</p>
                      <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>导出全部数据</Button>
                    </div>
                    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-sunken)' }}>
                      <Text strong>导入备份</Text>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 12px', fontSize: 13 }}>从JSON备份文件恢复数据（将覆盖现有数据）。</p>
                      <Upload accept=".json" beforeUpload={(file) => { Modal.confirm({ title: '确认导入备份？', content: '此操作将覆盖当前所有数据和设置，不可恢复！', okText: '确认导入', okType: 'danger', cancelText: '取消', onOk: () => handleImport(file) }); return false }} showUploadList={false}>
                        <Button icon={<UploadOutlined />}>选择备份文件</Button>
                      </Upload>
                    </div>
                    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-sunken)' }}>
                      <Text strong>自定义题目导入</Text>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 12px', fontSize: 13 }}>从JSON文件或文本框导入自定义题目到题库。</p>
                      <Upload accept=".json" beforeUpload={async (file) => { const text = await file.text(); setImportText(text); setImportModalVisible(true); return false }} showUploadList={false}>
                        <Button icon={<UploadOutlined />} style={{ marginRight: 8 }}>选择JSON文件</Button>
                      </Upload>
                      <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)} style={{ marginTop: 8 }}>手动输入JSON导入</Button>
                    </div>
                    <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}>
                      <Text strong style={{ color: 'var(--color-error)' }}>清除数据</Text>
                      <p style={{ color: 'var(--color-error)', margin: '4px 0 12px', fontSize: 13 }}>此操作不可恢复，请确保已备份。</p>
                      <Popconfirm title="确定清除所有数据？此操作不可恢复！" onConfirm={handleClearAll} okText="确定清除" cancelText="取消" okButtonProps={{ danger: true }}>
                        <Button danger icon={<DeleteOutlined />}>清除所有数据</Button>
                      </Popconfirm>
                    </div>
                  </Space>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal title="导入自定义题目" open={importModalVisible} onOk={handleImportQuestions} onCancel={() => setImportModalVisible(false)} width={700} okText="导入" cancelText="取消">
        <Alert
          message="JSON格式示例"
          description={<pre style={{ fontSize: 12, margin: 0, whiteSpace: 'pre-wrap' }}>{`[{
  "subject": "data-structure",
  "chapter": "ds-ch1",
  "type": "choice",
  "difficulty": 3,
  "content": "题目内容？",
  "options": ["A选项","B选项","C选项","D选项"],
  "answer": "B",
  "explanation": "解析内容",
  "source": "自定义",
  "tags": ["标签1","标签2"]
}]`}</pre>}
          type="info" showIcon style={{ marginBottom: 16 }}
        />
        <Select value={importSubject} onChange={setImportSubject} style={{ width: 200, marginBottom: 12 }} options={Object.entries(SUBJECT_NAMES).map(([k, v]) => ({ value: k, label: v }))} placeholder="默认科目（可在JSON中覆盖）" />
        <Input.TextArea rows={10} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="粘贴JSON格式的题目数组..." style={{ fontFamily: 'var(--font-mono)' }} />
      </Modal>
    </div>
  )
}
