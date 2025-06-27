"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { GripVertical, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import type { UserData } from "@/types/userdata"
import { UserDataIconRenderer } from "./UserDataIconRenderer"

// EditUserDataModalの遅延読み込み
const EditUserDataModal = dynamic(() => import("../edit-userdata-modal").then(mod => ({ default: mod.EditUserDataModal })), {
  loading: () => <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { deleteUserData, reorderUserData, updateUserData } from "@/app/actions/userdata-actions"

interface DragDropUserDataListProps {
  userData: UserData[]
  onDataChange: (data: UserData[]) => void
  onEditData: (data: UserData) => void
}

export function DragDropUserDataList({ userData, onDataChange, onEditData }: DragDropUserDataListProps) {
  const [activeItem, setActiveItem] = useState<UserData | null>(null)

  // DnD センサー設定（モバイル対応）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = userData.find(d => d.id === event.active.id)
    setActiveItem(data || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const oldIndex = userData.findIndex((data) => data.id === active.id)
    const newIndex = userData.findIndex((data) => data.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newData = arrayMove(userData, oldIndex, newIndex)
    onDataChange(newData)

    // サーバーで並び順を更新
    const result = await reorderUserData({
      dataIds: newData.map(data => data.id)
    })

    if (!result.success) {
      toast.error("並び替えに失敗しました")
      // エラー時は元の順序に戻す
      onDataChange(userData)
    }
  }

  const handleVisibilityToggle = async (data: UserData) => {
    const result = await updateUserData(data.id, {
      isVisible: !data.isVisible
    })

    if (result.success) {
      const updatedData = userData.map(d => 
        d.id === data.id ? { ...d, isVisible: !d.isVisible } : d
      )
      onDataChange(updatedData)
      toast.success(data.isVisible ? "データを非表示にしました" : "データを表示にしました")
    } else {
      toast.error("表示設定の変更に失敗しました")
    }
  }

  const handleDeleteData = async (data: UserData) => {
    if (!confirm("このデータを削除しますか？")) return

    const result = await deleteUserData(data.id)

    if (result.success) {
      const updatedData = userData.filter(d => d.id !== data.id)
      onDataChange(updatedData)
      toast.success("データを削除しました")
    } else {
      toast.error("データの削除に失敗しました")
    }
  }


  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={userData.map(data => data.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {userData.map((data) => (
            <SortableUserDataItem
              key={data.id}
              data={data}
              onEdit={() => onEditData(data)}
              onVisibilityToggle={() => handleVisibilityToggle(data)}
              onDelete={() => handleDeleteData(data)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && (
          <UserDataItemCard
            data={activeItem}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ソート可能なデータアイテム
function SortableUserDataItem({ 
  data, 
  onEdit, 
  onVisibilityToggle, 
  onDelete
}: {
  data: UserData
  onEdit: () => void
  onVisibilityToggle: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: data.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <UserDataItemCard
        data={data}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={onEdit}
        onVisibilityToggle={onVisibilityToggle}
        onDelete={onDelete}
      />
    </div>
  )
}

// データアイテムカード
function UserDataItemCard({
  data,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  data: UserData
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  onEdit?: () => void
  onVisibilityToggle?: () => void
  onDelete?: () => void
}) {

  return (
    <div className={`border rounded-lg p-4 bg-card ${isDragging ? 'shadow-lg opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-shrink-0">
          <UserDataIconRenderer iconName={data.icon} className="h-6 w-6 text-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{data.field}</div>
          <div className="text-xs text-muted-foreground truncate">{data.value}</div>
        </div>

        {!isDragging && onEdit && onVisibilityToggle && onDelete && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVisibilityToggle}
            >
              {data.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <EditUserDataModal
              data={data}
              onDataUpdated={() => {
                onEdit?.()
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              削除
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}