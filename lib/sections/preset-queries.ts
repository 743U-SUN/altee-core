import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import type { SectionBackgroundPreset } from '@/types/profile-sections'
import { presetConfigSchema } from '@/lib/validations/section-settings'

/** solid の fallback config */
const FALLBACK_CONFIG = { color: '#000000' } as const

/**
 * アクティブな背景プリセットを取得
 * React.cache() で同一リクエスト内の重複 fetch を防止
 */
export const getActivePresets = cache(async (): Promise<SectionBackgroundPreset[]> => {
  const presets = await prisma.sectionBackgroundPreset.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return presets.map((p) => {
    const parsed = presetConfigSchema.safeParse(p.config)

    return {
      id: p.id,
      name: p.name,
      category: p.category as SectionBackgroundPreset['category'],
      config: parsed.success ? parsed.data : FALLBACK_CONFIG,
      thumbnailKey: p.thumbnailKey,
      cssString: p.cssString,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
    }
  })
})
