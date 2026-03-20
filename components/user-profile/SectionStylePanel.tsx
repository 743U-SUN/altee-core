'use client'

import { useState, useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveBackgroundStyle } from '@/lib/sections/background-utils'
import { paddingToPx } from '@/lib/sections/padding-utils'
import { updateSectionSettings } from '@/app/actions/user/section-actions'
import type {
  SectionSettings,
  SectionBandBackground,
  SectionPaddingSize,
  SectionPaddingValue,
  ResponsivePadding,
  SectionBackgroundPreset,
} from '@/types/profile-sections'

// ===== パディングラベル =====

const PADDING_OPTIONS: { value: SectionPaddingSize; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
  { value: 'xl', label: '特大' },
]

// ===== Props =====

interface SectionStylePanelProps {
  isOpen: boolean
  onClose: () => void
  sectionId?: string
  currentSettings: SectionSettings | null
  presets: SectionBackgroundPreset[]
  onSettingsChange: (settings: SectionSettings) => void
  onSave?: (settings: SectionSettings) => Promise<void>
}

/**
 * セクションスタイル設定パネル（Sheet）
 * 背景プリセット選択とレスポンシブパディング設定
 */
export function SectionStylePanel({
  isOpen,
  onClose,
  sectionId,
  currentSettings,
  presets,
  onSettingsChange,
  onSave,
}: SectionStylePanelProps) {
  const [isPending, startTransition] = useTransition()

  // ローカル設定状態
  const [background, setBackground] = useState<SectionBandBackground>(
    currentSettings?.background ?? { type: 'inherit' }
  )
  const [paddingTop, setPaddingTop] = useState<ResponsivePadding>(
    currentSettings?.paddingTop ?? { mobile: 'sm', desktop: 'md' }
  )
  const [paddingBottom, setPaddingBottom] = useState<ResponsivePadding>(
    currentSettings?.paddingBottom ?? { mobile: 'sm', desktop: 'md' }
  )

  // 設定変更を親に通知（リアルタイムプレビュー）
  const notifyChange = useCallback(
    (bg: SectionBandBackground, pt: ResponsivePadding, pb: ResponsivePadding) => {
      onSettingsChange({ background: bg, paddingTop: pt, paddingBottom: pb })
    },
    [onSettingsChange]
  )

  // 背景変更
  const handleBackgroundTypeChange = useCallback(
    (type: 'inherit' | 'preset') => {
      const newBg: SectionBandBackground =
        type === 'inherit' ? { type: 'inherit' } : { type: 'preset', presetId: presets[0]?.id }
      setBackground(newBg)
      notifyChange(newBg, paddingTop, paddingBottom)
    },
    [presets, paddingTop, paddingBottom, notifyChange]
  )

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      const newBg: SectionBandBackground = { type: 'preset', presetId }
      setBackground(newBg)
      notifyChange(newBg, paddingTop, paddingBottom)
    },
    [paddingTop, paddingBottom, notifyChange]
  )

  // パディング変更
  const handlePaddingChange = useCallback(
    (
      direction: 'top' | 'bottom',
      breakpoint: 'mobile' | 'tablet' | 'desktop',
      value: SectionPaddingValue
    ) => {
      const setter = direction === 'top' ? setPaddingTop : setPaddingBottom
      const current = direction === 'top' ? paddingTop : paddingBottom

      const updated = { ...current, [breakpoint]: value }
      setter(updated)

      if (direction === 'top') {
        notifyChange(background, updated, paddingBottom)
      } else {
        notifyChange(background, paddingTop, updated)
      }
    },
    [background, paddingTop, paddingBottom, notifyChange]
  )

  // 保存
  const handleSave = useCallback(() => {
    startTransition(async () => {
      const settings: SectionSettings = {
        background,
        paddingTop,
        paddingBottom,
      }

      if (onSave) {
        try {
          await onSave(settings)
          toast.success('スタイルを更新しました')
          onClose()
        } catch {
          toast.error('スタイルの更新に失敗しました')
        }
        return
      }

      if (!sectionId) return
      const result = await updateSectionSettings(sectionId, settings)

      if (result.success) {
        toast.success('スタイルを更新しました')
        onClose()
      } else {
        toast.error(result.error || 'スタイルの更新に失敗しました')
      }
    })
  }, [sectionId, background, paddingTop, paddingBottom, onClose, onSave])

  // プリセットをカテゴリ別に分類
  const solidPresets = presets.filter((p) => p.category === 'solid')
  const gradientPresets = presets.filter((p) => p.category === 'gradient')

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[340px] sm:max-w-[340px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>セクションスタイル</SheetTitle>
          <SheetDescription>背景と余白を設定します</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4">
          {/* ===== 背景設定 ===== */}
          <section>
            <Label className="text-sm font-semibold">背景</Label>
            <RadioGroup
              value={background.type}
              onValueChange={(v) => handleBackgroundTypeChange(v as 'inherit' | 'preset')}
              className="mt-2 space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="inherit" id="bg-inherit" />
                <Label htmlFor="bg-inherit" className="font-normal cursor-pointer">
                  なし（テーマ背景）
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="preset" id="bg-preset" />
                <Label htmlFor="bg-preset" className="font-normal cursor-pointer">
                  プリセット選択
                </Label>
              </div>
            </RadioGroup>

            {/* プリセット選択グリッド */}
            {background.type === 'preset' && (
              <div className="mt-3">
                <Tabs defaultValue="gradient">
                  <TabsList className="w-full">
                    <TabsTrigger value="gradient" className="flex-1">
                      グラデーション
                    </TabsTrigger>
                    <TabsTrigger value="solid" className="flex-1">
                      単色
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="gradient" className="mt-2">
                    <PresetGrid
                      presets={gradientPresets}
                      selectedId={background.presetId}
                      onSelect={handlePresetSelect}
                    />
                  </TabsContent>

                  <TabsContent value="solid" className="mt-2">
                    <PresetGrid
                      presets={solidPresets}
                      selectedId={background.presetId}
                      onSelect={handlePresetSelect}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </section>

          <Separator />

          {/* ===== 余白設定 ===== */}
          <section>
            <Label className="text-sm font-semibold">余白</Label>

            <Tabs defaultValue="mobile" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="mobile" className="flex-1">
                  モバイル
                </TabsTrigger>
                <TabsTrigger value="tablet" className="flex-1">
                  タブレット
                </TabsTrigger>
                <TabsTrigger value="desktop" className="flex-1">
                  PC
                </TabsTrigger>
              </TabsList>

              {(['mobile', 'tablet', 'desktop'] as const).map((bp) => (
                <TabsContent key={bp} value={bp} className="mt-3 space-y-3">
                  {bp !== 'mobile' && (
                    <p className="text-xs text-muted-foreground">
                      未設定の場合、{bp === 'tablet' ? 'モバイル' : 'タブレット'}
                      の値を継承します
                    </p>
                  )}

                  <PaddingControl
                    label="上"
                    value={getPaddingValue(paddingTop, bp)}
                    onChange={(v) => handlePaddingChange('top', bp, v)}
                    allowUnset={bp !== 'mobile'}
                    padding={paddingTop}
                    breakpoint={bp}
                  />

                  <PaddingControl
                    label="下"
                    value={getPaddingValue(paddingBottom, bp)}
                    onChange={(v) => handlePaddingChange('bottom', bp, v)}
                    allowUnset={bp !== 'mobile'}
                    padding={paddingBottom}
                    breakpoint={bp}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </section>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ===== プリセットグリッド =====

function PresetGrid({
  presets,
  selectedId,
  onSelect,
}: {
  presets: SectionBackgroundPreset[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  if (presets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">プリセットがありません</p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {presets.map((preset) => {
        const style = resolveBackgroundStyle(preset)
        const isSelected = preset.id === selectedId

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={cn(
              'relative h-14 rounded-md border-2 transition-all',
              isSelected
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:border-primary/50'
            )}
            style={style}
            title={preset.name}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-primary p-0.5">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ===== パディングコントロール =====

function PaddingControl({
  label,
  value,
  onChange,
  allowUnset,
  padding,
  breakpoint,
}: {
  label: string
  value: SectionPaddingValue | undefined
  onChange: (value: SectionPaddingValue) => void
  allowUnset: boolean
  padding: ResponsivePadding
  breakpoint: 'mobile' | 'tablet' | 'desktop'
}) {
  // 現在のブレークポイントの実効値を取得
  const effectiveValue = getEffectivePadding(padding, breakpoint)
  const isInherited = allowUnset && padding[breakpoint] === undefined

  // カスタム値かどうか判定
  const isCustom = typeof value === 'number'

  // ToggleGroup の value: プリセットならプリセット値、カスタムなら 'custom'
  const toggleValue = isCustom ? 'custom' : (typeof value === 'string' ? value : '')

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs w-6">{label}</Label>
        {isInherited && (
          <span className="text-xs text-muted-foreground">(継承中)</span>
        )}
      </div>
      <ToggleGroup
        type="single"
        value={toggleValue}
        onValueChange={(v) => {
          if (!v) return
          if (v === 'custom') {
            // カスタム初期値: 現在の実効値のpx
            const currentPx = paddingToPx(effectiveValue)
            onChange(currentPx)
          } else {
            onChange(v as SectionPaddingSize)
          }
        }}
        className="justify-start flex-wrap"
      >
        {PADDING_OPTIONS.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            size="sm"
            className={cn(
              'text-xs px-2',
              isInherited && !isCustom &&
                typeof effectiveValue === 'string' && effectiveValue === opt.value &&
                'border-dashed border-primary/50'
            )}
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem
          value="custom"
          size="sm"
          className="text-xs px-2"
        >
          カスタム
        </ToggleGroupItem>
      </ToggleGroup>

      {/* カスタム値入力 */}
      {isCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={200}
            value={value}
            onChange={(e) => {
              const px = Math.max(0, Math.min(200, Number(e.target.value) || 0))
              onChange(px)
            }}
            className="w-20 h-7 text-xs"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      )}
    </div>
  )
}

// ===== ヘルパー関数 =====

/** ブレークポイントに対応するパディング値を取得 */
function getPaddingValue(
  padding: ResponsivePadding,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): SectionPaddingValue | undefined {
  return padding[breakpoint]
}

/** 継承を考慮した実効パディング値を取得 */
function getEffectivePadding(
  padding: ResponsivePadding,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): SectionPaddingValue {
  if (breakpoint === 'mobile') return padding.mobile
  if (breakpoint === 'tablet') return padding.tablet ?? padding.mobile
  // desktop
  return padding.desktop ?? padding.tablet ?? padding.mobile
}
