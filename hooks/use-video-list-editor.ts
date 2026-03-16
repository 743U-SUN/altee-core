'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'

export interface VideoItem {
  id: string
  videoId: string
  title: string
  thumbnail: string
  sortOrder: number
}

interface UseVideoListEditorOptions {
  sectionId: string
  initialItems: VideoItem[]
  maxVideos: number
  fetchMetadata: (url: string) => Promise<{
    success: boolean
    data?: { videoId: string; title?: string; thumbnail?: string }
    error?: string
  }>
  onClose: () => void
}

export function useVideoListEditor({
  sectionId,
  initialItems,
  maxVideos,
  fetchMetadata,
  onClose,
}: UseVideoListEditorOptions) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [items, setItems] = useState<VideoItem[]>(
    [...initialItems].sort((a, b) => a.sortOrder - b.sortOrder)
  )
  const [newUrl, setNewUrl] = useState('')

  const handleAddVideo = async () => {
    if (!newUrl.trim()) return
    if (items.length >= maxVideos) {
      toast.error(`おすすめ動画は最大${maxVideos}本まで追加できます`)
      return
    }

    setIsLoadingMetadata(true)
    try {
      const result = await fetchMetadata(newUrl)

      if (result.success && result.data) {
        if (items.some((item) => item.videoId === result.data!.videoId)) {
          toast.error('この動画は既に追加されています')
          setIsLoadingMetadata(false)
          return
        }

        const newItem: VideoItem = {
          id: nanoid(),
          videoId: result.data.videoId,
          title: result.data.title || '',
          thumbnail: result.data.thumbnail || '',
          sortOrder: items.length,
        }

        setItems([...items, newItem])
        setNewUrl('')
      } else {
        toast.error(result.error || '動画情報の取得に失敗しました')
      }
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  const handleDeleteVideo = useCallback((id: string) => {
    setItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, sortOrder: idx }))
    )
  }, [])

  const handleMoveVideo = useCallback((id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id)
      if (index === -1) return prev
      if (direction === 'up' && index === 0) return prev
      if (direction === 'down' && index === prev.length - 1) return prev

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      const newItems = [...prev]
      ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
      return newItems.map((item, idx) => ({ ...item, sortOrder: idx }))
    })
  }, [])

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateSection(sectionId, { data: { items } })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
      }
    })
  }

  return {
    items,
    newUrl,
    setNewUrl,
    isPending,
    isLoadingMetadata,
    handleAddVideo,
    handleDeleteVideo,
    handleMoveVideo,
    handleSave,
  }
}
