'use client'

import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { updateUserThemeSettings } from '@/app/actions/user/theme-actions'
import { useRouter } from 'next/navigation'
import { getThemesGroupedByName } from '@/lib/themes/registry'
import { applyThemePreview } from '@/lib/themes/preview'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ThemePresetSelectorProps {
  currentPreset: string
}

export function ThemePresetSelector({
  currentPreset,
}: ThemePresetSelectorProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)

  // メモリリーク対策: useStateからuseRefに変更
  // useRefを使うことで依存配列の問題を回避し、常に最新の参照を保持
  const cleanupPreviewRef = useRef<(() => void) | null>(null)

  // テーマファミリーをグループ化
  const themeGroups = useMemo(() => getThemesGroupedByName(), [])

  // プレビュー開始
  const handlePreviewStart = useCallback(
    (themeId: string) => {
      // 前のプレビューをクリーンアップ
      cleanupPreviewRef.current?.()
      const cleanup = applyThemePreview(themeId)
      cleanupPreviewRef.current = cleanup
    },
    [] // 依存配列を空にすることで無限ループを防止
  )

  // プレビュー終了
  const handlePreviewEnd = useCallback(() => {
    cleanupPreviewRef.current?.()
    cleanupPreviewRef.current = null
  }, []) // 依存配列を空にすることで無限ループを防止

  // テーマ選択
  const handleSelect = async (themeId: string) => {
    handlePreviewEnd() // プレビューを解除
    setIsUpdating(true)
    const result = await updateUserThemeSettings({ themePreset: themeId })
    setIsUpdating(false)

    if (result.success) {
      router.refresh()
    } else {
      console.error('Failed to update theme preset:', result.error)
    }
  }

  // コンポーネントのアンマウント時にプレビューをクリーンアップ
  useEffect(() => {
    return () => {
      cleanupPreviewRef.current?.()
    }
  }, []) // 依存配列を空にすることで、マウント時に一度だけ登録され、アンマウント時にクリーンアップされる

  return (
    <div className="space-y-4">
      <Label>テーマプリセット</Label>

      {Object.entries(themeGroups).map(([familyName, themes]) => (
        <div key={familyName} className="space-y-2">
          <h4
            id={`theme-group-${familyName}`}
            className="text-sm font-medium text-muted-foreground"
          >
            {familyName}
          </h4>
          <div
            role="radiogroup"
            aria-labelledby={`theme-group-${familyName}`}
            className="grid grid-cols-3 gap-2"
          >
            {themes.map((theme) => (
              <button
                key={theme.id}
                role="radio"
                aria-checked={currentPreset === theme.id}
                aria-label={`${familyName} ${theme.palette.displayName}テーマを選択`}
                onClick={() => handleSelect(theme.id)}
                onMouseEnter={() => handlePreviewStart(theme.id)}
                onMouseLeave={handlePreviewEnd}
                disabled={isUpdating}
                className={cn(
                  'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                  'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
                  currentPreset === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
              >
                {/* カラープレビュー */}
                <div
                  className="w-full h-8 rounded mb-2"
                  style={{ backgroundColor: theme.palette.background }}
                />
                {/* テーマ名 */}
                <span className="text-xs font-medium">
                  {theme.palette.displayName}
                </span>
                {/* 選択マーク */}
                {currentPreset === theme.id && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
