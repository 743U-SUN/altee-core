import { z } from 'zod'

// ===== 共通 =====

/** CUID フォーマット検証 */
export const cuidSchema = z.string().regex(/^c[a-z0-9]{24,}$/, '無効なIDフォーマットです')

/** HEX カラーコード検証 */
const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/)

// ===== プリセット config =====

export const solidConfigSchema = z.object({
  color: hexColorSchema,
})

export const gradientStopSchema = z.object({
  color: hexColorSchema,
  position: z.number().min(0).max(100),
})

export const gradientConfigSchema = z.object({
  type: z.enum(['linear', 'radial', 'conic']),
  stops: z.array(gradientStopSchema).min(2).max(10),
  angle: z.number().min(0).max(360).optional(),
})

/** プリセット config（solid | gradient） */
export const presetConfigSchema = z.union([solidConfigSchema, gradientConfigSchema])

// ===== Admin: プリセット入力 =====

export const presetInputSchema = z
  .object({
    name: z.string().min(1, '名前は必須です').max(100),
    category: z.enum(['solid', 'gradient']),
    config: z.union([solidConfigSchema, gradientConfigSchema]),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.category === 'solid' && 'type' in data.config) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'solid カテゴリに gradient config は使用できません',
        path: ['config'],
      })
    }
    if (data.category === 'gradient' && !('type' in data.config)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'gradient カテゴリには gradient config が必要です',
        path: ['config'],
      })
    }
  })

export type PresetInput = z.infer<typeof presetInputSchema>

// ===== User: セクション設定 =====

const paddingSizeSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl'])

const responsivePaddingSchema = z.object({
  mobile: paddingSizeSchema,
  tablet: paddingSizeSchema.optional(),
  desktop: paddingSizeSchema.optional(),
})

const sectionBandBackgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('inherit') }),
  z.object({ type: z.literal('preset'), presetId: z.string().optional() }),
])

/** UserSection.settings のバリデーション */
export const sectionSettingsSchema = z.object({
  background: sectionBandBackgroundSchema.optional(),
  paddingTop: responsivePaddingSchema.optional(),
  paddingBottom: responsivePaddingSchema.optional(),
})
