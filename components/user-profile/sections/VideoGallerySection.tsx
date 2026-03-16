'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import type { BaseSectionProps, VideoGallerySectionData } from '@/types/profile-sections'
import { cn } from '@/lib/utils'
import { PlaySquare, Youtube, Loader2 } from 'lucide-react'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { getSectionData, isVideoGallerySectionData } from '@/lib/sections/type-guards'

const DEFAULT_DATA: VideoGallerySectionData = { items: [] }

// YouTubeEmbed を遅延読み込み（編集モードでは不要）
const YouTubeEmbed = dynamic(
  () => import('@next/third-parties/google').then((mod) => mod.YouTubeEmbed),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    ),
  }
)

/**
 * 動画ギャラリーセクション
 * 複数のYouTube動画をギャラリー形式で表示
 * - 1本目（または選択中）をメイン表示
 * - 2本目以降をグリッドでサムネイル表示
 */
export function VideoGallerySection({ section, isEditable }: BaseSectionProps) {
  const data = getSectionData('video-gallery', section.data, isVideoGallerySectionData, DEFAULT_DATA)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // sortOrder順にソート
  const sortedItems = useMemo(
    () => [...data.items].sort((a, b) => a.sortOrder - b.sortOrder),
    [data.items]
  )

  // サムネイルクリックでメイン動画を切り替え
  const handleSelectVideo = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  // 選択中の動画（範囲外なら最初の動画にフォールバック）
  const currentMainVideo = sortedItems[selectedIndex] ?? sortedItems[0] ?? null

  // 動画がない場合のプレースホルダー
  if (sortedItems.length === 0) {
    return (
      <div className="w-full aspect-video bg-muted/50 rounded-md flex flex-col items-center justify-center">
        <PlaySquare className="w-12 h-12 text-muted-foreground/50 mb-2" />
        {isEditable && <p className="text-sm text-muted-foreground">動画を追加</p>}
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip space-y-4">
      <ThemedCard size="md" className="w-full mb-6">
        {/* メイン動画 */}
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
        {isEditable ? (
          // 編集モード: サムネイル表示（ドラッグ操作対応）
          <div className="relative w-full h-full">
            <Image
              src={
                currentMainVideo.thumbnail ||
                `https://img.youtube.com/vi/${currentMainVideo.videoId}/maxresdefault.jpg`
              }
              alt={currentMainVideo.title || 'YouTube Video'}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Youtube className="w-16 h-16 text-white opacity-80" />
            </div>
          </div>
        ) : (
          // 表示モード: YouTube埋め込み
          <div className="absolute inset-0 [&_lite-youtube]:!w-full [&_lite-youtube]:!h-full [&_lite-youtube]:!max-w-none [&_iframe]:!w-full [&_iframe]:!h-full">
            <YouTubeEmbed
              videoid={currentMainVideo.videoId}
              params="rel=0"
            />
          </div>
        )}
      </div>

        {/* メイン動画タイトル */}
        {currentMainVideo.title && (
          <h3 className="text-lg font-bold leading-tight break-words mt-4">
            {currentMainVideo.title}
          </h3>
        )}
      </ThemedCard>

      {/* サムネイル一覧 (2本以上ある場合) */}
      {sortedItems.length > 1 && (
        <div className="w-full overflow-x-auto pb-2">
          <div className="inline-flex gap-2">
            {sortedItems.map((video, index) => (
              <button
                key={video.id}
                type="button"
                onClick={() => handleSelectVideo(index)}
                aria-label={`動画を選択: ${video.title || `動画 ${index + 1}`}`}
                aria-pressed={selectedIndex === index}
                className={cn(
                  'flex-shrink-0 w-[120px] group cursor-pointer rounded-md',
                  selectedIndex === index && 'ring-2 ring-primary'
                )}
              >
                <div className="aspect-video relative bg-muted overflow-hidden rounded-md">
                  <Image
                    src={
                      video.thumbnail ||
                      `https://img.youtube.com/vi/${video.videoId}/sddefault.jpg`
                    }
                    alt={video.title || 'Video thumbnail'}
                    fill
                    sizes="120px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
