/**
 * セクションシステム - 公開API
 *
 * サーバーサイド（Server Actions・Server Components）向けエクスポート:
 *   - SECTION_REGISTRY → SECTION_METADATA_REGISTRY のエイリアス（component なし、React.lazy() なし）
 *   - SECTION_CATEGORIES, getCategoryDefinition, getAllCategories
 *   - SectionMetadata 型
 *
 * クライアント側でコンポーネント付きの SectionDefinition が必要な場合は
 * lib/sections/registry.ts ('use client') から直接インポートしてください。
 */

// 型定義
export type {
  SectionPriority,
  SectionCategory,
  SectionDefinition,
  SectionCategoryDefinition,
  SectionMetadata,
} from './types'

// サーバー互換メタデータレジストリ
// SECTION_REGISTRY はサーバーサイドでの検証用エイリアス（component フィールドなし）
export {
  SECTION_METADATA_REGISTRY as SECTION_REGISTRY,
  SECTION_CATEGORIES,
  getSectionMetadata as getSectionDefinition,
  getAllSectionMetadata as getAllSectionDefinitions,
  getSectionMetadataByCategory as getSectionsByCategory,
  getCategoryDefinition,
  getAllCategories,
  getSectionMetadataByPage as getSectionsByPage,
} from './registry-metadata'

// 型（後方互換性）
export type { SectionCategoryKey } from './registry-metadata'

// 型ガード（バレル経由で使用されるもののみ）
export {
  isImageHeroData,
  isImageGrid2Data,
  isImageGrid3Data,
} from './type-guards'
