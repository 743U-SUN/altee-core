"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HeaderConfig } from "@/lib/layout-config"
import { CircleUserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
    <header className="bg-background sticky z-20 top-0 flex shrink-0 items-center gap-2 border-b p-4">
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
        <div className="flex items-center gap-2">
          {config.titleUrl ? (
            <Link href={config.titleUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {config.titleIcon && (
                <div className={`flex items-center justify-center w-6 h-6 rounded-md ${config.titleIconBgColor || 'bg-sidebar-primary'}`}>
                  <config.titleIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-lg font-semibold">{config.title}</span>
            </Link>
          ) : (
            <>
              {config.titleIcon && (
                <div className={`flex items-center justify-center w-6 h-6 rounded-md ${config.titleIconBgColor || 'bg-sidebar-primary'}`}>
                  <config.titleIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-lg font-semibold">{config.title}</span>
            </>
          )}
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
          {config.user ? (
            <NavUserHeader user={config.user} />
          ) : (
            <Button
              variant="ghost"
              className="h-8 w-8 rounded-full hover:bg-accent"
              asChild
            >
              <Link href="/auth/signin">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <CircleUserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            </Button>
          )}
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