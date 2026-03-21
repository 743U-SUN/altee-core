'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DeleteItemAlertDialog } from './components/DeleteItemAlertDialog'
import type { BarGraphData } from '@/types/profile-sections'
import { useEditableList } from './hooks/useEditableList'

interface BarGraphEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: BarGraphData
  currentTitle?: string
}

type EditingBarItem = {
  id: string
  label: string
  value: number
  maxValue: number
  sortOrder: number
}

/**
 * バーグラフ編集モーダル
 * スキルセットや数値データの編集
 */
export function BarGraphEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
  currentTitle,
}: BarGraphEditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState(currentTitle ?? '')
  const [isPending, startTransition] = useTransition()

  const {
    items,
    editingItemId,
    handleAdd: handleAddItem,
    handleCloseEdit,
    handleToggleEdit,
    handleFieldChange,
    handleEscapeEdit,
    deleteTargetId,
    requestDelete: handleDeleteItem,
    confirmDelete,
    cancelDelete,
    handleMove: handleMoveItemOrder,
  } = useEditableList<EditingBarItem>({
    initialItems: currentData.items.map((item) => ({ ...item })),
    createEmptyItem: () => ({
      label: '',
      value: 0,
      maxValue: 100,
    }),
  })

  // 完了処理（全変更を1回のみDB保存してモーダル閉じる）
  const handleSave = () => {
    // 未入力チェック
    const invalidItems = items.filter((item) => !item.label.trim())
    if (invalidItems.length > 0) {
      toast.error('ラベルが未入力のアイテムがあります')
      return
    }

    startTransition(async () => {
      try {
        const barGraphData: BarGraphData = {
          items: items.map((item) => ({
            id: item.id,
            label: item.label,
            value: item.value,
            maxValue: item.maxValue,
            sortOrder: item.sortOrder,
          })),
        }

        const result = await updateSection(sectionId, {
          title: title.trim() || null,
          data: barGraphData,
        })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '保存に失敗しました')
          // モーダルは開いたまま（編集継続可能）
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
        // モーダルは開いたまま（編集継続可能）
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="バーグラフを編集"
      isSaving={isPending}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* セクションタイトル */}
        <div className="space-y-1">
          <Label htmlFor="section-title">セクションタイトル（任意）</Label>
          <Input
            id="section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: スキルセット"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{title.length}/50文字</p>
        </div>

        <Separator />

        {/* アイテム追加ボタン */}
        <Button
          onClick={handleAddItem}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!!editingItemId}
        >
          <Plus className="w-4 h-4 mr-2" />
          アイテムを追加
        </Button>

        {/* アイテム一覧 */}
        {items.map((item, index) => {
          const percentage =
            item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0
          const isEditing = editingItemId === item.id

          return (
            <Collapsible
              key={item.id}
              open={isEditing}
              onOpenChange={(open) => {
                if (open) {
                  handleToggleEdit(item.id)
                } else {
                  handleCloseEdit()
                }
              }}
              className="border rounded-lg p-4 bg-muted/30"
            >
              {/* 常に表示される部分 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <BarChart3 className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.label || '（ラベル未入力）'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.value} / {item.maxValue} ({percentage.toFixed(0)}
                      %)
                    </p>
                    {/* プレビュー用バー */}
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={editingItemId !== null && editingItemId !== item.id}
                    >
                      <Pencil className={cn("w-3.5 h-3.5", isEditing && "text-primary")} />
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={!!editingItemId}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveItemOrder(item.id, 'up')}
                    disabled={index === 0 || !!editingItemId}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveItemOrder(item.id, 'down')}
                    disabled={index === items.length - 1 || !!editingItemId}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 展開される編集フォーム */}
              <CollapsibleContent>
                <div className="pt-3 mt-3 border-t space-y-3">
                  <div>
                    <Label htmlFor={`label-${item.id}`}>ラベル</Label>
                    <Input
                      id={`label-${item.id}`}
                      value={item.label}
                      onChange={(e) => handleFieldChange(item.id, 'label', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="例: React"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`value-${item.id}`}>現在値</Label>
                      <Input
                        id={`value-${item.id}`}
                        type="number"
                        value={item.value}
                        onChange={(e) =>
                          handleFieldChange(item.id, 'value', Number(e.target.value))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            handleEscapeEdit()
                          }
                        }}
                        min={0}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`maxValue-${item.id}`}>最大値</Label>
                      <Input
                        id={`maxValue-${item.id}`}
                        type="number"
                        value={item.maxValue}
                        onChange={(e) =>
                          handleFieldChange(item.id, 'maxValue', Number(e.target.value))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            handleEscapeEdit()
                          }
                        }}
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            アイテムを追加してください
          </p>
        )}
      </div>

      <DeleteItemAlertDialog
        open={!!deleteTargetId}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </EditModal>
  )
}
