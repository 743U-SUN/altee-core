'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Youtube } from 'lucide-react'

// ニコニコ動画アイコン（lucide-reactにないためカスタム実装）
function NiconicoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <text x="2" y="18" fontSize="18" fontWeight="bold">ニ</text>
    </svg>
  )
}

// Twitch アイコン（lucide-reactにないためカスタム実装）
function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  )
}

interface PlatformType {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description: string
  isAvailable: boolean
}

const PLATFORM_TYPES: PlatformType[] = [
  {
    key: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    href: '/dashboard/platforms/youtube',
    description: 'YouTubeチャンネル設定とおすすめ動画管理',
    isAvailable: true,
  },
  {
    key: 'twitch',
    label: 'Twitch',
    icon: TwitchIcon,
    href: '/dashboard/platforms/twitch',
    description: 'Twitchチャンネル設定とライブ配信管理',
    isAvailable: true,
  },
  {
    key: 'niconico',
    label: 'ニコニコ動画',
    icon: NiconicoIcon,
    href: '/dashboard/platforms/niconico',
    description: 'ニコニコ動画チャンネル統合',
    isAvailable: false,
  },
]

export function PlatformNavigation() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <nav className="flex space-x-1 overflow-x-auto pb-4">
        {PLATFORM_TYPES.map((platform) => {
          const Icon = platform.icon
          const isActive = pathname.startsWith(platform.href)
          const isDisabled = !platform.isAvailable

          return (
            <div key={platform.key} className="flex-shrink-0">
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
                    {platform.label}
                    <span className="text-xs text-muted-foreground ml-1">
                      (準備中)
                    </span>
                  </Button>
                </div>
              ) : (
                <Link href={platform.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm",
                      isActive && "bg-muted text-muted-foreground font-medium"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {platform.label}
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
