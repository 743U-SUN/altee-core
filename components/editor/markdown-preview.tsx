'use client'

import { Suspense, lazy } from 'react'
import remarkGfm from 'remark-gfm'
import { PrismLight as SyntaxHighlighterBase } from 'react-syntax-highlighter'
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx'
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript'
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript'
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown'
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python'

SyntaxHighlighterBase.registerLanguage('tsx', tsx)
SyntaxHighlighterBase.registerLanguage('typescript', typescript)
SyntaxHighlighterBase.registerLanguage('javascript', javascript)
SyntaxHighlighterBase.registerLanguage('css', css)
SyntaxHighlighterBase.registerLanguage('json', json)
SyntaxHighlighterBase.registerLanguage('bash', bash)
SyntaxHighlighterBase.registerLanguage('markdown', markdown)
SyntaxHighlighterBase.registerLanguage('python', python)

// 重いコンポーネントを動的import
const ReactMarkdown = lazy(() => import('react-markdown'))

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
    <Suspense fallback={<div className="animate-pulse h-20 bg-muted rounded" />}>
    <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className } = props
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            return match ? (
              <div className="rounded-md overflow-hidden bg-gray-900">
                <SyntaxHighlighterBase
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    backgroundColor: 'transparent',
                    fontSize: '0.875rem',
                    lineHeight: 1.7
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighterBase>
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
          'meta', 'style', 'link', 'base', 'frame', 'frameset'
        ]}
        unwrapDisallowed={true}
      >
        {content}
      </ReactMarkdown>
    </div>
    </Suspense>
  )
}