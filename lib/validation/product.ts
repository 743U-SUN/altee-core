import { z } from 'zod'

// ProductType enum values
export const PRODUCT_TYPES = [
  'PC_PART',
  'PERIPHERAL',
  'FOOD',
  'BOOK',
  'MICROPHONE',
  'GENERAL',
] as const

// ===== ProductCategory Validation =====

export const productCategorySlugSchema = z
  .string()
  .min(1, 'スラッグは必須です')
  .max(100, 'スラッグは100文字以内にしてください')
  .regex(
    /^[a-z0-9-_]+$/,
    'スラッグは小文字英数字、ハイフン、アンダースコアのみ使用できます'
  )

export const productCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(100, 'カテゴリ名は100文字以内にしてください'),
  slug: productCategorySlugSchema,
  sortOrder: z.number().int().nonnegative(),
  productType: z.enum(PRODUCT_TYPES),
  requiresCompatibilityCheck: z.boolean(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
})

export type ProductCategoryInput = z.infer<typeof productCategorySchema>

// カテゴリ更新用（IDを含む）
export const productCategoryUpdateSchema = productCategorySchema.extend({
  id: z.string(),
})

export type ProductCategoryUpdateInput = z.infer<
  typeof productCategoryUpdateSchema
>

// ===== Product Validation =====

export const productSchema = z.object({
  name: z
    .string()
    .min(1, '商品名は必須です')
    .max(200, '商品名は200文字以内にしてください'),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'カテゴリは必須です'),
  brandId: z.string().optional().nullable(),

  // 画像関連
  amazonUrl: z
    .string()
    .url('正しいURLを入力してください')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  amazonImageUrl: z.string().url().optional().nullable(),
  customImageUrl: z
    .string()
    .url('正しいURLを入力してください')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  imageStorageKey: z.string().optional().nullable(),

  // OG情報
  ogTitle: z.string().optional().nullable(),
  ogDescription: z.string().optional().nullable(),

  // Amazon固有
  asin: z
    .string()
    .regex(/^[A-Z0-9]{10}$/, 'ASINは10桁の英数字である必要があります')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
})

export type ProductInput = z.infer<typeof productSchema>

// 商品更新用（IDを含む）
export const productUpdateSchema = productSchema.extend({
  id: z.string(),
})

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>

// ===== CSV Import Validation =====

export const productCSVRowSchema = z.object({
  name: z.string().min(1, '商品名は必須です'),
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

export type ProductCSVRow = z.infer<typeof productCSVRowSchema>

// CSVインポート結果
export interface CSVImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data: Partial<ProductCSVRow>
  }>
}

// ===== UserProduct (ユーザー所有商品) =====

export const userProductSchema = z.object({
  productId: z.string().min(1, '商品IDは必須です'),
  review: z.string().optional().nullable(),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
})

export type UserProductInput = z.infer<typeof userProductSchema>

// UserProduct更新用（IDを含む）
export const userProductUpdateSchema = userProductSchema.extend({
  id: z.string(),
})

export type UserProductUpdate = z.infer<typeof userProductUpdateSchema>
