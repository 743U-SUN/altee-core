'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { User, Video, HelpCircle, Package, Newspaper } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface MobileBottomNavProps {
  handle: string
  inDashboard?: boolean
  visibility?: { newsPage?: boolean }
}

/**
 * モバイルボトムナビゲーション
 */
export const MobileBottomNav = memo(function MobileBottomNav({
  handle,
  inDashboard = false,
  visibility,
}: MobileBottomNavProps) {
  const pathname = usePathname()

  const navItems = useMemo(() => {
    const items = inDashboard ? [
      { label: 'Profile', href: '/dashboard/profile-editor', icon: User },
      { label: 'Items', href: '/dashboard/items', icon: Package },
      { label: 'News', href: '/dashboard/news', icon: Newspaper },
      { label: 'Videos', href: '/dashboard/platforms', icon: Video },
      { label: 'FAQs', href: '/dashboard/faqs', icon: HelpCircle },
    ] : [
      { label: 'Profile', href: `/@${handle}`, icon: User },
      { label: 'Items', href: `/@${handle}/items`, icon: Package },
      { label: 'News', href: `/@${handle}/news`, icon: Newspaper },
      { label: 'Videos', href: `/@${handle}/videos`, icon: Video },
      { label: 'FAQs', href: `/@${handle}/faqs`, icon: HelpCircle },
    ]
    // 公開ページ側のみ visibility で News を除外（ダッシュボードは常に表示）
    if (!inDashboard && visibility?.newsPage === false) {
      return items.filter((item) => item.label !== 'News')
    }
    return items
  }, [handle, inDashboard, visibility?.newsPage])

  return (
    <nav
      className={`fixed left-0 right-0 z-50 bg-[var(--theme-card-bg)]/90 backdrop-blur-md border-t border-[var(--theme-stat-bg)] min-[993px]:hidden transition-all ${inDashboard ? 'bottom-16' : 'bottom-0'
        }`}
    >
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg
                transition-all min-w-[50px]
                ${isActive
                  ? 'text-[var(--theme-text-accent)] bg-[var(--theme-accent-bg)]'
                  : 'text-[var(--theme-text-secondary)]'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
})
