import React from "react"
import { AdminSidebarContent } from "@/components/sidebar-content/AdminSidebarContent"
import { AdminStats } from "@/app/actions/admin-stats"

// サイドバーコンテンツのレジストリ
export const sidebarContentRegistry = {
  admin: (stats: AdminStats) => <AdminSidebarContent stats={stats} />,
  // 他のバリアント用コンテンツも追加可能
  // dashboard: () => <DashboardSidebarContent />,
  // userProfile: () => <UserProfileSidebarContent />,
} as const

export type SidebarContentKey = keyof typeof sidebarContentRegistry

// ヘルパー関数 - adminのみサポート
export function getSidebarContent(key: "admin", stats: AdminStats): React.ReactNode {
  if (key === "admin") {
    return sidebarContentRegistry.admin(stats)
  }
  return null
}