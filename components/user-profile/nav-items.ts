import { User, Video, HelpCircle, Package, Newspaper } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export function getNavItems(
  handle: string,
  inDashboard: boolean,
  visibility?: { newsPage?: boolean }
): NavItem[] {
  const items: NavItem[] = inDashboard
    ? [
        { label: 'Profile', href: '/dashboard/profile-editor', icon: User },
        { label: 'Items', href: '/dashboard/items', icon: Package },
        { label: 'News', href: '/dashboard/news', icon: Newspaper },
        { label: 'Videos', href: '/dashboard/platforms', icon: Video },
        { label: 'FAQs', href: '/dashboard/faqs', icon: HelpCircle },
      ]
    : [
        { label: 'Profile', href: `/@${handle}`, icon: User },
        { label: 'Items', href: `/@${handle}/items`, icon: Package },
        { label: 'News', href: `/@${handle}/news`, icon: Newspaper },
        { label: 'Videos', href: `/@${handle}/videos`, icon: Video },
        { label: 'FAQs', href: `/@${handle}/faqs`, icon: HelpCircle },
      ]

  if (!inDashboard && visibility?.newsPage === false) {
    return items.filter((item) => item.label !== 'News')
  }
  return items
}
