'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { BaseSectionProps, ImageSectionData } from '@/types/profile-sections'
import { ImageSectionModal } from './ImageSectionModal'
import { ImageIcon } from 'lucide-react'
import { IMAGE_SIZES } from '@/lib/image-sizes'

/**
 * 画像セクション
 * バナー装飾用の単一画像表示、背景設定可能
 */
export function ImageSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as ImageSectionData
  const [isModalOpen, setIsModalOpen] = useState(false)

  // アスペクト比のクラス
  const aspectRatioClass = useMemo(() => {
    switch (data.aspectRatio) {
      case '16:9':
        return 'aspect-video'
      case '3:1':
        return 'aspect-[3/1]'
      case '4:3':
        return 'aspect-[4/3]'
      case '1:1':
        return 'aspect-square'
      default:
        return 'aspect-video'
    }
  }, [data.aspectRatio])

  // 角丸のクラス
  const borderRadiusClass = useMemo(() => {
    switch (data.borderRadius) {
      case 'none':
        return 'rounded-none'
      case 'sm':
        return 'rounded-sm'
      case 'md':
        return 'rounded-md'
      case 'lg':
        return 'rounded-lg'
      default:
        return 'rounded-md'
    }
  }, [data.borderRadius])

  // 背景スタイル
  const backgroundStyle = useMemo(() => {
    const bg = data.background

    if (!bg || bg.type === 'transparent') {
      return {}
    }

    if (bg.type === 'color' && bg.color) {
      return { backgroundColor: bg.color }
    }

    if (bg.type === 'image' && bg.imageKey) {
      return {
        backgroundImage: `url(/api/files/${bg.imageKey})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }

    return {}
  }, [data.background])

  const handleClick = () => {
    if (isEditable) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div
        className={`
          w-full ${aspectRatioClass} ${borderRadiusClass}
          overflow-hidden relative
          ${isEditable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}
        `}
        style={backgroundStyle}
        onClick={handleClick}
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isEditable && (e.key === 'Enter' || e.key === ' ')) {
            handleClick()
          }
        }}
      >
        {data.imageKey ? (
          <Image
            src={`/api/files/${data.imageKey}`}
            alt={data.altText || '画像'}
            fill
            sizes={IMAGE_SIZES.medium}
            className={`
              ${data.objectFit === 'contain' ? 'object-contain' : 'object-cover'}
            `}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
            {isEditable && (
              <p className="text-sm text-muted-foreground">
                クリックして画像を設定
              </p>
            )}
          </div>
        )}

        {/* 編集オーバーレイ */}
        {isEditable && data.imageKey && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <p className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-lg">
              クリックして編集
            </p>
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {isEditable && (
        <ImageSectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sectionId={section.id}
          currentData={data}
        />
      )}
    </>
  )
}
