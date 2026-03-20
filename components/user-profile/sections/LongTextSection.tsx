import type { BaseSectionProps, LongTextData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'
import dynamic from 'next/dynamic'
import remarkGfm from 'remark-gfm'

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: true })

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
    const safeHref = href && /^https?:\/\//.test(href) ? href : undefined
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

/**
 * 長文セクション
 * マークダウン対応の詳細テキスト表示
 */
export function LongTextSection({ section, isEditable: _isEditable }: BaseSectionProps) {
  const data = section.data as LongTextData

  return (
    <ThemedCard className="w-full mb-6">
      {section.title && (
        <Badge variant="accent" className="mb-3">
          {section.title}
        </Badge>
      )}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          components={markdownComponents}
        >
          {data.content || '内容がありません'}
        </ReactMarkdown>
      </div>
    </ThemedCard>
  )
}
