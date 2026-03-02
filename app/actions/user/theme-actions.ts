'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { ThemeSettings, BackgroundSettings } from '@/types/profile-sections'
import { DEFAULT_THEME_SETTINGS } from '@/types/profile-sections'
import { deleteImageAction } from '@/app/actions/media/image-upload-actions'
import { hasTheme } from '@/lib/themes/registry'
import { migrateLegacyThemeId } from '@/lib/themes/compat'

// 許可されたフォント（FontSelector.tsx と同期）
const ALLOWED_FONTS = [
  'Inter',
  'Noto Sans JP',
  'M PLUS Rounded 1c',
  'Zen Maru Gothic',
] as const

// HEXカラーコードの正規表現
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

// テーマ設定のバリデーションスキーマ
const themeSettingsSchema = z.object({
  themePreset: z.string().optional(),
  fontFamily: z.enum(ALLOWED_FONTS).optional(),
  headerColor: z.string().regex(hexColorRegex).nullable().optional(),
  headerTextColor: z.string().regex(hexColorRegex).nullable().optional(),
  accentColor: z.string().regex(hexColorRegex).nullable().optional(),
  visibility: z
    .object({
      banner: z.boolean().optional(),
      character: z.boolean().optional(),
      gameButton: z.boolean().optional(),
      snsButton: z.boolean().optional(),
      notification: z.boolean().optional(),
    })
    .optional(),
})

/**
 * ユーザーのテーマ設定を取得
 */
export async function getUserThemeSettings(
  userId: string
): Promise<ThemeSettings | null> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { themeSettings: true },
    })

    return (
      (profile?.themeSettings as unknown as ThemeSettings) ??
      DEFAULT_THEME_SETTINGS
    )
  } catch (error) {
    console.error('Failed to get theme settings:', error)
    return null
  }
}

/**
 * テーマ設定を更新
 */
export async function updateUserThemeSettings(settings: {
  themePreset?: string
  fontFamily?: string
  headerColor?: string | null
  headerTextColor?: string | null
  accentColor?: string | null
  visibility?: {
    banner?: boolean
    character?: boolean
    gameButton?: boolean
    snsButton?: boolean
    notification?: boolean
  }
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth()

    // 入力バリデーション（ホワイトリスト検証）
    const parseResult = themeSettingsSchema.safeParse(settings)
    if (!parseResult.success) {
      console.error(
        '[updateUserThemeSettings] バリデーションエラー:',
        parseResult.error.flatten()
      )
      return { success: false, error: '無効な設定値が含まれています' }
    }

    // バリデーション済みの値を使用
    const validatedSettings = parseResult.data

    // テーマプリセットの動的検証と互換性変換
    if (validatedSettings.themePreset) {
      // 旧IDを新IDに変換
      const normalizedId = migrateLegacyThemeId(validatedSettings.themePreset)

      if (!hasTheme(normalizedId)) {
        return { success: false, error: '無効なテーマです' }
      }

      // 正規化されたIDを使用
      validatedSettings.themePreset = normalizedId
    }

    // 現在の設定を取得
    const currentSettings = await getUserThemeSettings(session.user.id)
    if (!currentSettings) {
      return { success: false, error: 'テーマ設定の取得に失敗しました' }
    }

    // 設定をマージ（バリデーション済みの値を使用）
    const newSettings: ThemeSettings = {
      ...currentSettings,
      ...(validatedSettings.themePreset !== undefined && {
        themePreset: validatedSettings.themePreset,
      }),
      ...(validatedSettings.fontFamily !== undefined && {
        fontFamily: validatedSettings.fontFamily,
      }),
      ...('headerColor' in validatedSettings && {
        headerColor: validatedSettings.headerColor ?? undefined,
      }),
      ...('headerTextColor' in validatedSettings && {
        headerTextColor: validatedSettings.headerTextColor ?? undefined,
      }),
      ...('accentColor' in validatedSettings && {
        accentColor: validatedSettings.accentColor ?? undefined,
      }),
      ...(validatedSettings.visibility && {
        visibility: {
          ...currentSettings.visibility,
          ...validatedSettings.visibility,
        },
      }),
    }

    // UserProfile を更新（存在しない場合は作成）
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        // Prisma JSON型の制限: Prisma.JsonValueと具体的な型（ThemeSettings）の不一致を回避するため`as never`を使用
        themeSettings: newSettings as never,
        ...(validatedSettings.themePreset && {
          themePreset: validatedSettings.themePreset,
        }),
      },
      update: {
        // Prisma JSON型の制限: Prisma.JsonValueと具体的な型（ThemeSettings）の不一致を回避するため`as never`を使用
        themeSettings: newSettings as never,
        ...(validatedSettings.themePreset && {
          themePreset: validatedSettings.themePreset,
        }),
      },
    })

    // ユーザーのhandleを取得してrevalidate
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { handle: true },
    })
    if (user?.handle) {
      revalidatePath(`/@${user.handle}`)
    }
    revalidatePath('/dashboard/profile-editor')

    return { success: true }
  } catch (error) {
    console.error('Failed to update theme settings:', error)
    return { success: false, error: 'テーマ設定の更新に失敗しました' }
  }
}

// 背景設定のバリデーションスキーマ
const backgroundSettingsSchema = z
  .object({
    type: z.enum(['preset', 'color', 'image']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    imageKey: z.string().optional(),
    imageSource: z.enum(['admin', 'user']).optional(),
  })
  .optional()

/**
 * 背景設定を更新
 */
export async function updateThemeBackground(
  background?: BackgroundSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth()

    // 入力バリデーション
    const parseResult = backgroundSettingsSchema.safeParse(background)
    if (!parseResult.success) {
      console.error(
        '[updateThemeBackground] バリデーションエラー:',
        parseResult.error.flatten()
      )
      return { success: false, error: '無効な背景設定です' }
    }

    // 現在の設定を取得
    const currentSettings = await getUserThemeSettings(session.user.id)
    if (!currentSettings) {
      return { success: false, error: 'テーマ設定の取得に失敗しました' }
    }

    // 古い画像がある場合、新しい設定で画像を使用しないなら削除
    const oldImageKey = currentSettings.background?.imageKey
    const newImageKey = parseResult.data?.imageKey
    const shouldDeleteOldImage =
      oldImageKey &&
      currentSettings.background?.imageSource === 'user' && // ユーザーがアップロードした画像のみ削除
      (parseResult.data?.type !== 'image' || newImageKey !== oldImageKey)

    if (shouldDeleteOldImage) {
      // 非同期で画像を削除（失敗しても背景設定の更新は続行）
      deleteImageAction(oldImageKey).catch((error) => {
        console.error('Failed to delete old background image:', error)
      })
    }

    // 設定をマージ
    const newSettings: ThemeSettings = {
      ...currentSettings,
      background: parseResult.data,
    }

    // UserProfile を更新
    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        // Prisma JSON型の制限: Prisma.JsonValueと具体的な型（ThemeSettings）の不一致を回避するため`as never`を使用
        themeSettings: newSettings as never,
      },
      update: {
        // Prisma JSON型の制限: Prisma.JsonValueと具体的な型（ThemeSettings）の不一致を回避するため`as never`を使用
        themeSettings: newSettings as never,
      },
    })

    // ユーザーのhandleを取得してrevalidate
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { handle: true },
    })
    if (user?.handle) {
      revalidatePath(`/@${user.handle}`)
    }
    revalidatePath('/dashboard/profile-editor')

    return { success: true }
  } catch (error) {
    console.error('Failed to update background settings:', error)
    return { success: false, error: '背景設定の更新に失敗しました' }
  }
}
