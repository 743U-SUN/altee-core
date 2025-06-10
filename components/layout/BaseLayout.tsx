"use client"

import { useMemo } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { getLayoutConfig, mergeLayoutConfig, LayoutVariant, LayoutOverrides } from "@/lib/layout-config"

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

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": finalConfig.sidebarWidth || "350px",
      } as React.CSSProperties}
    >
      <Sidebar 
        firstSidebarConfig={finalConfig.firstSidebar}
        secondSidebarConfig={finalConfig.secondSidebar}
      />
      <SidebarInset>
        <Header config={finalConfig.header} />
        <main className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}