import Link from 'next/link'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { SectionBand } from '@/components/profile/SectionBand'
import { resolvePreset } from '@/lib/sections/background-utils'
import type { UserNews, MediaFile } from '@prisma/client'
import type { UserSection, SectionBackgroundPreset } from '@/types/profile-sections'

type NewsItem = UserNews & {
  thumbnail: Pick<MediaFile, 'storageKey'> | null
}

interface NewsListContentProps {
  handle: string
  news: NewsItem[]
  newsSection?: UserSection | null
  presets?: SectionBackgroundPreset[]
}

/** Asia/Tokyo タイムゾーン固定の日付フォーマット */
function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '/')
}

export function NewsListContent({ handle, news, newsSection, presets = [] }: NewsListContentProps) {
  const settings = newsSection?.settings ?? null
  const preset = resolvePreset(settings?.background, presets)

  return (
    <SectionBand settings={settings} preset={preset}>
      {news.length === 0 ? (
        <div className="text-center py-12 text-[var(--theme-text-secondary)]">
          ニュース記事はまだありません。
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {news.map((item) => {
            const thumbnailUrl = item.thumbnail?.storageKey
              ? getPublicUrl(item.thumbnail.storageKey)
              : null

            return (
              <Link
                key={item.id}
                href={`/@${handle}/news/${item.slug}`}
                className="block group"
              >
                <div className="flex gap-4 p-4 rounded-lg bg-[var(--theme-card-bg)] border border-[var(--theme-stat-bg)] hover:shadow-md transition-shadow">
                  {/* サムネイル */}
                  <div className="w-24 h-18 sm:w-32 sm:h-24 rounded overflow-hidden bg-[var(--theme-stat-bg)] flex-shrink-0">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={item.title}
                        width={128}
                        height={96}
                        sizes="(max-width: 640px) 96px, 128px"
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--theme-text-secondary)] text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* コンテンツ */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--theme-text-primary)] group-hover:text-[var(--theme-text-accent)] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <time className="text-xs text-[var(--theme-text-secondary)] mt-1 block">
                      {formatDate(new Date(item.createdAt))}
                    </time>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </SectionBand>
  )
}
