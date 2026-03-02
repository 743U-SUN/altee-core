'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import {
  getUserNews,
  deleteUserNews,
  reorderUserNews,
  toggleUserNewsPublished,
} from '@/app/actions/content/user-news-actions'
import { USER_NEWS_LIMITS } from '@/types/user-news'
import type { UserNewsWithImages } from '@/types/user-news'

interface UserNewsListClientProps {
  initialData: UserNewsWithImages[]
}

function SortableNewsItem({
  item,
  onTogglePublished,
  onDelete,
}: {
  item: UserNewsWithImages
  onTogglePublished: (id: string) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const thumbnailUrl = item.thumbnail?.storageKey
    ? getPublicUrl(item.thumbnail.storageKey)
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* サムネイル */}
      <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={item.title}
            width={64}
            height={48}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </div>

      {/* タイトル + バッジ */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={item.published ? 'default' : 'secondary'}>
            {item.published ? '公開' : '下書き'}
          </Badge>
          {item.adminHidden && (
            <Badge variant="destructive">管理者非表示</Badge>
          )}
        </div>
      </div>

      {/* アクション */}
      <div
        className="flex items-center gap-1"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePublished(item.id)}
          title={item.published ? '下書きに戻す' : '公開する'}
        >
          {item.published ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/news/${item.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function UserNewsListClient({ initialData }: UserNewsListClientProps) {
  const { data: newsItems, mutate } = useSWR(
    'user-news',
    async () => {
      const result = await getUserNews()
      return result.data as UserNewsWithImages[]
    },
    { fallbackData: initialData, revalidateOnFocus: false }
  )

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !newsItems) return

      const oldIndex = newsItems.findIndex((item) => item.id === active.id)
      const newIndex = newsItems.findIndex((item) => item.id === over.id)
      const reordered = arrayMove(newsItems, oldIndex, newIndex)

      await mutate(reordered, false)

      try {
        await reorderUserNews(reordered.map((item) => item.id))
      } catch {
        toast.error('並べ替えに失敗しました')
        await mutate()
      }
    },
    [newsItems, mutate]
  )

  const handleTogglePublished = useCallback(
    async (id: string) => {
      try {
        await toggleUserNewsPublished(id)
        await mutate(
          (current) =>
            current?.map((item) =>
              item.id === id
                ? { ...item, published: !item.published }
                : item
            ),
          false
        )
        toast.success('公開状態を変更しました')
      } catch {
        toast.error('公開状態の変更に失敗しました')
      }
    },
    [mutate]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteUserNews(id)
        await mutate(
          (current) => current?.filter((item) => item.id !== id),
          false
        )
        toast.success('記事を削除しました')
      } catch {
        toast.error('削除に失敗しました')
      } finally {
        setDeleteTarget(null)
      }
    },
    [mutate]
  )

  const items = newsItems ?? []
  const canCreate = items.length < USER_NEWS_LIMITS.MAX_ARTICLES

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ニュース記事</CardTitle>
        <Button asChild disabled={!canCreate} size="sm">
          <Link href="/dashboard/news/new">
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            まだニュース記事がありません。
            <br />
            「新規作成」ボタンから記事を作成してください。
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableNewsItem
                    key={item.id}
                    item={item}
                    onTogglePublished={handleTogglePublished}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          {items.length} / {USER_NEWS_LIMITS.MAX_ARTICLES} 記事
          {!canCreate && '（上限に達しています）'}
        </p>
      </CardContent>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。記事は完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
