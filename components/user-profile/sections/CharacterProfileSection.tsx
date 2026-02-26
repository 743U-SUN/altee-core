'use client'

import type { BaseSectionProps, CharacterProfileData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Twitter, Youtube, Twitch as TwitchIcon, Github, ExternalLink } from 'lucide-react'
import { LUCIDE_ICON_MAP } from '@/lib/lucide-icons'
import { IMAGE_SIZES } from '@/lib/image-sizes'

// SNSプラットフォームごとのアイコンマッピング
const PLATFORM_ICONS = {
  x: Twitter,
  youtube: Youtube,
  twitch: TwitchIcon,
  discord: ExternalLink,
  github: Github,
  other: ExternalLink,
} as const

/**
 * キャラクタープロフィールセクション
 * キャラクター画像（9:16）+ プロフィール情報を表示
 * PC: 左右配置、Mobile: 縦積み
 */
export function CharacterProfileSection({ section }: BaseSectionProps) {
  const data = section.data as CharacterProfileData

  const isLeftPosition = data.characterPosition === 'left'

  return (
    <ThemedCard showCornerDecor className="w-full mb-6 relative overflow-hidden">
      {/* 背景画像（オプション・blur処理） */}
      {data.characterBackgroundKey && (
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src={`/api/files/${data.characterBackgroundKey}`}
            alt=""
            fill
            className="object-cover blur-sm opacity-20"
            sizes={IMAGE_SIZES.characterBg}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <div
        className={cn(
          'relative z-10 flex flex-col gap-6',
          'lg:flex-row lg:gap-8',
          isLeftPosition ? '' : 'lg:flex-row-reverse'
        )}
      >
        {/* キャラクター画像 */}
        {data.characterImageKey && (
          <div className="flex-shrink-0 w-full lg:w-64">
            <div className="aspect-[9/16] relative rounded-lg overflow-hidden">
              <Image
                src={`/api/files/${data.characterImageKey}`}
                alt={data.name}
                fill
                className="object-cover"
                sizes={IMAGE_SIZES.character}
                priority
              />
            </div>
          </div>
        )}

        {/* プロフィール情報 */}
        <div className="flex-1 space-y-4">
          {/* バッジ */}
          {(data.badgeLeft || data.badgeRight) && (
            <div className="flex flex-wrap gap-2">
              {data.badgeLeft && <Badge variant="accent">{data.badgeLeft}</Badge>}
              {data.badgeRight && <Badge variant="accent">{data.badgeRight}</Badge>}
            </div>
          )}

          {/* キャラクター名 */}
          <h1
            className="
              text-3xl md:text-4xl lg:text-5xl font-extrabold
              text-[var(--theme-text-primary)]
              tracking-tight
            "
          >
            {data.name}
          </h1>

          {/* キャッチコピー */}
          {data.tagline && (
            <p
              className="
                text-base md:text-lg
                text-[var(--theme-text-accent)]
                font-medium tracking-wide
              "
            >
              {data.tagline}
            </p>
          )}

          {/* 自己紹介文 */}
          {data.bio && (
            <p
              className="
                text-sm md:text-base
                text-[var(--theme-text-secondary)]
                whitespace-pre-wrap
              "
            >
              {data.bio}
            </p>
          )}

          {/* SNSリンク */}
          {data.showSocialLinks && data.socialLinks && data.socialLinks.length > 0 && (
            <div className="pt-4 flex flex-wrap gap-3">
              {data.socialLinks.map((link) => {
                const IconComponent =
                  link.platform === 'other' && link.iconName
                    ? LUCIDE_ICON_MAP[link.iconName]
                    : PLATFORM_ICONS[link.platform]

                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex items-center justify-center
                      w-10 h-10 rounded-full
                      bg-theme-bar-bg
                      text-[var(--theme-text-secondary)]
                      hover:text-[var(--theme-text-accent)]
                      hover:bg-theme-accent-bg
                      transition-all duration-200
                    "
                    aria-label={link.platform}
                  >
                    {IconComponent ? <IconComponent className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ThemedCard>
  )
}
