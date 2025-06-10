"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NavUserHeader } from "@/components/navigation/nav-user-header"
import { HeaderConfig } from "@/lib/layout-config"
import { ModeToggle } from "@/components/mode-toggle"

interface HeaderProps {
  config: HeaderConfig
}

export function Header({ config }: HeaderProps) {
  return (
    <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      
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
          <ModeToggle />
          <NavUserHeader 
            user={{
              name: "shadcn",
              email: "m@example.com", 
              avatar: "/avatars/shadcn.jpg"
            }}
          />
        </div>
      )}

      {config.showNotifications && (
        <div className="flex items-center gap-2">
          {/* 将来的に通知コンポーネントを追加 */}
        </div>
      )}
    </header>
  )
}