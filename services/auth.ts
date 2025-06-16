import { prisma } from "@/lib/prisma"

export interface OAuthProfile {
  picture?: string
  avatar?: string
  id?: string
}

/**
 * OAuthプロバイダーから画像URLを抽出
 */
export function extractOAuthImageUrl(provider: string, profile: OAuthProfile): string | null {
  if (provider === 'google' && profile.picture) {
    return profile.picture
  }
  
  if (provider === 'discord' && profile.avatar && profile.id) {
    const extension = profile.avatar.startsWith('a_') ? 'gif' : 'png'
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}?size=256`
  }
  
  return null
}

/**
 * ユーザーの画像を更新（変更がある場合のみ）
 */
export async function updateUserImage(userId: string, newImageUrl: string): Promise<boolean> {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true }
    })
    
    // 画像が同じ場合は更新しない
    if (currentUser?.image === newImageUrl) {
      return false
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { image: newImageUrl }
    })
    
    return true
  } catch (error) {
    console.error('Failed to update user image:', error)
    return false
  }
}

/**
 * ブラックリストメールをチェック
 */
export async function isEmailBlacklisted(email: string): Promise<boolean> {
  const blacklisted = await prisma.blacklistedEmail.findUnique({
    where: { email }
  })
  return !!blacklisted
}