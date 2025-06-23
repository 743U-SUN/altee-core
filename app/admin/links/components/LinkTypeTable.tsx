"use client"

import { useState, useEffect, useCallback } from "react"
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

// 型定義
interface LinkType {
  id: string
  name: string
  displayName: string
  defaultIcon?: string | null
  urlPattern?: string | null
  isCustom: boolean
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    userLinks: number
  }
}

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
    if (linkType.defaultIcon) {
      return `https://object-storage.c3j1.conoha.io/v1/AUTH_0bf5238d06034983a552682e781f9e25/${linkType.defaultIcon}`
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
                unoptimized
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

export function LinkTypeTable() {
  const [linkTypes, setLinkTypes] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
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

  // データ取得（useCallbackでメモ化して無限ループを防止）
  const fetchLinkTypes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/link-types')
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setLinkTypes(data)
    } catch (error) {
      console.error('LinkType取得エラー:', error)
      toast.error('リンクタイプの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinkTypes()
  }, [fetchLinkTypes])

  // アクティブ状態の切り替え
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const result = await updateLinkType(id, { isActive })
      
      if (result.success) {
        setLinkTypes(linkTypes.map(lt => 
          lt.id === id ? { ...lt, isActive } : lt
        ))
        toast.success(isActive ? "リンクタイプを有効にしました" : "リンクタイプを無効にしました")
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch {
      toast.error("更新に失敗しました")
    }
  }

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm("このリンクタイプを削除しますか？")) return

    try {
      const result = await deleteLinkType(id)
      
      if (result.success) {
        setLinkTypes(linkTypes.filter(lt => lt.id !== id))
        toast.success("リンクタイプを削除しました")
      } else {
        toast.error(result.error || "削除に失敗しました")
      }
    } catch {
      toast.error("削除に失敗しました")
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
    setLinkTypes(newLinkTypes)

    // サーバーに並び順を保存
    try {
      const updatePromises = newLinkTypes.map((linkType, index) =>
        updateLinkType(linkType.id, { sortOrder: index })
      )
      
      await Promise.all(updatePromises)
      toast.success("並び順を更新しました")
    } catch {
      // エラーの場合は元に戻す
      setLinkTypes(linkTypes)
      toast.error("並び替えに失敗しました")
    }
  }

  // 編集完了（fetchLinkTypes削除で無限ループ修正）
  const handleLinkTypeUpdated = (updatedLinkType: LinkType) => {
    setLinkTypes(linkTypes.map(lt => 
      lt.id === updatedLinkType.id ? updatedLinkType : lt
    ))
    setEditingLinkType(null)
    // fetchLinkTypes() を削除 - 状態は既に更新済み
  }

  if (loading) {
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
          <CardTitle>リンクタイプ一覧</CardTitle>
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

      <AddLinkTypeModal onLinkTypeAdded={fetchLinkTypes} />
    </>
  )
}