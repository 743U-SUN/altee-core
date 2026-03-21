'use client'

import { Suspense, lazy } from 'react'

// 言語パックの登録を含む重いコンポーネントを動的 import
const MarkdownPreviewInner = lazy(() =>
  import('./markdown-preview-inner').then((m) => ({ default: m.MarkdownPreviewInner }))
)

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
    <Suspense fallback={<div className="animate-pulse h-20 bg-muted rounded" />}>
      <div className={`prose prose-slate max-w-none dark:prose-invert ${className}`}>
        <MarkdownPreviewInner content={content} />
      </div>
    </Suspense>
  )
}
