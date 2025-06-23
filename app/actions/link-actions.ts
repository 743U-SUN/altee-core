"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ユーザーリンク作成・更新用のスキーマ
const userLinkSchema = z.object({
  linkTypeId: z.string().min(1, "リンクタイプは必須です"),
  url: z.string()
    .url("有効なURLを入力してください")
    .refine((url) => url.startsWith("https://"), {
      message: "HTTPSのURLを入力してください"
    }),
  customLabel: z.string()
    .max(10, "カスタムラベルは10文字以内で入力してください")
    .optional(),
  customIconId: z.string().optional(),
  isVisible: z.boolean().default(true),
})

// リンク並び替え用のスキーマ
const reorderLinksSchema = z.object({
  linkIds: z.array(z.string()).min(1, "並び替えるリンクが必要です"),
})

// LinkType作成・更新用のスキーマ（管理者用）
const linkTypeSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  displayName: z.string().min(1, "表示名は必須です"),
  defaultIcon: z.string().optional(),
  urlPattern: z.string().optional(),
  isCustom: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

// ユーザーリンクを作成
export async function createUserLink(data: z.infer<typeof userLinkSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = userLinkSchema.parse(data)

    // 20個制限チェック
    const existingLinksCount = await prisma.userLink.count({
      where: { userId: session.user.id }
    })

    if (existingLinksCount >= 20) {
      return { success: false, error: "リンクは最大20個まで設定できます" }
    }

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.userLink.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true }
    })

    const newSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    // リンクを作成
    const userLink = await prisma.userLink.create({
      data: {
        userId: session.user.id,
        linkTypeId: validatedData.linkTypeId,
        url: validatedData.url,
        customLabel: validatedData.customLabel,
        customIconId: validatedData.customIconId,
        isVisible: validatedData.isVisible,
        sortOrder: newSortOrder,
      },
      include: {
        linkType: true,
        customIcon: true,
      }
    })

    revalidatePath("/dashboard/links")
    return { success: true, data: userLink }

  } catch (error) {
    console.error("リンク作成エラー:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "リンクの作成に失敗しました" }
  }
}

// ユーザーリンクを更新
export async function updateUserLink(linkId: string, data: Partial<z.infer<typeof userLinkSchema>>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 部分バリデーション
    const validatedData = userLinkSchema.partial().parse(data)

    // 自分のリンクかどうかチェック
    const existingLink = await prisma.userLink.findFirst({
      where: { id: linkId, userId: session.user.id }
    })

    if (!existingLink) {
      return { success: false, error: "リンクが見つかりません" }
    }

    // リンクを更新
    const userLink = await prisma.userLink.update({
      where: { id: linkId },
      data: validatedData,
      include: {
        linkType: true,
        customIcon: true,
      }
    })

    revalidatePath("/dashboard/links")
    return { success: true, data: userLink }

  } catch (error) {
    console.error("リンク更新エラー:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "リンクの更新に失敗しました" }
  }
}

// ユーザーリンクを削除
export async function deleteUserLink(linkId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 自分のリンクかどうかチェック
    const existingLink = await prisma.userLink.findFirst({
      where: { id: linkId, userId: session.user.id }
    })

    if (!existingLink) {
      return { success: false, error: "リンクが見つかりません" }
    }

    // リンクを削除
    await prisma.userLink.delete({
      where: { id: linkId }
    })

    revalidatePath("/dashboard/links")
    return { success: true }

  } catch (error) {
    console.error("リンク削除エラー:", error)
    return { success: false, error: "リンクの削除に失敗しました" }
  }
}

// ユーザーのリンク一覧を取得
export async function getUserLinks(userId?: string) {
  try {
    const session = await auth()
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    const userLinks = await prisma.userLink.findMany({
      where: { 
        userId: targetUserId,
        // 自分のリンクでない場合は visible のみ表示
        ...(userId && userId !== session?.user?.id ? { isVisible: true } : {})
      },
      orderBy: { sortOrder: "asc" },
      include: {
        linkType: true,
        customIcon: true,
      }
    })

    return { success: true, data: userLinks }

  } catch (error) {
    console.error("リンク取得エラー:", error)
    return { success: false, error: "リンクの取得に失敗しました" }
  }
}

// リンクの並び替え
export async function reorderUserLinks(data: z.infer<typeof reorderLinksSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const validatedData = reorderLinksSchema.parse(data)

    // すべてのリンクが自分のものかチェック
    const userLinks = await prisma.userLink.findMany({
      where: { 
        id: { in: validatedData.linkIds },
        userId: session.user.id 
      }
    })

    if (userLinks.length !== validatedData.linkIds.length) {
      return { success: false, error: "無効なリンクが含まれています" }
    }

    // トランザクションで並び順を更新
    await prisma.$transaction(
      validatedData.linkIds.map((linkId, index) =>
        prisma.userLink.update({
          where: { id: linkId },
          data: { sortOrder: index }
        })
      )
    )

    revalidatePath("/dashboard/links")
    return { success: true }

  } catch (error) {
    console.error("リンク並び替えエラー:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "リンクの並び替えに失敗しました" }
  }
}

// 利用可能なリンクタイプ一覧を取得
export async function getLinkTypes() {
  try {
    const linkTypes = await prisma.linkType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })

    return { success: true, data: linkTypes }

  } catch (error) {
    console.error("リンクタイプ取得エラー:", error)
    return { success: false, error: "リンクタイプの取得に失敗しました" }
  }
}

// 管理者用: リンクタイプを作成
export async function createLinkType(data: z.infer<typeof linkTypeSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "管理者権限が必要です" }
    }

    const validatedData = linkTypeSchema.parse(data)

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.linkType.aggregate({
      _max: { sortOrder: true }
    })

    const newSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    const linkType = await prisma.linkType.create({
      data: {
        ...validatedData,
        sortOrder: validatedData.sortOrder || newSortOrder,
      }
    })

    revalidatePath("/admin/links")
    return { success: true, data: linkType }

  } catch (error) {
    console.error("リンクタイプ作成エラー:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "リンクタイプの作成に失敗しました" }
  }
}

// 管理者用: リンクタイプを更新
export async function updateLinkType(linkTypeId: string, data: Partial<z.infer<typeof linkTypeSchema>>) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "管理者権限が必要です" }
    }

    const validatedData = linkTypeSchema.partial().parse(data)

    const linkType = await prisma.linkType.update({
      where: { id: linkTypeId },
      data: validatedData
    })

    revalidatePath("/admin/links")
    return { success: true, data: linkType }

  } catch (error) {
    console.error("リンクタイプ更新エラー:", error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "リンクタイプの更新に失敗しました" }
  }
}

// 管理者用: リンクタイプを削除
export async function deleteLinkType(linkTypeId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "管理者権限が必要です" }
    }

    // 使用中のリンクタイプは削除できない
    const usageCount = await prisma.userLink.count({
      where: { linkTypeId }
    })

    if (usageCount > 0) {
      return { success: false, error: `このリンクタイプは${usageCount}個のリンクで使用中のため削除できません` }
    }

    await prisma.linkType.delete({
      where: { id: linkTypeId }
    })

    revalidatePath("/admin/links")
    return { success: true }

  } catch (error) {
    console.error("リンクタイプ削除エラー:", error)
    return { success: false, error: "リンクタイプの削除に失敗しました" }
  }
}