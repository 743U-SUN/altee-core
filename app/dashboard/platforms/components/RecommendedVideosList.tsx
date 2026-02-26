"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteRecommendedVideo, reorderRecommendedVideos } from "@/app/actions/social/youtube-actions"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Video {
  id: string
  videoId: string
  title: string | null
  thumbnail: string | null
  sortOrder: number
  isVisible: boolean
}

interface RecommendedVideosListProps {
  videos: Video[]
  onVideosChange: (videos: Video[]) => void
}

export function RecommendedVideosList({ videos, onVideosChange }: RecommendedVideosListProps) {
  const [activeItem, setActiveItem] = useState<Video | null>(null)

  // DnD センサー設定（モバイル対応）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const video = videos.find(v => v.id === event.active.id)
    setActiveItem(video || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const oldIndex = videos.findIndex((v) => v.id === active.id)
    const newIndex = videos.findIndex((v) => v.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newVideos = arrayMove(videos, oldIndex, newIndex)
    onVideosChange(newVideos)

    // サーバーで並び順を更新
    const result = await reorderRecommendedVideos({
      videoIds: newVideos.map(v => v.id)
    })

    if (!result.success) {
      toast.error("並び替えに失敗しました")
      // エラー時は元の順序に戻す
      onVideosChange(videos)
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm("この動画を削除しますか？")) return

    const result = await deleteRecommendedVideo(videoId)

    if (result.success) {
      const updatedVideos = videos.filter(v => v.id !== videoId)
      onVideosChange(updatedVideos)
      toast.success("動画を削除しました")
    } else {
      toast.error(result.error || "削除に失敗しました")
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={videos.map(v => v.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {videos.map((video) => (
            <SortableVideoItem
              key={video.id}
              video={video}
              onDelete={() => handleDelete(video.id)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <VideoItemCard
            video={activeItem}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ソート可能な動画アイテム
interface SortableVideoItemProps {
  video: Video
  onDelete: () => void
}

function SortableVideoItem({ video, onDelete }: SortableVideoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <VideoItemCard
        video={video}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// 動画アイテムカード
interface VideoItemCardProps {
  video: Video
  onDelete?: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
}

function VideoItemCard({ video, onDelete, isDragging, dragHandleProps }: VideoItemCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    await onDelete()
    setIsDeleting(false)
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg border bg-card
        ${isDragging ? "shadow-lg" : ""}
      `}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <img
          src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`}
          alt="サムネイル"
          className="w-20 h-15 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {video.title || video.videoId}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {video.videoId}
          </p>
        </div>
      </div>

      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}
