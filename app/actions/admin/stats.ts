"use server"

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  usersByRole: {
    ADMIN: number
    USER: number
    GUEST: number
  }
  oauthConnections: {
    google: number
    discord: number
    totalConnected: number
    totalUsers: number
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    // 全クエリをフラットに並列実行
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole,
      providerCounts,
      totalWithConnections,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      prisma.account.groupBy({
        by: ['provider'],
        _count: { id: true },
        where: { provider: { in: ['google', 'discord'] } }
      }),
      prisma.user.count({
        where: { accounts: { some: {} } }
      }),
    ])

    // ロール別カウントをオブジェクトに変換
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id
      return acc
    }, { ADMIN: 0, USER: 0, GUEST: 0 } as { ADMIN: number, USER: number, GUEST: number })

    const providerStats = providerCounts.reduce((acc, item) => {
      if (item.provider === 'google') acc.google = item._count.id
      if (item.provider === 'discord') acc.discord = item._count.id
      return acc
    }, { google: 0, discord: 0 })

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole: roleStats,
      oauthConnections: {
        google: providerStats.google,
        discord: providerStats.discord,
        totalConnected: totalWithConnections,
        totalUsers,
      }
    }
  } catch {
    throw new Error("統計データの取得に失敗しました")
  }
}