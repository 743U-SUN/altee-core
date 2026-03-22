"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { handleSchema, characterNameSchema } from "@/lib/validations/user-setup"
import { basicInfoSchema } from "@/lib/validations/character"
import { z } from "zod"
import { cuidSchema } from "@/lib/validations/shared"
import { invalidateAllUserCacheTags, invalidateUserCacheTags } from "@/lib/cache-utils"

// ===== ヘルパー =====

/**
 * MANAGED ユーザーの存在確認
 * MANAGED 以外のユーザーに対する操作を防止
 */
async function requireManagedUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, accountType: true, handle: true },
  })

  if (!user) {
    throw new Error("ユーザーが見つかりません")
  }

  if (user.accountType !== "MANAGED") {
    throw new Error("このユーザーはMANAGEDプロフィールではありません")
  }

  return user
}

// ===== CRUD =====

/**
 * MANAGEDプロフィールを作成
 * handle + characterName → トランザクションで User + UserProfile + CharacterInfo 一括作成
 */
export async function createManagedProfile(data: {
  handle: string
  characterName: string
}) {
  const session = await requireAdmin()

  try {
    // バリデーション
    const validatedHandle = handleSchema.parse(data.handle)
    const validatedName = characterNameSchema.parse(data.characterName)

    // ハンドル重複チェック
    const existing = await prisma.user.findUnique({
      where: { handle: validatedHandle },
      select: { id: true },
    })

    if (existing) {
      return { success: false, error: "このハンドルは既に使用されています" }
    }

    // トランザクションで一括作成
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: `${validatedHandle}@altee.internal`,
          name: validatedName,
          handle: validatedHandle,
          accountType: "MANAGED",
          managedBy: session.user.id,
          role: "USER",
          profile: {
            create: {},
          },
          characterInfo: {
            create: {
              characterName: validatedName,
            },
          },
        },
        select: {
          id: true,
          handle: true,
          name: true,
          characterInfo: {
            select: { characterName: true },
          },
        },
      })

      return newUser
    })

    revalidatePath("/admin/managed-profiles")

    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力が不正です" }
    }
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: "このハンドルは既に使用されています" }
    }
    return { success: false, error: "プロフィールの作成に失敗しました" }
  }
}

/**
 * MANAGEDプロフィール一覧を取得（検索・ページネーション付き）
 */
export async function getManagedProfiles(
  filters: { search?: string } = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 20 }
) {
  await requireAdmin()

  try {
    const where = {
      accountType: "MANAGED" as const,
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { handle: { contains: filters.search, mode: "insensitive" as const } },
          { characterInfo: { characterName: { contains: filters.search, mode: "insensitive" as const } } },
        ],
      }),
    }

    const [profiles, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          handle: true,
          name: true,
          createdAt: true,
          managedBy: true,
          characterInfo: {
            select: { characterName: true, iconImageKey: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.user.count({ where }),
    ])

    return {
      profiles,
      totalCount,
      totalPages: Math.ceil(totalCount / pagination.limit),
      currentPage: pagination.page,
    }
  } catch {
    throw new Error("プロフィール一覧の取得に失敗しました")
  }
}

/**
 * MANAGEDプロフィール詳細を取得
 */
export async function getManagedProfileDetail(userId: string) {
  await requireAdmin()

  const validatedUserId = cuidSchema.parse(userId)

  try {
    await requireManagedUser(validatedUserId)

    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      select: {
        id: true,
        handle: true,
        name: true,
        accountType: true,
        managedBy: true,
        createdAt: true,
        characterInfo: true,
        profile: {
          select: { id: true },
        },
      },
    })

    if (!user) {
      throw new Error("ユーザーが見つかりません")
    }

    return user
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("プロフィール詳細の取得に失敗しました")
  }
}

/**
 * MANAGEDプロフィールを削除
 */
export async function deleteManagedProfile(userId: string) {
  await requireAdmin()

  const validatedUserId = cuidSchema.parse(userId)

  try {
    const user = await requireManagedUser(validatedUserId)

    await prisma.user.delete({
      where: { id: validatedUserId },
    })

    invalidateAllUserCacheTags(user.handle)
    revalidatePath("/admin/managed-profiles")

    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("プロフィールの削除に失敗しました")
  }
}

// ===== キャラクター情報編集 =====

/**
 * 管理者用キャラクター情報取得
 */
export async function adminGetCharacterInfo(userId: string) {
  await requireAdmin()

  const validatedUserId = cuidSchema.parse(userId)

  try {
    await requireManagedUser(validatedUserId)

    const characterInfo = await prisma.characterInfo.findUnique({
      where: { userId: validatedUserId },
    })

    return { success: true, data: characterInfo }
  } catch {
    return { success: false, error: "キャラクター情報の取得に失敗しました" }
  }
}

/**
 * 管理者用キャラクター基本情報更新
 */
export async function adminUpdateCharacterInfo(
  userId: string,
  data: z.infer<typeof basicInfoSchema>
) {
  await requireAdmin()

  const validatedUserId = cuidSchema.parse(userId)

  try {
    const user = await requireManagedUser(validatedUserId)

    const validated = basicInfoSchema.parse(data)

    const characterData = {
      ...validated,
      debutDate: validated.debutDate ? new Date(validated.debutDate) : null,
      affiliationType: validated.affiliationType || null,
      affiliation: validated.affiliationType === "agency" ? (validated.affiliation || null) : null,
    }

    await prisma.characterInfo.upsert({
      where: { userId: validatedUserId },
      create: { userId: validatedUserId, ...characterData },
      update: characterData,
    })

    invalidateUserCacheTags(user.handle, ['profile'])
    revalidatePath("/admin/managed-profiles")

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "入力が不正です" }
    }
    return { success: false, error: "キャラクター情報の更新に失敗しました" }
  }
}
