'use client'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  type DragEndEvent,
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
import { PresetPreview } from './PresetPreview'
import type { SerializedPreset } from './PresetListClient'

// カテゴリラベルのモジュールレベル定数
const CATEGORY_LABELS: Record<string, string> = {
  solid: '単色',
  gradient: 'グラデーション',
  pattern: 'パターン',
  animated: 'アニメーション',
}

interface PresetDndTableProps {
  presets: SerializedPreset[]
  onToggleActive: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onDragEnd: (event: DragEndEvent) => void
}

function SortablePresetRow({
  preset,
  onToggleActive,
  onDelete,
}: {
  preset: SerializedPreset
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
            {CATEGORY_LABELS[preset.category] || preset.category}
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

export function PresetDndTable({ presets, onToggleActive, onDelete, onDragEnd }: PresetDndTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext
        items={presets.map((p) => p.id)}
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
            {presets.map((preset) => (
              <SortablePresetRow
                key={preset.id}
                preset={preset}
                onToggleActive={onToggleActive}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </SortableContext>
    </DndContext>
  )
}
