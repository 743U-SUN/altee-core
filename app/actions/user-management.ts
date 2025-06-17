"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { UserRole } from "@prisma/client"

// ユーザー一覧取得のフィルター・ページネーション型定義
export interface UserListFilters {
  search?: string
  role?: UserRole
  isActive?: boolean
  createdFrom?: Date
  createdTo?: Date
}

export interface UserListPagination {
  page: number
  limit: number
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
    const where = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.createdFrom && {
        createdAt: { gte: filters.createdFrom },
      }),
      ...(filters.createdTo && {
        createdAt: { lte: filters.createdTo },
      }),
    }

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
          createdAt: true,
          updatedAt: true,
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

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
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

  if (!["USER", "ADMIN", "GUEST"].includes(newRole)) {
    throw new Error("無効なロールです")
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, name: true },
    })

    if (!currentUser) {
      throw new Error("ユーザーが見つかりません")
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
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

  if (!reason || reason.trim().length < 5) {
    throw new Error("削除理由は5文字以上で入力してください")
  }

  try {
    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      throw new Error("ユーザーが見つかりません")
    }

    // 関連データを含めて削除（Cascadeで自動削除される）
    await prisma.user.delete({
      where: { id: userId },
    })

    // 削除ログを記録（将来的に実装）
    console.log(`User deleted: ${user.email} (${user.name}) - Reason: ${reason}`)

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

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      throw new Error("ユーザーが見つかりません")
    }

    // 全セッションを削除
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId },
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

  if (!userIds.length) {
    throw new Error("変更するユーザーが選択されていません")
  }

  if (!["USER", "ADMIN", "GUEST"].includes(newRole)) {
    throw new Error("無効なロールです")
  }

  try {
    await prisma.user.updateMany({
      where: {
        id: { in: userIds }
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

  if (!userIds.length) {
    throw new Error("変更するユーザーが選択されていません")
  }

  try {
    await prisma.user.updateMany({
      where: {
        id: { in: userIds }
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
 * CSVエクスポート用ユーザーデータ取得（メモリ効率化）
 */
export async function getUsersForCsvExport(filters: UserListFilters = {}) {
  await requireAdmin()

  try {
    const where = {
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.createdFrom && {
        createdAt: { gte: filters.createdFrom },
      }),
      ...(filters.createdTo && {
        createdAt: { lte: filters.createdTo },
      }),
    }

    // First, get the total count for memory estimation
    const totalCount = await prisma.user.count({ where })
    
    // For large datasets (>10k records), consider implementing pagination
    const BATCH_SIZE = 5000
    const shouldUseBatching = totalCount > BATCH_SIZE

    let users
    if (shouldUseBatching) {
      // Process in batches to avoid memory issues
      users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: BATCH_SIZE, // Limit to prevent memory issues
      })
    } else {
      users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }

    // CSV形式に変換（メモリ効率を考慮）
    const csvHeader = "ID,名前,メールアドレス,ロール,状態,登録日"
    const csvRows = users.map(user => 
      `"${user.id}","${user.name || ""}","${user.email}","${user.role}","${user.isActive ? "アクティブ" : "非アクティブ"}","${new Date(user.createdAt).toLocaleDateString("ja-JP")}"`
    )
    
    const csvContent = [csvHeader, ...csvRows].join("\n")
    
    return {
      csvContent,
      userCount: users.length,
      totalCount, // Return both actual exported count and total available
      filename: `users_export_${new Date().toISOString().split('T')[0]}.csv`,
      isTruncated: shouldUseBatching && users.length === BATCH_SIZE
    }
  } catch (error) {
    console.error("CSV export error:", error)
    throw new Error("CSVエクスポートに失敗しました")
  }
}