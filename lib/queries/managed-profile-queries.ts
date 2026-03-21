import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { cuidSchema } from '@/lib/validations/shared'

/**
 * MANAGEDプロフィール詳細を取得（read-only、React.cache でリクエスト内重複排除）
 */
export const getManagedProfileDetailQuery = cache(async (userId: string) => {
  const validatedUserId = cuidSchema.parse(userId)

  const user = await prisma.user.findUnique({
    where: { id: validatedUserId },
    select: {
      id: true,
      handle: true,
      name: true,
      accountType: true,
      managedBy: true,
      createdAt: true,
      characterInfo: true,
      profile: {
        select: { id: true },
      },
    },
  })

  return user
})
