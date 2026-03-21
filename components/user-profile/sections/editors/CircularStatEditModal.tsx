'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { IconSelector } from '@/components/ui/icon-selector'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Circle,
  X,
} from 'lucide-react'
import { getLucideIcon } from '@/lib/lucide-icons'
import { cn } from '@/lib/utils'
import { DeleteItemAlertDialog } from './components/DeleteItemAlertDialog'
import type { CircularStatData, CircularStatItem } from '@/types/profile-sections'
import { useEditableList } from './hooks/useEditableList'

interface CircularStatEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: CircularStatData
  currentTitle?: string
}

// プリセットカラー
const PRESET_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#4ade80', // green
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
  '#94a3b8', // gray
]

/**
 * 円形スタット編集モーダル
 * ステータスや数値データの編集
 */
export function CircularStatEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
  currentTitle,
}: CircularStatEditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState(currentTitle ?? '')
  const [showIconPickerFor, setShowIconPickerFor] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    items,
    editingItemId,
    handleAdd: handleAddItem,
    handleCloseEdit: rawHandleCloseEdit,
    handleToggleEdit,
    handleFieldChange,
    handleEscapeEdit: rawHandleEscapeEdit,
    deleteTargetId,
    requestDelete: handleDeleteItem,
    confirmDelete,
    cancelDelete,
    handleMove: handleMoveOrder,
  } = useEditableList<CircularStatItem>({
    initialItems: currentData.items.map((item) => ({ ...item })),
    createEmptyItem: (sortOrder) => ({
      value: 50,
      centerChar: 'A',
      label: '',
      color: PRESET_COLORS[sortOrder % PRESET_COLORS.length],
    }),
  })

  const handleCloseEdit = () => {
    rawHandleCloseEdit()
    setShowIconPickerFor(null)
  }
  const handleEscapeEdit = () => {
    rawHandleEscapeEdit()
    setShowIconPickerFor(null)
  }

  // アイコンのクリア
  const handleClearIcon = (itemId: string) => {
    handleFieldChange(itemId, 'iconName', undefined)
    setShowIconPickerFor(null)
  }

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
        const circularStatData: CircularStatData = {
          items: items.map((item) => ({
            id: item.id,
            value: item.value,
            centerChar: item.centerChar,
            iconName: item.iconName,
            label: item.label,
            subLabel: item.subLabel,
            color: item.color,
            sortOrder: item.sortOrder,
          })),
        }

        const result = await updateSection(sectionId, {
          title: title.trim() || null,
          data: circularStatData,
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
      title="円形スタットを編集"
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
            placeholder="例: ステータス"
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
              className="border rounded-lg p-3 bg-muted/30"
            >
              {/* 常に表示される部分 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* プレビュー円 */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border-4 shrink-0"
                    style={{ borderColor: item.color }}
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: item.color }}
                    >
                      {item.centerChar}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.iconName &&
                        (() => {
                          const Icon = getLucideIcon(item.iconName, Circle)
                          return (
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          )
                        })()}
                      <p className="font-medium truncate">
                        {item.label || '（ラベル未入力）'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.value}%
                      {item.subLabel && ` - ${item.subLabel}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                    onClick={() => handleMoveOrder(item.id, 'up')}
                    disabled={index === 0 || !!editingItemId}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveOrder(item.id, 'down')}
                    disabled={index === items.length - 1 || !!editingItemId}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 展開される編集フォーム */}
              <CollapsibleContent>
                <div className="pt-3 mt-3 border-t space-y-3">
                {/* パーセント値 */}
                <div className="space-y-1">
                  <Label>パーセント値 (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
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
                  />
                </div>

                {/* 中央文字 */}
                <div className="space-y-1">
                  <Label>中央文字（1文字）</Label>
                  <Input
                    value={item.centerChar}
                    onChange={(e) =>
                      handleFieldChange(
                        item.id,
                        'centerChar',
                        e.target.value.slice(0, 1)
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        handleEscapeEdit()
                      }
                    }}
                    placeholder="例: A, S, ★"
                    maxLength={1}
                  />
                </div>

                {/* カラー */}
                <div className="space-y-1">
                  <Label>カラー</Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="flex gap-1">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            item.color === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleFieldChange(item.id, 'color', color)}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={item.color}
                      onChange={(e) =>
                        handleFieldChange(item.id, 'color', e.target.value)
                      }
                      className="w-10 h-8 p-1 cursor-pointer"
                    />
                  </div>
                </div>

                {/* ラベル */}
                <div className="space-y-1">
                  <Label>ラベル（最大10文字）</Label>
                  <Input
                    value={item.label}
                    onChange={(e) =>
                      handleFieldChange(item.id, 'label', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        handleEscapeEdit()
                      }
                    }}
                    placeholder="例: STR, HP"
                    maxLength={10}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.label.length}/10文字
                  </p>
                </div>

                {/* サブラベル */}
                <div className="space-y-1">
                  <Label>サブラベル（任意・最大10文字）</Label>
                  <Input
                    value={item.subLabel ?? ''}
                    onChange={(e) =>
                      handleFieldChange(item.id, 'subLabel', e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        handleEscapeEdit()
                      }
                    }}
                    placeholder="例: Level Up!"
                    maxLength={10}
                  />
                </div>

                {/* アイコン選択 */}
                <div className="space-y-2">
                  <Label>アイコン（任意）</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowIconPickerFor(
                          showIconPickerFor === item.id ? null : item.id
                        )
                      }
                    >
                      {(() => {
                        const Icon = item.iconName
                          ? getLucideIcon(item.iconName, Circle)
                          : Circle
                        return <Icon className="w-4 h-4 mr-1" />
                      })()}
                      {item.iconName ? 'アイコン変更' : 'アイコンを選択'}
                    </Button>
                    {item.iconName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleClearIcon(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {showIconPickerFor === item.id && (
                    <div className="border rounded-lg overflow-hidden">
                      <IconSelector
                        selectedIcon={item.iconName ?? ''}
                        onIconSelect={(iconName) => {
                          handleFieldChange(item.id, 'iconName', iconName)
                          setShowIconPickerFor(null)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )
        })}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">
            「アイテムを追加」ボタンでスタットを追加してください
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
