"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// LinkType用のinclude定義
const linkTypeInclude = {
  icons: {
    orderBy: { sortOrder: "asc" as const }
  }
} as const

// LinkType作成・更新用のスキーマ（管理者用）
const linkTypeSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  displayName: z.string().min(1, "表示名は必須です"),
  urlPattern: z.string().optional(),
  isCustom: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

// LinkTypeIcon作成・更新用のスキーマ（管理者用）
const linkTypeIconSchema = z.object({
  iconKey: z.string().min(1, "アイコンキーは必須です"),
  iconName: z.string().max(50, "アイコン名は50文字以内で入力してください").optional(),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

// 利用可能なリンクタイプ一覧を取得（管理者用）
export async function getLinkTypes() {
  await requireAdmin()

  try {
    const linkTypes = await prisma.linkType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: linkTypeInclude
    })

    return { success: true, data: linkTypes }

  } catch {
    return { success: false, error: "リンクタイプの取得に失敗しました" }
  }
}

// 管理者用: リンクタイプを作成
export async function createLinkType(data: z.infer<typeof linkTypeSchema>) {
  try {
    await requireAdmin()

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
    await requireAdmin()

    const validatedData = linkTypeSchema.partial().parse(data)

    const linkType = await prisma.linkType.update({
      where: { id: linkTypeId },
      data: validatedData
    })

    revalidatePath("/admin/links")
    return { success: true, data: linkType }

  } catch (error) {
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
export async function deleteLinkType(linkTypeId: string, _force: boolean = false) {
  try {
    await requireAdmin()

    // Note: UserLinkテーブルは削除済みのため、使用チェックはスキップ
    // 将来的にUserSectionでリンクタイプを使用する場合は、ここにチェックを追加

    // リンクタイプを削除（カスケードでLinkTypeIconも削除される）
    await prisma.linkType.delete({
      where: { id: linkTypeId }
    })

    revalidatePath("/admin/links")
    return { success: true }

  } catch (error) {
    console.error('LinkType deletion error:', error)
    return { success: false, error: "リンクタイプの削除に失敗しました" }
  }
}

// ====== LinkTypeIcon管理関数 ======

// 管理者用: リンクタイプのアイコン一覧を取得
export async function getLinkTypeIcons(linkTypeId: string) {
  try {
    await requireAdmin()

    const icons = await prisma.linkTypeIcon.findMany({
      where: { linkTypeId },
      orderBy: { sortOrder: "asc" }
    })

    return { success: true, data: icons }

  } catch {
    return { success: false, error: "アイコンの取得に失敗しました" }
  }
}

// 管理者用: リンクタイプアイコンを作成
export async function createLinkTypeIcon(linkTypeId: string, data: z.infer<typeof linkTypeIconSchema>) {
  try {
    await requireAdmin()

    const validatedData = linkTypeIconSchema.parse(data)

    // リンクタイプが存在するかチェック
    const linkType = await prisma.linkType.findUnique({
      where: { id: linkTypeId }
    })

    if (!linkType) {
      return { success: false, error: "リンクタイプが見つかりません" }
    }

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.linkTypeIcon.aggregate({
      where: { linkTypeId },
      _max: { sortOrder: true }
    })

    const newSortOrder = validatedData.sortOrder || (maxSortOrder._max.sortOrder || 0) + 1

    // デフォルトアイコンに設定する場合は、他のアイコンのデフォルトを解除
    if (validatedData.isDefault) {
      await prisma.linkTypeIcon.updateMany({
        where: { linkTypeId },
        data: { isDefault: false }
      })
    }

    const icon = await prisma.linkTypeIcon.create({
      data: {
        linkTypeId,
        iconKey: validatedData.iconKey,
        iconName: validatedData.iconName || "",
        isDefault: validatedData.isDefault,
        sortOrder: newSortOrder,
      }
    })

    revalidatePath("/admin/links")
    return { success: true, data: icon }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "アイコンの作成に失敗しました" }
  }
}

// 管理者用: リンクタイプアイコンを更新
export async function updateLinkTypeIcon(iconId: string, data: Partial<z.infer<typeof linkTypeIconSchema>>) {
  try {
    await requireAdmin()

    const validatedData = linkTypeIconSchema.partial().parse(data)

    const existingIcon = await prisma.linkTypeIcon.findUnique({
      where: { id: iconId }
    })

    if (!existingIcon) {
      return { success: false, error: "アイコンが見つかりません" }
    }

    // デフォルトアイコンに設定する場合は、他のアイコンのデフォルトを解除
    if (validatedData.isDefault) {
      await prisma.linkTypeIcon.updateMany({
        where: {
          linkTypeId: existingIcon.linkTypeId,
          id: { not: iconId }
        },
        data: { isDefault: false }
      })
    }

    const icon = await prisma.linkTypeIcon.update({
      where: { id: iconId },
      data: validatedData
    })

    revalidatePath("/admin/links")
    return { success: true, data: icon }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "アイコンの更新に失敗しました" }
  }
}

// 管理者用: リンクタイプアイコンを削除
export async function deleteLinkTypeIcon(iconId: string) {
  try {
    await requireAdmin()

    await prisma.linkTypeIcon.delete({
      where: { id: iconId }
    })

    revalidatePath("/admin/links")
    return { success: true }

  } catch {
    return { success: false, error: "アイコンの削除に失敗しました" }
  }
}

// 管理者用: デフォルトアイコンを設定
export async function setDefaultLinkTypeIcon(iconId: string) {
  try {
    await requireAdmin()

    const targetIcon = await prisma.linkTypeIcon.findUnique({
      where: { id: iconId }
    })

    if (!targetIcon) {
      return { success: false, error: "アイコンが見つかりません" }
    }

    // トランザクションで実行
    await prisma.$transaction([
      // 同じリンクタイプの他のアイコンのデフォルトを解除
      prisma.linkTypeIcon.updateMany({
        where: {
          linkTypeId: targetIcon.linkTypeId,
          id: { not: iconId }
        },
        data: { isDefault: false }
      }),
      // 指定したアイコンをデフォルトに設定
      prisma.linkTypeIcon.update({
        where: { id: iconId },
        data: { isDefault: true }
      })
    ])

    revalidatePath("/admin/links")
    return { success: true }

  } catch {
    return { success: false, error: "デフォルトアイコンの設定に失敗しました" }
  }
}

// 管理者用: アイコンの並び替え
export async function reorderLinkTypeIcons(linkTypeId: string, iconIds: string[]) {
  try {
    await requireAdmin()

    // すべてのアイコンが指定したリンクタイプに属するかチェック
    const icons = await prisma.linkTypeIcon.findMany({
      where: {
        id: { in: iconIds },
        linkTypeId
      }
    })

    if (icons.length !== iconIds.length) {
      return { success: false, error: "無効なアイコンが含まれています" }
    }

    // トランザクションで並び順を更新
    await prisma.$transaction(
      iconIds.map((iconId, index) =>
        prisma.linkTypeIcon.update({
          where: { id: iconId },
          data: { sortOrder: index }
        })
      )
    )

    revalidatePath("/admin/links")
    return { success: true }

  } catch {
    return { success: false, error: "アイコンの並び替えに失敗しました" }
  }
}
