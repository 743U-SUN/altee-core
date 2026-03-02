'use client'

import type { BaseSectionProps, ProfileCardData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import Image from 'next/image'

/**
 * プロフィールカードセクション
 * バッジ、名前、タグライン、アバター画像を表示
 */
export function ProfileCardSection({ section }: BaseSectionProps) {
  const data = section.data as ProfileCardData

  // バッジテキストの生成
  const badgeText = [data.badgeLeft, data.badgeRight].filter(Boolean).join(' — ')

  return (
    <ThemedCard className="w-full mb-6 relative overflow-hidden">
      {/* 右上の背景画像（半透明） */}
      {data.avatarImageKey && (
        <div className="absolute -top-4 -right-4 w-32 h-32 md:w-40 md:h-40 opacity-30 pointer-events-none">
          <Image
            src={getPublicUrl(data.avatarImageKey)}
            alt=""
            fill
            className="object-cover rounded-full"
            sizes="160px"
          />
        </div>
      )}

      <div className="relative z-10 space-y-2">
        {/* バッジ */}
        {badgeText && (
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[var(--theme-accent-bg,rgba(176,125,79,0.1))] text-[var(--theme-text-accent,#b07d4f)]">
            {badgeText}
          </span>
        )}

        {/* キャラクター名 */}
        <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--theme-text-primary)] tracking-tight">
          {data.characterName || 'User'}
        </h1>

        {/* タグライン */}
        {data.bio && (
          <p className="text-sm text-[var(--theme-text-secondary)] tracking-widest uppercase">
            {data.bio}
          </p>
        )}
      </div>
    </ThemedCard>
  )
}
