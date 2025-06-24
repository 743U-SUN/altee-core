"use client"

import { useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ExternalLink, GripVertical } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { updateLinkType, deleteLinkType } from "@/app/actions/link-actions"
import { EditLinkTypeModal } from "./EditLinkTypeModal"
import { AddLinkTypeModal } from "./AddLinkTypeModal"
import {
  DndContext,
  DragEndEvent,
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
import useSWR from "swr"

import type { LinkType } from "@/types/link-type"

// ソート可能な行コンポーネント
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

  const getIconUrl = () => {
    if (linkType.icons && linkType.icons.length > 0) {
      // デフォルトアイコンを探す
      const defaultIcon = linkType.icons.find(icon => icon.isDefault)
      if (defaultIcon) {
        return `/api/files/${defaultIcon.iconKey}`
      }
      // デフォルトがない場合は最初のアイコンを使用
      return `/api/files/${linkType.icons[0].iconKey}`
    }
    
    return null
  }

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
            {getIconUrl() ? (
              <Image
                src={getIconUrl()!}
                alt={linkType.displayName}
                width={24}
                height={24}
                className="object-contain"
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
        {linkType._count?.userLinks || 0}
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
              disabled={(linkType._count?.userLinks || 0) > 0}
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

// SWR fetcher関数
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export function LinkTypeTable() {
  const [editingLinkType, setEditingLinkType] = useState<LinkType | null>(null)

  // dnd-kit sensors設定（モバイル対応）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  // useSWRでデータ取得
  const { data: linkTypes = [], isLoading, mutate } = useSWR<LinkType[]>(
    '/api/admin/link-types',
    fetcher,
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error('リンクタイプの取得に失敗しました')
      }
    }
  )

  // アクティブ状態の切り替え
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      // 楽観的更新
      await mutate(
        linkTypes.map(lt => 
          lt.id === id ? { ...lt, isActive } : lt
        ),
        false
      )

      const result = await updateLinkType(id, { isActive })
      
      if (result.success) {
        toast.success(isActive ? "リンクタイプを有効にしました" : "リンクタイプを無効にしました")
        // 再検証して最新データを取得
        mutate()
      } else {
        toast.error(result.error || "更新に失敗しました")
        // エラー時は元に戻す
        mutate()
      }
    } catch {
      toast.error("更新に失敗しました")
      mutate()
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm("このリンクタイプを削除しますか？")) return

    try {
      // 楽観的更新
      await mutate(
        linkTypes.filter(lt => lt.id !== id),
        false
      )

      const result = await deleteLinkType(id)
      
      if (result.success) {
        toast.success("リンクタイプを削除しました")
        mutate()
      } else {
        toast.error(result.error || "削除に失敗しました")
        mutate()
      }
    } catch {
      toast.error("削除に失敗しました")
      mutate()
    }
  }

  // 並び替え
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = linkTypes.findIndex((item) => item.id === active.id)
    const newIndex = linkTypes.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newLinkTypes = arrayMove(linkTypes, oldIndex, newIndex)
    
    // 楽観的更新
    await mutate(newLinkTypes, false)

    // サーバーに並び順を保存
    try {
      const updatePromises = newLinkTypes.map((linkType, index) =>
        updateLinkType(linkType.id, { sortOrder: index })
      )
      
      await Promise.all(updatePromises)
      toast.success("並び順を更新しました")
      mutate()
    } catch {
      // エラーの場合は元に戻す
      toast.error("並び替えに失敗しました")
      mutate()
    }
  }

  // 編集完了
  const handleLinkTypeUpdated = (updatedLinkType: LinkType) => {
    mutate(
      linkTypes.map(lt => 
        lt.id === updatedLinkType.id ? updatedLinkType : lt
      ),
      false
    )
    setEditingLinkType(null)
    mutate()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">リンクタイプを読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>リンクタイプ一覧</CardTitle>
            <AddLinkTypeModal onLinkTypeAdded={() => mutate()} />
          </div>
        </CardHeader>
        <CardContent>
          {linkTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>リンクタイプがまだ作成されていません</p>
              <p className="text-sm">「リンクタイプを追加」から設定を始めましょう</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={linkTypes.map(lt => lt.id)} strategy={verticalListSortingStrategy}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>サービス</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>URLパターン</TableHead>
                      <TableHead>使用数</TableHead>
                      <TableHead>有効</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkTypes.map((linkType) => (
                      <SortableTableRow
                        key={linkType.id}
                        linkType={linkType}
                        onEdit={setEditingLinkType}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* 編集モーダル */}
      {editingLinkType && (
        <EditLinkTypeModal
          linkType={editingLinkType}
          onLinkTypeUpdated={handleLinkTypeUpdated}
          onCancel={() => setEditingLinkType(null)}
        />
      )}
    </>
  )
}