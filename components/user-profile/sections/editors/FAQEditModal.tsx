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
} from 'lucide-react'
import { getLucideIcon } from '@/lib/lucide-icons'
import { cn } from '@/lib/utils'
import type { FAQData } from '@/types/profile-sections'
import type { OldFAQData } from '@/lib/faq-compat'
import { normalizeQuestions } from '@/lib/faq-compat'
import { nanoid } from 'nanoid'

interface FAQEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: FAQData
  currentTitle?: string
}

type EditingQuestion = {
  id: string
  question: string
  answer: string
  iconName?: string
  sortOrder: number
}

// 編集中の質問ID（questionsから直接取得するためIDのみ管理）
type EditingItemId = string | null

/**
 * FAQ編集モーダル
 * 単一の質問リスト（カテゴリーなし）・タイトル入力・アイコン選択に対応
 */
export function FAQEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
  currentTitle,
}: FAQEditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState(currentTitle ?? '')
  const [questions, setQuestions] = useState<EditingQuestion[]>(() =>
    normalizeQuestions(currentData as FAQData | OldFAQData)
  )
  const [editingItemId, setEditingItemId] = useState<EditingItemId>(null)
  const [editingBackup, setEditingBackup] = useState<EditingQuestion | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isPending, startTransition] = useTransition()

  // 質問を追加（自動的に編集モードに）
  const handleAddQuestion = () => {
    const newQuestion: EditingQuestion = {
      id: nanoid(),
      question: '',
      answer: '',
      sortOrder: questions.length,
    }
    setQuestions([...questions, newQuestion])
    setEditingBackup({ ...newQuestion }) // バックアップ保存
    setEditingItemId(newQuestion.id) // 自動的に編集モードに
    setShowIconPicker(false)
  }

  // 編集を閉じる（内容は保持、バックアップはクリア）
  const handleCloseEdit = () => {
    setEditingItemId(null)
    setEditingBackup(null)
    setShowIconPicker(false)
  }

  // 質問の編集を開始/終了（トグル）
  const handleToggleEdit = (itemId: string) => {
    if (editingItemId === itemId) {
      handleCloseEdit()
      return
    }
    const item = questions.find((q) => q.id === itemId)
    if (item) {
      setEditingBackup({ ...item }) // バックアップ保存
      setEditingItemId(itemId)
      setShowIconPicker(false)
    }
  }

  // フィールド変更（ローカルstateのみ更新、DB保存なし）
  const handleFieldChange = <K extends keyof EditingQuestion>(
    itemId: string,
    field: K,
    value: EditingQuestion[K]
  ) => {
    setQuestions((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    )
  }

  // Escapeキーで編集キャンセル（編集中の質問のみ元に戻す）
  const handleEscapeEdit = () => {
    if (editingItemId && editingBackup) {
      // 編集中のアイテムのみバックアップから復元
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === editingItemId ? { ...editingBackup } : item
        )
      )
    }
    setEditingItemId(null)
    setEditingBackup(null)
    setShowIconPicker(false)
  }

  // 質問を削除（ローカルstateのみ更新、DB保存なし）
  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('この質問を削除しますか？')) return
    const filtered = questions.filter((q) => q.id !== questionId)
    const updatedQuestions = filtered.map((q, idx) => ({ ...q, sortOrder: idx }))
    setQuestions(updatedQuestions)
    // DB保存はしない（完了ボタンで一括保存）
  }

  // 質問を上下に移動（ローカルstateのみ更新、DB保存なし）
  const handleMoveOrder = (questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex((q) => q.id === questionId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newQuestions = [...questions]
    ;[newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ]
    const updatedQuestions = newQuestions.map((q, idx) => ({ ...q, sortOrder: idx }))
    setQuestions(updatedQuestions)
    // DB保存はしない（完了ボタンで一括保存）
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
    const invalidQuestions = questions.filter((q) => !q.question.trim() || !q.answer.trim())
    if (invalidQuestions.length > 0) {
      toast.error('質問または回答が未入力の項目があります')
      return
    }

    startTransition(async () => {
      try {
        const faqData: FAQData = {
          questions: questions.map((q) => ({
            id: q.id,
            question: q.question,
            answer: q.answer,
            iconName: q.iconName,
            sortOrder: q.sortOrder,
          })),
        }

        const result = await updateSection(sectionId, {
          title: title.trim() || null,
          data: faqData,
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
      title="FAQを編集"
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
            placeholder="例: よくある質問"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{title.length}/50文字</p>
        </div>

        <Separator />

        {/* 質問追加ボタン */}
        <Button
          onClick={handleAddQuestion}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={!!editingItemId}
        >
          <Plus className="w-4 h-4 mr-2" />
          質問を追加
        </Button>

        {/* 質問一覧 */}
        {questions.map((q, index) => {
          const isEditing = editingItemId === q.id

          return (
            <Collapsible
              key={q.id}
              open={isEditing}
              onOpenChange={(open) => {
                if (open) {
                  handleToggleEdit(q.id)
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
                    {q.iconName && (() => {
                      const Icon = getLucideIcon(q.iconName)
                      return (
                        <div className="shrink-0 p-1 rounded bg-muted">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )
                    })()}
                    <p className="font-medium text-sm truncate">
                      {q.question || '（質問未入力）'}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {q.answer || '（回答未入力）'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={editingItemId !== null && editingItemId !== q.id}
                    >
                      <Pencil className={cn("w-3.5 h-3.5", isEditing && "text-primary")} />
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteQuestion(q.id)}
                    disabled={!!editingItemId}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveOrder(q.id, 'up')}
                    disabled={index === 0 || !!editingItemId}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveOrder(q.id, 'down')}
                    disabled={index === questions.length - 1 || !!editingItemId}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 展開される編集フォーム */}
              <CollapsibleContent>
                <div className="pt-3 mt-3 border-t space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`question-${q.id}`}>質問</Label>
                    <Input
                      id={`question-${q.id}`}
                      value={q.question}
                      onChange={(e) => handleFieldChange(q.id, 'question', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="質問を入力"
                      maxLength={100}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`answer-${q.id}`}>回答</Label>
                    <Textarea
                      id={`answer-${q.id}`}
                      value={q.answer}
                      onChange={(e) => handleFieldChange(q.id, 'answer', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="回答を入力"
                      rows={3}
                      maxLength={1000}
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
                          const Icon = q.iconName ? getLucideIcon(q.iconName, Smile) : Smile
                          return <Icon className="w-4 h-4 mr-1" />
                        })()}
                        {q.iconName ? 'アイコン変更' : 'アイコンを選択'}
                      </Button>
                      {q.iconName && (
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
                          selectedIcon={q.iconName ?? ''}
                          onIconSelect={(iconName) => {
                            handleFieldChange(q.id, 'iconName', iconName)
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

        {questions.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">
            「質問を追加」ボタンで質問を追加してください
          </p>
        )}
      </div>
    </EditModal>
  )
}
