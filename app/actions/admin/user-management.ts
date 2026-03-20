"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { UserRole, AccountType } from "@prisma/client"
import { cuidSchema, cuidArraySchema } from "@/lib/validations/shared"
import { handleSchema } from "@/lib/validations/user-setup"
import { isReservedHandle } from "@/lib/reserved-handles"

// ユーザー一覧取得のフィルター・ページネーション型定義
export interface UserListFilters {
  search?: string
  role?: UserRole
  isActive?: boolean
  accountType?: AccountType
  createdFrom?: string
  createdTo?: string
}

export interface UserListPagination {
  page: number
  limit: number
}

/**
 * フィルターから Prisma WHERE 句を構築（getUserList / getUsersForCsvExport で共用）
 */
function buildUserWhereClause(filters: UserListFilters) {
  return {
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" as const } },
        { email: { contains: filters.search, mode: "insensitive" as const } },
        { handle: { contains: filters.search, mode: "insensitive" as const } },
        { characterInfo: { characterName: { contains: filters.search, mode: "insensitive" as const } } },
      ],
    }),
    ...(filters.role && { role: filters.role }),
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters.accountType && { accountType: filters.accountType }),
    ...((filters.createdFrom || filters.createdTo) && {
      createdAt: {
        ...(filters.createdFrom && { gte: new Date(filters.createdFrom) }),
        ...(filters.createdTo && { lte: new Date(filters.createdTo) }),
      },
    }),
  }
}

/**
 * ユーザー一覧を取得（フィルター・ページネーション対応）
 */
export async function getUserList(
  filters: UserListFilters = {},
  pagination: UserListPagination = { page: 1, limit: 20 }
) {
  await requireAdmin()

  try {
    const where = buildUserWhereClause(filters)

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          image: true,
          accountType: true,
          createdAt: true,
          updatedAt: true,
          characterInfo: {
            select: { characterName: true, iconImageKey: true },
          },
          _count: {
            select: {
              sessions: true,
              accounts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.user.count({ where }),
    ])

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / pagination.limit),
      currentPage: pagination.page,
    }
  } catch (error) {
    console.error("getUserList error:", error)
    throw new Error("ユーザー一覧の取得に失敗しました")
  }
}

/**
 * ユーザー詳細情報を取得
 */
export async function getUserDetail(userId: string) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  try {
    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
        characterInfo: {
          select: { characterName: true, iconImageKey: true },
        },
        sessions: {
          select: {
            id: true,
            expires: true,
          },
          orderBy: { expires: "desc" },
          take: 5,
        },
        _count: {
          select: {
            sessions: true,
            accounts: true,
            articles: true,
            mediaFiles: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error("ユーザーが見つかりません")
    }

    return user
  } catch (error) {
    console.error("getUserDetail error:", error)
    throw new Error("ユーザー詳細の取得に失敗しました")
  }
}

/**
 * ユーザーのロールを変更
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  if (!["USER", "ADMIN", "GUEST"].includes(newRole)) {
    throw new Error("無効なロールです")
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: validatedUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return updatedUser
  } catch (error) {
    console.error("updateUserRole error:", error)
    throw new Error("ユーザーロールの更新に失敗しました")
  }
}

/**
 * ユーザーのアクティブ状態を切り替え
 */
export async function toggleUserActive(userId: string) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: validatedUserId },
      select: { isActive: true, name: true },
    })

    if (!currentUser) {
      throw new Error("ユーザーが見つかりません")
    }

    const updatedUser = await prisma.user.update({
      where: { id: validatedUserId },
      data: { isActive: !currentUser.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    return updatedUser
  } catch (error) {
    console.error("toggleUserActive error:", error)
    throw new Error("ユーザー状態の更新に失敗しました")
  }
}

/**
 * ユーザーを強制削除（危険な操作）
 */
export async function deleteUser(userId: string, reason: string) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  if (!reason || reason.trim().length < 5) {
    throw new Error("削除理由は5文字以上で入力してください")
  }

  try {
    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      select: { name: true, email: true },
    })

    if (!user) {
      throw new Error("ユーザーが見つかりません")
    }

    // 関連データを含めて削除（Cascadeで自動削除される）
    await prisma.user.delete({
      where: { id: validatedUserId },
    })

    return { success: true, deletedUser: user }
  } catch (error) {
    console.error("deleteUser error:", error)
    throw new Error("ユーザーの削除に失敗しました")
  }
}

/**
 * ユーザーを強制ログアウト（全セッション削除）
 */
export async function forceLogout(userId: string) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  try {
    const user = await prisma.user.findUnique({
      where: { id: validatedUserId },
      select: { name: true, email: true },
    })

    if (!user) {
      throw new Error("ユーザーが見つかりません")
    }

    // 全セッションを削除
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: validatedUserId },
    })

    return {
      success: true,
      user,
      deletedSessionsCount: deletedSessions.count
    }
  } catch (error) {
    console.error("forceLogout error:", error)
    throw new Error("強制ログアウトに失敗しました")
  }
}

/**
 * 一括ロール変更
 */
export async function bulkUpdateUserRole(userIds: string[], newRole: UserRole) {
  await requireAdmin()

  const validatedIds = cuidArraySchema.parse(userIds)

  if (!["USER", "ADMIN", "GUEST"].includes(newRole)) {
    throw new Error("無効なロールです")
  }

  try {
    await prisma.user.updateMany({
      where: {
        id: { in: validatedIds }
      },
      data: {
        role: newRole
      }
    })
  } catch (error) {
    console.error("Bulk role update error:", error)
    throw new Error("一括ロール変更に失敗しました")
  }
}

/**
 * 一括状態変更
 */
export async function bulkToggleUserActive(userIds: string[], isActive: boolean) {
  await requireAdmin()

  const validatedIds = cuidArraySchema.parse(userIds)

  try {
    await prisma.user.updateMany({
      where: {
        id: { in: validatedIds }
      },
      data: {
        isActive
      }
    })
  } catch (error) {
    console.error("Bulk active toggle error:", error)
    throw new Error("一括状態変更に失敗しました")
  }
}

/**
 * CSV値をエスケープ（インジェクション対策）
 */
function escapeCsvValue(val: string): string {
  const escaped = val.replace(/"/g, '""')
  if (/^[=+\-@\t\r]/.test(escaped)) return `"'${escaped}"`
  return `"${escaped}"`
}

/**
 * CSVエクスポート用ユーザーデータ取得（メモリ効率化）
 */
export async function getUsersForCsvExport(filters: UserListFilters = {}) {
  await requireAdmin()

  try {
    const where = buildUserWhereClause(filters)

    const totalCount = await prisma.user.count({ where })

    const BATCH_SIZE = 5000
    const shouldUseBatching = totalCount > BATCH_SIZE

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        handle: true,
        role: true,
        isActive: true,
        createdAt: true,
        characterInfo: {
          select: { characterName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(shouldUseBatching && { take: BATCH_SIZE }),
    })

    const csvHeader = "ID,名前,キャラクター名,ハンドル,ロール,状態,登録日"
    const csvRows = users.map(user =>
      [
        escapeCsvValue(user.id),
        escapeCsvValue(user.name || ""),
        escapeCsvValue(user.characterInfo?.characterName || ""),
        escapeCsvValue(user.handle || ""),
        escapeCsvValue(user.role),
        escapeCsvValue(user.isActive ? "アクティブ" : "非アクティブ"),
        escapeCsvValue(new Date(user.createdAt).toLocaleDateString("ja-JP")),
      ].join(",")
    )

    const csvContent = [csvHeader, ...csvRows].join("\n")

    return {
      csvContent,
      userCount: users.length,
      totalCount,
      filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
      isTruncated: shouldUseBatching && users.length === BATCH_SIZE
    }
  } catch (error) {
    console.error("CSV export error:", error)
    throw new Error("CSVエクスポートに失敗しました")
  }
}

/**
 * Adminによるユーザーハンドル変更（特権操作）
 */
export async function updateUserHandle(
  userId: string,
  newHandle: string,
  reason: string
) {
  await requireAdmin()
  const validatedUserId = cuidSchema.parse(userId)

  // 変更理由のバリデーション
  if (!reason || reason.trim().length < 5) {
    throw new Error("変更理由は5文字以上で入力してください")
  }

  try {
    const validation = handleSchema.safeParse(newHandle)
    if (!validation.success) {
      throw new Error(validation.error.errors[0]?.message || "ハンドルの形式が正しくありません")
    }

    const normalizedHandle = validation.data

    // 予約語チェック
    if (isReservedHandle(normalizedHandle)) {
      throw new Error("このハンドルは予約語のため使用できません")
    }

    // 重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { handle: normalizedHandle },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== validatedUserId) {
      throw new Error("このハンドルは既に使用されています")
    }

    // 現在のユーザー情報を取得
    const currentUser = await prisma.user.findUnique({
      where: { id: validatedUserId },
      select: { handle: true, name: true, email: true },
    })

    if (!currentUser) {
      throw new Error("ユーザーが見つかりません")
    }

    // ハンドル更新
    const updatedUser = await prisma.user.update({
      where: { id: validatedUserId },
      data: { handle: normalizedHandle },
      select: {
        id: true,
        handle: true,
        name: true,
        email: true,
      },
    })

    return {
      success: true,
      oldHandle: currentUser.handle,
      newHandle: normalizedHandle,
      user: updatedUser,
    }
  } catch (error) {
    console.error("updateUserHandle error:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("ハンドルの更新に失敗しました")
  }
}