'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { updateUserThemeSettings } from '@/app/actions/user/theme-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ThemeSettings } from '@/types/profile-sections'

interface VisibilityTogglesProps {
  visibility: ThemeSettings['visibility']
}

export function VisibilityToggles({ visibility }: VisibilityTogglesProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})

  const handleToggle = async (
    key: keyof ThemeSettings['visibility'],
    value: boolean
  ) => {
    setIsUpdating((prev) => ({ ...prev, [key]: true }))
    const result = await updateUserThemeSettings({
      visibility: { [key]: value },
    })
    setIsUpdating((prev) => ({ ...prev, [key]: false }))

    if (result.success) {
      router.refresh()
    } else {
      toast.error('表示設定の更新に失敗しました')
    }
  }

  const toggleItems = [
    { key: 'banner' as const, label: 'バナー画像' },
    { key: 'character' as const, label: 'キャラクター画像' },
    { key: 'gameButton' as const, label: 'ゲームボタン' },
    { key: 'snsButton' as const, label: 'SNSシェアボタン' },
    { key: 'notification' as const, label: '通知アイコン' },
  ]

  return (
    <div className="space-y-4">
      <Label>表示/非表示設定</Label>
      <div className="space-y-3">
        {toggleItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <Label htmlFor={item.key} className="text-sm font-normal">
              {item.label}
            </Label>
            <Switch
              id={item.key}
              checked={visibility[item.key]}
              onCheckedChange={(checked) => handleToggle(item.key, checked)}
              disabled={isUpdating[item.key]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
