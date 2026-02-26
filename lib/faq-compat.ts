import type { FAQData } from '@/types/profile-sections'

/**
 * 旧形式（categories配列）との後方互換用型
 * 新規作成・更新では使用しない
 */
export interface OldFAQData {
  categories: {
    id: string
    name?: string
    sortOrder: number
    questions: {
      id: string
      question: string
      answer: string
      sortOrder: number
    }[]
  }[]
}

export type NormalizedQuestion = {
  id: string
  question: string
  answer: string
  iconName?: string
  sortOrder: number
}

/**
 * 新旧両形式のFAQデータを正規化してフラットな質問リストに変換する
 */
export function normalizeQuestions(
  data: FAQData | OldFAQData
): NormalizedQuestion[] {
  if ('questions' in data && Array.isArray(data.questions)) {
    return data.questions
  }
  if ('categories' in data && Array.isArray((data as OldFAQData).categories)) {
    return (data as OldFAQData).categories
      .toSorted((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((cat) =>
        cat.questions.map((q) => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          sortOrder: q.sortOrder,
        }))
      )
  }
  return []
}
