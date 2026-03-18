import { z } from 'zod'

/** CUID形式のIDバリデーション */
export const cuidSchema = z.string().cuid()

/** CUID配列バリデーション（最大100件） */
export const cuidArraySchema = z.array(cuidSchema).min(1).max(100)
