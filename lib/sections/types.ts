import type { ComponentType, LazyExoticComponent } from 'react'
import type { BaseSectionProps } from '@/types/profile-sections'

/**
 * セクションの読み込み優先度
 * - high: 即座に読み込み（初期表示に重要）
 * - medium: Intersection Observerで遅延読み込み
 * - low: ビューポート外まで遅延
 */
export type SectionPriority = 'high' | 'medium' | 'low'

/**
 * セクションカテゴリ
 */
export type SectionCategory =
  | 'main'              // メインコンテンツ（profile-card, character-profile）
  | 'image'             // 画像コンテンツ
  | 'links'             // リンク集
  | 'content'           // テキストコンテンツ
  | 'data'              // データ・グラフ
  | 'video'             // 動画コンテンツ
  | 'structure'         // 見出し・区切り・余白

/**
 * セクション定義
 * - fullBleed: trueの場合、SectionBand内でmax-widthコンテナをスキップ
 * - priority: 読み込み優先度
 * - component: React.lazy()対応
 */
export interface SectionDefinition {
  type: string
  label: string
  description: string
  icon: string // Lucide icon name
  category: SectionCategory
  fullBleed?: boolean // true: バンド幅いっぱいにレンダリング（max-widthコンテナなし）
  maxInstances?: number // 最大インスタンス数（未指定 = 無制限）
  priority: SectionPriority
  component: ComponentType<BaseSectionProps> | LazyExoticComponent<ComponentType<BaseSectionProps>>
  defaultData: unknown
  validate?: (data: unknown) => boolean
}

/**
 * セクションカテゴリ定義
 */
export interface SectionCategoryDefinition {
  label: string
  icon: string // Lucide icon name
  description: string
}
