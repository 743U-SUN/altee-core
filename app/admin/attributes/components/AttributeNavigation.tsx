'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Folder, Tag, List, Zap, BookOpen, Trophy } from 'lucide-react'

// 将来の拡張を見据えた属性タイプ定義
interface AttributeType {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description: string
  isAvailable: boolean // 実装済みかどうか
  count?: number // アイテム数（将来的にはServer Componentで取得）
}

const ATTRIBUTE_TYPES: AttributeType[] = [
  {
    key: 'categories',
    label: 'カテゴリ',
    icon: Folder,
    href: '/admin/attributes/categories',
    description: '記事の主要分類を管理',
    isAvailable: true,
  },
  {
    key: 'tags',
    label: 'タグ',
    icon: Tag,
    href: '/admin/attributes/tags',
    description: '横断的な属性を管理',
    isAvailable: true,
  },
  {
    key: 'series',
    label: 'シリーズ',
    icon: List,
    href: '/admin/attributes/series',
    description: '連載記事のシリーズ管理',
    isAvailable: false, // 将来実装予定
  },
  {
    key: 'difficulty',
    label: '難易度',
    icon: Zap,
    href: '/admin/attributes/difficulty',
    description: '記事の難易度レベル管理',
    isAvailable: false, // 将来実装予定
  },
  {
    key: 'formats',
    label: '記事形式',
    icon: BookOpen,
    href: '/admin/attributes/formats',
    description: 'チュートリアル、解説、レビューなど',
    isAvailable: false, // 将来実装予定
  },
  {
    key: 'achievements',
    label: '実績バッジ',
    icon: Trophy,
    href: '/admin/attributes/achievements',
    description: '記事に付与する実績バッジ',
    isAvailable: false, // 将来実装予定
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
          const isDisabled = !type.isAvailable
          
          return (
            <div key={type.key} className="flex-shrink-0">
              {isDisabled ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm",
                      "opacity-50 cursor-not-allowed"
                    )}
                    disabled
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                    <span className="text-xs text-muted-foreground ml-1">
                      (予定)
                    </span>
                  </Button>
                </div>
              ) : (
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
                    {type.count !== undefined && (
                      <span className="text-xs bg-muted-foreground/10 px-1.5 py-0.5 rounded">
                        {type.count}
                      </span>
                    )}
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}