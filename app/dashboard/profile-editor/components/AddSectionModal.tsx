'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import {
  getAllCategories,
  getSectionsByCategory,
  SECTION_REGISTRY,
  type SectionCategoryKey,
} from '@/lib/sections'
import { createSection } from '@/app/actions/user/section-actions'
import { useRouter } from 'next/navigation'
import * as LucideIcons from 'lucide-react'
import type { UserSection } from '@/types/profile-sections'

interface AddSectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  existingSections?: UserSection[]
}

type Step = 'category' | 'type'

export function AddSectionModal({
  open,
  onOpenChange,
  userId,
  existingSections = [],
}: AddSectionModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [selectedCategory, setSelectedCategory] =
    useState<SectionCategoryKey | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const categories = getAllCategories()

  // 各セクションタイプの現在の数をカウント
  const sectionTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    existingSections.forEach((section) => {
      counts[section.sectionType] = (counts[section.sectionType] || 0) + 1
    })
    return counts
  }, [existingSections])

  // セクションタイプが追加可能かチェック
  const canAddSectionType = (sectionType: string): boolean => {
    const definition = SECTION_REGISTRY[sectionType]
    if (!definition?.maxInstances) return true // 制限なし
    const currentCount = sectionTypeCounts[sectionType] || 0
    return currentCount < definition.maxInstances
  }

  const handleCategorySelect = (categoryKey: SectionCategoryKey) => {
    setSelectedCategory(categoryKey)
    setStep('type')
  }

  const handleBack = () => {
    setStep('category')
    setSelectedCategory(null)
  }

  const handleTypeSelect = async (sectionType: string, defaultData: unknown) => {
    setIsCreating(true)
    const result = await createSection(userId, sectionType, defaultData)
    setIsCreating(false)

    if (result.success) {
      onOpenChange(false)
      setStep('category')
      setSelectedCategory(null)
      router.refresh()
    } else {
      console.error('Failed to create section:', result.error)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false)
      setStep('category')
      setSelectedCategory(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 'type' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleBack}
                disabled={isCreating}
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
            <DialogTitle>
              {step === 'category'
                ? 'セクションカテゴリを選択'
                : 'セクションタイプを選択'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'category' && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(({ key, definition }) => {
              const IconComponent =
                LucideIcons[
                  definition.icon as keyof typeof LucideIcons
                ] as React.ComponentType<{ className?: string }>

              return (
                <Card
                  key={key}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleCategorySelect(key)}
                >
                  <div className="flex items-start gap-3">
                    {IconComponent && (
                      <IconComponent className="size-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{definition.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {definition.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {step === 'type' && selectedCategory && (
          <div className="grid grid-cols-2 gap-3">
            {getSectionsByCategory(selectedCategory).map((section) => {
              const IconComponent =
                LucideIcons[
                  section.icon as keyof typeof LucideIcons
                ] as React.ComponentType<{ className?: string }>
              const isAddable = canAddSectionType(section.type)

              return (
                <Card
                  key={section.type}
                  className={`p-4 transition-colors ${
                    isAddable
                      ? 'hover:bg-accent cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() =>
                    isAddable &&
                    handleTypeSelect(section.type, section.defaultData)
                  }
                >
                  <div className="flex items-start gap-3">
                    {IconComponent && (
                      <IconComponent className="size-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{section.label}</h3>
                        {!isAddable && (
                          <Badge variant="secondary" className="text-xs">
                            追加済み
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {isCreating && (
          <div className="text-center py-4 text-muted-foreground">
            セクションを作成中...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
