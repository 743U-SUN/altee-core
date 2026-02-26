'use client'

import React, { useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { NestedSortableList } from '@/components/sortable-list'
import type {
  NestedSortableListConfig,
  EditableField
} from '@/components/sortable-list'
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
} from '@/app/actions/content/faq-actions'
import { FAQ_LIMITS } from '@/types/faq'

interface FaqCategory {
  id: string
  name: string
  description?: string
  questions?: FaqQuestion[]
  sortOrder: number
  isVisible?: boolean
}

interface FaqQuestion {
  id: string
  question: string
  answer: string
  sortOrder: number
  categoryId: string
  parentId: string // SortableChildItemインターフェースで必要
  isVisible?: boolean
}

interface FaqManagementSectionProps {
  initialFaqCategories: unknown[]
}

// カテゴリー用の編集可能フィールド（静的コンフィグはコンポーネント外に配置）
const CATEGORY_FIELDS: EditableField[] = [
  {
    key: 'name',
    label: 'カテゴリ名',
    type: 'text',
    placeholder: 'カテゴリ名を入力してください',
    maxLength: FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH,
    validation: (value: string) => {
      if (!value.trim()) return 'カテゴリ名は必須です'
      if (value.length > FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH) {
        return `カテゴリ名は${FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH}文字以内で入力してください`
      }
      return null
    }
  },
  {
    key: 'description',
    label: '説明',
    type: 'textarea',
    placeholder: 'カテゴリの説明を入力してください（オプション）',
    maxLength: FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH,
    validation: (value: string) => {
      if (value && value.length > FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH) {
        return `説明は${FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`
      }
      return null
    }
  }
]

// 質問用の編集可能フィールド
const QUESTION_FIELDS: EditableField[] = [
  {
    key: 'question',
    label: '質問',
    type: 'text',
    placeholder: '質問を入力してください',
    maxLength: FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH,
    validation: (value: string) => {
      if (!value.trim()) return '質問は必須です'
      if (value.length > FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH) {
        return `質問は${FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH}文字以内で入力してください`
      }
      return null
    }
  },
  {
    key: 'answer',
    label: '回答',
    type: 'textarea',
    placeholder: '回答を入力してください',
    maxLength: FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH,
    validation: (value: string) => {
      if (!value.trim()) return '回答は必須です'
      if (value.length > FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH) {
        return `回答は${FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH}文字以内で入力してください`
      }
      return null
    }
  }
]

export function FaqManagementSection({ initialFaqCategories }: FaqManagementSectionProps) {
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

  // カテゴリーのイベントハンドラー
  const handleCategoryReorder = useCallback(async (reorderedCategories: FaqCategory[]) => {
    const categoryIds = reorderedCategories.map((cat: FaqCategory) => cat.id)

    try {
      // 楽観的更新 (ドラッグ&ドロップの応答性のため)
      await mutate(reorderedCategories, false)

      const result = await reorderFaqCategories({ categoryIds })
      if (!result.success) {
        throw new Error(result.error)
        // エラー時は自動でSWRが元データに戻すのでロールバック不要
      }

      toast.success('カテゴリーの順序を更新しました')
    } catch (error) {
      // SWRが自動でリフェッチするためロールバック不要
      toast.error(error instanceof Error ? error.message : 'カテゴリーの並び替えに失敗しました')
    }
  }, [mutate])

  const handleCategoryAdd = useCallback(async () => {
    try {
      const result = await createFaqCategory({
        name: `新しいカテゴリー`,
        description: '新しいカテゴリーの説明'
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // 楽観的更新: 最新データを追加
      await mutate((current) => {
        if (!current) return current
        return [...current, result.data as FaqCategory]
      }, false)

      toast.success('カテゴリーを作成しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの作成に失敗しました')
    }
  }, [mutate])

  const handleCategoryEdit = useCallback(async (itemId: string, updates: Partial<FaqCategory>) => {
    try {
      // InlineEditの編集時は全体ローディングを表示しない（InlineEdit自体のisSavingのみ表示）
      const result = await updateFaqCategory(itemId, {
        name: updates.name,
        description: updates.description,
        isVisible: updates.isVisible
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Server Action成功後に更新
      await mutate((current) => {
        if (!current) return current
        return current.map(cat =>
          cat.id === itemId ? { ...cat, ...updates } : cat
        )
      }, false)

      toast.success('保存しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの更新に失敗しました')
      throw error // InlineEditがエラーハンドリングするためにthrow
    }
  }, [mutate])

  const handleCategoryDelete = useCallback(async (itemId: string) => {
    try {
      const result = await deleteFaqCategory(itemId)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Server Action成功後に削除
      await mutate((current) => {
        if (!current) return current
        return current.filter(cat => cat.id !== itemId)
      }, false)

      toast.success('カテゴリーを削除しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリーの削除に失敗しました')
    }
  }, [mutate])

  // 質問のイベントハンドラー
  const handleQuestionReorder = useCallback(async (categoryId: string, reorderedQuestions: FaqQuestion[]) => {
    const questionIds = reorderedQuestions.map(q => q.id)

    try {
      // 楽観的更新 (ドラッグ&ドロップの応答性のため)
      await mutate((current) => {
        if (!current) return current
        return current.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, questions: reorderedQuestions }
          }
          return cat
        })
      }, false)

      const result = await reorderFaqQuestions(categoryId, { questionIds })

      if (!result.success) {
        throw new Error(result.error)
        // エラー時は自動でSWRが元データに戻すのでロールバック不要
      }

      toast.success('質問の順序を更新しました')
    } catch (error) {
      // SWRが自動でリフェッチするためロールバック不要
      toast.error(error instanceof Error ? error.message : '質問の並び替えに失敗しました')
    }
  }, [mutate])

  const handleQuestionAdd = useCallback(async (categoryId: string) => {
    try {
      const result = await createFaqQuestion(categoryId, {
        question: '新しい質問',
        answer: '新しい回答'
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Server Action成功後にカテゴリの質問リストに追加
      await mutate((current) => {
        if (!current) return current
        return current.map(cat => {
          if (cat.id === categoryId) {
            const newQuestion = {
              ...(result.data as FaqQuestion),
              parentId: categoryId
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
  }, [mutate])

  const handleQuestionEdit = useCallback(async (categoryId: string, itemId: string, updates: Partial<FaqQuestion>) => {
    try {
      // InlineEditの編集時は全体ローディングを表示しない（InlineEdit自体のisSavingのみ表示）
      const result = await updateFaqQuestion(itemId, {
        question: updates.question,
        answer: updates.answer,
        isVisible: updates.isVisible
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Server Action成功後に更新
      await mutate((current) => {
        if (!current) return current
        return current.map(cat => {
          if (cat.id === categoryId) {
            const updatedQuestions = (cat.questions || []).map(q =>
              q.id === itemId ? { ...q, ...updates } : q
            )
            return { ...cat, questions: updatedQuestions }
          }
          return cat
        })
      }, false)

      toast.success('保存しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '質問の更新に失敗しました')
      throw error // InlineEditがエラーハンドリングするためにthrow
    }
  }, [mutate])

  const handleQuestionDelete = useCallback(async (categoryId: string, itemId: string) => {
    try {
      const result = await deleteFaqQuestion(itemId)

      if (!result.success) {
        throw new Error(result.error)
      }

      // Server Action成功後に削除
      await mutate((current) => {
        if (!current) return current
        return current.map(cat => {
          if (cat.id === categoryId) {
            const updatedQuestions = (cat.questions || []).filter(q => q.id !== itemId)
            return { ...cat, questions: updatedQuestions }
          }
          return cat
        })
      }, false)

      toast.success('質問を削除しました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '質問の削除に失敗しました')
    }
  }, [mutate])

  // ネストしたリストの設定
  const nestedConfig: NestedSortableListConfig<FaqCategory, FaqQuestion> = {
    parentItems: faqCategories,
    // getChildItemsをインライン化して循環依存を回避
    getChildItems: (categoryId: string): FaqQuestion[] => {
      const category = faqCategories?.find((cat: FaqCategory) => cat.id === categoryId)
      return category?.questions || []
    },
    parentConfig: {
      editableFields: CATEGORY_FIELDS,
      itemDisplayName: (item) => item.name || '新しいカテゴリー',
      onReorder: handleCategoryReorder,
      onAdd: handleCategoryAdd,
      onEdit: handleCategoryEdit,
      onDelete: handleCategoryDelete,
      maxItems: FAQ_LIMITS.CATEGORY.MAX_COUNT,
      addButtonText: '新しいカテゴリーを追加',
      emptyStateText: 'カテゴリーがありません',
      emptyStateDescription: '上のボタンからカテゴリーを追加してください',
    },
    childConfig: {
      editableFields: QUESTION_FIELDS,
      itemDisplayName: (item) => item.question || '新しい質問',
      onReorder: handleQuestionReorder,
      onAdd: handleQuestionAdd,
      onEdit: handleQuestionEdit,
      onDelete: handleQuestionDelete,
      maxItems: FAQ_LIMITS.QUESTION.MAX_COUNT_PER_CATEGORY,
      addButtonText: 'Q&Aを追加',
      emptyStateText: 'Q&Aがありません',
      emptyStateDescription: '上のボタンからQ&Aを追加してください',
      childListLabel: (parentItem, childCount) => `Q&A管理 (${childCount}個)`,
    },
  }

  return (
    <NestedSortableList<FaqCategory, FaqQuestion>
      config={nestedConfig}
    />
  )
}