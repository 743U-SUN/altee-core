"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SidebarConfig, MobileFooterConfig, iconMap, IconName } from "@/lib/layout-config"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileFooterProps {
  sidebarConfig: SidebarConfig
  mobileFooterConfig: MobileFooterConfig
  className?: string
}

export function MobileFooter({ sidebarConfig, mobileFooterConfig, className }: MobileFooterProps) {
  const isMobile = useIsMobile()

  // モバイルでない場合は何も表示しない
  if (!isMobile) return null

  // モバイルフッターが非表示の場合は何も表示しない
  if (mobileFooterConfig.hide) return null

  // サイドバーが非表示の場合は何も表示しない
  if (sidebarConfig.hide) return null

  // ブランド設定とナビゲーション項目を取得
  const brand = sidebarConfig.brand
  const navItems = sidebarConfig.navItems || []

  // ブランドが存在しない場合は何も表示しない
  if (!brand) return null

  // アイコンを解決する関数
  const getBrandIcon = (icon: IconName | React.ComponentType<{ className?: string }>) => {
    if (typeof icon === 'string') {
      return iconMap[icon]
    }
    return icon
  }

  const BrandIcon = getBrandIcon(brand.icon)

  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "lg:hidden", // デスクトップでは非表示
        className
      )}
    >
      <div className="flex h-16 items-center justify-around px-4">
        {/* ブランドアイコン（左端） */}
        <Link
          href={brand.url || "#"}
          className="flex flex-col items-center justify-center gap-1 rounded-md p-2 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex size-6 items-center justify-center">
            <BrandIcon className="size-5" />
          </div>
        </Link>

        {/* ナビゲーション項目 */}
        {navItems.map((item) => {
          const ItemIcon = typeof item.icon === 'string' 
            ? iconMap[item.icon as IconName]
            : item.icon
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-center transition-colors hover:bg-accent hover:text-accent-foreground",
                item.isActive && "text-primary"
              )}
            >
              <div className="flex size-6 items-center justify-center">
                <ItemIcon className="size-5" />
              </div>
            </Link>
          )
        })}
      </div>
    </footer>
  )
}