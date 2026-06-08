import { useAIStore } from '../stores/useAIStore'
import type { DailyTask } from '../types'

interface EvaluationResult {
  reflection: string
  growthPoints: number
  category: string
  subject?: string
  chapter?: string
}

const EVALUATION_PROMPT = `你是一位408考研辅导专家。请评估学生刚完成的自主学习任务，并从任务描述中解析学习维度。

评估维度：
1. 与408考研的相关性和学习深度
2. 任务完成质量（从描述判断）

从任务描述中解析以下结构化信息：
- subject: 归属科目，必须是以下之一：data-structure（数据结构）、computer-organization（计算机组成原理）、os（操作系统）、network（计算机网络）、general（跨科目/通识）
- chapter: 对应章节ID，必须从以下映射中选择（如果无法确定则留空）：
  数据结构: ds-ch1(基本概念) ds-ch2(线性表) ds-ch3(栈队列数组) ds-ch4(树和二叉树) ds-ch5(图) ds-ch6(查找) ds-ch7(排序)
  组成原理: co-ch1(系统概述) co-ch2(数据表示与运算) co-ch3(存储系统) co-ch4(指令系统) co-ch5(中央处理器) co-ch6(总线) co-ch7(输入输出系统)
  操作系统: os-ch1(概述) os-ch2(进程管理) os-ch3(内存管理) os-ch4(文件管理) os-ch5(I/O管理)
  网络: net-ch1(概述) net-ch2(物理层与数据链路层) net-ch3(网络层) net-ch4(传输层) net-ch5(应用层)
- category: 学习类型，必须是以下之一：知识巩固、刷题练习、错题复盘、系统学习、拓展阅读、考试技巧
- growthPoints: 0-5整数（0=无关，1=浅层，2=基础巩固，3=有效练习，4=深入理解，5=重大突破）
- reflection: 一句话评价（15-30字）

严格按以下JSON格式返回，不要添加任何其他内容：
{
  "subject": "data-structure",
  "chapter": "ds-ch2",
  "category": "刷题练习",
  "growthPoints": 3,
  "reflection": "对线性表的插入删除操作有了深入理解"
}`

export async function evaluateTask(task: DailyTask): Promise<EvaluationResult> {
  const provider = useAIStore.getState().getActiveProvider()
  if (!provider?.apiKey) {
    return { reflection: '请先配置AI模型', growthPoints: 0, category: '未评估', subject: undefined, chapter: undefined }
  }

  const messages = [
    { role: 'user', content: `学生刚完成以下学习任务：\n\n"${task.content}"\n\n完成时间：${task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : '未知'}` }
  ]

  try {
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
          max_tokens: 200,
          temperature: 0.3,
          system: EVALUATION_PROMPT,
          messages,
        }),
        signal: AbortSignal.timeout(15000),
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
          max_tokens: 200,
          temperature: 0.3,
          messages: [
            { role: 'system', content: EVALUATION_PROMPT },
            ...messages,
          ],
        }),
        signal: AbortSignal.timeout(15000),
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

    const validSubjects = ['data-structure', 'computer-organization', 'os', 'network', 'general']
    const validChapters = new Set([
      'ds-ch1', 'ds-ch2', 'ds-ch3', 'ds-ch4', 'ds-ch5', 'ds-ch6', 'ds-ch7',
      'co-ch1', 'co-ch2', 'co-ch3', 'co-ch4', 'co-ch5', 'co-ch6', 'co-ch7',
      'os-ch1', 'os-ch2', 'os-ch3', 'os-ch4', 'os-ch5',
      'net-ch1', 'net-ch2', 'net-ch3', 'net-ch4', 'net-ch5',
    ])
    const validCategories = ['知识巩固', '刷题练习', '错题复盘', '系统学习', '拓展阅读', '考试技巧']

    const subject = validSubjects.includes(result.subject) ? result.subject : 'general'
    const chapter = result.chapter && validChapters.has(result.chapter) ? result.chapter : undefined
    const category = validCategories.includes(result.category) ? result.category : '综合学习'

    return {
      reflection: result.reflection || '评估完成',
      growthPoints: Math.max(0, Math.min(5, Math.round(result.growthPoints || 0))),
      category,
      subject,
      chapter,
    }
  } catch (err) {
    return {
      reflection: `AI评估失败: ${err instanceof Error ? err.message : '未知错误'}`,
      growthPoints: 0,
      category: '评估失败',
      subject: undefined,
      chapter: undefined,
    }
  }
}
