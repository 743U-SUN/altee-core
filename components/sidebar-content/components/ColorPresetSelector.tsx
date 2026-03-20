'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateUserThemeSettings } from '@/app/actions/user/theme-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColorPreset {
  name: string
  value: string
}

const HEADER_COLOR_PRESETS: ColorPreset[] = [
  { name: 'ネイビー', value: '#1e3a5f' },
  { name: 'フォレスト', value: '#1a3d2e' },
  { name: 'ワイン', value: '#5a1a2e' },
  { name: 'スレート', value: '#334155' },
  { name: 'ブラック', value: '#111827' },
  { name: 'パープル', value: '#3b1a6e' },
]

const HEADER_TEXT_COLOR_PRESETS: ColorPreset[] = [
  { name: 'ホワイト', value: '#ffffff' },
  { name: 'オフホワイト', value: '#f0f0f0' },
  { name: 'ライトタン', value: '#fbd4a4' },
  { name: 'チャコール', value: '#374151' },
  { name: 'ダークブラウン', value: '#3d3a36' },
  { name: 'ブラック', value: '#111827' },
]

const ACCENT_COLOR_PRESETS: ColorPreset[] = [
  { name: 'ブルー', value: '#2563eb' },
  { name: 'グリーン', value: '#16a34a' },
  { name: 'オレンジ', value: '#ea580c' },
  { name: 'ピンク', value: '#db2777' },
  { name: 'パープル', value: '#7c3aed' },
  { name: 'レッド', value: '#dc2626' },
]

type ColorTarget = 'headerColor' | 'headerTextColor' | 'accentColor'

interface ColorPresetSelectorProps {
  currentHeaderColor?: string
  currentHeaderTextColor?: string
  currentAccentColor?: string
}

function ColorSwatchRow({
  label,
  presets,
  currentColor,
  target,
}: {
  label: string
  presets: ColorPreset[]
  currentColor?: string
  target: ColorTarget
}) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleColorSelect = async (color: string | null) => {
    setIsUpdating(true)
    const result = await updateUserThemeSettings({ [target]: color })
    setIsUpdating(false)
    if (result.success) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {currentColor && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs text-muted-foreground"
            onClick={() => handleColorSelect(null)}
            disabled={isUpdating}
          >
            <X className="w-3 h-3 mr-0.5" />
            リセット
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            title={preset.name}
            onClick={() => handleColorSelect(preset.value)}
            disabled={isUpdating}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
              currentColor === preset.value
                ? 'border-foreground scale-110'
                : 'border-transparent'
            )}
            style={{ backgroundColor: preset.value }}
          />
        ))}
      </div>
    </div>
  )
}

export function ColorPresetSelector({
  currentHeaderColor,
  currentHeaderTextColor,
  currentAccentColor,
}: ColorPresetSelectorProps) {
  return (
    <div className="space-y-4">
      <ColorSwatchRow
        label="ヘッダー色"
        presets={HEADER_COLOR_PRESETS}
        currentColor={currentHeaderColor}
        target="headerColor"
      />
      <ColorSwatchRow
        label="ヘッダー文字・アイコン色"
        presets={HEADER_TEXT_COLOR_PRESETS}
        currentColor={currentHeaderTextColor}
        target="headerTextColor"
      />
      <ColorSwatchRow
        label="アクセント色"
        presets={ACCENT_COLOR_PRESETS}
        currentColor={currentAccentColor}
        target="accentColor"
      />
    </div>
  )
}
