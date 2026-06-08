import { useAIStore } from '../stores/useAIStore'
import type { Question } from '../types'

export interface ShortAnswerEvaluation {
  score: number
  feedback: string
  isCorrect: boolean
  keyPointsCovered: string[]
  keyPointsMissed: string[]
}

const EVALUATION_PROMPT = `你是一位408考研阅卷专家。请评估学生的简答题答案，与参考答案对比。

评估要求：
1. score: 0-100的得分（核心：答案的逻辑正确性和完整性）
2. isCorrect: 是否基本正确（score>=60为true）
3. feedback: 一句话简短评价（20-40字），点明优点和不足
4. keyPointsCovered: 学生答到的关键点列表（1-3个短语）
5. keyPointsMissed: 学生遗漏的关键点列表（1-3个短语）

评判标准：
- 概念理解是否准确（不要求与参考答案逐字相同）
- 关键步骤/要点是否覆盖
- 逻辑推理是否清晰
- 计算过程是否正确（如有）

严格按以下JSON格式返回，不要添加任何其他内容：
{
  "score": 75,
  "isCorrect": true,
  "feedback": "理解了银行家算法的核心思想，但Need矩阵计算有误",
  "keyPointsCovered": ["安全性检查思路正确", "找到了安全序列"],
  "keyPointsMissed": ["Need矩阵计算错误", "未考虑所有进程"]
}`

export async function evaluateShortAnswer(
  question: Question,
  userAnswer: string,
): Promise<ShortAnswerEvaluation> {
  const provider = useAIStore.getState().getActiveProvider()
  if (!provider?.apiKey) {
    return {
      score: 0,
      feedback: '请先配置AI模型再进行AI评估',
      isCorrect: false,
      keyPointsCovered: [],
      keyPointsMissed: [],
    }
  }

  const userMessage = `题目：${question.content}

参考答案：${question.answer}

学生答案：${userAnswer}

请评估学生的答案并返回JSON。`

  const messages = [{ role: 'user', content: userMessage }]

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
          max_tokens: 400,
          temperature: 0.3,
          system: EVALUATION_PROMPT,
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
          max_tokens: 400,
          temperature: 0.3,
          messages: [
            { role: 'system', content: EVALUATION_PROMPT },
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

    return {
      score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
      feedback: result.feedback || '评估完成',
      isCorrect: result.isCorrect !== undefined ? result.isCorrect : (result.score >= 60),
      keyPointsCovered: Array.isArray(result.keyPointsCovered) ? result.keyPointsCovered.slice(0, 3) : [],
      keyPointsMissed: Array.isArray(result.keyPointsMissed) ? result.keyPointsMissed.slice(0, 3) : [],
    }
  } catch (err) {
    return {
      score: 0,
      feedback: `AI评估失败: ${err instanceof Error ? err.message : '未知错误'}`,
      isCorrect: false,
      keyPointsCovered: [],
      keyPointsMissed: [],
    }
  }
}
