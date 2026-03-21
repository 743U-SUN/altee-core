"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { NOTIFICATION_CONSTRAINTS } from "@/types/notifications"

// 通知データのバリデーションスキーマ
const notificationSchema = z.object({
  isEnabled: z.boolean().default(false),
  title: z.string()
    .max(NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH, `タイトルは${NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH}文字以内で入力してください`)
    .optional()
    .nullable(),
  content: z.string()
    .max(NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH, `内容は${NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH}文字以内で入力してください`)
    .optional()
    .nullable(),
  linkUrl: z.string()
    .refine(
      (val) => !val || NOTIFICATION_CONSTRAINTS.URL_PATTERN.test(val),
      { message: "URLはhttps://で始まる必要があります" }
    )
    .optional()
    .nullable(),
  buttonText: z.string()
    .max(20, "ボタンテキストは20文字以内で入力してください")
    .optional()
    .nullable(),
  imageId: z.string().optional().nullable(),
})

// ユーザーの通知設定を取得
export async function getUserNotification() {
  const session = await requireAuth()

  try {

    const notification = await prisma.userNotification.findUnique({
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

    return { success: true, data: notification }

  } catch {
    return { success: false, error: "通知設定の取得に失敗しました" }
  }
}

// 通知設定を作成・更新
export async function updateUserNotification(data: z.infer<typeof notificationSchema>) {
  const session = await requireAuth()

  try {

    // 権限チェック（AdminまたはUserロールのみ）
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.USER) {
      return { success: false, error: "権限がありません" }
    }

    // バリデーション
    const validatedData = notificationSchema.parse(data)

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
    const notification = await prisma.userNotification.upsert({
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
    revalidatePath(`/@${session.user.handle}`) // プロフィールページも更新
    return { success: true, data: notification }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "通知設定の更新に失敗しました" }
  }
}

// 通知設定を削除
export async function deleteUserNotification() {
  const session = await requireAuth()

  try {

    // 権限チェック（AdminまたはUserロールのみ）
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.USER) {
      return { success: false, error: "権限がありません" }
    }

    // 既存の通知設定があるかチェック
    const existingNotification = await prisma.userNotification.findUnique({
      where: { userId: session.user.id }
    })

    if (!existingNotification) {
      return { success: false, error: "通知設定が見つかりません" }
    }

    // 通知設定を削除
    await prisma.userNotification.delete({
      where: { userId: session.user.id }
    })

    revalidatePath("/dashboard/notifications")
    revalidatePath(`/@${session.user.handle}`) // プロフィールページも更新
    return { success: true }

  } catch {
    return { success: false, error: "通知設定の削除に失敗しました" }
  }
}

// Cookie用の既読状態管理
export async function markNotificationAsRead() {
  const session = await requireAuth()

  try {
    // 通知の最終更新日時を取得して返す
    const notification = await prisma.userNotification.findUnique({
      where: { userId: session.user.id },
      select: { updatedAt: true }
    })

    if (!notification) {
      return { success: false, error: "通知が見つかりません" }
    }

    return {
      success: true,
      data: {
        userId: session.user.id,
        updatedAt: notification.updatedAt.toISOString()
      }
    }

  } catch {
    return { success: false, error: "既読状態の更新に失敗しました" }
  }
}