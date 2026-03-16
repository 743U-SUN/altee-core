'use client'

import { getNiconicoMetadata } from '@/app/actions/social/niconico-actions'
import type { NiconicoRecommendedData } from '@/types/profile-sections'
import Image from 'next/image'
import { VideoRecommendedEditModal } from './VideoRecommendedEditModal'
import type { VideoItem } from '@/hooks/use-video-list-editor'

interface NiconicoRecommendedEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: NiconicoRecommendedData
}

export function NiconicoRecommendedEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: NiconicoRecommendedEditModalProps) {
  return (
    <VideoRecommendedEditModal
      isOpen={isOpen}
      onClose={onClose}
      sectionId={sectionId}
      initialItems={currentData.items}
      title="ニコニコおすすめ動画を編集"
      placeholder="https://www.nicovideo.jp/watch/sm... または sm..."
      emptyText="ニコニコ動画のURLを入力して動画を追加してください"
      maxVideos={6}
      fetchMetadata={getNiconicoMetadata}
      renderThumbnail={(item: VideoItem) =>
        item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title || 'Video'}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null
      }
      renderItemExtra={(item: VideoItem) => (
        <p className="text-xs text-muted-foreground">{item.videoId}</p>
      )}
    />
  )
}
