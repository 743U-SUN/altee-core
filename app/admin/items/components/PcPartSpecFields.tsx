'use client'

import { useState, useRef } from 'react'
import type { Brand } from '@prisma/client'
import type { PcPartType } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PC_PART_TYPES, pcPartTypeLabels } from '@/lib/validations/pc-build'
import { specFieldsByType } from '@/lib/validations/pc-part-specs'
import type { PcPartSpecFormData } from '@/types/pc-part-spec'

interface PcPartSpecFieldsProps {
  brands: Brand[]
  value: PcPartSpecFormData | null
  onChange: (data: PcPartSpecFormData | null) => void
}

export function PcPartSpecFields({ brands, value, onChange }: PcPartSpecFieldsProps) {
  const [enabled, setEnabled] = useState(value !== null)
  const [partType, setPartType] = useState<PcPartType>(value?.partType ?? 'CPU')
  const [chipMakerId, setChipMakerId] = useState<string | null>(value?.chipMakerId ?? null)
  const [tdp, setTdp] = useState<number | null>(value?.tdp ?? null)
  const [releaseDate, setReleaseDate] = useState<string | null>(value?.releaseDate ?? null)
  const [specs, setSpecs] = useState<Record<string, unknown>>(value?.specs ?? {})

  // onChange の最新参照を保持（イベントハンドラ内で安全に呼べるように）
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const notifyParent = (overrides: Partial<{ enabled: boolean; partType: PcPartType; chipMakerId: string | null; tdp: number | null; releaseDate: string | null; specs: Record<string, unknown> }> = {}) => {
    const e = overrides.enabled ?? enabled
    if (!e) {
      onChangeRef.current(null)
      return
    }
    onChangeRef.current({
      partType: overrides.partType ?? partType,
      chipMakerId: overrides.chipMakerId !== undefined ? overrides.chipMakerId : chipMakerId,
      tdp: overrides.tdp !== undefined ? overrides.tdp : tdp,
      releaseDate: overrides.releaseDate !== undefined ? overrides.releaseDate : releaseDate,
      specs: overrides.specs ?? specs,
    })
  }

  const fields = specFieldsByType[partType] ?? []

  const updateSpec = (key: string, val: unknown) => {
    const newSpecs = { ...specs, [key]: val }
    setSpecs(newSpecs)
    notifyParent({ specs: newSpecs })
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="pc-part-spec-toggle"
          checked={enabled}
          onChange={(e) => {
            const newEnabled = e.target.checked
            setEnabled(newEnabled)
            notifyParent({ enabled: newEnabled })
          }}
          className="h-4 w-4"
        />
        <Label htmlFor="pc-part-spec-toggle" className="text-base font-semibold">
          PCパーツスペック情報を設定
        </Label>
      </div>

      {enabled && (
        <div className="space-y-4 pt-2">
          {/* パーツ種別 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>パーツ種別</Label>
              <Select value={partType} onValueChange={(v) => {
                const newPartType = v as PcPartType
                setPartType(newPartType)
                setSpecs({})
                notifyParent({ partType: newPartType, specs: {} })
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PC_PART_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {pcPartTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* チップメーカー */}
            <div className="space-y-2">
              <Label>チップメーカー</Label>
              <Select
                value={chipMakerId ?? 'none'}
                onValueChange={(v) => {
                  const newChipMakerId = v === 'none' ? null : v
                  setChipMakerId(newChipMakerId)
                  notifyParent({ chipMakerId: newChipMakerId })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TDP / 発売日 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>TDP（消費電力）</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="125"
                  value={tdp ?? ''}
                  onChange={(e) => {
                    const newTdp = e.target.value === '' ? null : Number(e.target.value)
                    setTdp(newTdp)
                    notifyParent({ tdp: newTdp })
                  }}
                />
                <span className="text-sm text-muted-foreground">W</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>発売日</Label>
              <Input
                type="date"
                value={releaseDate ?? ''}
                onChange={(e) => {
                  const newDate = e.target.value || null
                  setReleaseDate(newDate)
                  notifyParent({ releaseDate: newDate })
                }}
              />
            </div>
          </div>

          {/* カテゴリ別スペック */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {pcPartTypeLabels[partType]} 固有スペック
            </Label>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-sm">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>

                  {field.type === 'select' && field.options ? (
                    <Select
                      value={(specs[field.key] as string) ?? ''}
                      onValueChange={(v) => updateSpec(field.key, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'number' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder={field.placeholder}
                        value={(specs[field.key] as number) ?? ''}
                        onChange={(e) =>
                          updateSpec(field.key, e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                      {field.unit && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{field.unit}</span>
                      )}
                    </div>
                  ) : field.type === 'multi-text' ? (
                    <Input
                      placeholder={field.placeholder}
                      value={Array.isArray(specs[field.key]) ? (specs[field.key] as string[]).join(', ') : ''}
                      onChange={(e) =>
                        updateSpec(
                          field.key,
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      value={(specs[field.key] as string) ?? ''}
                      onChange={(e) => updateSpec(field.key, e.target.value || undefined)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
