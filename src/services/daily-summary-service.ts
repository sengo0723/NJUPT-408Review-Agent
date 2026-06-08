import { useAIStore } from '../stores/useAIStore'
import { db } from '../db'
import { evaluateTask } from './task-evaluation-service'
import { getToday } from '../utils/date'

const SUMMARY_PROMPT = `你是一位408考研学习教练。请根据学生当天的学习数据，生成一份简短的学习日报总结。

要求：
1. 用第二人称"你"来写，语气温暖鼓励
2. 概述当天学习的科目和内容
3. 指出亮点和不足
4. 给出明天的学习建议
5. 150-250字

严格按以下JSON格式返回，不要添加任何其他内容：
{
  "summary": "今天你在数据结构方面..."
}`

export async function generateDailySummary(date: string): Promise<string | null> {
  const provider = useAIStore.getState().getActiveProvider()
  if (!provider?.apiKey) return null

  try {
    const tasks = await db.dailyTasks.where('date').equals(date).toArray()

    // 自动评估未评估的已完成任务
    for (const task of tasks) {
      if (task.isCompleted && task.id && !task.aiReflection) {
        const result = await evaluateTask(task)
        await db.dailyTasks.update(task.id, {
          aiReflection: result.reflection,
          aiGrowthPoints: result.growthPoints,
          aiReflectionAt: new Date(),
          aiCategory: result.category,
          subject: result.subject,
          chapter: result.chapter,
        })
        task.aiReflection = result.reflection
        task.aiGrowthPoints = result.growthPoints
        task.aiCategory = result.category
        task.subject = result.subject
        task.chapter = result.chapter
      }
    }

    // 收集当天数据
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')

    const [focusRecords, answerRecords] = await Promise.all([
      db.focusRecords.where('createdAt').between(dayStart, dayEnd, true, true).toArray(),
      db.answerRecords.where('createdAt').between(dayStart, dayEnd, true, true).toArray(),
    ])

    const totalFocusMin = Math.round(focusRecords.reduce((s, r) => s + r.duration, 0) / 60)
    const practiceCount = answerRecords.length
    const correctCount = answerRecords.filter(r => r.isCorrect).length

    // 构建学习数据摘要
    const completedTasks = tasks.filter(t => t.isCompleted)
    const taskLines = completedTasks.map(t => {
      let line = `- ${t.content}`
      if (t.subject && t.subject !== 'general') line += ` [${t.subject}]`
      if (t.aiCategory) line += ` [${t.aiCategory}]`
      if (t.aiGrowthPoints) line += ` +${t.aiGrowthPoints}分`
      return line
    }).join('\n')

    const userMessage = `日期：${date}

已完成任务（${completedTasks.length}个）：
${taskLines || '无'}

专注时长：${totalFocusMin}分钟
刷题：${practiceCount}题（正确${correctCount}题）
${practiceCount > 0 ? `正确率：${Math.round(correctCount / practiceCount * 100)}%` : ''}

请生成学习日报。`

    const messages = [{ role: 'user', content: userMessage }]

    let response: Response
    if (provider.providerType === 'anthropic') {
      response = await fetch(`${provider.apiEndpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': provider.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 500,
          temperature: 0.5,
          system: SUMMARY_PROMPT,
          messages,
        }),
        signal: AbortSignal.timeout(20000),
      })
    } else {
      response = await fetch(`${provider.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: 500,
          temperature: 0.5,
          messages: [
            { role: 'system', content: SUMMARY_PROMPT },
            ...messages,
          ],
        }),
        signal: AbortSignal.timeout(20000),
      })
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    let text = ''
    if (provider.providerType === 'anthropic') {
      text = data.content?.[0]?.text || '{}'
    } else {
      text = data.choices?.[0]?.message?.content || '{}'
    }

    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const result = JSON.parse(jsonStr)

    const summary = result.summary || '今日学习总结生成失败，请稍后重试。'

    // 存储到数据库
    const existing = await db.dailySummaries.where('date').equals(date).first()
    if (existing?.id) {
      await db.dailySummaries.update(existing.id, { summary, createdAt: new Date() })
    } else {
      await db.dailySummaries.add({ date, summary, createdAt: new Date() })
    }

    return summary
  } catch (err) {
    console.error('生成每日总结失败:', err)
    return null
  }
}

export async function getDailySummary(date: string): Promise<string | null> {
  try {
    const record = await db.dailySummaries.where('date').equals(date).first()
    return record?.summary || null
  } catch {
    return null
  }
}
