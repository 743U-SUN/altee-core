'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { isSafeUrl } from '@/lib/validations/shared'

const remarkPlugins = [remarkGfm]

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-3">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-2">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-[var(--theme-text-secondary)] mb-3">
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside text-[var(--theme-text-secondary)] mb-3">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside text-[var(--theme-text-secondary)] mb-3">
      {children}
    </ol>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
    const safeHref = href && isSafeUrl(href) ? href : undefined
    return (
      <a
        href={safeHref}
        className="text-[var(--theme-text-accent)] hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  },
  img: () => null,
}

interface MarkdownContentProps {
  content: string
}

/**
 * マークダウンレンダラー（遅延読み込み用ラッパー）
 * ReactMarkdown + remarkGfm を同一チャンクにバンドルする
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  )
}
