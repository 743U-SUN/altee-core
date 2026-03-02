import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { CHARACTER_NAV_ITEMS } from "@/app/dashboard/character/constants"

export function CharacterSidebarContent() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        {CHARACTER_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Button key={item.href} asChild className="w-full justify-start" variant="outline">
              <Link href={item.href}>
                <Icon className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
