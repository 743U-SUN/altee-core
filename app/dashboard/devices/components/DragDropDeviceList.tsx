'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { GripVertical, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { UserDeviceWithDetails } from "@/types/device"
import { DeviceImage } from "@/components/devices/device-image"
import { Badge } from "@/components/ui/badge"
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
import { deleteUserDevice, reorderUserDevices, updateUserDevice } from "@/app/actions/device-actions"

// EditUserDeviceModalの遅延読み込み
const EditUserDeviceModal = dynamic(() => import('./EditUserDeviceModal').then(mod => ({ default: mod.EditUserDeviceModal })), {
  loading: () => <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

interface DragDropDeviceListProps {
  userDevices: UserDeviceWithDetails[]
  userId: string
  onDevicesChange: (devices: UserDeviceWithDetails[]) => void
}

export function DragDropDeviceList({ userDevices, userId, onDevicesChange }: DragDropDeviceListProps) {
  const [activeItem, setActiveItem] = useState<UserDeviceWithDetails | null>(null)
  const [editingDevice, setEditingDevice] = useState<UserDeviceWithDetails | null>(null)

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
    const device = userDevices.find(d => d.id === event.active.id)
    setActiveItem(device || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const oldIndex = userDevices.findIndex((device) => device.id === active.id)
    const newIndex = userDevices.findIndex((device) => device.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newDevices = arrayMove(userDevices, oldIndex, newIndex)
    onDevicesChange(newDevices)

    // サーバーで並び順を更新
    const result = await reorderUserDevices(userId, newDevices.map(device => device.id))

    if (!result.success) {
      toast.error("並び替えに失敗しました")
      // エラー時は元の順序に戻す
      onDevicesChange(userDevices)
    }
  }

  const handleVisibilityToggle = async (device: UserDeviceWithDetails) => {
    const result = await updateUserDevice(userId, device.id, {
      isPublic: !device.isPublic
    })

    if (result.success) {
      const updatedDevices = userDevices.map(d => 
        d.id === device.id ? { ...d, isPublic: !d.isPublic } : d
      )
      onDevicesChange(updatedDevices)
      toast.success(device.isPublic ? "デバイスを非公開にしました" : "デバイスを公開しました")
    } else {
      toast.error("表示設定の変更に失敗しました")
    }
  }

  const handleDeleteDevice = async (device: UserDeviceWithDetails) => {
    if (!confirm(`${device.device.name}を削除しますか？`)) return

    const result = await deleteUserDevice(userId, device.id)

    if (result.success) {
      const updatedDevices = userDevices.filter(d => d.id !== device.id)
      onDevicesChange(updatedDevices)
      toast.success("デバイスを削除しました")
    } else {
      toast.error("デバイスの削除に失敗しました")
    }
  }

  const handleUpdate = (updatedDevice: UserDeviceWithDetails) => {
    const updatedDevices = userDevices.map(d => 
      d.id === updatedDevice.id ? updatedDevice : d
    )
    onDevicesChange(updatedDevices)
    setEditingDevice(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={userDevices.map(device => device.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {userDevices.map((device) => (
              <SortableDeviceItem
                key={device.id}
                device={device}
                onEdit={() => setEditingDevice(device)}
                onVisibilityToggle={() => handleVisibilityToggle(device)}
                onDelete={() => handleDeleteDevice(device)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem && (
            <DeviceItemCard
              device={activeItem}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {editingDevice && (
        <EditUserDeviceModal
          isOpen={true}
          onClose={() => setEditingDevice(null)}
          userDevice={editingDevice}
          userId={userId}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}

// ソート可能なデバイスアイテム
function SortableDeviceItem({ 
  device, 
  onEdit, 
  onVisibilityToggle, 
  onDelete
}: {
  device: UserDeviceWithDetails
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
  } = useSortable({ id: device.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <DeviceItemCard
        device={device}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={onEdit}
        onVisibilityToggle={onVisibilityToggle}
        onDelete={onDelete}
      />
    </div>
  )
}

// デバイスアイテムカード
function DeviceItemCard({
  device,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  device: UserDeviceWithDetails
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
          <DeviceImage
            src={device.device.amazonImageUrl}
            alt={device.device.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium text-sm truncate">{device.device.name}</div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {device.device.category.name}
            </Badge>
            {device.device.brand && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {device.device.brand.name}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {device.review || "レビューなし"}
          </div>
        </div>

        {!isDragging && onEdit && onVisibilityToggle && onDelete && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVisibilityToggle}
            >
              {device.isPublic ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(device.device.amazonUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}