import React from "react"
import { AdminSidebarContent } from "@/components/sidebar-content/AdminSidebarContent"

// サイドバーコンテンツのレジストリ
export const sidebarContentRegistry = {
  admin: () => <AdminSidebarContent />,
  // 他のバリアント用コンテンツも追加可能
  // dashboard: () => <DashboardSidebarContent />,
  // userProfile: () => <UserProfileSidebarContent />,
} as const

export type SidebarContentKey = keyof typeof sidebarContentRegistry

// ヘルパー関数
export function getSidebarContent(key: SidebarContentKey): React.ReactNode {
  const contentFactory = sidebarContentRegistry[key]
  return contentFactory ? contentFactory() : null
}