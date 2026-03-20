"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CHARACTER_NAV_ITEMS } from "../constants"

export function CharacterNavigation() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <nav className="flex space-x-1 overflow-x-auto pb-4">
        {CHARACTER_NAV_ITEMS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)

          return (
            <Link key={tab.key} href={tab.href} className="flex-shrink-0">
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm",
                  isActive && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
