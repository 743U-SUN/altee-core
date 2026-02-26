import type { UserLink } from "@/types/link-type"

/**
 * リンクアイコンのソースURLを取得
 * 優先順位: カスタムアイコン > 選択されたプリセットアイコン > デフォルトアイコン > 最初のアイコン
 */
export function getLinkIconSrc(link: UserLink): string | null {
  // カスタムアイコンが設定されている場合
  if (link.customIcon) {
    return `/api/files/${link.customIcon.storageKey}`
  }

  // 選択されたプリセットアイコンがある場合
  if (link.selectedLinkTypeIcon) {
    return `/api/files/${link.selectedLinkTypeIcon.iconKey}`
  }

  // リンクタイプのアイコンがある場合
  if (link.linkType.icons && link.linkType.icons.length > 0) {
    // デフォルトアイコンを探す
    const defaultIcon = link.linkType.icons.find(icon => icon.isDefault)
    if (defaultIcon) {
      return `/api/files/${defaultIcon.iconKey}`
    }
    // デフォルトがない場合は最初のアイコンを使用
    return `/api/files/${link.linkType.icons[0].iconKey}`
  }

  return null
}

/**
 * リンクの表示名を取得
 * カスタムリンクの場合はカスタムラベル、それ以外はリンクタイプの表示名
 */
export function getLinkDisplayName(link: UserLink): string {
  if (link.linkType.isCustom && link.customLabel) {
    return link.customLabel
  }
  return link.linkType.displayName
}
