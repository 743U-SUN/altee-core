/**
 * next/image sizes属性のユーティリティ
 * セクション幅とレイアウトに基づいて計算済みの値を提供する
 */

export const IMAGE_SIZES = {
  // 1200px Largeセクション用（padding考慮: 16px×2 or 24px×2）
  large: '(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc(100vw - 48px), 1152px',

  // 720px Mediumセクション用
  medium: '(max-width: 640px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 48px), 672px',

  // 2カラムグリッド用（gap考慮）
  grid2: '(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc((100vw - 64px) / 2), 568px',

  // 3カラムグリッド用
  grid3: '(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc((100vw - 64px) / 2), 376px',

  // キャラクター画像用（9:16縦長）
  character: '(min-width: 1024px) 256px, 100vw',

  // キャラクター背景用
  characterBg: '(max-width: 1200px) 100vw, 1200px',

  // アバター用
  avatar: '48px',

  // ヒーロー画像用（フルスクリーン）
  heroFull: '100vw',
  heroMobile: '(min-width: 993px) 0px, 100vw',

  // ヒーロー上キャラクター画像用（9:16、中央下配置）
  heroCharacter: '(max-width: 992px) 40vw, 25vw',
} as const

export type ImageSizesKey = keyof typeof IMAGE_SIZES
