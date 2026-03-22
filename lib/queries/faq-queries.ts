import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
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
 * 'use cache' でクロスリクエストキャッシュ
 */
export async function getPublicFaqByHandle(handle: string): Promise<FaqActionResult> {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`faq-${normalized}`)

  try {
    const user = await prisma.user.findUnique({
      where: { handle: normalized },
      select: {
        id: true,
        isActive: true,
        faqCategories: {
          where: { isVisible: true },
          include: {
            questions: {
              where: { isVisible: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!user || !user.isActive) {
      return { success: false, error: 'ユーザーが見つかりません' }
    }

    return { success: true, data: user.faqCategories }
  } catch {
    return { success: false, error: 'FAQの取得に失敗しました' }
  }
}
