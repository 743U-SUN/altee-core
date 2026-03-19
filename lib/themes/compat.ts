/**
 * 旧テーマシステムとの互換性レイヤー
 * 既存のthemePreset（'claymorphic', 'minimal'）を新しいthemeIdにマッピング
 */

/**
 * 旧テーマID → 新テーマIDのマッピング
 */
const LEGACY_THEME_MAP: Record<string, string> = {
  claymorphic: 'claymorphic-warm',
  minimal: 'minimal-white',
}

/**
 * 旧テーマIDを新テーマIDに変換
 * 新テーマIDが渡された場合はそのまま返す
 */
export function migrateLegacyThemeId(legacyId: string): string {
  return LEGACY_THEME_MAP[legacyId] || legacyId
}

/**
 * 旧テーマIDかどうかを判定
 */
export function isLegacyThemeId(id: string): boolean {
  return id in LEGACY_THEME_MAP
}
