import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getFaqCategories } from '@/app/actions/content/faq-actions'
import { EditableFAQClient } from './EditableFAQClient'

export const metadata: Metadata = {
  title: 'FAQ管理',
  robots: { index: false, follow: false },
}
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from '@/types/profile-sections'

export default async function DashboardFaqsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 並行してデータフェッチを行うことでウォーターフォールを解消
  const [user, faqResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            characterImage: true,
          },
        },
      },
    }),
    getFaqCategories()
  ])

  if (!user || !user.profile) {
    redirect('/dashboard/setup')
  }

  const themePreset = user.profile.themePreset || 'claymorphic'

  let themeSettings: ThemeSettings = DEFAULT_THEME_SETTINGS
  if (user.profile.themeSettings) {
    try {
      themeSettings = user.profile.themeSettings as unknown as ThemeSettings
    } catch {
      themeSettings = DEFAULT_THEME_SETTINGS
    }
  }

  let characterImageUrl: string | null = null
  if (user.profile.characterImage?.storageKey) {
    characterImageUrl = `/api/files/${user.profile.characterImage.storageKey}`
  }

  const initialFaqCategories = faqResult.success ? ((faqResult.data as unknown[]) ?? []) : []

  return (
    <div className="flex flex-1 flex-col">
      <EditableFAQClient
        handle={user.handle || ''}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterImageUrl={characterImageUrl}
        characterName={user.characterName}
        bannerImageKey={user.profile.bannerImageKey}
        characterBackgroundKey={user.profile.characterBackgroundKey}
        initialFaqCategories={initialFaqCategories}
      />
    </div>
  )
}
