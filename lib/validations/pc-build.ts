import { z } from 'zod'
import type { PcPartType } from '@prisma/client'

export const PC_PART_TYPES = [
  'CPU',
  'GPU',
  'MOTHERBOARD',
  'RAM',
  'STORAGE',
  'PSU',
  'CASE',
  'COOLER',
  'OTHER',
] as const

export const pcPartTypeLabels: Record<PcPartType, string> = {
  CPU: 'CPU',
  GPU: 'GPU',
  MOTHERBOARD: 'マザーボード',
  RAM: 'RAM',
  STORAGE: 'ストレージ',
  PSU: '電源ユニット',
  CASE: 'PCケース',
  COOLER: 'CPUクーラー',
  OTHER: 'その他',
}

const AMAZON_DOMAINS = [
  'amazon.co.jp',
  'www.amazon.co.jp',
  'amazon.com',
  'www.amazon.com',
  'amzn.to',
  'amzn.asia',
]

export const pcBuildSchema = z.object({
  name: z.string().max(100, 'ビルド名は100文字以内にしてください').nullish(),
  imageKey: z
    .string()
    .max(500, '画像キーが長すぎます')
    .regex(/^[a-zA-Z0-9/_-]+(\.[a-zA-Z0-9]+)?$/, '不正な画像キーです')
    .optional()
    .nullable(),
  description: z.string().max(500, '説明は500文字以内にしてください').nullish(),
  totalBudget: z.number().int().nonnegative().nullish(),
  isPublic: z.boolean(),
})

export type PcBuildInput = z.infer<typeof pcBuildSchema>

export const pcPartSchema = z.object({
  partType: z.enum(PC_PART_TYPES),
  name: z
    .string()
    .min(1, 'パーツ名は必須です')
    .max(200, 'パーツ名は200文字以内にしてください'),
  price: z.number().int().nonnegative().nullish(),
  amazonUrl: z
    .string()
    .url('正しいURLを入力してください')
    .refine(
      (url) => {
        try {
          const parsed = new URL(url)
          return parsed.protocol === 'https:' && AMAZON_DOMAINS.includes(parsed.hostname)
        } catch {
          return false
        }
      },
      'Amazon（amazon.co.jp / amazon.com）のURLを入力してください'
    )
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val)),
  memo: z.string().max(500, 'メモは500文字以内にしてください').nullish(),
  sortOrder: z.number().int().nonnegative().optional(),
  itemId: z.string().nullish(), // カタログアイテムへの参照（オプション）
})

export type PcPartInput = z.infer<typeof pcPartSchema>
