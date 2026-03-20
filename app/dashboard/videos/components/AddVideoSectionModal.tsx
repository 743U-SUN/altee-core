'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getSectionsByPage, SECTION_REGISTRY, type SectionDefinition } from '@/lib/sections'
import { createSection } from '@/app/actions/user/section-actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  User,
  Image,
  Link,
  FileText,
  BarChart2,
  Video,
  Heading,
  UserCircle,
  HelpCircle,
  Link2,
  List,
  PieChart,
  PanelTop,
  Columns2,
  Columns3,
  Youtube,
  CalendarDays,
  Clock,
  Newspaper,
  PlaySquare,
  Film,
  Rss,
  ThumbsUp,
  Tv2,
} from 'lucide-react'

// セクションアイコンマップ（`import * as LucideIcons` の代替）
const SECTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Image,
  Link,
  FileText,
  BarChart2,
  Video,
  Heading,
  UserCircle,
  HelpCircle,
  Link2,
  List,
  PieChart,
  PanelTop,
  Columns2,
  Columns3,
  Youtube,
  CalendarDays,
  Clock,
  Newspaper,
  PlaySquare,
  Film,
  Rss,
  ThumbsUp,
  Tv2,
}
import type { UserSection } from '@/types/profile-sections'

interface AddVideoSectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  existingSections?: UserSection[]
}

export function AddVideoSectionModal({
  open,
  onOpenChange,
  userId,
  existingSections = [],
}: AddVideoSectionModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const videoSections = getSectionsByPage('videos')

  const sectionTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    existingSections.forEach((section) => {
      counts[section.sectionType] = (counts[section.sectionType] || 0) + 1
    })
    return counts
  }, [existingSections])

  const canAddSectionType = (sectionType: string): boolean => {
    const definition = SECTION_REGISTRY[sectionType]
    if (!definition?.maxInstances) return true
    const currentCount = sectionTypeCounts[sectionType] || 0
    return currentCount < definition.maxInstances
  }

  const handleTypeSelect = async (sectionType: string, defaultData: unknown) => {
    setIsCreating(true)
    const result = await createSection(userId, sectionType, defaultData, 'videos')
    setIsCreating(false)

    if (result.success) {
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error || 'セクションの作成に失敗しました')
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>セクションを追加</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          {videoSections.map((section: SectionDefinition) => {
            const IconComponent = SECTION_ICON_MAP[section.icon]
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

        {isCreating && (
          <div className="text-center py-4 text-muted-foreground">
            セクションを作成中...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
