"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { FAQ_LIMITS, type FaqActionResult } from "@/types/faq"

// Zodスキーマ定義
const createFaqCategorySchema = z.object({
  name: z.string()
    .min(1, "カテゴリ名は必須です")
    .max(FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH, `カテゴリ名は${FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH}文字以内で入力してください`),
  description: z.string()
    .max(FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH, `説明は${FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
})

const updateFaqCategorySchema = z.object({
  name: z.string()
    .min(1, "カテゴリ名は必須です")
    .max(FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH, `カテゴリ名は${FAQ_LIMITS.CATEGORY.NAME_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  description: z.string()
    .max(FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH, `説明は${FAQ_LIMITS.CATEGORY.DESCRIPTION_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  isVisible: z.boolean().optional(),
})

const createFaqQuestionSchema = z.object({
  question: z.string()
    .min(1, "質問は必須です")
    .max(FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH, `質問は${FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH}文字以内で入力してください`),
  answer: z.string()
    .min(1, "回答は必須です")
    .max(FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH, `回答は${FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH}文字以内で入力してください`),
})

const updateFaqQuestionSchema = z.object({
  question: z.string()
    .min(1, "質問は必須です")
    .max(FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH, `質問は${FAQ_LIMITS.QUESTION.QUESTION_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  answer: z.string()
    .min(1, "回答は必須です")
    .max(FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH, `回答は${FAQ_LIMITS.QUESTION.ANSWER_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  isVisible: z.boolean().optional(),
})

const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1, "並び替えるカテゴリが必要です"),
})

const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string()).min(1, "並び替える質問が必要です"),
})

// FAQカテゴリー一覧取得
export async function getFaqCategories(): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const categories = await prisma.faqCategory.findMany({
      where: { userId: session.user.id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" }
        }
      },
      orderBy: { sortOrder: "asc" }
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error("FAQカテゴリー取得エラー:", error)
    return { success: false, error: "FAQカテゴリーの取得に失敗しました" }
  }
}

// FAQカテゴリー作成
export async function createFaqCategory(data: z.infer<typeof createFaqCategorySchema>): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = createFaqCategorySchema.parse(data)

    // カテゴリー数制限チェック
    const existingCategoriesCount = await prisma.faqCategory.count({
      where: { userId: session.user.id }
    })

    if (existingCategoriesCount >= FAQ_LIMITS.CATEGORY.MAX_COUNT) {
      return { success: false, error: `カテゴリーは最大${FAQ_LIMITS.CATEGORY.MAX_COUNT}個まで作成できます` }
    }

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.faqCategory.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true }
    })

    const newSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    // カテゴリー作成
    const category = await prisma.faqCategory.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        sortOrder: newSortOrder,
      },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" }
        }
      }
    })

    revalidatePath("/dashboard/faq")
    return { success: true, data: category }
  } catch (error) {
    console.error("FAQカテゴリー作成エラー:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力データが無効です" }
    }
    return { success: false, error: "FAQカテゴリーの作成に失敗しました" }
  }
}

// FAQカテゴリー更新
export async function updateFaqCategory(categoryId: string, data: z.infer<typeof updateFaqCategorySchema>): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = updateFaqCategorySchema.parse(data)

    // 所有者確認
    const existingCategory = await prisma.faqCategory.findFirst({
      where: { 
        id: categoryId,
        userId: session.user.id 
      }
    })

    if (!existingCategory) {
      return { success: false, error: "カテゴリーが見つからないか、編集権限がありません" }
    }

    // カテゴリー更新
    const updatedCategory = await prisma.faqCategory.update({
      where: { id: categoryId },
      data: validatedData,
      include: {
        questions: {
          orderBy: { sortOrder: "asc" }
        }
      }
    })

    revalidatePath("/dashboard/faq")
    return { success: true, data: updatedCategory }
  } catch (error) {
    console.error("FAQカテゴリー更新エラー:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力データが無効です" }
    }
    return { success: false, error: "FAQカテゴリーの更新に失敗しました" }
  }
}

// FAQカテゴリー削除
export async function deleteFaqCategory(categoryId: string): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 所有者確認
    const existingCategory = await prisma.faqCategory.findFirst({
      where: { 
        id: categoryId,
        userId: session.user.id 
      }
    })

    if (!existingCategory) {
      return { success: false, error: "カテゴリーが見つからないか、削除権限がありません" }
    }

    // カテゴリー削除（関連する質問も自動削除される）
    await prisma.faqCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath("/dashboard/faq")
    return { success: true }
  } catch (error) {
    console.error("FAQカテゴリー削除エラー:", error)
    return { success: false, error: "FAQカテゴリーの削除に失敗しました" }
  }
}

// FAQカテゴリー並び替え
export async function reorderFaqCategories(data: z.infer<typeof reorderCategoriesSchema>): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = reorderCategoriesSchema.parse(data)

    // 所有者確認
    const userCategories = await prisma.faqCategory.findMany({
      where: { 
        userId: session.user.id,
        id: { in: validatedData.categoryIds }
      }
    })

    if (userCategories.length !== validatedData.categoryIds.length) {
      return { success: false, error: "一部のカテゴリーが見つからないか、編集権限がありません" }
    }

    // 並び替え実行
    await prisma.$transaction(
      validatedData.categoryIds.map((categoryId, index) =>
        prisma.faqCategory.update({
          where: { id: categoryId },
          data: { sortOrder: index }
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error("FAQカテゴリー並び替えエラー:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力データが無効です" }
    }
    return { success: false, error: "FAQカテゴリーの並び替えに失敗しました" }
  }
}

// FAQ質問作成
export async function createFaqQuestion(categoryId: string, data: z.infer<typeof createFaqQuestionSchema>): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = createFaqQuestionSchema.parse(data)

    // カテゴリー所有者確認
    const category = await prisma.faqCategory.findFirst({
      where: { 
        id: categoryId,
        userId: session.user.id 
      }
    })

    if (!category) {
      return { success: false, error: "カテゴリーが見つからないか、編集権限がありません" }
    }

    // 質問数制限チェック
    const existingQuestionsCount = await prisma.faqQuestion.count({
      where: { categoryId }
    })

    if (existingQuestionsCount >= FAQ_LIMITS.QUESTION.MAX_COUNT_PER_CATEGORY) {
      return { success: false, error: `1つのカテゴリーにつき質問は最大${FAQ_LIMITS.QUESTION.MAX_COUNT_PER_CATEGORY}個まで作成できます` }
    }

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.faqQuestion.aggregate({
      where: { categoryId },
      _max: { sortOrder: true }
    })

    const newSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    // 質問作成
    const question = await prisma.faqQuestion.create({
      data: {
        categoryId,
        question: validatedData.question,
        answer: validatedData.answer,
        sortOrder: newSortOrder,
      }
    })

    revalidatePath("/dashboard/faq")
    return { success: true, data: question }
  } catch (error) {
    console.error("FAQ質問作成エラー:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力データが無効です" }
    }
    return { success: false, error: "FAQ質問の作成に失敗しました" }
  }
}

// FAQ質問更新
export async function updateFaqQuestion(questionId: string, data: z.infer<typeof updateFaqQuestionSchema>): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = updateFaqQuestionSchema.parse(data)

    // 所有者確認（カテゴリー経由）
    const existingQuestion = await prisma.faqQuestion.findFirst({
      where: { id: questionId },
      include: {
        category: true
      }
    })

    if (!existingQuestion || existingQuestion.category.userId !== session.user.id) {
      return { success: false, error: "質問が見つからないか、編集権限がありません" }
    }

    // 質問更新
    const updatedQuestion = await prisma.faqQuestion.update({
      where: { id: questionId },
      data: validatedData
    })

    revalidatePath("/dashboard/faq")
    return { success: true, data: updatedQuestion }
  } catch (error) {
    console.error("FAQ質問更新エラー:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力データが無効です" }
    }
    return { success: false, error: "FAQ質問の更新に失敗しました" }
  }
}

// FAQ質問削除
export async function deleteFaqQuestion(questionId: string): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 所有者確認（カテゴリー経由）
    const existingQuestion = await prisma.faqQuestion.findFirst({
      where: { id: questionId },
      include: {
        category: true
      }
    })

    if (!existingQuestion || existingQuestion.category.userId !== session.user.id) {
      return { success: false, error: "質問が見つからないか、削除権限がありません" }
    }

    // 質問削除
    await prisma.faqQuestion.delete({
      where: { id: questionId }
    })

    revalidatePath("/dashboard/faq")
    return { success: true }
  } catch (error) {
    console.error("FAQ質問削除エラー:", error)
    return { success: false, error: "FAQ質問の削除に失敗しました" }
  }
}

// FAQ質問並び替え
export async function reorderFaqQuestions(categoryId: string, data: z.infer<typeof reorderQuestionsSchema>): Promise<FaqActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = reorderQuestionsSchema.parse(data)

    // カテゴリー所有者確認
    const category = await prisma.faqCategory.findFirst({
      where: { 
        id: categoryId,
        userId: session.user.id 
      }
    })

    if (!category) {
      return { success: false, error: "カテゴリーが見つからないか、編集権限がありません" }
    }

    // 質問の所有者確認
    const userQuestions = await prisma.faqQuestion.findMany({
      where: { 
        categoryId,
        id: { in: validatedData.questionIds }
      }
    })

    if (userQuestions.length !== validatedData.questionIds.length) {
      return { success: false, error: "一部の質問が見つからないか、編集権限がありません" }
    }

    // 並び替え実行
    await prisma.$transaction(
      validatedData.questionIds.map((questionId, index) =>
        prisma.faqQuestion.update({
          where: { id: questionId },
          data: { sortOrder: index }
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error("FAQ質問並び替えエラー:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力データが無効です" }
    }
    return { success: false, error: "FAQ質問の並び替えに失敗しました" }
  }
}