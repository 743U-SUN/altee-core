import { z } from 'zod'

// ItemType enum values
export const ITEM_TYPES = [
  'PC_PART',
  'PERIPHERAL',
  'FOOD',
  'BOOK',
  'MICROPHONE',
  'GENERAL',
] as const

// ===== ItemCategory Validation =====

export const itemCategorySlugSchema = z
  .string()
  .min(1, 'スラッグは必須です')
  .max(100, 'スラッグは100文字以内にしてください')
  .regex(
    /^[a-z0-9-_]+$/,
    'スラッグは小文字英数字、ハイフン、アンダースコアのみ使用できます'
  )

export const itemCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(100, 'カテゴリ名は100文字以内にしてください'),
  slug: itemCategorySlugSchema,
  sortOrder: z.number().int().nonnegative(),
  itemType: z.enum(ITEM_TYPES),
  requiresCompatibilityCheck: z.boolean(),
  description: z.string().max(2000, '説明は2000文字以内にしてください').nullish(),
  icon: z.string().nullish(),
  parentId: z.string().nullish(),
})

export type ItemCategoryInput = z.infer<typeof itemCategorySchema>

// カテゴリ更新用（IDを含む）
export const itemCategoryUpdateSchema = itemCategorySchema.extend({
  id: z.string(),
})

export type ItemCategoryUpdateInput = z.infer<
  typeof itemCategoryUpdateSchema
>

// ===== Item Validation =====

export const itemSchema = z.object({
  name: z
    .string()
    .min(1, 'アイテム名は必須です')
    .max(200, 'アイテム名は200文字以内にしてください'),
  description: z.string().max(2000, '説明は2000文字以内にしてください').nullish(),
  categoryId: z.string().min(1, 'カテゴリは必須です'),
  brandId: z.string().nullish(),

  // 画像関連
  amazonUrl: z
    .string()
    .url('正しいURLを入力してください')
    .refine(
      (val) => !val || /^https:\/\/(www\.)?amazon\.(co\.jp|com)\//.test(val),
      { message: 'AmazonのURLを入力してください' }
    )
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  amazonImageUrl: z.string().url().nullish().or(z.literal('')).transform((val) => (val === '' ? undefined : val)),
  customImageUrl: z
    .string()
    .url('正しいURLを入力してください')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  imageStorageKey: z.string().nullish(),

  // OG情報
  ogTitle: z.string().nullish(),
  ogDescription: z.string().nullish(),

  // Amazon固有
  asin: z
    .string()
    .regex(/^[A-Z0-9]{10}$/, 'ASINは10桁の英数字である必要があります')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
})

export type ItemInput = z.infer<typeof itemSchema>

// アイテム更新用（IDを含む）
export const itemUpdateSchema = itemSchema.extend({
  id: z.string(),
})

export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>

// ===== CSV Import Validation =====

export const itemCSVRowSchema = z.object({
  name: z.string().min(1, 'アイテム名は必須です'),
  description: z.string().optional().default(''),
  categorySlug: z.string().min(1, 'カテゴリslugは必須です'),
  brandName: z.string().optional().default(''),
  amazonUrl: z.string().url().optional().or(z.literal('')),
  asin: z
    .string()
    .regex(/^[A-Z0-9]{10}$/)
    .optional()
    .or(z.literal('')),
})

export type ItemCSVRow = z.infer<typeof itemCSVRowSchema>

// CSVインポート結果
export interface CSVImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data: Partial<ItemCSVRow>
  }>
}

// ===== UserItem (ユーザー所有アイテム) =====

export const userItemSchema = z.object({
  itemId: z.string().min(1, 'アイテムIDは必須です'),
  review: z.string().nullish(),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().optional(),
})

export type UserItemInput = z.infer<typeof userItemSchema>

// UserItem更新用（IDを含む）
export const userItemUpdateSchema = userItemSchema.extend({
  id: z.string(),
})

export type UserItemUpdate = z.infer<typeof userItemUpdateSchema>
