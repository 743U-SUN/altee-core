import { auth } from '@/auth'
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
 * プロフィール画像の優先順位: カスタム画像 > OAuth画像
 */
export async function getUserNavData(): Promise<UserNavData | null> {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: {
          avatarImage: true // アイコン画像（ヘッダー・ネームカード用）
        }
      }
    }
  })

  if (!user) {
    return null
  }

  // アイコン画像の優先順位
  let avatar: string | null = null

  // 1. カスタムアイコン画像（MediaFile）
  if (user.profile?.avatarImage?.storageKey) {
    avatar = `/api/files/${user.profile.avatarImage.storageKey}`
  }
  // 2. OAuth提供者の画像
  else if (user.image) {
    avatar = user.image
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    characterName: user.characterName,
    handle: user.handle,
    avatar,
    role: user.role
  }
}