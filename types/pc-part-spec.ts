import type { Item, Brand, ItemCategory, PcPartSpec, PcPartType } from '@prisma/client'

// Item with PcPartSpec
export type ItemWithPcPartSpec = Item & {
  category: ItemCategory
  brand: Brand | null
  pcPartSpec: PcPartSpec | null
}

// For admin form
export interface PcPartSpecFormData {
  partType: PcPartType
  chipMakerId: string | null
  tdp: number | null
  releaseDate: string | null
  specs: Record<string, unknown>
}
