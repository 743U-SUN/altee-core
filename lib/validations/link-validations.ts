import type { LinkType } from "@/types/link-type"

/**
 * URLパターンのバリデーション関数
 * リンクタイプに設定されたURLパターン（正規表現）に一致するかチェック
 */
export function urlPatternValidator(linkTypes: LinkType[]) {
  return (data: { linkTypeId: string; url: string }) => {
    const selectedLinkType = linkTypes.find(lt => lt.id === data.linkTypeId)

    if (selectedLinkType?.urlPattern) {
      // URL長制限（ReDoS対策）
      if (data.url.length > 2048) return false

      try {
        const regex = new RegExp(selectedLinkType.urlPattern)
        return regex.test(data.url)
      } catch {
        // 正規表現が無効な場合はURLを拒否（安全側に倒す）
        return false
      }
    }
    return true
  }
}

/**
 * カスタムラベルのバリデーション関数
 * カスタムリンクタイプの場合は必須
 */
export function customLabelValidator(linkTypes: LinkType[]) {
  return (data: { linkTypeId: string; customLabel?: string }) => {
    const selectedLinkType = linkTypes.find(lt => lt.id === data.linkTypeId)
    if (selectedLinkType?.isCustom) {
      return !!data.customLabel && data.customLabel.trim().length > 0
    }
    return true
  }
}
