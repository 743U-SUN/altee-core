'use client'

import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useVideoListEditor, type VideoItem } from '@/hooks/use-video-list-editor'

interface VideoRecommendedEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  initialItems: VideoItem[]
  title: string
  placeholder: string
  emptyText: string
  maxVideos: number
  fetchMetadata: (url: string) => Promise<{
    success: boolean
    data?: { videoId: string; title?: string; thumbnail?: string }
    error?: string
  }>
  renderThumbnail: (item: VideoItem) => React.ReactNode
  renderItemExtra?: (item: VideoItem) => React.ReactNode
}

export function VideoRecommendedEditModal({
  isOpen,
  onClose,
  sectionId,
  initialItems,
  title,
  placeholder,
  emptyText,
  maxVideos,
  fetchMetadata,
  renderThumbnail,
  renderItemExtra,
}: VideoRecommendedEditModalProps) {
  const {
    items,
    newUrl,
    setNewUrl,
    isPending,
    isLoadingMetadata,
    handleAddVideo,
    handleDeleteVideo,
    handleMoveVideo,
    handleSave,
  } = useVideoListEditor({
    sectionId,
    initialItems,
    maxVideos,
    fetchMetadata,
    onClose,
  })

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title={title} hideActions>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>URL を追加</Label>
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVideo()
                }
              }}
              disabled={items.length >= maxVideos}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddVideo}
              disabled={isLoadingMetadata || !newUrl || items.length >= maxVideos}
            >
              {isLoadingMetadata ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {items.length}/{maxVideos}本 登録済み
          </p>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 p-2 border rounded-md bg-muted/20">
              <div className="w-24 aspect-video relative shrink-0 rounded overflow-hidden bg-muted">
                {renderThumbnail(item)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">
                  {item.title || '（タイトルなし）'}
                </p>
                {renderItemExtra?.(item)}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveVideo(item.id, 'up')} disabled={index === 0} aria-label="上に移動">
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveVideo(item.id, 'down')} disabled={index === items.length - 1} aria-label="下に移動">
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteVideo(item.id)} aria-label="削除">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {emptyText}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
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
