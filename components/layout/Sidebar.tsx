"use client"

import * as React from "react"
import { NavUser } from "@/components/navigation/nav-user"
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarConfig, defaultBrand } from "@/lib/layout-config"

interface SidebarProps extends React.ComponentProps<typeof SidebarPrimitive> {
  firstSidebarConfig: SidebarConfig
  secondSidebarConfig: { content?: React.ReactNode }
}

export function Sidebar({ 
  firstSidebarConfig, 
  secondSidebarConfig, 
  ...props 
}: SidebarProps) {
  const [activeItem, setActiveItem] = React.useState(
    firstSidebarConfig.navItems?.[0]
  )

  // First Sidebarが非表示の場合
  if (firstSidebarConfig.hide) {
    return null
  }

  // ブランド設定（デフォルト値を使用）
  const brand = firstSidebarConfig.brand || defaultBrand
  const BrandIcon = brand.icon

  return (
    <SidebarPrimitive
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* First Sidebar */}
      <SidebarPrimitive
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href={brand.url || "#"}>
                  <div className={`${brand.iconBgColor || "bg-sidebar-primary"} text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg`}>
                    <BrandIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{brand.title}</span>
                    <span className="truncate text-xs">{brand.subtitle}</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {firstSidebarConfig.navItems?.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => setActiveItem(item)}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                      asChild
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        {!firstSidebarConfig.hideUser && firstSidebarConfig.user && (
          <SidebarFooter>
            <NavUser user={firstSidebarConfig.user} />
          </SidebarFooter>
        )}
      </SidebarPrimitive>

      {/* Second Sidebar */}
      <SidebarPrimitive collapsible="none" className="hidden flex-1 md:flex">
        <SidebarContent>
          {secondSidebarConfig.content || (
            <div className="p-4 text-muted-foreground text-sm">
              カスタムコンテンツエリア
            </div>
          )}
        </SidebarContent>
      </SidebarPrimitive>
    </SidebarPrimitive>
  )
}