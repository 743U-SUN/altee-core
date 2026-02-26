'use client'

import type { BaseSectionProps, HeaderData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'

/**
 * ヘッダーセクション
 * コンテンツの区切りや見出しとして使用
 * h2: ThemedCard + CornerDecor
 * h3/h4: 軽量スタイル維持
 */
export function HeaderSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as HeaderData

  const HeadingTag = data.level || 'h2'

  const headingClasses = {
    h2: 'text-3xl font-bold text-[var(--theme-text-primary)]',
    h3: 'text-2xl font-semibold text-[var(--theme-text-primary)]',
    h4: 'text-xl font-medium text-[var(--theme-text-primary)]',
  }

  // h2の場合はThemedCardでラップ
  if (data.level === 'h2') {
    return (
      <ThemedCard showCornerDecor className="w-full mb-6">
        <HeadingTag className={headingClasses.h2}>
          {data.text || '見出し'}
        </HeadingTag>
      </ThemedCard>
    )
  }

  // h3/h4は軽量スタイル維持
  return (
    <div className="w-full mb-6">
      <HeadingTag className={headingClasses[data.level || 'h2']}>
        {data.text || '見出し'}
      </HeadingTag>
    </div>
  )
}
