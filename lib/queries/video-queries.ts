import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'

/**
 * ハンドルからユーザーの動画セクション情報を取得
 * 'use cache' でクロスリクエストキャッシュ
 */
export async function getVideoPageData(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`videos-${normalized}`)

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
    select: {
      id: true,
      isActive: true,
      characterInfo: {
        select: { characterName: true },
      },
      userSections: {
        where: { isVisible: true, page: 'videos' },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!user || !user.isActive) return null

  return user
}
