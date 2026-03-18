import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const handleSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, '不正なハンドルです')

/**
 * ハンドルからユーザーの動画セクション情報を取得
 * React.cache()でリクエスト単位のデデュプリケーション（generateMetadataとページ本体で共有）
 */
export const getVideoPageData = cache(async (handle: string) => {
  const validatedHandle = handleSchema.parse(handle)

  const user = await prisma.user.findUnique({
    where: { handle: validatedHandle },
    select: {
      id: true,
      characterInfo: {
        select: { characterName: true },
      },
      userSections: {
        where: { isVisible: true, page: 'videos' },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return user
})
