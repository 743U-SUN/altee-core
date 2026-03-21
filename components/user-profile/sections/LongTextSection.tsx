import type { BaseSectionProps, LongTextData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'
import dynamic from 'next/dynamic'

const MarkdownContent = dynamic(
  () => import('./MarkdownContent').then(m => m.MarkdownContent),
  { ssr: true }
)

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
        <MarkdownContent content={data.content || '内容がありません'} />
      </div>
    </ThemedCard>
  )
}
