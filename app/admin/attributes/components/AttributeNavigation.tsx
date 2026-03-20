'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Folder, Tag } from 'lucide-react'

interface AttributeType {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const ATTRIBUTE_TYPES: AttributeType[] = [
  {
    key: 'categories',
    label: 'カテゴリ',
    icon: Folder,
    href: '/admin/attributes/categories',
  },
  {
    key: 'tags',
    label: 'タグ',
    icon: Tag,
    href: '/admin/attributes/tags',
  },
]

export function AttributeNavigation() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <nav className="flex space-x-1 overflow-x-auto pb-4">
        {ATTRIBUTE_TYPES.map((type) => {
          const Icon = type.icon
          const isActive = pathname.startsWith(type.href)

          return (
            <div key={type.key} className="flex-shrink-0">
              <Link href={type.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm",
                    isActive && "bg-muted text-muted-foreground font-medium"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {type.label}
                </Button>
              </Link>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
