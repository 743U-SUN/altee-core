'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateSection } from '@/app/actions/user/section-actions'
import { getYouTubeMetadata } from '@/app/actions/social/youtube-actions'
import { toast } from 'sonner'
import type {
  VideoGallerySectionData,
  VideoGalleryItem,
} from '@/types/profile-sections'
import Image from 'next/image'
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { nanoid } from 'nanoid'

const MAX_VIDEOS = 10

interface VideoGallerySectionModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: VideoGallerySectionData
}

export function VideoGallerySectionModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: VideoGallerySectionModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

  // 動画リスト
  const [items, setItems] = useState<VideoGalleryItem[]>(
    [...currentData.items].sort((a, b) => a.sortOrder - b.sortOrder)
  )

  // 新規追加用URL
  const [newUrl, setNewUrl] = useState('')

  // タイトル編集中のアイテムID
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBackup, setEditingBackup] = useState<VideoGalleryItem | null>(null)

  // 動画追加処理（ローカルstateのみ更新、DB保存なし）
  const handleAddVideo = async () => {
    if (!newUrl.trim()) return
    if (items.length >= MAX_VIDEOS) {
      toast.error(`動画は最大${MAX_VIDEOS}本まで追加できます`)
      return
    }

    setIsLoadingMetadata(true)
    try {
      const result = await getYouTubeMetadata(newUrl)

      if (result.success && result.data) {
        // 重複チェック
        if (items.some((item) => item.videoId === result.data.videoId)) {
          toast.error('この動画は既に追加されています')
          setIsLoadingMetadata(false)
          return
        }

        const newItem: VideoGalleryItem = {
          id: nanoid(),
          videoId: result.data.videoId,
          url: newUrl,
          title: result.data.title || '',
          thumbnail: result.data.thumbnail || '',
          sortOrder: items.length,
        }

        const updatedItems = [...items, newItem]
        setItems(updatedItems)
        setNewUrl('')
        // DB保存はしない（完了ボタンで一括保存）
      } else {
        toast.error(result.error || '動画情報の取得に失敗しました')
      }
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  // 動画削除（ローカルstateのみ更新、DB保存なし）
  const handleDeleteVideo = (id: string) => {
    const updatedItems = items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, sortOrder: idx }))
    setItems(updatedItems)
    // DB保存はしない（完了ボタンで一括保存）
  }

  // 並び替え（ローカルstateのみ更新、DB保存なし）
  const handleMoveVideo = (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newItems = [...items]
    ;[newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ]

    const updatedItems = newItems.map((item, idx) => ({ ...item, sortOrder: idx }))
    setItems(updatedItems)
    // DB保存はしない（完了ボタンで一括保存）
  }

  // タイトル編集開始
  const handleStartEditTitle = (item: VideoGalleryItem) => {
    setEditingBackup({ ...item }) // バックアップ保存
    setEditingId(item.id)
  }

  // Escapeキーで編集キャンセル（編集中のアイテムのみ元に戻す）
  const handleEscapeEdit = () => {
    if (editingId && editingBackup) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...editingBackup } : item
        )
      )
    }
    setEditingId(null)
    setEditingBackup(null)
  }

  // タイトル変更（ローカルstateのみ更新、DB保存なし）
  const handleTitleChange = (itemId: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, title: newTitle } : item))
    )
  }

  // 完了処理（全変更を1回のみDB保存してモーダル閉じる）
  const handleSave = () => {
    startTransition(async () => {
      try {
        const newData: VideoGallerySectionData = { items }
        const result = await updateSection(sectionId, { data: newData })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
          // モーダルは開いたまま（編集継続可能）
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
        // モーダルは開いたまま（編集継続可能）
      }
    })
  }

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title="動画ギャラリーを編集" hideActions>
      <div className="space-y-6">
        {/* 動画追加フォーム */}
        <div className="space-y-2">
          <Label>YouTube URLを追加</Label>
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVideo()
                }
              }}
              disabled={items.length >= MAX_VIDEOS}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddVideo}
              disabled={isLoadingMetadata || !newUrl || items.length >= MAX_VIDEOS}
            >
              {isLoadingMetadata ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {items.length}/{MAX_VIDEOS}本 登録済み
          </p>
        </div>

        {/* 動画一覧 */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 border rounded-md bg-muted/20"
            >
              {/* サムネイル */}
              <div className="w-24 aspect-video relative shrink-0 rounded overflow-hidden">
                <Image
                  src={
                    item.thumbnail ||
                    `https://img.youtube.com/vi/${item.videoId}/default.jpg`
                  }
                  alt={item.title || 'Video'}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[10px] px-1 rounded">
                    メイン
                  </div>
                )}
              </div>

              {/* タイトル */}
              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <Input
                    value={item.title}
                    onChange={(e) => handleTitleChange(item.id, e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        handleEscapeEdit()
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartEditTitle(item)}
                    aria-label={`タイトルを編集: ${item.title || '(タイトルなし)'}`}
                    className="text-sm w-full text-left hover:text-primary line-clamp-2"
                  >
                    {item.title
                      ? item.title.length > 30
                        ? `${item.title.slice(0, 30)}...`
                        : item.title
                      : '（タイトルなし）'}
                  </button>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveVideo(item.id, 'up')}
                  disabled={index === 0}
                  aria-label="上に移動"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveVideo(item.id, 'down')}
                  disabled={index === items.length - 1}
                  aria-label="下に移動"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDeleteVideo(item.id)}
                  aria-label="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              YouTube URLを入力して動画を追加してください
            </p>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1">
            {isPending ? '処理中...' : '完了'}
          </Button>
        </div>
      </div>
    </EditModal>
  )
}
