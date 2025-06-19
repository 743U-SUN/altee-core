'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
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
                <SyntaxHighlighter
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
          'meta', 'style', 'link', 'base', 'frame', 'frameset'
        ]}
        unwrapDisallowed={true}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}