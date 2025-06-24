"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { GripVertical, ExternalLink, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import type { UserLink, LinkType } from "@/types/link-type"

// EditLinkModalの遅延読み込み
const EditLinkModal = dynamic(() => import("../edit-link-modal").then(mod => ({ default: mod.EditLinkModal })), {
  loading: () => <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

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
import { deleteUserLink, reorderUserLinks, updateUserLink } from "@/app/actions/link-actions"

interface DragDropLinkListProps {
  userLinks: UserLink[]
  linkTypes: LinkType[]
  onLinksChange: (links: UserLink[]) => void
  onEditLink: (link: UserLink) => void
}

export function DragDropLinkList({ userLinks, linkTypes, onLinksChange, onEditLink }: DragDropLinkListProps) {
  const [activeItem, setActiveItem] = useState<UserLink | null>(null)

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
    const link = userLinks.find(l => l.id === event.active.id)
    setActiveItem(link || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const oldIndex = userLinks.findIndex((link) => link.id === active.id)
    const newIndex = userLinks.findIndex((link) => link.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newLinks = arrayMove(userLinks, oldIndex, newIndex)
    onLinksChange(newLinks)

    // サーバーで並び順を更新
    const result = await reorderUserLinks({
      linkIds: newLinks.map(link => link.id)
    })

    if (!result.success) {
      toast.error("並び替えに失敗しました")
      // エラー時は元の順序に戻す
      onLinksChange(userLinks)
    }
  }

  const handleVisibilityToggle = async (link: UserLink) => {
    const result = await updateUserLink(link.id, {
      isVisible: !link.isVisible
    })

    if (result.success) {
      const updatedLinks = userLinks.map(l => 
        l.id === link.id ? { ...l, isVisible: !l.isVisible } : l
      )
      onLinksChange(updatedLinks)
      toast.success(link.isVisible ? "リンクを非表示にしました" : "リンクを表示にしました")
    } else {
      toast.error("表示設定の変更に失敗しました")
    }
  }

  const handleDeleteLink = async (link: UserLink) => {
    if (!confirm("このリンクを削除しますか？")) return

    const result = await deleteUserLink(link.id)

    if (result.success) {
      const updatedLinks = userLinks.filter(l => l.id !== link.id)
      onLinksChange(updatedLinks)
      toast.success("リンクを削除しました")
    } else {
      toast.error("リンクの削除に失敗しました")
    }
  }

  const getIconSrc = (link: UserLink) => {
    if (link.customIcon) {
      return `/api/files/${link.customIcon.storageKey}`
    }
    
    // 選択されたプリセットアイコンがある場合はそれを表示
    if (link.selectedLinkTypeIcon) {
      return `/api/files/${link.selectedLinkTypeIcon.iconKey}`
    }
    
    // 選択されたアイコンがない場合はデフォルトアイコンを表示
    if (link.linkType.icons && link.linkType.icons.length > 0) {
      const defaultIcon = link.linkType.icons.find(icon => icon.isDefault)
      if (defaultIcon) {
        return `/api/files/${defaultIcon.iconKey}`
      }
      // デフォルトがない場合は最初のアイコンを使用
      return `/api/files/${link.linkType.icons[0].iconKey}`
    }
    
    return null
  }

  const getDisplayName = (link: UserLink) => {
    if (link.linkType.isCustom && link.customLabel) {
      return link.customLabel
    }
    return link.linkType.displayName
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={userLinks.map(link => link.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {userLinks.map((link) => (
            <SortableLinkItem
              key={link.id}
              link={link}
              linkTypes={linkTypes}
              onEdit={() => onEditLink(link)}
              onVisibilityToggle={() => handleVisibilityToggle(link)}
              onDelete={() => handleDeleteLink(link)}
              getIconSrc={getIconSrc}
              getDisplayName={getDisplayName}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <LinkItemCard
            link={activeItem}
            getIconSrc={getIconSrc}
            getDisplayName={getDisplayName}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ソート可能なリンクアイテム
function SortableLinkItem({ 
  link, 
  linkTypes,
  onEdit, 
  onVisibilityToggle, 
  onDelete, 
  getIconSrc, 
  getDisplayName 
}: {
  link: UserLink
  linkTypes: LinkType[]
  onEdit: () => void
  onVisibilityToggle: () => void
  onDelete: () => void
  getIconSrc: (link: UserLink) => string | null
  getDisplayName: (link: UserLink) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <LinkItemCard
        link={link}
        linkTypes={linkTypes}
        getIconSrc={getIconSrc}
        getDisplayName={getDisplayName}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={onEdit}
        onVisibilityToggle={onVisibilityToggle}
        onDelete={onDelete}
      />
    </div>
  )
}

// リンクアイテムカード
function LinkItemCard({
  link,
  linkTypes,
  getIconSrc,
  getDisplayName,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  link: UserLink
  linkTypes?: LinkType[]
  getIconSrc: (link: UserLink) => string | null
  getDisplayName: (link: UserLink) => string
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  onEdit?: () => void
  onVisibilityToggle?: () => void
  onDelete?: () => void
}) {
  const iconSrc = getIconSrc(link)

  return (
    <div className={`border rounded-lg p-4 bg-card ${isDragging ? 'shadow-lg opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-shrink-0">
          {iconSrc ? (
            <Image
              src={iconSrc}
              alt={getDisplayName(link)}
              width={24}
              height={24}
              className="rounded"
            />
          ) : (
            <div className="w-6 h-6 bg-muted rounded" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{getDisplayName(link)}</div>
          <div className="text-xs text-muted-foreground truncate">{link.url}</div>
        </div>

        {!isDragging && onEdit && onVisibilityToggle && onDelete && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVisibilityToggle}
            >
              {link.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(link.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            {linkTypes && (
              <EditLinkModal
                link={link}
                linkTypes={linkTypes}
                onLinkUpdated={() => {
                  onEdit?.()
                }}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              削除
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}