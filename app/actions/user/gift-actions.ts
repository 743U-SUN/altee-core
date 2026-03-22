"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { invalidateUserCacheTags } from "@/lib/cache-utils"
import { UserRole } from "@prisma/client"
import { GIFT_CONSTRAINTS } from "@/types/gift"

// ギフト設定データのバリデーションスキーマ
const giftSchema = z.object({
  isEnabled: z.boolean().default(false),
  linkUrl: z
    .string()
    .max(2000, 'URLは2000文字以内で入力してください')
    .optional()
    .nullable(),
  imageId: z.string().optional().nullable(),
}).refine(
  (data) => {
    // linkUrlが存在する場合のみ、正規表現チェック
    if (data.linkUrl && data.linkUrl.trim() !== '') {
      return GIFT_CONSTRAINTS.URL_PATTERN.test(data.linkUrl)
    }
    return true
  },
  {
    message: "URLはhttps://で始まる必要があります",
    path: ["linkUrl"],
  }
)

// ユーザーのギフト設定を取得
export async function getUserGift() {
  const session = await requireAuth()

  try {

    const gift = await prisma.userGift.findUnique({
      where: { userId: session.user.id },
      include: {
        image: {
          select: {
            id: true,
            storageKey: true,
            originalName: true,
            mimeType: true,
          }
        }
      }
    })

    return { success: true, data: gift }

  } catch {
    return { success: false, error: "ギフト設定の取得に失敗しました" }
  }
}

// ギフト設定を作成・更新
export async function updateUserGift(data: z.infer<typeof giftSchema>) {
  const session = await requireAuth()

  try {

    // 権限チェック（AdminまたはUserロールのみ）
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.USER) {
      return { success: false, error: "権限がありません" }
    }

    // バリデーション
    const validatedData = giftSchema.parse(data)

    // 画像IDが指定されている場合、自分がアップロードした画像かチェック
    if (validatedData.imageId) {
      const image = await prisma.mediaFile.findFirst({
        where: {
          id: validatedData.imageId,
          uploaderId: session.user.id,
          deletedAt: null
        }
      })

      if (!image) {
        return { success: false, error: "指定された画像が見つかりません" }
      }
    }

    // upsert（存在する場合は更新、しない場合は作成）
    const gift = await prisma.userGift.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      },
      include: {
        image: {
          select: {
            id: true,
            storageKey: true,
            originalName: true,
            mimeType: true,
          }
        }
      }
    })

    revalidatePath("/dashboard/notifications")
    revalidatePath(`/@${session.user.handle}`)
    invalidateUserCacheTags(session.user.handle, ['profile'])

    return { success: true, data: gift }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "ギフト設定の更新に失敗しました" }
  }
}

// ギフト設定を削除
export async function deleteUserGift() {
  const session = await requireAuth()

  try {

    // 権限チェック（AdminまたはUserロールのみ）
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.USER) {
      return { success: false, error: "権限がありません" }
    }

    // 存在確認
    const existing = await prisma.userGift.findUnique({
      where: { userId: session.user.id }
    })
    if (!existing) {
      return { success: false, error: "ギフト設定が見つかりません" }
    }

    // 削除
    await prisma.userGift.delete({
      where: { userId: session.user.id }
    })

    revalidatePath("/dashboard/notifications")
    revalidatePath(`/@${session.user.handle}`)
    invalidateUserCacheTags(session.user.handle, ['profile'])

    return { success: true }

  } catch {
    return { success: false, error: "ギフト設定の削除に失敗しました" }
  }
}
