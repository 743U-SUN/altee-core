"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ExternalLink, GripVertical } from "lucide-react"
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import Image from "next/image"
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { LinkType } from "@/types/link-type"

interface LinkTypeDndTableProps {
  linkTypes: LinkType[]
  onEdit: (linkType: LinkType) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onDragEnd: (event: DragEndEvent) => void
}

function SortableTableRow({ linkType, onEdit, onToggleActive, onDelete }: {
  linkType: LinkType
  onEdit: (linkType: LinkType) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: linkType.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // アイコンURLを一度だけ計算
  const iconUrl = (() => {
    if (linkType.icons && linkType.icons.length > 0) {
      const defaultIcon = linkType.icons.find(icon => icon.isDefault)
      if (defaultIcon) {
        return getPublicUrl(defaultIcon.iconKey)
      }
      return getPublicUrl(linkType.icons[0].iconKey)
    }
    return null
  })()

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            {iconUrl ? (
              <Image
                src={iconUrl}
                alt={linkType.displayName}
                width={24}
                height={24}
                className="object-contain dark:brightness-0 dark:invert"
              />
            ) : (
              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">{linkType.displayName}</div>
            <div className="text-sm text-muted-foreground">{linkType.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {linkType.isCustom && (
            <Badge variant="secondary">カスタム</Badge>
          )}
          {!linkType.isActive && (
            <Badge variant="destructive">無効</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {linkType.urlPattern || "なし"}
        </code>
      </TableCell>
      <TableCell>
        <Switch
          checked={linkType.isActive}
          onCheckedChange={(checked) => onToggleActive(linkType.id, checked)}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(linkType)}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(linkType.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function LinkTypeDndTable({ linkTypes, onEdit, onToggleActive, onDelete, onDragEnd }: LinkTypeDndTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={linkTypes.map(lt => lt.id)} strategy={verticalListSortingStrategy}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>サービス</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>URLパターン</TableHead>
              <TableHead>有効</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linkTypes.map((linkType) => (
              <SortableTableRow
                key={linkType.id}
                linkType={linkType}
                onEdit={onEdit}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  )
}
