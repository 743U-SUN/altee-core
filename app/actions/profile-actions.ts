"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// プロフィール更新用のスキーマ
const updateProfileSchema = z.object({
  characterName: z.string().min(1, 'キャラクター名を入力してください').max(30, 'キャラクター名は30文字以下で入力してください').optional(),
  bio: z.string().max(500).optional(),
  profileImageId: z.string().optional(),
  backgroundImageKey: z.string().optional(),
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
          profileImageId: validatedData.profileImageId,
          backgroundImageKey: validatedData.backgroundImageKey,
        },
        create: {
          userId: session.user.id,
          bio: validatedData.bio,
          profileImageId: validatedData.profileImageId,
          backgroundImageKey: validatedData.backgroundImageKey,
        },
      })

      return userProfile
    })

    // キャッシュを再検証
    revalidatePath("/dashboard/profile")

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
        profileImage: true,
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