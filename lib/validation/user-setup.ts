import { z } from 'zod';
import { isReservedHandle } from '@/lib/reserved-handles';

/**
 * Handle用バリデーションスキーマ
 */
export const handleSchema = z
  .string()
  .min(3, 'ハンドルは3文字以上で入力してください')
  .max(20, 'ハンドルは20文字以下で入力してください')
  .regex(/^[a-zA-Z0-9_-]+$/, 'ハンドルは英数字、アンダースコア、ハイフンのみ使用できます')
  .refine((value) => !isReservedHandle(value), {
    message: 'このハンドルは予約語のため使用できません',
  })
  .transform((value) => value.toLowerCase()); // 小文字に変換

/**
 * キャラクター名用バリデーションスキーマ
 */
export const characterNameSchema = z
  .string()
  .min(1, 'キャラクター名を入力してください')
  .max(30, 'キャラクター名は30文字以下で入力してください')
  .refine((value) => value.trim().length > 0, {
    message: 'キャラクター名を入力してください',
  });

/**
 * ユーザーロール選択用バリデーションスキーマ
 */
export const userRoleSchema = z.enum(['USER', 'GUEST'], {
  errorMap: () => ({ message: 'ユーザータイプを選択してください' }),
});

/**
 * ユーザーセットアップ用統合バリデーションスキーマ
 */
export const userSetupSchema = z.object({
  characterName: characterNameSchema,
  role: userRoleSchema,
  handle: z.string().optional(),
}).refine((data) => {
  // USERロールの場合はhandleが必須
  if (data.role === 'USER') {
    return data.handle && data.handle.length > 0;
  }
  return true;
}, {
  message: 'ユーザーとして登録する場合、ハンドルの設定が必要です',
  path: ['handle'],
});

/**
 * Handle重複チェック用のスキーマ（Server Action用）
 */
export const handleAvailabilityCheckSchema = z.object({
  handle: handleSchema,
});

/**
 * TypeScript型定義
 */
export type HandleSchema = z.infer<typeof handleSchema>;
export type CharacterNameSchema = z.infer<typeof characterNameSchema>;
export type UserRoleSchema = z.infer<typeof userRoleSchema>;
export type UserSetupSchema = z.infer<typeof userSetupSchema>;
export type HandleAvailabilityCheckSchema = z.infer<typeof handleAvailabilityCheckSchema>;