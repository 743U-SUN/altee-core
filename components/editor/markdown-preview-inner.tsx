'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'

// 言語パックをこのコンポーネント内で登録（モジュールレベルの副作用を遅延させる）
SyntaxHighlighter.registerLanguage('tsx', tsx)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('python', python)

interface MarkdownPreviewInnerProps {
  content: string
}

export function MarkdownPreviewInner({ content }: MarkdownPreviewInnerProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className } = props
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''

          return match ? (
            <div className="rounded-md overflow-hidden bg-gray-900">
              <SyntaxHighlighter
                language={language}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  backgroundColor: 'transparent',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm`}>
              {children}
            </code>
          )
        },
      }}
      disallowedElements={[
        'script', 'iframe', 'object', 'embed', 'form', 'input',
        'meta', 'style', 'link', 'base', 'frame', 'frameset',
      ]}
      unwrapDisallowed={true}
    >
      {content}
    </ReactMarkdown>
  )
}
