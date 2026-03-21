"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ThemeSettings } from "@/types/profile-sections"
import { deleteImageAction } from "@/app/actions/media/image-upload-actions"

// プロフィール更新用のスキーマ
const updateProfileSchema = z.object({
  characterName: z.string().min(1, 'キャラクター名を入力してください').max(30, 'キャラクター名は30文字以下で入力してください').optional(),
  bio: z.string().max(500).optional(),
  characterImageId: z.string().nullable().optional(), // キャラクター画像（9:16縦長）- nullで削除
  iconImageKey: z.string().nullable().optional(),      // アイコン画像（R2 key）→ CharacterInfo.iconImageKey
  backgroundImageKey: z.string().nullable().optional(),
  bannerImageKey: z.string().nullable().optional(),   // バナー画像（3:1横長）- nullで削除
  characterBackgroundKey: z.string().nullable().optional(), // CharacterColumn専用背景 - nullで削除
})

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
  const session = await requireAuth()

  try {

    // バリデーション
    const validatedData = updateProfileSchema.parse(data)

    // トランザクションでプロフィールを更新
    const result = await prisma.$transaction(async (tx) => {
      // characterName / iconImageKey → CharacterInfo に保存
      if (validatedData.characterName !== undefined || validatedData.iconImageKey !== undefined) {
        await tx.characterInfo.upsert({
          where: { userId: session.user.id },
          update: {
            ...(validatedData.characterName !== undefined && { characterName: validatedData.characterName }),
            ...(validatedData.iconImageKey !== undefined && { iconImageKey: validatedData.iconImageKey }),
          },
          create: {
            userId: session.user.id,
            characterName: validatedData.characterName ?? null,
            iconImageKey: validatedData.iconImageKey ?? null,
          },
        })
      }

      // UserProfileの更新または作成
      const userProfile = await tx.userProfile.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          bio: validatedData.bio,
          characterImageId: validatedData.characterImageId,
          backgroundImageKey: validatedData.backgroundImageKey,
          bannerImageKey: validatedData.bannerImageKey,
          characterBackgroundKey: validatedData.characterBackgroundKey,
        },
        create: {
          userId: session.user.id,
          bio: validatedData.bio,
          characterImageId: validatedData.characterImageId,
          backgroundImageKey: validatedData.backgroundImageKey,
          bannerImageKey: validatedData.bannerImageKey,
          characterBackgroundKey: validatedData.characterBackgroundKey,
        },
      })

      return userProfile
    })

    // キャッシュを再検証
    revalidatePath("/dashboard/profile-editor")

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "プロフィールの更新に失敗しました" }
  }
}

/**
 * themeSettings の namecard フィールドを更新（他フィールドはマージして保持）
 * namecard が null の場合はデフォルトに戻す（namecard キーを削除）
 */
const hexColorPattern = /^#[0-9a-fA-F]{6}$/

const namecardSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('color'), color: z.string().regex(hexColorPattern), textColor: z.string().regex(hexColorPattern).optional() }),
  z.object({ type: z.literal('preset'), imageKey: z.string().min(1), textColor: z.string().regex(hexColorPattern).optional() }),
  z.object({ type: z.literal('image'), imageKey: z.string().min(1), textColor: z.string().regex(hexColorPattern).optional() }),
])

export async function updateThemeSettings(
  namecard: NonNullable<ThemeSettings['namecard']> | null
) {
  const session = await requireAuth()

  try {
    if (namecard !== null) {
      namecardSchema.parse(namecard)
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { themeSettings: true },
    })

    const current = (profile?.themeSettings ?? {}) as unknown as ThemeSettings
    const existingNamecard = current.namecard
    let merged: ThemeSettings

    // ユーザーアップロードのカスタム画像を削除すべきか判定
    // - デフォルトに戻す場合（null）
    // - 別タイプに変更する場合（image → color/preset）
    // - 別の画像に差し替える場合（imageKey が変わる）
    const shouldDeleteOldImage =
      existingNamecard?.type === 'image' &&
      existingNamecard.imageKey &&
      (namecard === null ||
        namecard.type !== 'image' ||
        namecard.imageKey !== existingNamecard.imageKey)

    if (shouldDeleteOldImage && existingNamecard?.imageKey) {
      deleteImageAction(existingNamecard.imageKey).catch(() => {
        // 削除失敗は無視
      })
    }

    if (namecard === null) {
      // namecard キーを削除してデフォルトに戻す
      const { namecard: _, ...rest } = current
      void _
      merged = rest as ThemeSettings
    } else {
      merged = { ...current, namecard }
    }

    await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: { themeSettings: merged as never },
    })

    revalidatePath("/dashboard/profile-editor")

    return { success: true }
  } catch {
    return { success: false, error: "テーマ設定の更新に失敗しました" }
  }
}

/**
 * ネームカードプリセット画像一覧を取得（tags に "namecard" を含む BACKGROUND 画像）
 */
export async function getNamecardImages() {
  await requireAuth()

  try {
    const namecardImages = await prisma.mediaFile.findMany({
      where: {
        uploadType: 'BACKGROUND',
        tags: { array_contains: 'namecard' },
        deletedAt: null,
      },
      select: {
        id: true,
        storageKey: true,
        fileName: true,
        originalName: true,
        description: true,
        altText: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, data: namecardImages }
  } catch {
    return { success: false, error: "ネームカード画像の取得に失敗しました" }
  }
}

/**
 * 背景画像一覧を取得
 */
export async function getBackgroundImages() {
  await requireAuth()

  try {
    const backgroundImages = await prisma.mediaFile.findMany({
      where: {
        uploadType: 'BACKGROUND',
        deletedAt: null, // 削除されていないもののみ
      },
      select: {
        id: true,
        storageKey: true,
        fileName: true,
        originalName: true,
        description: true,
        altText: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, data: backgroundImages }
  } catch {
    return { success: false, error: "背景画像の取得に失敗しました" }
  }
}