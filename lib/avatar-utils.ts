import { getPublicUrl } from '@/lib/image-uploader/get-public-url'

/**
 * CharacterInfo.iconImageKey → 公開URL に変換
 * フォールバックとして User.image (OAuth由来) を使用
 */
export function resolveAvatarUrl(
  iconImageKey: string | null | undefined,
  oauthImage?: string | null
): string | null {
  if (iconImageKey) {
    return getPublicUrl(iconImageKey)
  }
  return oauthImage ?? null
}
