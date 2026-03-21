'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import type { BaseSectionProps, YoutubeSectionData } from '@/types/profile-sections'
import { IMAGE_SIZES } from '@/lib/image-sizes'
import { Youtube } from 'lucide-react'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'

const YouTubeEmbed = dynamic(
  () => import('@next/third-parties/google').then(m => m.YouTubeEmbed),
  { ssr: false }
)

/**
 * YouTubeセクション
 * YouTube動画を埋め込み表示
 */
export function YoutubeSection({ section, isEditable }: BaseSectionProps) {
    const data = section.data as YoutubeSectionData

    return (
        <ThemedCard size="md" className="w-full mb-6">
            {/* タイトル (存在する場合はBadgeで表示) */}
            {data.title && (
                <Badge variant="accent" className="mb-4">
                    {data.title}
                </Badge>
            )}
            {/* 動画埋め込み or プレースホルダー */}
            <div className="w-full aspect-video bg-black/5 rounded-lg overflow-hidden relative">
                {data.videoId ? (
                    isEditable ? (
                        // 編集モード時はiframeの代わりにサムネイル画像を表示 (ドラッグ&ドロップ等の操作性向上のため)
                        <div className="relative w-full h-full">
                            {/* サムネイルがある場合はそれを表示、なければYouTubeのデフォルトサムネイル */}
                            <Image
                                src={data.thumbnail || `https://img.youtube.com/vi/${data.videoId}/maxresdefault.jpg`}
                                alt={data.title || "Youtube Video"}
                                fill
                                sizes={IMAGE_SIZES.medium}
                                className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Youtube className="w-16 h-16 text-white opacity-80" />
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 [&_lite-youtube]:!w-full [&_lite-youtube]:!h-full [&_lite-youtube]:!max-w-none [&_iframe]:!w-full [&_iframe]:!h-full">
                            <YouTubeEmbed
                                videoid={data.videoId}
                                params="rel=0"
                            />
                        </div>
                    )
                ) : (
                    // 未設定時のプレースホルダー
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                        <Youtube className="w-12 h-12 mb-2 opacity-50" />
                        {isEditable && <p className="text-sm">動画を設定</p>}
                    </div>
                )}
            </div>
        </ThemedCard>
    )
}
