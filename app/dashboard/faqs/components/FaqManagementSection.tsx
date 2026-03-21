'use client'

import React from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FaqCategoryCard } from './FaqCategoryCard'
import {
  getFaqCategories,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  reorderFaqCategories,
  createFaqQuestion,
  updateFaqQuestion,
  deleteFaqQuestion,
  reorderFaqQuestions,
  updateFaqCategorySettings,
} from '@/app/actions/content/faq-actions'
import { FAQ_LIMITS } from '@/types/faq'
import type { FaqCategoryBase, FaqQuestionBase } from '@/types/faq'
import type { SectionSettings, SectionBackgroundPreset } from '@/types/profile-sections'

type FaqQuestion = FaqQuestionBase & { parentId?: string }
type FaqCategory = FaqCategoryBase & { questions?: FaqQuestion[] }

interface FaqManagementSectionProps {
  initialFaqCategories: unknown[]
  presets: SectionBackgroundPreset[]
}

export function FaqManagementSection({ initialFaqCategories, presets }: FaqManagementSectionProps) {
  // SWRでデータ管理
  const { data: faqCategories = initialFaqCategories as FaqCategory[], mutate } = useSWR(
    'faq-categories',
    async () => {
      const result = await getFaqCategories()
      if (!result.success) {
        throw new Error(result.error || 'データ取得に失敗しました')
      }
      return (result.data || []) as FaqCategory[]
    },
    {
      fallbackData: initialFaqCategories as FaqCategory[],
      revalidateOnFocus: false,
    }
  )

  // ===== カテゴリー操作 =====

  const handleCategoryReorder = async (reorderedCategories: FaqCategory[]) => {
    const categoryIds = reorderedCategories.map((cat) => cat.id)
    try {
      await mutate(reorderedCategories, false)
      const result = await reorderFaqCategories({ categoryIds })
      if (!result.success) throw new Error(result.error)
      toast.success('カテゴリーの順序を更新しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの並び替えに失敗しました')
    }
  }

  const handleCategoryMoveUp = async (categoryId: string) => {
    const index = faqCategories.findIndex((c) => c.id === categoryId)
    if (index <= 0) return
    await handleCategoryReorder(arrayMove(faqCategories, index, index - 1))
  }

  const handleCategoryMoveDown = async (categoryId: string) => {
    const index = faqCategories.findIndex((c) => c.id === categoryId)
    if (index < 0 || index >= faqCategories.length - 1) return
    await handleCategoryReorder(arrayMove(faqCategories, index, index + 1))
  }

  const handleCategoryAdd = async () => {
    try {
      const result = await createFaqCategory({
        name: `新しいカテゴリー`,
        description: '',
      })
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return [...current, result.data as FaqCategory]
      }, false)
      toast.success('カテゴリーを作成しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの作成に失敗しました')
    }
  }

  const handleCategoryEdit = async (categoryId: string, updates: Partial<FaqCategory>) => {
    try {
      const result = await updateFaqCategory(categoryId, {
        name: updates.name,
        description: updates.description ?? undefined,
        isVisible: updates.isVisible,
      })
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return current.map((cat) => cat.id === categoryId ? { ...cat, ...updates } : cat)
      }, false)
      toast.success('保存しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの更新に失敗しました')
      throw error
    }
  }

  const handleCategoryDelete = async (categoryId: string) => {
    try {
      const result = await deleteFaqCategory(categoryId)
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return current.filter((cat) => cat.id !== categoryId)
      }, false)
      toast.success('カテゴリーを削除しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの削除に失敗しました')
    }
  }

  const handleStyleSave = async (categoryId: string, settings: SectionSettings | null) => {
    try {
      const result = await updateFaqCategorySettings(categoryId, settings)
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return current.map((cat) => cat.id === categoryId ? { ...cat, settings } : cat)
      }, false)
      toast.success('スタイルを保存しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'スタイルの保存に失敗しました')
      throw error
    }
  }

  // ===== 質問操作 =====

  const handleQuestionReorder = async (categoryId: string, reorderedQuestions: FaqQuestion[]) => {
    const questionIds = reorderedQuestions.map((q) => q.id)
    try {
      await mutate((current) => {
        if (!current) return current
        return current.map((cat) =>
          cat.id === categoryId ? { ...cat, questions: reorderedQuestions } : cat
        )
      }, false)
      const result = await reorderFaqQuestions(categoryId, { questionIds })
      if (!result.success) throw new Error(result.error)
      toast.success('質問の順序を更新しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '質問の並び替えに失敗しました')
    }
  }

  const handleQuestionMoveUp = async (categoryId: string, questionId: string) => {
    const questions = faqCategories.find((c) => c.id === categoryId)?.questions ?? []
    const index = questions.findIndex((q) => q.id === questionId)
    if (index <= 0) return
    await handleQuestionReorder(categoryId, arrayMove(questions, index, index - 1))
  }

  const handleQuestionMoveDown = async (categoryId: string, questionId: string) => {
    const questions = faqCategories.find((c) => c.id === categoryId)?.questions ?? []
    const index = questions.findIndex((q) => q.id === questionId)
    if (index < 0 || index >= questions.length - 1) return
    await handleQuestionReorder(categoryId, arrayMove(questions, index, index + 1))
  }

  const handleQuestionAdd = async (categoryId: string) => {
    try {
      const result = await createFaqQuestion(categoryId, {
        question: '新しい質問',
        answer: '新しい回答',
      })
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return current.map((cat) => {
          if (cat.id === categoryId) {
            const newQuestion = {
              ...(result.data as FaqQuestion),
              parentId: categoryId,
            }
            return { ...cat, questions: [...(cat.questions || []), newQuestion] }
          }
          return cat
        })
      }, false)
      toast.success('質問を作成しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '質問の作成に失敗しました')
    }
  }

  const handleQuestionEdit = async (categoryId: string, questionId: string, updates: Partial<FaqQuestion>) => {
    try {
      const result = await updateFaqQuestion(questionId, {
        question: updates.question,
        answer: updates.answer,
        isVisible: updates.isVisible,
      })
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return current.map((cat) => {
          if (cat.id === categoryId) {
            const updatedQuestions = (cat.questions || []).map((q) =>
              q.id === questionId ? { ...q, ...updates } : q
            )
            return { ...cat, questions: updatedQuestions }
          }
          return cat
        })
      }, false)
      toast.success('保存しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '質問の更新に失敗しました')
      throw error
    }
  }

  const handleQuestionDelete = async (categoryId: string, questionId: string) => {
    try {
      const result = await deleteFaqQuestion(questionId)
      if (!result.success) throw new Error(result.error)
      await mutate((current) => {
        if (!current) return current
        return current.map((cat) => {
          if (cat.id === categoryId) {
            const updatedQuestions = (cat.questions || []).filter((q) => q.id !== questionId)
            return { ...cat, questions: updatedQuestions }
          }
          return cat
        })
      }, false)
      toast.success('質問を削除しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '質問の削除に失敗しました')
    }
  }

  return (
    <div>
      {/* カテゴリーカード一覧（SectionBandで全幅表示） */}
      {faqCategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">カテゴリーがありません</p>
          <p className="text-xs mt-1">下のボタンからカテゴリーを追加してください</p>
        </div>
      ) : (
        faqCategories.map((category, index) => (
          <FaqCategoryCard
            key={category.id}
            category={category}
            index={index}
            totalCount={faqCategories.length}
            presets={presets}
            onMoveUp={handleCategoryMoveUp}
            onMoveDown={handleCategoryMoveDown}
            onEdit={handleCategoryEdit}
            onDelete={handleCategoryDelete}
            onQuestionMoveUp={handleQuestionMoveUp}
            onQuestionMoveDown={handleQuestionMoveDown}
            onQuestionAdd={handleQuestionAdd}
            onQuestionEdit={handleQuestionEdit}
            onQuestionDelete={handleQuestionDelete}
            onStyleSave={handleStyleSave}
          />
        ))
      )}

      {/* カテゴリー追加ボタン（中央寄せ） */}
      {faqCategories.length < FAQ_LIMITS.CATEGORY.MAX_COUNT && (
        <div className="py-4 flex justify-center">
          <Button
            variant="outline"
            onClick={handleCategoryAdd}
          >
            <Plus className="h-4 w-4 mr-1" />
            新しいカテゴリーを追加
          </Button>
        </div>
      )}
    </div>
  )
}
