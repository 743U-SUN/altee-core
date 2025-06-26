"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { getLayoutConfig, mergeLayoutConfig, LayoutVariant, LayoutOverrides } from "@/lib/layout-config"

const MobileFooter = dynamic(
  () => import("./MobileFooter").then(mod => ({ default: mod.MobileFooter })),
  { 
    loading: () => null,
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

interface BaseLayoutProps {
  variant?: LayoutVariant
  overrides?: LayoutOverrides
  children: React.ReactNode
}

export function BaseLayout({ 
  variant = 'default', 
  overrides, 
  children 
}: BaseLayoutProps) {
  const finalConfig = useMemo(() => {
    const baseConfig = getLayoutConfig(variant)
    return mergeLayoutConfig(baseConfig, overrides)
  }, [variant, overrides])

  // 縦並びレイアウトの場合
  if (finalConfig.mobileLayout.verticalLayout) {
    return (
      <div className="min-h-svh w-full">
        {/* デスクトップ用のサイドバーレイアウト */}
        <div className="hidden lg:flex">
          <SidebarProvider
            style={{
              "--sidebar-width": finalConfig.sidebarWidth || "350px",
            } as React.CSSProperties}
          >
            <Sidebar 
              firstSidebarConfig={finalConfig.firstSidebar}
              secondSidebarConfig={finalConfig.secondSidebar}
              verticalMobileLayout={false}
            />
            <SidebarInset>
              <Header config={finalConfig.header} />
              <main className="flex flex-1 flex-col gap-4 p-4">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </div>

        {/* モバイル用の縦並びレイアウト */}
        <div className="lg:hidden">
          <Header config={finalConfig.header} />
          <MobileSidebarSheet
            open={false}
            onOpenChange={() => {}}
            secondSidebarContent={finalConfig.secondSidebar.content}
            verticalLayout={true}
          />
          <main className="flex flex-1 flex-col gap-4 p-4 pb-20">
            {children}
          </main>
          <MobileFooter 
            sidebarConfig={finalConfig.firstSidebar} 
            mobileFooterConfig={finalConfig.mobileFooter}
          />
        </div>
      </div>
    )
  }

  // 通常レイアウト
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": finalConfig.sidebarWidth || "350px",
      } as React.CSSProperties}
    >
      <Sidebar 
        firstSidebarConfig={finalConfig.firstSidebar}
        secondSidebarConfig={finalConfig.secondSidebar}
        verticalMobileLayout={finalConfig.mobileLayout.verticalLayout}
      />
      <SidebarInset>
        <Header config={finalConfig.header} />
        <main className="flex flex-1 flex-col gap-4 p-4 pb-20 lg:pb-4">
          {children}
        </main>
      </SidebarInset>
      <MobileFooter 
        sidebarConfig={finalConfig.firstSidebar} 
        mobileFooterConfig={finalConfig.mobileFooter}
      />
    </SidebarProvider>
  )
}