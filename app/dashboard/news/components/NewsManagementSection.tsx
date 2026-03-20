'use client'

import { useState, useRef } from 'react'
import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionBand } from '@/components/profile/SectionBand'
import { SectionStylePanel } from '@/components/user-profile/SectionStylePanel'
import { resolvePreset } from '@/lib/sections/background-utils'
import { updateNewsListSettings } from '@/app/actions/content/user-news-actions'
import dynamic from 'next/dynamic'

const UserNewsListClient = dynamic(
  () => import('./UserNewsListClient').then((m) => ({ default: m.UserNewsListClient })),
  { ssr: false }
)
import type { SectionSettings, SectionBackgroundPreset } from '@/types/profile-sections'
import type { UserNewsWithImages } from '@/types/user-news'

interface NewsManagementSectionProps {
  initialData: UserNewsWithImages[]
  newsSection: { id: string; settings: SectionSettings | null }
  presets: SectionBackgroundPreset[]
}

export function NewsManagementSection({
  initialData,
  newsSection,
  presets,
}: NewsManagementSectionProps) {
  const [localSettings, setLocalSettings] = useState<SectionSettings | null>(newsSection.settings)
  const [isStyleOpen, setIsStyleOpen] = useState(false)
  const [styleKey, setStyleKey] = useState(0)
  const preEditSettingsRef = useRef<SectionSettings | null>(newsSection.settings)

  const preset = resolvePreset(localSettings?.background, presets)

  const handleStyleOpen = () => {
    preEditSettingsRef.current = localSettings
    setStyleKey((k) => k + 1)
    setIsStyleOpen(true)
  }

  const handleStyleClose = () => {
    setIsStyleOpen(false)
    setLocalSettings(preEditSettingsRef.current)
  }

  const handleStyleSave = async (settings: SectionSettings) => {
    const result = await updateNewsListSettings(newsSection.id, settings)
    if (!result.success) throw new Error(result.error)
    preEditSettingsRef.current = settings
    setLocalSettings(settings)
  }

  return (
    <SectionBand settings={localSettings} preset={preset} fullBleed>
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStyleOpen}
            title="背景スタイルを設定"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </div>

        <UserNewsListClient initialData={initialData} />

        <SectionStylePanel
          key={styleKey}
          isOpen={isStyleOpen}
          onClose={handleStyleClose}
          currentSettings={localSettings}
          presets={presets}
          onSettingsChange={setLocalSettings}
          onSave={handleStyleSave}
        />
      </div>
    </SectionBand>
  )
}
