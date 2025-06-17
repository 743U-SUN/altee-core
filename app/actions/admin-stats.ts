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
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole,
      googleConnections,
      discordConnections,
      totalWithConnections
    ] = await Promise.all([
      // 総ユーザー数
      prisma.user.count(),
      
      // アクティブユーザー数
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // 今日の新規登録数
      prisma.user.count({
        where: {
          createdAt: { gte: today }
        }
      }),
      
      // 今週の新規登録数
      prisma.user.count({
        where: {
          createdAt: { gte: thisWeek }
        }
      }),
      
      // 今月の新規登録数
      prisma.user.count({
        where: {
          createdAt: { gte: thisMonth }
        }
      }),
      
      // ロール別ユーザー数
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      
      // Google連携数
      prisma.account.count({
        where: { provider: 'google' }
      }),
      
      // Discord連携数
      prisma.account.count({
        where: { provider: 'discord' }
      }),
      
      // OAuth連携を持つユーザー数
      prisma.user.count({
        where: {
          accounts: {
            some: {}
          }
        }
      })
    ])

    // ロール別カウントをオブジェクトに変換
    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id
      return acc
    }, { ADMIN: 0, USER: 0, GUEST: 0 } as { ADMIN: number, USER: number, GUEST: number })

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersByRole: roleStats,
      oauthConnections: {
        google: googleConnections,
        discord: discordConnections,
        totalConnected: totalWithConnections,
        totalUsers
      }
    }
  } catch (error) {
    console.error("統計データの取得に失敗しました:", error)
    throw new Error("統計データの取得に失敗しました")
  }
}