'use client'

import { getYouTubeMetadata } from '@/app/actions/social/youtube-actions'
import type { YouTubeRecommendedData } from '@/types/profile-sections'
import Image from 'next/image'
import { VideoRecommendedEditModal } from './VideoRecommendedEditModal'
import type { VideoItem } from '@/hooks/use-video-list-editor'

interface YouTubeRecommendedEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: YouTubeRecommendedData
}

export function YouTubeRecommendedEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: YouTubeRecommendedEditModalProps) {
  return (
    <VideoRecommendedEditModal
      isOpen={isOpen}
      onClose={onClose}
      sectionId={sectionId}
      initialItems={currentData.items}
      title="YouTubeおすすめ動画を編集"
      placeholder="https://www.youtube.com/watch?v=..."
      emptyText="YouTube URLを入力して動画を追加してください"
      maxVideos={6}
      fetchMetadata={getYouTubeMetadata}
      renderThumbnail={(item: VideoItem) => (
        <Image
          src={item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/default.jpg`}
          alt={item.title || 'Video'}
          fill
          sizes="96px"
          className="object-cover"
        />
      )}
    />
  )
}
