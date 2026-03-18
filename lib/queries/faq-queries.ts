import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { FaqActionResult } from '@/types/faq'

const handleSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, '不正なハンドルです')

/**
 * 公開FAQ取得（ハンドルから）
 */
export async function getPublicFaqByHandle(
  handle: string
): Promise<FaqActionResult> {
  const validatedHandle = handleSchema.parse(handle)

  try {
    const user = await prisma.user.findUnique({
      where: { handle: validatedHandle },
      select: { id: true },
    })

    if (!user) {
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
}
