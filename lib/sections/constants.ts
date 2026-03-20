/**
 * セクションコンポーネント共通定数
 * Phase 4 リファクタリングで追加
 */

/**
 * テーマ連動のhover効果クラス定義
 * ThemedCard, ImageHeroSection などで共通使用
 */
export const HOVER_CLASSES: Record<string, string> = {
  lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
  glow: 'hover:shadow-[0_0_20px_var(--theme-accent-bg)] transition-shadow duration-200',
  press: 'hover:scale-[0.98] active:scale-95 transition-transform duration-200',
  shake: 'hover:animate-shake',
  none: '',
}
