import type { AIProviderConfig, AIMemory } from '../types'
import { formatMemoriesForPrompt } from './memory-service'

export async function testConnection(config: AIProviderConfig): Promise<{
  success: boolean
  latency: number
  message: string
}> {
  const start = Date.now()
  try {
    const messages = [{ role: 'user', content: '请回复"连接成功"四个字' }]
    let response: Response

    if (config.providerType === 'anthropic') {
      response = await fetch(`${config.apiEndpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 100,
          messages,
        }),
        signal: AbortSignal.timeout(15000),
      })
    } else {
      response = await fetch(`${config.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 100,
          messages,
        }),
        signal: AbortSignal.timeout(15000),
      })
    }

    const latency = Date.now() - start
    if (!response.ok) {
      const err = await response.text()
      return { success: false, latency, message: `HTTP ${response.status}: ${err.slice(0, 200)}` }
    }

    const data = await response.json()
    let text = ''
    if (config.providerType === 'anthropic') {
      text = data.content?.[0]?.text || ''
    } else {
      text = data.choices?.[0]?.message?.content || ''
    }
    return { success: true, latency, message: text.slice(0, 100) }
  } catch (err: unknown) {
    const latency = Date.now() - start
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, latency, message: msg }
  }
}

export async function sendMessage(
  config: AIProviderConfig,
  messages: { role: string; content: string }[],
  memories: AIMemory[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  const memoryText = formatMemoriesForPrompt(memories)
  const systemContent = config.systemPrompt + (memoryText ? '\n\n' + memoryText : '')
  const fullMessages = [{ role: 'system', content: systemContent }, ...messages]

  try {
    let response: Response

    if (config.providerType === 'anthropic') {
      response = await fetch(`${config.apiEndpoint}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          system: systemContent,
          messages: messages.map((m) => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content })),
          stream: true,
        }),
        signal,
      })
    } else {
      response = await fetch(`${config.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: fullMessages,
          stream: true,
        }),
        signal,
      })
    }

    if (!response.ok) {
      const errText = await response.text()
      // 脱敏：移除可能包含的 API Key
      const sanitized = errText
        .replace(/sk-[a-zA-Z0-9]{20,}/g, 'sk-****')
        .replace(/key-[a-zA-Z0-9]{20,}/g, 'key-****')
        .replace(/Bearer\s+[^\s"]+/gi, 'Bearer ****')
        .slice(0, 300)
      throw new Error(`HTTP ${response.status}: ${sanitized}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      let streamEnded = false
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue

        try {
          const json = JSON.parse(data)
          let content = ''

          if (config.providerType === 'anthropic') {
            if (json.type === 'content_block_delta') {
              content = json.delta?.text || ''
            } else if (json.type === 'message_stop') {
              // 流结束，退出循环
              streamEnded = true
              break
            } else if (json.type === 'message_delta') {
              // 可选：读取 usage 信息
            }
          } else {
            content = json.choices?.[0]?.delta?.content || ''
          }

          if (content) {
            onChunk(content)
          }
        } catch {
          // skip malformed JSON lines
        }
      }
      if (streamEnded) break
    }

    onDone()
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      // 停止时仍调用 onDone 以保存已接收的部分内容
      onDone()
      return
    }
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
