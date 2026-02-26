'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUserThemeSettings } from '@/app/actions/user/theme-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'M PLUS Rounded 1c', label: 'M PLUS Rounded 1c' },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic' },
] as const

interface FontSelectorProps {
  currentFont: string
}

export function FontSelector({ currentFont }: FontSelectorProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleFontChange = async (fontFamily: string) => {
    setIsUpdating(true)
    const result = await updateUserThemeSettings({ fontFamily })
    setIsUpdating(false)

    if (result.success) {
      router.refresh()
    } else {
      console.error('Failed to update font:', result.error)
    }
  }

  return (
    <div className="space-y-2">
      <Label>フォント</Label>
      <Select
        value={currentFont}
        onValueChange={handleFontChange}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-full min-w-0">
          <SelectValue className="truncate" />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
