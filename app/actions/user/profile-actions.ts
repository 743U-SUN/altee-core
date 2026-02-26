"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ThemeSettings } from "@/types/profile-sections"
import { deleteImageAction } from "@/app/actions/media/image-upload-actions"

// プロフィール更新用のスキーマ
const updateProfileSchema = z.object({
  characterName: z.string().min(1, 'キャラクター名を入力してください').max(30, 'キャラクター名は30文字以下で入力してください').optional(),
  bio: z.string().max(500).optional(),
  characterImageId: z.string().nullable().optional(), // キャラクター画像（9:16縦長）- nullで削除
  avatarImageId: z.string().nullable().optional(),    // アイコン画像（1:1正方形）- nullで削除
  backgroundImageKey: z.string().nullable().optional(),
  bannerImageKey: z.string().nullable().optional(),   // バナー画像（3:1横長）- nullで削除
  characterBackgroundKey: z.string().nullable().optional(), // CharacterColumn専用背景 - nullで削除
})

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = updateProfileSchema.parse(data)

    // トランザクションでユーザーとプロフィールを更新
    const result = await prisma.$transaction(async (tx) => {
      // characterNameが指定されている場合はUserテーブルを更新
      if (validatedData.characterName !== undefined) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { characterName: validatedData.characterName },
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
          avatarImageId: validatedData.avatarImageId,
          backgroundImageKey: validatedData.backgroundImageKey,
          bannerImageKey: validatedData.bannerImageKey,
          characterBackgroundKey: validatedData.characterBackgroundKey,
        },
        create: {
          userId: session.user.id,
          bio: validatedData.bio,
          characterImageId: validatedData.characterImageId,
          avatarImageId: validatedData.avatarImageId,
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
    console.error("プロフィール更新エラー:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "プロフィールの更新に失敗しました" }
  }
}

export async function getUserProfile(userId?: string) {
  try {
    // 認証チェック（自分のプロフィールの場合）
    const session = await auth()
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: {
        userId: targetUserId,
      },
      include: {
        characterImage: true, // キャラクター画像
        avatarImage: true,    // アイコン画像
        user: {
          select: {
            name: true,
            email: true,
            characterName: true,
          },
        },
      },
    })

    return { success: true, data: userProfile }
  } catch (error) {
    console.error("プロフィール取得エラー:", error)
    return { success: false, error: "プロフィールの取得に失敗しました" }
  }
}

/**
 * themeSettings の namecard フィールドを更新（他フィールドはマージして保持）
 * namecard が null の場合はデフォルトに戻す（namecard キーを削除）
 */
export async function updateThemeSettings(
  namecard: NonNullable<ThemeSettings['namecard']> | null
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
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
      deleteImageAction(existingNamecard.imageKey).catch((error) => {
        console.error('Failed to delete old namecard image:', error)
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
  } catch (error) {
    console.error("themeSettings更新エラー:", error)
    return { success: false, error: "テーマ設定の更新に失敗しました" }
  }
}

/**
 * ネームカードプリセット画像一覧を取得（tags に "namecard" を含む BACKGROUND 画像）
 */
export async function getNamecardImages() {
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
  } catch (error) {
    console.error("ネームカード画像取得エラー:", error)
    return { success: false, error: "ネームカード画像の取得に失敗しました" }
  }
}

/**
 * 背景画像一覧を取得
 */
export async function getBackgroundImages() {
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
  } catch (error) {
    console.error("背景画像取得エラー:", error)
    return { success: false, error: "背景画像の取得に失敗しました" }
  }
}