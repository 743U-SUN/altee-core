"use client"

import {
  CircleUserRound,
  LogOut,
  Settings,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { logoutAction } from "@/app/actions/auth"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { UserData } from "@/lib/layout-config"

export function NavUserHeader({
  user,
}: {
  user?: UserData | null
}) {
  // ログインしていない場合
  if (!user) {
    return (
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
    )
  }

  // ログインしている場合
  const displayName = user.characterName || user.name || 'ユーザー'
  const userAvatar = user.avatar || null
  const userHandle = user.handle || user.id
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            {userAvatar && <AvatarImage src={userAvatar} alt={displayName} />}
            <AvatarFallback>
              <CircleUserRound className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
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
          {user.role === 'ADMIN' && (
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
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
  )
}