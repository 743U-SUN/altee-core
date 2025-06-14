"use client"

import dynamic from "next/dynamic"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HeaderConfig } from "@/lib/layout-config"

const NavUserHeader = dynamic(
  () => import("@/components/navigation/nav-user-header").then(mod => ({ default: mod.NavUserHeader })),
  { 
    loading: () => <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />,
    ssr: false
  }
)

const ModeToggle = dynamic(
  () => import("@/components/mode-toggle").then(mod => ({ default: mod.ModeToggle })),
  { 
    loading: () => <div className="w-9 h-9 bg-muted rounded-md animate-pulse" />,
    ssr: false
  }
)

interface HeaderProps {
  config: HeaderConfig
}

export function Header({ config }: HeaderProps) {
  return (
    <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
      {!config.hideSidebarTrigger && (
        <>
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </>
      )}
      
      {config.title && (
        <div className="text-lg font-semibold">
          {config.title}
        </div>
      )}

      {config.rightContent && (
        <div className="ml-auto">
          {config.rightContent}
        </div>
      )}

      {!config.hideUserMenu && !config.rightContent && (
        <div className="ml-auto flex items-center gap-2">
          {!config.hideModeToggle && <ModeToggle />}
          <NavUserHeader 
            user={{
              name: "shadcn",
              email: "m@example.com", 
              avatar: "/avatars/shadcn.jpg"
            }}
          />
        </div>
      )}

      {!config.hideNotifications && (
        <div className="flex items-center gap-2">
          {/* 将来的に通知コンポーネントを追加 */}
        </div>
      )}
    </header>
  )
}