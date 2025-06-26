"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  secondSidebarContent?: React.ReactNode
  side?: "left" | "right"
  verticalLayout?: boolean
}

const SIDEBAR_WIDTH_MOBILE = "18rem"

export function MobileSidebarSheet({ 
  open, 
  onOpenChange, 
  secondSidebarContent,
  side = "left",
  verticalLayout = false
}: MobileSidebarSheetProps) {
  const isMobile = useIsMobile()

  // 縦並びレイアウトの場合はモバイル判定に関係なく表示
  if (verticalLayout) {
    return (
      <div className="w-full bg-sidebar text-sidebar-foreground border-b">
        <div className="p-4">
          {secondSidebarContent || (
            <div className="text-muted-foreground text-sm">
              セカンドサイドバーコンテンツ
            </div>
          )}
        </div>
      </div>
    )
  }

  // 通常のシートレイアウトの場合のみモバイル判定
  if (!isMobile) return null

  // 従来のシートレイアウト
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-sidebar="mobile-sheet"
        data-mobile="true"
        className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
          } as React.CSSProperties
        }
        side={side}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Mobile Sidebar</SheetTitle>
          <SheetDescription>Displays the mobile sidebar content.</SheetDescription>
        </SheetHeader>
        
        <div className="flex h-full w-full flex-col">
          <SidebarContent>
            {secondSidebarContent || (
              <div className="p-4 text-muted-foreground text-sm">
                セカンドサイドバーコンテンツ
              </div>
            )}
          </SidebarContent>
        </div>
      </SheetContent>
    </Sheet>
  )
}