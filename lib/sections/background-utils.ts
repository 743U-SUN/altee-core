import type { CSSProperties } from 'react'
import type {
  SectionBackgroundPreset,
  SectionBandBackground,
  SolidBgConfig,
  GradientBgConfig,
} from '@/types/profile-sections'

function isSolidBgConfig(config: SectionBackgroundPreset['config']): config is SolidBgConfig {
  return 'color' in config && typeof (config as SolidBgConfig).color === 'string'
}

function isGradientBgConfig(config: SectionBackgroundPreset['config']): config is GradientBgConfig {
  return 'stops' in config && Array.isArray((config as GradientBgConfig).stops) && 'type' in config
}

/**
 * プリセットの config → CSSProperties に変換
 * Phase 1 では solid + gradient のみ対応
 */
export function resolveBackgroundStyle(
  preset: SectionBackgroundPreset | null | undefined
): CSSProperties {
  if (!preset) return {}

  const { category, config } = preset

  switch (category) {
    case 'solid': {
      if (!isSolidBgConfig(config) || !config.color) return {}
      return { backgroundColor: config.color }
    }
    case 'gradient': {
      if (!isGradientBgConfig(config) || !config.stops || !config.type) return {}
      const gradientString = buildGradientString(config)
      return { background: gradientString }
    }
    // pattern, animated は Phase 2+ で対応
    default:
      return {}
  }
}

/**
 * GradientBgConfig → CSS gradient 文字列を生成
 */
function buildGradientString(config: GradientBgConfig): string {
  const stops = config.stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')

  switch (config.type) {
    case 'linear':
      return `linear-gradient(${config.angle ?? 135}deg, ${stops})`
    case 'radial':
      return `radial-gradient(circle, ${stops})`
    case 'conic':
      return `conic-gradient(${stops})`
    default:
      return `linear-gradient(135deg, ${stops})`
  }
}

/**
 * presets 配列から presetId でプリセットを検索（O(1) Map化）
 */
export function resolvePreset(
  background: SectionBandBackground | undefined,
  presets: SectionBackgroundPreset[]
): SectionBackgroundPreset | null {
  if (!background || background.type !== 'preset' || !background.presetId) {
    return null
  }

  // Map を利用して O(1) 検索
  const presetMap = getPresetMap(presets)
  return presetMap.get(background.presetId) ?? null
}

/**
 * プリセットの config → cssString を生成（Admin UI 保存時のキャッシュ生成用）
 */
export function generateCssString(
  category: string,
  config: SectionBackgroundPreset['config']
): string {
  switch (category) {
    case 'solid': {
      if (!isSolidBgConfig(config) || !config.color) return ''
      return `background-color: ${config.color}`
    }
    case 'gradient': {
      if (!isGradientBgConfig(config) || !config.stops || !config.type) return ''
      return `background: ${buildGradientString(config)}`
    }
    default:
      return ''
  }
}

// WeakMap でキャッシュし、同一配列参照なら Map を再生成しない
const presetMapCache = new WeakMap<
  SectionBackgroundPreset[],
  Map<string, SectionBackgroundPreset>
>()

function getPresetMap(
  presets: SectionBackgroundPreset[]
): Map<string, SectionBackgroundPreset> {
  let map = presetMapCache.get(presets)
  if (!map) {
    map = new Map(presets.map((p) => [p.id, p]))
    presetMapCache.set(presets, map)
  }
  return map
}
