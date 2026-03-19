'use client'

import useSWR from 'swr'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Newspaper } from 'lucide-react'
import type { BaseSectionProps } from '@/types/profile-sections'
import type { UserNews, MediaFile } from '@prisma/client'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { getPublicNewsByHandle } from '@/app/actions/content/user-news-actions'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { IMAGE_SIZES } from '@/lib/image-sizes'

type NewsItem = UserNews & {
  thumbnail: Pick<MediaFile, 'storageKey'> | null
}

/**
 * NEWS セクション
 * プロフィールページにニュース記事カードを表示
 */
export function NewsSection({ section: _section, isEditable }: BaseSectionProps) {
  const params = useParams()
  const handle = (params?.handle as string) || ''

  const { data: news = [], isLoading } = useSWR(
    handle ? `news-${handle}` : null,
    () => getPublicNewsByHandle(handle) as Promise<NewsItem[]>
  )

  if (isLoading) {
    return (
      <ThemedCard size="md" className="w-full mb-6">
        <div className="flex items-center justify-center py-8 text-[var(--theme-text-secondary)]">
          読み込み中...
        </div>
      </ThemedCard>
    )
  }

  if (news.length === 0) {
    if (isEditable) {
      return (
        <ThemedCard size="md" className="w-full mb-6">
          <div className="flex flex-col items-center justify-center py-8 text-[var(--theme-text-secondary)]">
            <Newspaper className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">ニュース記事を作成するとここに表示されます</p>
          </div>
        </ThemedCard>
      )
    }
    return null
  }

  return (
    <ThemedCard size="md" className="w-full mb-6">
      {/* PC: グリッド表示 */}
      <div className={
        news.length === 1
          ? 'hidden min-[993px]:block max-w-sm mx-auto'
          : news.length === 2
            ? 'hidden min-[993px]:grid grid-cols-2 gap-4'
            : 'hidden min-[993px]:grid grid-cols-3 gap-4'
      }>
        {news.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            handle={handle}
            layout="vertical"
          />
        ))}
      </div>

      {/* モバイル: 縦並び */}
      <div className="min-[993px]:hidden space-y-3">
        {news.map((item) => (
          <NewsCard
            key={item.id}
            item={item}
            handle={handle}
            layout="horizontal"
          />
        ))}
      </div>
    </ThemedCard>
  )
}

function NewsCard({
  item,
  handle,
  layout,
}: {
  item: NewsItem
  handle: string
  layout: 'vertical' | 'horizontal'
}) {
  const thumbnailUrl = item.thumbnail?.storageKey
    ? getPublicUrl(item.thumbnail.storageKey)
    : null

  if (layout === 'horizontal') {
    return (
      <Link
        href={`/@${handle}/news/${item.slug}`}
        className="flex gap-3 group"
      >
        <div className="w-20 h-15 rounded overflow-hidden bg-[var(--theme-stat-bg)] flex-shrink-0">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={item.title}
              width={80}
              height={60}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)]">
              <Newspaper className="w-5 h-5 opacity-50" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--theme-text-primary)] line-clamp-2 group-hover:text-[var(--theme-text-accent)] transition-colors">
            {item.title}
          </p>
          <time className="text-xs text-[var(--theme-text-secondary)] mt-1 block">
            {new Date(item.createdAt).toLocaleDateString('ja-JP')}
          </time>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/@${handle}/news/${item.slug}`}
      className="block group"
    >
      <div className="rounded-lg overflow-hidden bg-[var(--theme-stat-bg)]">
        <div className="aspect-video relative">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={item.title}
              fill
              sizes={IMAGE_SIZES.grid3}
              className="object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)]">
              <Newspaper className="w-8 h-8 opacity-50" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-[var(--theme-text-primary)] line-clamp-2 group-hover:text-[var(--theme-text-accent)] transition-colors">
            {item.title}
          </p>
          <time className="text-xs text-[var(--theme-text-secondary)] mt-1 block">
            {new Date(item.createdAt).toLocaleDateString('ja-JP')}
          </time>
        </div>
      </div>
    </Link>
  )
}
