'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/** Admin: ユーザーのニュース記事一覧を取得 */
export async function adminGetUserNewsList(userId: string) {
  await requireAdmin()

  return prisma.userNews.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
    include: {
      thumbnail: { select: { storageKey: true } },
    },
  })
}

/** Admin: 強制非表示トグル */
export async function adminToggleNewsHidden(newsId: string) {
  await requireAdmin()

  const news = await prisma.userNews.findUnique({
    where: { id: newsId },
    select: { id: true, adminHidden: true, userId: true },
  })

  if (!news) throw new Error('記事が見つかりません')

  const updated = await prisma.userNews.update({
    where: { id: newsId },
    data: { adminHidden: !news.adminHidden },
  })

  revalidatePath(`/admin/users/${news.userId}`)
  return { success: true, data: updated }
}
