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
}

const SIDEBAR_WIDTH_MOBILE = "18rem"

export function MobileSidebarSheet({ 
  open, 
  onOpenChange, 
  secondSidebarContent,
  side = "left"
}: MobileSidebarSheetProps) {
  const isMobile = useIsMobile()

  // モバイルでない場合は何も表示しない
  if (!isMobile) return null

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