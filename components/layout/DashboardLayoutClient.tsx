"use client"

import { usePathname } from "next/navigation"
import { BaseLayout } from "./BaseLayout"
import type { LayoutOverrides, UserData } from "@/lib/layout-config"

const PREVIEW_PATHS = ['/dashboard/profile-editor', '/dashboard/faqs', '/dashboard/character']

interface SidebarRoute {
  path: string
  content: React.ReactNode
}

interface DashboardLayoutClientProps {
  user: UserData | null
  sidebarContent: React.ReactNode
  sidebarRoutes?: SidebarRoute[]
  children: React.ReactNode
}

export function DashboardLayoutClient({
  user,
  sidebarContent,
  sidebarRoutes = [],
  children
}: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const isPreviewPage = PREVIEW_PATHS.some(path => pathname.startsWith(path))

  // パスに応じたサイドバーコンテンツを選択
  const activeSidebar = sidebarRoutes.find(r => pathname.startsWith(r.path))?.content ?? sidebarContent

  const overrides: LayoutOverrides | undefined = isPreviewPage
    ? {
        secondSidebar: { content: activeSidebar },
        mainClassName: "p-0 gap-0 lg:pb-0"
      }
    : undefined

  return (
    <BaseLayout
      variant="dashboard"
      user={user}
      overrides={overrides}
    >
      {children}
    </BaseLayout>
  )
}
