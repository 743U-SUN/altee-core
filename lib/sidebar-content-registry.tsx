import React from "react"
import dynamic from "next/dynamic"

const AdminSidebarContent = dynamic(
  () => import("@/components/sidebar-content/AdminSidebarContent").then(mod => ({ default: mod.AdminSidebarContent })),
  { 
    loading: () => <div className="p-4 animate-pulse">Loading...</div>,
    ssr: false
  }
)

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