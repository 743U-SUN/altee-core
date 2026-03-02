"use client"

import { usePathname } from "next/navigation"
import { BaseLayout } from "./BaseLayout"
import type { LayoutOverrides, UserData } from "@/lib/layout-config"

const PREVIEW_PATHS = ['/dashboard/profile-editor', '/dashboard/faqs']

interface DashboardLayoutClientProps {
  user: UserData | null
  sidebarContent: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayoutClient({
  user,
  sidebarContent,
  children
}: DashboardLayoutClientProps) {
  const pathname = usePathname()
  const isPreviewPage = PREVIEW_PATHS.some(path => pathname.startsWith(path))

  const overrides: LayoutOverrides | undefined = isPreviewPage
    ? {
        secondSidebar: { content: sidebarContent },
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
