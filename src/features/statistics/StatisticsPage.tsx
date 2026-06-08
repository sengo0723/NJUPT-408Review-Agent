import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Statistic, Typography, Tag, Empty, Table, List, Space, Tooltip } from 'antd'
import { BulbOutlined } from '@ant-design/icons'
import { db } from '../../db'
import { SUBJECT_NAMES, SUBJECT_COLORS, CHAPTER_NAMES, SUBJECT_CHAPTERS } from '../../utils/helpers'
import { getToday } from '../../utils/date'
import ReactEChartsCore from 'echarts-for-react'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function calcRadarScore(data: { onlineRate: number; offlineScore: number; hasOnline: boolean }): number {
  if (data.hasOnline) {
    return Math.round(data.onlineRate * 0.6 + data.offlineScore * 0.4)
  }
  return data.offlineScore
}

function calcChapterScore(data: { online: number; offline: number; count: number }): number {
  const hasOnline = data.count > 0 && data.online > 0
  if (hasOnline) {
    return Math.round(data.online * 0.6 + data.offline * 0.4)
  }
  return data.offline
}

export default function StatisticsPage() {
  const [stats, setStats] = useState({
    totalQuestions: 0, totalCorrect: 0, correctRate: 0,
    consecutiveDays: 0, totalFocusMinutes: 0, aiConversationCount: 0,
    totalGrowthPoints: 0, todayGrowthPoints: 0,
    subjectStats: [] as { subject: string; count: number; correctRate: number }[],
    dailyHistory: [] as { date: string; count: number; correct: number }[],
    weakPoints: [] as { tag: string; subject: string; correctRate: number; count: number }[],
    categoryDistribution: [] as { category: string; points: number; count: number }[],
    timelineData: [] as Record<string, unknown>[],
    chapterScores: {} as Record<string, Record<string, { online: number; offline: number; count: number }>>,
    subjectScores: {} as Record<string, { onlineRate: number; offlineScore: number; hasOnline: boolean; offlineCount: number }>,
    coverageMatrix: {} as Record<string, Record<string, number>>,
  })

  const [radarSubject, setRadarSubject] = useState<string | null>(null)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [records, allQuestions, focusRecords, convCount] = await Promise.all([
      db.answerRecords.toArray(),
      db.questions.toArray(),
      db.focusRecords.toArray(),
      db.aiConversations.count(),
    ])

    const questionMap = new Map(allQuestions.map((q) => [q.id, q]))

    const totalQuestions = records.length
    const totalCorrect = records.filter((r) => r.isCorrect).length
    const correctRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    const dates = [...new Set(records.map((r) => dayjs(r.createdAt).format('YYYY-MM-DD')))].sort()
    let consecutive = 0
    const dateSet = new Set(dates)
    let checkDate = dayjs()
    while (dateSet.has(checkDate.format('YYYY-MM-DD'))) {
      consecutive++
      checkDate = checkDate.subtract(1, 'day')
    }

    const totalFocusMinutes = Math.round(focusRecords.reduce((s, r) => s + r.duration, 0) / 60)

    const subjectMap: Record<string, { count: number; correct: number }> = {}
    for (const r of records) {
      const q = questionMap.get(r.questionId)
      if (!q) continue
      if (!subjectMap[q.subject]) subjectMap[q.subject] = { count: 0, correct: 0 }
      subjectMap[q.subject].count++
      if (r.isCorrect) subjectMap[q.subject].correct++
    }
    const subjectStats = Object.entries(subjectMap).map(([subject, data]) => ({
      subject, count: data.count, correctRate: Math.round((data.correct / data.count) * 100),
    }))

    const dailyMap: Record<string, { count: number; correct: number }> = {}
    for (const r of records) {
      const date = dayjs(r.createdAt).format('YY/MM/DD')
      if (!dailyMap[date]) dailyMap[date] = { count: 0, correct: 0 }
      dailyMap[date].count++
      if (r.isCorrect) dailyMap[date].correct++
    }
    const dailyHistory = Object.entries(dailyMap).map(([date, data]) => ({ date, ...data })).slice(-14)

    const tagMap: Record<string, { subject: string; count: number; correct: number }> = {}
    for (const r of records) {
      const q = questionMap.get(r.questionId)
      if (!q) continue
      for (const tag of q.tags) {
        if (!tagMap[tag]) tagMap[tag] = { subject: q.subject, count: 0, correct: 0 }
        tagMap[tag].count++
        if (r.isCorrect) tagMap[tag].correct++
      }
    }
    const weakPoints = Object.entries(tagMap)
      .map(([tag, data]) => ({ tag, subject: data.subject, correctRate: Math.round((data.correct / data.count) * 100), count: data.count }))
      .filter((p) => p.correctRate < 70 && p.count >= 2)
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 10)

    // 成长分统计
    const today = getToday()
    const todayTasks = await db.dailyTasks.where('date').equals(today).toArray()
    const allTasks = await db.dailyTasks.toArray()

    const todayGrowthPoints = todayTasks.reduce((s, t) => s + (t.aiGrowthPoints || 0), 0)
    const totalGrowthPoints = allTasks.reduce((s, t) => s + (t.aiGrowthPoints || 0), 0)

    // 分类分布（使用 aiCategory 字段）
    const categoryMap: Record<string, { points: number; count: number }> = {}
    for (const t of allTasks) {
      if (t.aiCategory && t.aiCategory !== '评估失败' && t.aiCategory !== '未评估' && t.aiGrowthPoints) {
        if (!categoryMap[t.aiCategory]) categoryMap[t.aiCategory] = { points: 0, count: 0 }
        categoryMap[t.aiCategory].points += t.aiGrowthPoints
        categoryMap[t.aiCategory].count++
      }
    }
    const categoryDistribution = Object.entries(categoryMap).map(([category, data]) => ({ category, ...data }))

    // 科目得分计算（融合线上+线下）
    const subjectScores: Record<string, { onlineRate: number; offlineScore: number; hasOnline: boolean; offlineCount: number }> = {}
    for (const sub of ['data-structure', 'computer-organization', 'os', 'network']) {
      const subjectRecords = records.filter(r => {
        const q = questionMap.get(r.questionId)
        return q?.subject === sub
      })
      const onlineRate = subjectRecords.length > 0
        ? Math.round(subjectRecords.filter(r => r.isCorrect).length / subjectRecords.length * 100)
        : 0
      const subjectTasks = allTasks.filter(t => t.subject === sub && t.aiGrowthPoints !== undefined)
      const offlineScore = Math.min(
        subjectTasks.reduce((s, t) => s + (t.aiGrowthPoints || 0), 0) / (SUBJECT_CHAPTERS[sub]?.length || 5) / 5 * 100,
        100
      )
      subjectScores[sub] = {
        onlineRate,
        offlineScore: Math.round(offlineScore),
        hasOnline: subjectRecords.length > 0,
        offlineCount: subjectTasks.length,
      }
    }

    // 章节得分计算
    const chapterScores: Record<string, Record<string, { online: number; offline: number; count: number }>> = {}
    for (const [sub, chapters] of Object.entries(SUBJECT_CHAPTERS)) {
      chapterScores[sub] = {}
      for (const chId of chapters) {
        const chRecords = records.filter(r => {
          const q = questionMap.get(r.questionId)
          return q?.chapter === chId
        })
        const chTasks = allTasks.filter(t => t.chapter === chId && t.aiGrowthPoints !== undefined)
        const onlineRate = chRecords.length > 0
          ? Math.round(chRecords.filter(r => r.isCorrect).length / chRecords.length * 100)
          : 0
        const offlineScore = Math.min(
          chTasks.reduce((s, t) => s + (t.aiGrowthPoints || 0), 0) / 5 * 20,
          100
        )
        chapterScores[sub][chId] = {
          online: onlineRate,
          offline: Math.round(offlineScore),
          count: chRecords.length + chTasks.length,
        }
      }
    }

    // 覆盖矩阵数据
    const coverageMatrix: Record<string, Record<string, number>> = {}
    for (const [sub, chapters] of Object.entries(SUBJECT_CHAPTERS)) {
      coverageMatrix[sub] = {}
      for (const chId of chapters) {
        const chRecords = records.filter(r => {
          const q = questionMap.get(r.questionId)
          return q?.chapter === chId
        })
        const chTasks = allTasks.filter(t => t.chapter === chId)
        coverageMatrix[sub][chId] = chRecords.length + chTasks.length
      }
    }

    // 学习时间线（按科目堆叠）
    const timelineSubjects = ['data-structure', 'computer-organization', 'os', 'network', 'general'] as const
    const dailyGrowthBySubject: Record<string, Record<string, number>> = {}
    for (const sub of timelineSubjects) {
      dailyGrowthBySubject[sub] = {}
    }
    for (const t of allTasks) {
      if (t.aiGrowthPoints && t.subject) {
        const sub = (timelineSubjects as readonly string[]).includes(t.subject) ? t.subject : 'general'
        if (!dailyGrowthBySubject[sub][t.date]) dailyGrowthBySubject[sub][t.date] = 0
        dailyGrowthBySubject[sub][t.date] += t.aiGrowthPoints
      }
    }
    const allDates = [...new Set(allTasks.filter(t => t.aiGrowthPoints).map(t => t.date))].sort().slice(-14)
    const timelineData = allDates.map(date => {
      const point: Record<string, unknown> = { date }
      for (const sub of timelineSubjects) {
        point[sub] = dailyGrowthBySubject[sub][date] || 0
      }
      return point
    })

    setStats({ totalQuestions, totalCorrect, correctRate, consecutiveDays: consecutive, totalFocusMinutes, aiConversationCount: convCount, totalGrowthPoints, todayGrowthPoints, subjectStats, dailyHistory, weakPoints, categoryDistribution, timelineData, chapterScores, subjectScores, coverageMatrix })
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card size="small"><Statistic title="总刷题量" value={stats.totalQuestions} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="正确率" value={stats.correctRate} suffix="%" valueStyle={{ color: stats.correctRate >= 70 ? '#52c41a' : '#faad14' }} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="连续打卡" value={stats.consecutiveDays} suffix="天" /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="专注时长" value={stats.totalFocusMinutes} suffix="分钟" /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="AI对话" value={stats.aiConversationCount} suffix="次" /></Card></Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="今日成长分"
              value={stats.todayGrowthPoints}
              prefix={<BulbOutlined />}
              valueStyle={{ color: stats.todayGrowthPoints > 0 ? '#faad14' : '#999' }}
            />
            <Text type="secondary">累计 {stats.totalGrowthPoints} 分</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="每日刷题趋势" style={{ marginBottom: 16 }}>
            <ReactEChartsCore option={{
              xAxis: { type: 'category', data: stats.dailyHistory.map((d) => d.date) },
              yAxis: [{ type: 'value', name: '刷题量' }, { type: 'value', name: '正确率%', max: 100 }],
              series: [
                { type: 'bar', data: stats.dailyHistory.map((d) => d.count), name: '刷题量' },
                { type: 'line', yAxisIndex: 1, data: stats.dailyHistory.map((d) => d.count > 0 ? Math.round((d.correct / d.count) * 100) : 0), name: '正确率', smooth: true },
              ],
              tooltip: { trigger: 'axis' },
              legend: {},
            }} style={{ height: 280 }} />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={radarSubject ? `${SUBJECT_NAMES[radarSubject]} — 章节能力雷达` : '能力雷达图'}
            extra={radarSubject ? <Button type="link" size="small" onClick={() => setRadarSubject(null)}>返回总览</Button> : undefined}
            style={{ marginBottom: 16 }}
          >
            {radarSubject ? (
              <ReactEChartsCore option={{
                radar: {
                  indicator: (SUBJECT_CHAPTERS[radarSubject] || []).map(chId => ({
                    name: CHAPTER_NAMES[chId],
                    max: 100,
                  })),
                },
                series: [{
                  type: 'radar',
                  data: [{
                    value: (SUBJECT_CHAPTERS[radarSubject] || []).map(chId =>
                      calcChapterScore(stats.chapterScores[radarSubject]?.[chId] || { online: 0, offline: 0, count: 0 })
                    ),
                    name: SUBJECT_NAMES[radarSubject],
                  }],
                  areaStyle: { opacity: 0.3 },
                }],
              }} style={{ height: 280 }} />
            ) : (
              <ReactEChartsCore option={{
                radar: {
                  indicator: Object.entries(SUBJECT_NAMES).map(([, v]) => ({ name: v, max: 100 })),
                },
                series: [{
                  type: 'radar',
                  data: [{
                    value: Object.entries(SUBJECT_NAMES).map(([key]) =>
                      calcRadarScore(stats.subjectScores[key] || { onlineRate: 0, offlineScore: 0, hasOnline: false })
                    ),
                    name: '综合能力',
                  }],
                  areaStyle: { opacity: 0.3 },
                }],
              }} style={{ height: 280 }} />
            )}
            {!radarSubject && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {Object.entries(SUBJECT_NAMES).map(([key, name]) => (
                  <Button
                    key={key}
                    size="small"
                    type="text"
                    onClick={() => setRadarSubject(key)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="各科目统计" style={{ marginBottom: 16 }}>
            {stats.subjectStats.length === 0 ? <Empty description="暂无数据" /> : (
              <Table dataSource={stats.subjectStats} rowKey="subject" size="small" pagination={false} columns={[
                { title: '科目', key: 'subject', render: (_: unknown, r: Record<string, unknown>) => <Tag color={SUBJECT_COLORS[r.subject as string]}>{SUBJECT_NAMES[r.subject as string]}</Tag> },
                { title: '刷题量', dataIndex: 'count' },
                { title: '正确率', key: 'rate', render: (_: unknown, r: Record<string, unknown>) => <span style={{ color: (r.correctRate as number) >= 70 ? '#52c41a' : '#ff4d4f' }}>{r.correctRate as number}%</span> },
              ]} />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title="薄弱知识点（正确率<70%）" style={{ marginBottom: 16 }}>
            {stats.weakPoints.length === 0 ? <Empty description="暂无薄弱点，继续加油！" /> : (
              <List size="small" dataSource={stats.weakPoints} renderItem={(p) => (
                <List.Item>
                  <Space>
                    <Tag color={SUBJECT_COLORS[p.subject]}>{SUBJECT_NAMES[p.subject]}</Tag>
                    <Text>{p.tag}</Text>
                    <Tag color="red">正确率{p.correctRate}%</Tag>
                    <Text type="secondary">{p.count}题</Text>
                  </Space>
                </List.Item>
              )} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="知识覆盖矩阵" style={{ marginBottom: 16 }}>
            {Object.entries(SUBJECT_CHAPTERS).map(([sub, chapters]) => (
              <div key={sub} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag color={SUBJECT_COLORS[sub]}>{SUBJECT_NAMES[sub]}</Tag>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {chapters.map(chId => {
                    const count = stats.coverageMatrix?.[sub]?.[chId] || 0
                    const bg = count === 0 ? '#f5f5f5' : count <= 2 ? '#e6f4ff' : '#f6ffed'
                    const borderColor = count === 0 ? '#d9d9d9' : count <= 2 ? '#1677ff' : '#52c41a'
                    return (
                      <Tooltip key={chId} title={`${CHAPTER_NAMES[chId]}：${count} 次学习`}>
                        <div style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          background: bg,
                          border: `1px solid ${borderColor}`,
                          fontSize: 12,
                          cursor: 'default',
                        }}>
                          {CHAPTER_NAMES[chId]} {count > 0 && <span style={{ fontWeight: 600 }}>{count}</span>}
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {(stats.timelineData.length > 0 || stats.categoryDistribution.length > 0) && (
        <Row gutter={16}>
          {stats.timelineData.length > 0 && (
            <Col span={stats.categoryDistribution.length > 0 ? 12 : 24}>
              <Card title="学习时间线（按科目）" style={{ marginBottom: 16 }}>
                <ReactEChartsCore option={{
                  legend: {
                    data: [...Object.entries(SUBJECT_NAMES).map(([, v]) => v), '通识'],
                  },
                  xAxis: { type: 'category', data: stats.timelineData.map((d) => d.date as string) },
                  yAxis: { type: 'value', name: '成长分' },
                  series: [
                    ...Object.entries(SUBJECT_NAMES).map(([key, name]) => ({
                      type: 'bar' as const,
                      stack: 'total',
                      name,
                      data: stats.timelineData.map((d) => (d[key] as number) || 0),
                      itemStyle: { color: SUBJECT_COLORS[key] },
                    })),
                    {
                      type: 'bar' as const,
                      stack: 'total',
                      name: '通识',
                      data: stats.timelineData.map((d) => (d['general'] as number) || 0),
                      itemStyle: { color: '#999' },
                    },
                  ],
                  tooltip: { trigger: 'axis' },
                }} style={{ height: 250 }} />
              </Card>
            </Col>
          )}
          {stats.categoryDistribution.length > 0 && (
            <Col span={stats.timelineData.length > 0 ? 12 : 24}>
              <Card title="成长分类分布" style={{ marginBottom: 16 }}>
                <ReactEChartsCore option={{
                  series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: stats.categoryDistribution.map((c) => ({ name: c.category, value: c.points })),
                    label: { formatter: '{b}: {c}分' },
                  }],
                  tooltip: { trigger: 'item' },
                }} style={{ height: 250 }} />
              </Card>
            </Col>
          )}
        </Row>
      )}
    </div>
  )
}
