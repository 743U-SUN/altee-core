'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Smile,
  X,
  Clock,
} from 'lucide-react'
import { getLucideIcon } from '@/lib/lucide-icons'
import { cn } from '@/lib/utils'
import { DeleteItemAlertDialog } from './components/DeleteItemAlertDialog'
import type { TimelineData, TimelineItem } from '@/types/profile-sections'
import { useEditableList } from './hooks/useEditableList'

interface TimelineEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: TimelineData
  currentTitle?: string
}

type EditingItem = TimelineItem

/**
 * Timeline編集モーダル
 * 活動年表の編集・タイトル入力・アイコン選択に対応
 */
export function TimelineEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
  currentTitle,
}: TimelineEditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState(currentTitle ?? '')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    items,
    editingItemId,
    handleAdd: rawHandleAdd,
    handleCloseEdit: rawHandleCloseEdit,
    handleToggleEdit: rawHandleToggleEdit,
    handleFieldChange,
    handleEscapeEdit: rawHandleEscapeEdit,
    deleteTargetId,
    requestDelete: handleDeleteItem,
    confirmDelete,
    cancelDelete,
    handleMove: handleMoveOrder,
  } = useEditableList<EditingItem>({
    initialItems: (currentData?.items ?? []).map((item) => ({ ...item })),
    createEmptyItem: () => ({
      label: '',
      title: '',
      description: '',
    }),
  })

  const handleAddItem = () => {
    rawHandleAdd()
    setShowIconPicker(false)
  }
  const handleCloseEdit = () => {
    rawHandleCloseEdit()
    setShowIconPicker(false)
  }
  const handleToggleEdit = (itemId: string) => {
    rawHandleToggleEdit(itemId)
    setShowIconPicker(false)
  }
  const handleEscapeEdit = () => {
    rawHandleEscapeEdit()
    setShowIconPicker(false)
  }

  // アイコンのクリア
  const handleClearIcon = () => {
    if (editingItemId) {
      handleFieldChange(editingItemId, 'iconName', undefined)
      setShowIconPicker(false)
    }
  }

  // 完了処理（全変更を1回のみDB保存してモーダル閉じる）
  const handleSave = () => {
    // 未入力チェック
    const invalidItems = items.filter((item) => !item.label.trim() || !item.title.trim())
    if (invalidItems.length > 0) {
      toast.error('ラベルまたはタイトルが未入力の項目があります')
      return
    }

    startTransition(async () => {
      try {
        const timelineData: TimelineData = {
          items: items.map((item) => ({
            id: item.id,
            label: item.label,
            title: item.title,
            description: item.description,
            iconName: item.iconName,
            sortOrder: item.sortOrder,
          })),
        }

        const result = await updateSection(sectionId, {
          title: title.trim() || null,
          data: timelineData,
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
      title="活動年表を編集"
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
            placeholder="例: 活動履歴"
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
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getLucideIcon(item.iconName, Clock)
                      return (
                        <div className="shrink-0 p-1 rounded bg-muted">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )
                    })()}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {item.label || '（ラベル未入力）'}
                      </p>
                      <p className="font-medium text-sm truncate">
                        {item.title || '（タイトル未入力）'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-7">
                    {item.description || '（説明未入力）'}
                  </p>
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
                  <div className="space-y-1">
                    <Label htmlFor={`label-${item.id}`}>ラベル（日付やタイトル）</Label>
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
                      placeholder="例: 2023年 / プロローグ"
                      maxLength={50}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`title-${item.id}`}>タイトル</Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.title}
                      onChange={(e) => handleFieldChange(item.id, 'title', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="例: プロジェクト始動"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`description-${item.id}`}>説明</Label>
                    <Textarea
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="詳細な説明を入力"
                      rows={3}
                      maxLength={500}
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
                        onClick={() => setShowIconPicker(!showIconPicker)}
                      >
                        {(() => {
                          const Icon = item.iconName ? getLucideIcon(item.iconName, Smile) : Smile
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
                          onClick={handleClearIcon}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {showIconPicker && (
                      <div className="border rounded-lg overflow-hidden">
                        <IconSelector
                          selectedIcon={item.iconName ?? ''}
                          onIconSelect={(iconName) => {
                            handleFieldChange(item.id, 'iconName', iconName)
                            setShowIconPicker(false)
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
            「アイテムを追加」ボタンでタイムラインを追加してください
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
