'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { cuidSchema } from '@/lib/validations/shared'
import { invalidateUserCacheTags } from '@/lib/cache-utils'

/** Admin: ユーザーのニュース記事一覧を取得 */
export async function adminGetUserNewsList(userId: string) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  return prisma.userNews.findMany({
    where: { userId: validatedUserId },
    orderBy: { sortOrder: 'asc' },
    include: {
      thumbnail: { select: { storageKey: true } },
    },
  })
}

/** Admin: 強制非表示トグル */
export async function adminToggleNewsHidden(newsId: string) {
  await requireAdmin()
  const validatedNewsId = cuidSchema.parse(newsId)

  const news = await prisma.userNews.findUnique({
    where: { id: validatedNewsId },
    select: { id: true, adminHidden: true, userId: true },
  })

  if (!news) throw new Error('記事が見つかりません')

  // 対象ユーザーの handle を取得
  const targetUser = await prisma.user.findUnique({
    where: { id: news.userId },
    select: { handle: true },
  })

  const updated = await prisma.userNews.update({
    where: { id: validatedNewsId },
    data: { adminHidden: !news.adminHidden },
  })

  revalidatePath(`/admin/users/${news.userId}`)
  invalidateUserCacheTags(targetUser?.handle, ['news', 'profile'])
  return { success: true, data: updated }
}
