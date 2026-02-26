'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  togglePresetActiveAction,
  deletePresetAction,
  updatePresetSortOrderAction,
} from '@/app/actions/admin/section-background-actions'
import { PresetPreview } from './PresetPreview'
import type { SectionBackgroundPreset } from '@prisma/client'

interface PresetListClientProps {
  presets: SectionBackgroundPreset[]
}

// ===== ソート可能な行コンポーネント =====

function SortablePresetRow({
  preset,
  onToggleActive,
  onDelete,
}: {
  preset: SectionBackgroundPreset
  onToggleActive: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: preset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const categoryLabel: Record<string, string> = {
    solid: '単色',
    gradient: 'グラデーション',
    pattern: 'パターン',
    animated: 'アニメーション',
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell>
        <PresetPreview
          category={preset.category}
          config={preset.config as Record<string, unknown>}
          size="sm"
        />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{preset.name}</div>
          <div className="text-xs text-muted-foreground">
            {categoryLabel[preset.category] || preset.category}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={preset.isActive ? 'default' : 'secondary'}>
          {preset.isActive ? '公開' : '非公開'}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{preset.sortOrder}</span>
      </TableCell>
      <TableCell>
        <Switch
          checked={preset.isActive}
          onCheckedChange={(checked) => onToggleActive(preset.id, checked)}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/section-backgrounds/${preset.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(preset.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// ===== メインコンポーネント =====

export function PresetListClient({ presets: initialPresets }: PresetListClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  const handleToggleActive = (id: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await togglePresetActiveAction(id, isActive)
      if (result.success) {
        toast.success(isActive ? 'プリセットを公開しました' : 'プリセットを非公開にしました')
        router.refresh()
      } else {
        toast.error(result.error || '更新に失敗しました')
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('このプリセットを削除しますか？')) return

    startTransition(async () => {
      const result = await deletePresetAction(id)
      if (result.success) {
        toast.success('プリセットを削除しました')
        router.refresh()
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = initialPresets.findIndex((p) => p.id === active.id)
    const newIndex = initialPresets.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    // 新しい並び順を計算
    const reordered = [...initialPresets]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    const items = reordered.map((p, index) => ({ id: p.id, sortOrder: index }))

    startTransition(async () => {
      const result = await updatePresetSortOrderAction(items)
      if (result.success) {
        toast.success('並び順を更新しました')
        router.refresh()
      } else {
        toast.error(result.error || '並び替えに失敗しました')
      }
    })
  }

  // カテゴリ別にグループ化
  const solidPresets = initialPresets.filter((p) => p.category === 'solid')
  const gradientPresets = initialPresets.filter((p) => p.category === 'gradient')
  const allPresets = [...solidPresets, ...gradientPresets]

  return (
    <div className="space-y-4" data-pending={isPending ? '' : undefined}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            プリセット一覧（{initialPresets.length}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allPresets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>プリセットがまだ作成されていません</p>
              <p className="text-sm">「プリセット追加」から設定を始めましょう</p>
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={allPresets.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[80px]">プレビュー</TableHead>
                      <TableHead>名前</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>順序</TableHead>
                      <TableHead>有効</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPresets.map((preset) => (
                      <SortablePresetRow
                        key={preset.id}
                        preset={preset}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
