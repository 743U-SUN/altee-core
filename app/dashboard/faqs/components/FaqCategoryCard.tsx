'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Plus, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SectionBand } from '@/components/profile/SectionBand'

const SectionStylePanel = dynamic(
  () => import('@/components/user-profile/SectionStylePanel').then((m) => ({ default: m.SectionStylePanel })),
  { ssr: false }
)
import { resolvePreset } from '@/lib/sections/background-utils'
import type { SectionSettings, SectionBackgroundPreset } from '@/types/profile-sections'
import { FAQ_LIMITS } from '@/types/faq'

interface FaqQuestion {
  id: string
  question: string
  answer: string
  sortOrder: number
  categoryId: string
  parentId?: string
  isVisible: boolean
}

interface FaqCategory {
  id: string
  name: string
  description: string | null
  isVisible: boolean
  settings: SectionSettings | null
  questions?: FaqQuestion[]
}

interface FaqCategoryCardProps {
  category: FaqCategory
  index: number
  totalCount: number
  presets: SectionBackgroundPreset[]
  onMoveUp: (categoryId: string) => Promise<void>
  onMoveDown: (categoryId: string) => Promise<void>
  onEdit: (categoryId: string, updates: Partial<FaqCategory>) => Promise<void>
  onDelete: (categoryId: string) => Promise<void>
  onQuestionMoveUp: (categoryId: string, questionId: string) => Promise<void>
  onQuestionMoveDown: (categoryId: string, questionId: string) => Promise<void>
  onQuestionAdd: (categoryId: string) => Promise<void>
  onQuestionEdit: (categoryId: string, questionId: string, updates: Partial<FaqQuestion>) => Promise<void>
  onQuestionDelete: (categoryId: string, questionId: string) => Promise<void>
  onStyleSave: (categoryId: string, settings: SectionSettings | null) => Promise<void>
}

/**
 * FAQカテゴリーカード
 * Profile-editorのEditableSectionWrapperと同様のツールバーを持つ
 * SectionBandで背景プリセットをリアルタイムプレビュー
 */
export function FaqCategoryCard({
  category,
  index,
  totalCount,
  presets,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  onQuestionMoveUp,
  onQuestionMoveDown,
  onQuestionAdd,
  onQuestionEdit,
  onQuestionDelete,
  onStyleSave,
}: FaqCategoryCardProps) {
  const [isStyleOpen, setIsStyleOpen] = useState(false)
  // keyカウンターでSectionStylePanelをリマウントし、staleな内部状態を防ぐ
  const [styleKey, setStyleKey] = useState(0)
  const [localSettings, setLocalSettings] = useState<SectionSettings | null>(category.settings)

  // パネルを開く前の設定を記録（キャンセル時にリバート）
  const preEditSettingsRef = useRef<SectionSettings | null>(category.settings)

  const questions = category.questions ?? []
  const currentPreset = resolvePreset(localSettings?.background, presets)

  const handleStyleOpen = () => {
    preEditSettingsRef.current = localSettings
    setStyleKey((k) => k + 1)
    setIsStyleOpen(true)
  }

  const handleStyleClose = () => {
    setIsStyleOpen(false)
    // キャンセルの場合はパネルを開く前の設定に戻す
    setLocalSettings(preEditSettingsRef.current)
  }

  const handleStyleSave = async (settings: SectionSettings) => {
    // 保存成功時はpreEditSettingsRefを更新し、closeしてもリバートされないようにする
    preEditSettingsRef.current = settings
    setLocalSettings(settings)
    await onStyleSave(category.id, settings)
  }

  return (
    <>
      {/* SectionBandで背景プリセットをリアルタイムプレビュー */}
      <SectionBand settings={localSettings} preset={currentPreset} fullBleed>
        <div className="max-w-[768px] mx-auto px-4 py-4 pb-14">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                {/* カテゴリー名・説明（インライン編集） */}
                <div className="flex-1 space-y-2 min-w-0">
                  <CategoryNameInput
                    value={category.name}
                    onSave={(name) => onEdit(category.id, { name })}
                  />
                  <CategoryDescriptionInput
                    value={category.description ?? ''}
                    onSave={(description) =>
                      onEdit(category.id, { description: description || null })
                    }
                  />
                </div>

                {/* 表示/非表示スイッチ */}
                <div className="flex items-center gap-1.5 pt-1 shrink-0">
                  {category.isVisible ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={category.isVisible}
                    onCheckedChange={(checked) => onEdit(category.id, { isVisible: checked })}
                    aria-label="カテゴリーの表示/非表示"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {/* 質問リスト */}
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Q&Aがありません
                </p>
              ) : (
                questions.map((question, qIndex) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    index={qIndex}
                    totalCount={questions.length}
                    categoryId={category.id}
                    onMoveUp={onQuestionMoveUp}
                    onMoveDown={onQuestionMoveDown}
                    onEdit={onQuestionEdit}
                    onDelete={onQuestionDelete}
                  />
                ))
              )}

              {/* Q&A追加ボタン */}
              {questions.length < FAQ_LIMITS.QUESTION.MAX_COUNT_PER_CATEGORY && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => onQuestionAdd(category.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Q&Aを追加
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 浮動ツールバー（Profile-editorのEditableSectionWrapperと同じスタイル） */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-1 bg-gray-800/70 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              onClick={() => onMoveUp(category.id)}
              disabled={index === 0}
              title="上へ移動"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              onClick={() => onMoveDown(category.id)}
              disabled={index === totalCount - 1}
              title="下へ移動"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-gray-500/50 mx-1" />

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              onClick={handleStyleOpen}
              title="スタイル設定"
            >
              <Palette className="h-4 w-4" />
            </Button>

            <div className="w-px h-5 bg-gray-500/50 mx-1" />

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full"
              onClick={() => onDelete(category.id)}
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SectionBand>

      {/* スタイル設定パネル（keyでリマウントして内部状態をリセット） */}
      <SectionStylePanel
        key={styleKey}
        isOpen={isStyleOpen}
        onClose={handleStyleClose}
        currentSettings={localSettings}
        presets={presets}
        onSettingsChange={setLocalSettings}
        onSave={handleStyleSave}
      />
    </>
  )
}

// ===== カテゴリー名インライン編集 =====

function CategoryNameInput({
  value,
  onSave,
}: {
  value: string
  onSave: (value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  const handleBlur = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraft(value)
      setEditing(false)
      return
    }
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onSave(trimmed)
    } catch {
      setDraft(value)
    } finally {
      setIsSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        maxLength={FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH}
        className="h-7 text-sm font-semibold"
        disabled={isSaving}
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      className="text-sm font-semibold text-left hover:underline focus:outline-none truncate w-full"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      {value}
    </button>
  )
}

// ===== カテゴリー説明インライン編集 =====

function CategoryDescriptionInput({
  value,
  onSave,
}: {
  value: string
  onSave: (value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  const handleBlur = async () => {
    if (draft === value) {
      setEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onSave(draft)
    } catch {
      setDraft(value)
    } finally {
      setIsSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
        maxLength={FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH}
        className="text-xs min-h-[60px] resize-none"
        placeholder="カテゴリーの説明（オプション）"
        disabled={isSaving}
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      className="text-xs text-muted-foreground text-left hover:underline focus:outline-none line-clamp-2 w-full"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      {value || <span className="italic">説明なし（クリックして編集）</span>}
    </button>
  )
}

// ===== 質問アイテム =====

function QuestionItem({
  question,
  index,
  totalCount,
  categoryId,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  question: FaqQuestion
  index: number
  totalCount: number
  categoryId: string
  onMoveUp: (categoryId: string, questionId: string) => Promise<void>
  onMoveDown: (categoryId: string, questionId: string) => Promise<void>
  onEdit: (categoryId: string, questionId: string, updates: Partial<FaqQuestion>) => Promise<void>
  onDelete: (categoryId: string, questionId: string) => Promise<void>
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-2">
      {/* 並べ替えボタン */}
      <div className="flex flex-col gap-0.5 pt-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={index === 0}
          onClick={() => onMoveUp(categoryId, question.id)}
          aria-label="質問を上へ移動"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          disabled={index === totalCount - 1}
          onClick={() => onMoveDown(categoryId, question.id)}
          aria-label="質問を下へ移動"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 質問・回答 */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <QuestionTextInput
          label="Q"
          value={question.question}
          maxLength={FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH}
          onSave={(q) => onEdit(categoryId, question.id, { question: q })}
        />
        <QuestionTextInput
          label="A"
          value={question.answer}
          maxLength={FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH}
          multiline
          onSave={(a) => onEdit(categoryId, question.id, { answer: a })}
        />
      </div>

      {/* 表示切替 + 削除 */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <Switch
          checked={question.isVisible}
          onCheckedChange={(checked) => onEdit(categoryId, question.id, { isVisible: checked })}
          aria-label="質問の表示/非表示"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => onDelete(categoryId, question.id)}
          aria-label="質問を削除"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// ===== 質問テキストインライン編集 =====

function QuestionTextInput({
  label,
  value,
  maxLength,
  multiline,
  onSave,
}: {
  label: string
  value: string
  maxLength: number
  multiline?: boolean
  onSave: (value: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  const handleBlur = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraft(value)
      setEditing(false)
      return
    }
    if (trimmed === value) {
      setEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onSave(trimmed)
    } catch {
      setDraft(value)
    } finally {
      setIsSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    const commonProps = {
      value: draft,
      onBlur: handleBlur,
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!multiline && e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      },
      maxLength,
      disabled: isSaving,
      autoFocus: true,
    }

    return (
      <div className="flex items-start gap-1">
        <Label className="text-xs font-bold pt-1 w-4 shrink-0">{label}.</Label>
        {multiline ? (
          <Textarea
            {...commonProps}
            onChange={(e) => setDraft(e.target.value)}
            className="text-xs min-h-[50px] resize-none flex-1"
          />
        ) : (
          <Input
            {...commonProps}
            onChange={(e) => setDraft(e.target.value)}
            className="h-6 text-xs flex-1"
          />
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      className="flex items-start gap-1 w-full text-left hover:underline focus:outline-none"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      <span className="text-xs font-bold pt-0.5 w-4 shrink-0">{label}.</span>
      <span className="text-xs line-clamp-3 flex-1">{value}</span>
    </button>
  )
}
