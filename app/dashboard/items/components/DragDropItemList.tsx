'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { GripVertical, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { UserItemWithDetails } from "@/types/item"
import { ItemImage } from "@/components/items/item-image"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { deleteUserItem, reorderUserItems, updateUserItem } from "@/app/actions/content/item-actions"

// EditUserItemModalの遅延読み込み
const EditUserItemModal = dynamic(() => import('./EditUserItemModal').then(mod => ({ default: mod.EditUserItemModal })), {
  loading: () => <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

interface DragDropItemListProps {
  userItems: UserItemWithDetails[]
  userId: string
  onItemsChange: (items: UserItemWithDetails[]) => void
}

export function DragDropItemList({ userItems, userId, onItemsChange }: DragDropItemListProps) {
  const [activeItem, setActiveItem] = useState<UserItemWithDetails | null>(null)
  const [editingItem, setEditingItem] = useState<UserItemWithDetails | null>(null)
  const [deletingItem, setDeletingItem] = useState<UserItemWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    const item = userItems.find(p => p.id === event.active.id)
    setActiveItem(item || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const oldIndex = userItems.findIndex((item) => item.id === active.id)
    const newIndex = userItems.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(userItems, oldIndex, newIndex)
    onItemsChange(newItems)

    // サーバーで並び順を更新
    const result = await reorderUserItems(newItems.map(item => item.id))

    if (!result.success) {
      toast.error("並び替えに失敗しました")
      // エラー時は元の順序に戻す
      onItemsChange(userItems)
    }
  }

  const handleVisibilityToggle = async (item: UserItemWithDetails) => {
    const result = await updateUserItem(item.id, {
      isPublic: !item.isPublic
    })

    if (result.success) {
      const updatedItems = userItems.map(p =>
        p.id === item.id ? { ...p, isPublic: !p.isPublic } : p
      )
      onItemsChange(updatedItems)
      toast.success(item.isPublic ? "アイテムを非公開にしました" : "アイテムを公開しました")
    } else {
      toast.error("表示設定の変更に失敗しました")
    }
  }

  const handleDeleteItem = (item: UserItemWithDetails) => {
    setDeletingItem(item)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      const result = await deleteUserItem(deletingItem.id)

      if (result.success) {
        const updatedItems = userItems.filter(p => p.id !== deletingItem.id)
        onItemsChange(updatedItems)
        toast.success("アイテムを削除しました")
        setDeletingItem(null)
      } else {
        toast.error("アイテムの削除に失敗しました")
      }
    } catch {
      toast.error("アイテムの削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdate = (updatedItem: UserItemWithDetails) => {
    const updatedItems = userItems.map(p =>
      p.id === updatedItem.id ? updatedItem : p
    )
    onItemsChange(updatedItems)
    setEditingItem(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={userItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {userItems.map((item) => (
              <SortableItemItem
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onVisibilityToggle={() => handleVisibilityToggle(item)}
                onDelete={() => handleDeleteItem(item)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem && (
            <ItemCard
              item={activeItem}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {editingItem && (
        <EditUserItemModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          userItem={editingItem}
          onUpdate={handleUpdate}
        />
      )}

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アイテムを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <span className="font-medium">「{deletingItem?.item.name}」</span>
                をマイアイテムから削除します。
              </span>
              <span className="block text-sm">
                この操作は取り消せません。アイテム自体は削除されず、あなたの登録のみが削除されます。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ソート可能なアイテム
function SortableItemItem({
  item,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  item: UserItemWithDetails
  onEdit: () => void
  onVisibilityToggle: () => void
  onDelete: () => void
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
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ItemCard
        item={item}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={onEdit}
        onVisibilityToggle={onVisibilityToggle}
        onDelete={onDelete}
      />
    </div>
  )
}

// アイテムカード
function ItemCard({
  item,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  item: UserItemWithDetails
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  onEdit?: () => void
  onVisibilityToggle?: () => void
  onDelete?: () => void
}) {
  return (
    <div className={`border rounded-lg p-4 bg-card ${isDragging ? 'shadow-lg opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-shrink-0">
          <ItemImage
            imageStorageKey={item.item.imageStorageKey}
            customImageUrl={item.item.customImageUrl}
            amazonImageUrl={item.item.amazonImageUrl}
            alt={item.item.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium text-sm line-clamp-1 max-w-xs">{item.item.name}</div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {item.item.category.name}
            </Badge>
            {item.item.brand && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {item.item.brand.name}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {item.review || "レビューなし"}
          </div>
        </div>

        {!isDragging && onEdit && onVisibilityToggle && onDelete && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVisibilityToggle}
            >
              {item.isPublic ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => item.item.amazonUrl && window.open(item.item.amazonUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
