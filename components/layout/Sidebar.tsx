"use client"

import * as React from "react"
import dynamic from "next/dynamic"
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
  useSidebar,
} from "@/components/ui/sidebar"
import { SidebarConfig, defaultBrand } from "@/lib/layout-config"

const NavUser = dynamic(
  () => import("@/components/navigation/nav-user").then(mod => ({ default: mod.NavUser })),
  { 
    loading: () => <div className="p-2 animate-pulse bg-muted rounded-md" />,
    ssr: false
  }
)

const MobileSidebarSheet = dynamic(
  () => import("./MobileSidebarSheet").then(mod => ({ default: mod.MobileSidebarSheet })),
  { 
    loading: () => null,
    ssr: false
  }
)

interface SidebarProps extends React.ComponentProps<typeof SidebarPrimitive> {
  firstSidebarConfig: SidebarConfig
  secondSidebarConfig: { content?: React.ReactNode }
  verticalMobileLayout?: boolean
}

export function Sidebar({ 
  firstSidebarConfig, 
  secondSidebarConfig, 
  verticalMobileLayout = false,
  ...props 
}: SidebarProps) {
  const [activeItem, setActiveItem] = React.useState(
    firstSidebarConfig.navItems?.[0]
  )
  const { openMobile, setOpenMobile } = useSidebar()

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
      className={`overflow-hidden *:data-[sidebar=sidebar]:flex-row ${verticalMobileLayout ? 'lg:hidden' : ''}`}
      {...props}
    >
      {/* First Sidebar */}
      <SidebarPrimitive
        collapsible="none"
        className={`w-[calc(var(--sidebar-width-icon)+1px)]! border-r ${verticalMobileLayout ? 'lg:hidden' : ''}`}
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
        
        {!firstSidebarConfig.hideUser && (
          <SidebarFooter>
            <NavUser user={firstSidebarConfig.user} />
          </SidebarFooter>
        )}
      </SidebarPrimitive>

      {/* Second Sidebar */}
      <SidebarPrimitive collapsible="none" className="hidden flex-1 lg:flex">
        <SidebarContent>
          {secondSidebarConfig.content || (
            <div className="p-4 text-muted-foreground text-sm">
              カスタムコンテンツエリア
            </div>
          )}
        </SidebarContent>
      </SidebarPrimitive>
      
      {/* Mobile Sidebar Sheet - Second Sidebar Content */}
      <MobileSidebarSheet
        open={openMobile}
        onOpenChange={setOpenMobile}
        secondSidebarContent={secondSidebarConfig.content}
        verticalLayout={verticalMobileLayout}
      />
    </SidebarPrimitive>
  )
}