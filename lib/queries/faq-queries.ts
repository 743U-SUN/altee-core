import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'
import type { FaqActionResult } from '@/types/faq'

/**
 * ダッシュボード用: ログインユーザーのFAQカテゴリー一覧取得
 */
export const getDashboardFaqCategories = cache(async (userId: string) => {
  return prisma.faqCategory.findMany({
    where: { userId },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
})

/**
 * 公開FAQ取得（ハンドルから）
 */
export const getPublicFaqByHandle = cache(async (
  handle: string
): Promise<FaqActionResult> => {
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)

  try {
    const user = await prisma.user.findUnique({
      where: { handle: normalized },
      select: { id: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return { success: false, error: 'ユーザーが見つかりません' }
    }

    const categories = await prisma.faqCategory.findMany({
      where: { userId: user.id, isVisible: true },
      include: {
        questions: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error('公開FAQ取得エラー:', error)
    return { success: false, error: 'FAQの取得に失敗しました' }
  }
})
