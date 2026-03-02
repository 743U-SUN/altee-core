'use client'

import type { BaseSectionProps, LongTextData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * 長文セクション
 * マークダウン対応の詳細テキスト表示
 */
export function LongTextSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as LongTextData

  return (
    <ThemedCard className="w-full mb-6">
      {section.title && (
        <span className="inline-block px-3 py-1 rounded-full mb-3 text-xs font-bold bg-[var(--theme-accent-bg,rgba(176,125,79,0.1))] text-[var(--theme-text-accent,#b07d4f)]">
          {section.title}
        </span>
      )}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-3">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold text-[var(--theme-text-primary)] mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-[var(--theme-text-primary)] mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-[var(--theme-text-secondary)] mb-3">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-[var(--theme-text-secondary)] mb-3">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside text-[var(--theme-text-secondary)] mb-3">
                {children}
              </ol>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-[var(--theme-text-accent)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
        >
          {data.content || '内容がありません'}
        </ReactMarkdown>
      </div>
    </ThemedCard>
  )
}
