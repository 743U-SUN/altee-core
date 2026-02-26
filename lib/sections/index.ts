/**
 * セクションシステム - 公開API
 */

// 型定義
export type {
  SectionPriority,
  SectionCategory,
  SectionDefinition,
  SectionCategoryDefinition,
} from './types'

// レジストリ
export {
  SECTION_REGISTRY,
  SECTION_CATEGORIES,
  getSectionDefinition,
  getAllSectionDefinitions,
  getSectionsByCategory,
  getCategoryDefinition,
  getAllCategories,
  preloadHighPrioritySections,
} from './registry'

// 型（後方互換性）
export type { SectionCategoryKey } from './registry'

// 型ガード
export * from './type-guards'
