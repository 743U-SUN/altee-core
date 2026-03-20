"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { toast } from "sonner"
import { updateLinkType, deleteLinkType, reorderLinkTypes } from "@/app/actions/admin/link-type-actions"
import { EditLinkTypeModal } from "./EditLinkTypeModal"
import { AddLinkTypeModal } from "./AddLinkTypeModal"
import { arrayMove } from "@dnd-kit/sortable"
import useSWR from "swr"

import type { LinkType } from "@/types/link-type"
import type { DragEndEvent } from "@dnd-kit/core"

// dnd-kitを含むテーブルをlazy loading
const LinkTypeDndTable = dynamic(
  () => import('./LinkTypeDndTable').then((mod) => mod.LinkTypeDndTable),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-muted rounded" />,
  }
)

// SWR fetcher関数
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

export function LinkTypeTable() {
  const [editingLinkType, setEditingLinkType] = useState<LinkType | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

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
  const handleToggleActive = (id: string, isActive: boolean) => {
    startTransition(async () => {
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
          mutate()
        } else {
          toast.error(result.error || "更新に失敗しました")
          mutate()
        }
      } catch {
        toast.error("更新に失敗しました")
        mutate()
      }
    })
  }

  // 削除確認ダイアログを開く
  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id)
  }

  // 削除確認
  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return

    const id = deleteTargetId
    setDeleteTargetId(null)

    startTransition(async () => {
      try {
        await mutate(
          linkTypes.filter(lt => lt.id !== id),
          false
        )

        const result = await deleteLinkType(id, false)

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
    })
  }

  // 並び替え
  const handleDragEnd = (event: DragEndEvent) => {
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

    startTransition(async () => {
      // 楽観的更新
      await mutate(newLinkTypes, false)

      // バッチreorderアクションで一括更新
      const items = newLinkTypes.map((linkType, index) => ({
        id: linkType.id,
        sortOrder: index,
      }))

      const result = await reorderLinkTypes(items)
      if (result.success) {
        toast.success("並び順を更新しました")
        mutate()
      } else {
        toast.error(result.error || "並び替えに失敗しました")
        mutate()
      }
    })
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
            <AddLinkTypeModal linkTypes={linkTypes} onLinkTypeAdded={() => mutate()} />
          </div>
        </CardHeader>
        <CardContent>
          {linkTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>リンクタイプがまだ作成されていません</p>
              <p className="text-sm">「リンクタイプを追加」から設定を始めましょう</p>
            </div>
          ) : (
            <LinkTypeDndTable
              linkTypes={linkTypes}
              onEdit={setEditingLinkType}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteRequest}
              onDragEnd={handleDragEnd}
            />
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

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>リンクタイプを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このリンクタイプを削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
