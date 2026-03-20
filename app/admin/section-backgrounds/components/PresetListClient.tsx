'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
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
import { toast } from 'sonner'
import {
  togglePresetActiveAction,
  deletePresetAction,
  updatePresetSortOrderAction,
} from '@/app/actions/admin/section-background-actions'
import type { DragEndEvent } from '@dnd-kit/core'

// dnd-kitを含むテーブルをlazy loading
const PresetDndTable = dynamic(
  () => import('./PresetDndTable').then((mod) => mod.PresetDndTable),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-muted rounded" />,
  }
)

// シリアライズ済みPreset型
export interface SerializedPreset {
  id: string
  name: string
  category: string
  config: unknown
  cssString: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface PresetListClientProps {
  presets: SerializedPreset[]
}

// ===== メインコンポーネント =====

export function PresetListClient({ presets: initialPresets }: PresetListClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleToggleActive = (id: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await togglePresetActiveAction(id, isActive)
      if (result.success) {
        toast.success(isActive ? 'プリセットを公開しました' : 'プリセットを非公開にしました')
        router.refresh()
      } else {
        toast.error(result.error || '更新に失敗しました')
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return

    const id = deleteTargetId
    setDeleteTargetId(null)

    startTransition(async () => {
      const result = await deletePresetAction(id)
      if (result.success) {
        toast.success('プリセットを削除しました')
        router.refresh()
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = initialPresets.findIndex((p) => p.id === active.id)
    const newIndex = initialPresets.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // 新しい並び順を計算
    const reordered = [...initialPresets]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const items = reordered.map((p, index) => ({ id: p.id, sortOrder: index }))

    startTransition(async () => {
      const result = await updatePresetSortOrderAction(items)
      if (result.success) {
        toast.success('並び順を更新しました')
        router.refresh()
      } else {
        toast.error(result.error || '並び替えに失敗しました')
      }
    })
  }

  // カテゴリ別にグループ化
  const solidPresets = initialPresets.filter((p) => p.category === 'solid')
  const gradientPresets = initialPresets.filter((p) => p.category === 'gradient')
  const allPresets = [...solidPresets, ...gradientPresets]

  return (
    <>
      <div className="space-y-4" data-pending={isPending ? '' : undefined}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              プリセット一覧（{initialPresets.length}件）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allPresets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>プリセットがまだ作成されていません</p>
                <p className="text-sm">「プリセット追加」から設定を始めましょう</p>
              </div>
            ) : (
              <PresetDndTable
                presets={allPresets}
                onToggleActive={handleToggleActive}
                onDelete={setDeleteTargetId}
                onDragEnd={handleDragEnd}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プリセットを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このプリセットを削除しますか？この操作は元に戻せません。
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
