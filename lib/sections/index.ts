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
  getSectionsByPage,
} from './registry'

// 型（後方互換性）
export type { SectionCategoryKey } from './registry'

// 型ガード（バレル経由で使用されるもののみ）
export {
  isImageHeroData,
  isImageGrid2Data,
  isImageGrid3Data,
} from './type-guards'
