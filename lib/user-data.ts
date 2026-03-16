import { cachedAuth } from '@/lib/auth'
import { resolveAvatarUrl } from '@/lib/avatar-utils'
import { prisma } from '@/lib/prisma'

export interface UserNavData {
  id: string
  name: string | null
  email: string | null
  characterName: string | null
  handle: string | null
  avatar: string | null
  role?: string | null
}

/**
 * ナビゲーション用のユーザー情報を取得
 * 表示名: CharacterInfo.characterName → User.name フォールバック
 * アイコン: CharacterInfo.iconImageKey → User.image フォールバック
 */
export async function getUserNavData(): Promise<UserNavData | null> {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      characterInfo: {
        select: { characterName: true, iconImageKey: true }
      }
    }
  })

  if (!user) {
    return null
  }

  // アイコン画像: CharacterInfo.iconImageKey → User.image（OAuthフォールバック）
  const avatar = resolveAvatarUrl(user.characterInfo?.iconImageKey, user.image)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    characterName: user.characterInfo?.characterName ?? null,
    handle: user.handle,
    avatar,
    role: user.role
  }
}