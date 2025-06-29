"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { UserRole } from "@prisma/client"
import { CONTACT_CONSTRAINTS } from "@/types/contacts"

// 連絡方法データのバリデーションスキーマ
const contactSchema = z.object({
  isEnabled: z.boolean().default(false),
  title: z.string()
    .max(CONTACT_CONSTRAINTS.TITLE_MAX_LENGTH, `タイトルは${CONTACT_CONSTRAINTS.TITLE_MAX_LENGTH}文字以内で入力してください`)
    .optional()
    .nullable(),
  content: z.string()
    .max(CONTACT_CONSTRAINTS.CONTENT_MAX_LENGTH, `内容は${CONTACT_CONSTRAINTS.CONTENT_MAX_LENGTH}文字以内で入力してください`)
    .optional()
    .nullable(),
  linkUrl: z.string()
    .regex(CONTACT_CONSTRAINTS.URL_PATTERN, "URLはhttps://で始まる必要があります")
    .optional()
    .nullable(),
  buttonText: z.string()
    .max(20, "ボタンテキストは20文字以内で入力してください")
    .optional()
    .nullable(),
  imageId: z.string().optional().nullable(),
})

// ユーザーの連絡方法設定を取得
export async function getUserContact(userId?: string) {
  try {
    const session = await auth()
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    const contact = await prisma.userContact.findUnique({
      where: { userId: targetUserId },
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

    return { success: true, data: contact }

  } catch {
    return { success: false, error: "連絡方法設定の取得に失敗しました" }
  }
}

// 連絡方法設定を作成・更新
export async function updateUserContact(data: z.infer<typeof contactSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 権限チェック（AdminまたはUserロールのみ）
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.USER) {
      return { success: false, error: "権限がありません" }
    }

    // バリデーション
    const validatedData = contactSchema.parse(data)

    // linkUrlがある場合、buttonTextも必要
    if (validatedData.linkUrl && !validatedData.buttonText) {
      return { success: false, error: "リンクを設定する場合、ボタンテキストも設定してください" }
    }

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
    const contact = await prisma.userContact.upsert({
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
    revalidatePath(`/${session.user.handle}`) // プロフィールページも更新
    return { success: true, data: contact }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "連絡方法設定の更新に失敗しました" }
  }
}

// 連絡方法設定を削除
export async function deleteUserContact() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 権限チェック（AdminまたはUserロールのみ）
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.USER) {
      return { success: false, error: "権限がありません" }
    }

    // 既存の連絡方法設定があるかチェック
    const existingContact = await prisma.userContact.findUnique({
      where: { userId: session.user.id }
    })

    if (!existingContact) {
      return { success: false, error: "連絡方法設定が見つかりません" }
    }

    // 連絡方法設定を削除
    await prisma.userContact.delete({
      where: { userId: session.user.id }
    })

    revalidatePath("/dashboard/notifications")
    revalidatePath(`/${session.user.handle}`) // プロフィールページも更新
    return { success: true }

  } catch {
    return { success: false, error: "連絡方法設定の削除に失敗しました" }
  }
}