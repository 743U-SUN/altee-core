'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import type { BaseSectionProps } from '@/types/profile-sections'
import { isImageHeroData } from '@/lib/sections'
import { cn } from '@/lib/utils'
import { IMAGE_SIZES } from '@/lib/image-sizes'

const DEFAULT_HERO_DATA = {
  item: undefined,
  mobileImageKey: undefined,
  characterImageKey: undefined,
  speeches: undefined,
  speechDisplayMode: undefined as 'sequential' | 'random' | undefined,
}

/**
 * ヒーロー画像セクション
 * PC（>992px）: 16:9 画像をビューポート全画面表示（ヘッダー分を除く）
 * モバイル/タブレット（≤992px）: 3:4 画像をビューポート全画面表示（ボトムナビ分を除く）
 * キャラクター画像（9:16）を中央下に配置。タップでセリフ吹き出し表示。
 */
export function ImageHeroSection({ section }: BaseSectionProps) {
  const data = isImageHeroData(section.data)
    ? section.data
    : DEFAULT_HERO_DATA
  const item = data.item

  // セリフ表示状態
  const [speechIndex, setSpeechIndex] = useState(-1)
  const [showSpeech, setShowSpeech] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const speeches = data.speeches ?? []
  const sortedSpeeches = speeches.toSorted((a, b) => a.sortOrder - b.sortOrder)

  const currentSpeechText =
    speechIndex >= 0 && speechIndex < sortedSpeeches.length
      ? sortedSpeeches[speechIndex].text
      : null

  const handleCharacterTap = useCallback(() => {
    if (sortedSpeeches.length === 0) return

    // タイマーリセット
    if (timerRef.current) clearTimeout(timerRef.current)

    // 次のセリフを決定
    let nextIndex: number
    if (data.speechDisplayMode === 'random') {
      if (sortedSpeeches.length === 1) {
        nextIndex = 0
      } else {
        do {
          nextIndex = Math.floor(Math.random() * sortedSpeeches.length)
        } while (nextIndex === speechIndex)
      }
    } else {
      // 順番
      nextIndex = speechIndex < 0 ? 0 : (speechIndex + 1) % sortedSpeeches.length
    }

    setSpeechIndex(nextIndex)
    setShowSpeech(true)

    // 3秒後に自動消去
    timerRef.current = setTimeout(() => {
      setShowSpeech(false)
    }, 3000)
  }, [sortedSpeeches, speechIndex, data.speechDisplayMode])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const hasBackgroundImage = !!item?.imageKey
  const pcImageUrl = hasBackgroundImage ? getPublicUrl(item.imageKey!) : null
  const mobileImageUrl = data.mobileImageKey
    ? getPublicUrl(data.mobileImageKey)
    : pcImageUrl

  // 背景もキャラクターも未設定の場合
  if (!hasBackgroundImage && !data.characterImageKey) {
    return (
      <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden bg-muted/50">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">画像が設定されていません</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full overflow-hidden', 'h-[calc(100dvh-4rem)]', !hasBackgroundImage && 'bg-muted/50')}>
      {/* PC 画像（>992px で表示） */}
      {pcImageUrl && (
        <div className="absolute inset-0 hidden min-[993px]:block">
          <Image
            src={pcImageUrl}
            alt="ヒーロー画像"
            fill
            sizes={IMAGE_SIZES.heroFull}
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* モバイル/タブレット画像（≤992px で表示） */}
      {mobileImageUrl && (
        <div className="absolute inset-0 block min-[993px]:hidden">
          <Image
            src={mobileImageUrl}
            alt="ヒーロー画像"
            fill
            sizes={IMAGE_SIZES.heroMobile}
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* キャラクター画像（中央下配置） */}
      {data.characterImageKey && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[90%] aspect-[9/16] z-10 cursor-pointer select-none"
          onClick={handleCharacterTap}
        >
          <Image
            src={getPublicUrl(data.characterImageKey)}
            alt="キャラクター"
            fill
            className="object-contain object-bottom"
            sizes={IMAGE_SIZES.heroCharacter}
          />
        </div>
      )}

      {/* セリフコンテナ（画面中央下） */}
      {showSpeech && currentSpeechText && (
        <div
          key={speechIndex}
          className="absolute bottom-[40%] left-1/2 -translate-x-1/2 z-20 w-[85%] max-w-md pointer-events-none animate-speech-bubble"
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-xl px-5 py-3">
            <p className="text-center text-white text-sm font-medium whitespace-pre-wrap">
              {currentSpeechText}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
