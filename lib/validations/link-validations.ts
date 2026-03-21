import type { LinkType } from "@/types/link-type"

const regexCache = new Map<string, RegExp>()

function getCachedRegex(pattern: string): RegExp {
  if (!regexCache.has(pattern)) regexCache.set(pattern, new RegExp(pattern))
  return regexCache.get(pattern)!
}

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

      // ネスト量子化子の検出（ReDoS対策: (a+)+ 等のパターンを拒否）
      if (/(\+|\*|\{)\)?(\+|\*|\{)/.test(selectedLinkType.urlPattern)) return false

      try {
        const regex = getCachedRegex(selectedLinkType.urlPattern)
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
