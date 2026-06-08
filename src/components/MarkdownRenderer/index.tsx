import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

interface Props {
  content: string
  className?: string
}

const CODE_LINE_PATTERN = /^(?:[ \t]*(?:int|void|char|float|double|long|short|unsigned|static|const|return|if|else|for|while|do|switch|case|break|continue|struct|typedef|enum|class|template|typename|namespace|#include|#define|#ifdef|#endif|using|public|private|protected|new|delete|true|false|nullptr|NULL)[\s{(]|.*[{};]\s*$|.*->.*;?\s*$|.*\w+\s*=\s*.*;\s*$|.*\(\).*;\s*$)/

function wrapCodeBlocks(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []

  function flushCode() {
    if (codeBuffer.length > 0) {
      result.push('```c')
      result.push(...codeBuffer)
      result.push('```')
      codeBuffer = []
    }
    inCodeBlock = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) flushCode()
      result.push(line)
      let j = i + 1
      while (j < lines.length && !lines[j].trim().startsWith('```')) {
        result.push(lines[j])
        j++
      }
      if (j < lines.length) {
        result.push(lines[j])
        i = j
      }
      continue
    }

    const looksLikeCode = trimmed.length > 0 && CODE_LINE_PATTERN.test(trimmed)

    if (looksLikeCode) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBuffer = []
      }
      codeBuffer.push(line)
    } else {
      if (inCodeBlock) {
        if (trimmed === '' && i + 1 < lines.length && CODE_LINE_PATTERN.test(lines[i + 1].trim())) {
          codeBuffer.push(line)
        } else {
          flushCode()
          result.push(line)
        }
      } else {
        result.push(line)
      }
    }
  }

  flushCode()
  return result.join('\n')
}

export default function MarkdownRenderer({ content, className }: Props) {
  const processed = wrapCodeBlocks(content)

  return (
    <div className={`prose max-w-none ${className || ''}`} style={{ minWidth: 0, overflow: 'hidden', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
