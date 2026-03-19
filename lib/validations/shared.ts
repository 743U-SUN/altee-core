import { z } from 'zod'

/** CUID形式のIDバリデーション */
export const cuidSchema = z.string().cuid()

/** CUID配列バリデーション（最大100件） */
export const cuidArraySchema = z.array(cuidSchema).min(1).max(100)

/** 公開クエリ用ハンドルバリデーション（軽量版） */
export const queryHandleSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, '不正なハンドルです')

/** ハンドル正規化（@除去 + 小文字化） */
export function normalizeHandle(handle: string): string {
  return handle.startsWith('@') ? handle.slice(1).toLowerCase() : handle.toLowerCase()
}

/** 安全なURLプロトコル検証（XSS対策） */
export function isSafeUrl(url: string): boolean {
  try {
    return ['http:', 'https:', 'mailto:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}
