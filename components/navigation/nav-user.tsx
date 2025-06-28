"use client"

import {
  CircleUserRound,
  ChevronsUpDown,
  LogOut,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { logoutAction } from "@/app/actions/auth"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { UserData } from "@/lib/layout-config"

export function NavUser({
  user,
}: {
  user?: UserData | null
}) {
  const { isMobile } = useSidebar()

  // ログインしていない場合
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="md:h-8 md:p-0"
            asChild
          >
            <Link href="/auth/signin">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  <CircleUserRound className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // ログインしている場合
  const displayName = user.characterName || user.name || 'ユーザー'
  const userAvatar = user.avatar || null
  const userHandle = user.handle || user.id

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-8 md:p-0"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {userAvatar && <AvatarImage src={userAvatar} alt={displayName} />}
                <AvatarFallback className="rounded-lg">
                  <CircleUserRound className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <Link href={`/${userHandle}`} className="flex items-center gap-2 px-1 py-1.5 text-left text-sm hover:bg-accent transition-colors rounded">
                <Avatar className="h-8 w-8 rounded-lg">
                  {userAvatar && <AvatarImage src={userAvatar} alt={displayName} />}
                  <AvatarFallback className="rounded-lg">
                    <CircleUserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                </div>
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await logoutAction()
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
