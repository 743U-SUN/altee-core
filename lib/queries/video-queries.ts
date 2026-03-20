import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'

/**
 * ハンドルからユーザーの動画セクション情報を取得
 * React.cache()でリクエスト単位のデデュプリケーション（generateMetadataとページ本体で共有）
 */
export const getVideoPageData = cache(async (handle: string) => {
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)

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
})
