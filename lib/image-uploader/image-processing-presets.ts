import type { ImageProcessingOptions } from '@/types/image-upload'

type Preset = Required<ImageProcessingOptions>

/** アイコン・小さい画像用 (256x256) */
export const PRESET_ICON: Preset = {
  maxWidth: 256,
  maxHeight: 256,
  quality: 0.8,
  format: 'webp',
}

/** アバター・中サイズアイコン用 (512x512) */
export const PRESET_AVATAR: Preset = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.8,
  format: 'webp',
}

/** ポートレート（縦長）画像用 (720x1280) */
export const PRESET_PORTRAIT: Preset = {
  maxWidth: 720,
  maxHeight: 1280,
  quality: 0.8,
  format: 'webp',
}

/** モバイル背景用 (810x1080) */
export const PRESET_MOBILE_BG: Preset = {
  maxWidth: 810,
  maxHeight: 1080,
  quality: 0.8,
  format: 'webp',
}

/** ミディアム正方形画像用 (800x800) */
export const PRESET_MEDIUM_SQUARE: Preset = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  format: 'webp',
}

/** コンテンツ幅画像用 (1200x900) */
export const PRESET_CONTENT: Preset = {
  maxWidth: 1200,
  maxHeight: 900,
  quality: 0.8,
  format: 'webp',
}

/** サムネイル用 (1200x675, 16:9相当) */
export const PRESET_THUMBNAIL: Preset = {
  maxWidth: 1200,
  maxHeight: 675,
  quality: 0.8,
  format: 'webp',
}

/** 記事/ニュース本文画像用 (1200x1200) */
export const PRESET_ARTICLE: Preset = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: 'webp',
}

/** ネームカード用 (1200x400) */
export const PRESET_NAMECARD: Preset = {
  maxWidth: 1200,
  maxHeight: 400,
  quality: 0.8,
  format: 'webp',
}

/** フルHD / デフォルト (1920x1080) */
export const PRESET_FULL_HD: Preset = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'webp',
}
