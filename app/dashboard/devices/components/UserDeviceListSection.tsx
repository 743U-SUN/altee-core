'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { UserDeviceWithDetails } from "@/types/device"

// モーダルコンポーネントの遅延読み込み
const AddDeviceModal = dynamic(() => import('./AddDeviceModal').then(mod => ({ default: mod.AddDeviceModal })), {
  loading: () => <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

// DnD機能の遅延読み込み
const DragDropDeviceList = dynamic(() => import('./DragDropDeviceList').then(mod => ({ default: mod.DragDropDeviceList })), {
  loading: () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="w-12 h-12 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-1">
              <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              <div className="w-20 h-3 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-8 h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
  ssr: false
})

interface UserDeviceListSectionProps {
  initialUserDevices: UserDeviceWithDetails[]
  userId: string
}

export function UserDeviceListSection({ initialUserDevices, userId }: UserDeviceListSectionProps) {
  // データ管理（シンプル化）
  const [userDevices, setUserDevices] = useState(initialUserDevices)

  const mutateUserDevices = (newDevices: UserDeviceWithDetails[]) => {
    setUserDevices(newDevices)
  }

  const handleDevicesChange = (newDevices: UserDeviceWithDetails[]) => {
    mutateUserDevices(newDevices)
  }

  const handleDeviceAdded = (newDevice: UserDeviceWithDetails) => {
    const updatedDevices = [...userDevices, newDevice].sort((a, b) => a.sortOrder - b.sortOrder)
    mutateUserDevices(updatedDevices)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">デバイス設定</h2>
          <p className="text-sm text-muted-foreground">
            使用しているデバイスを管理できます（最大30個）
          </p>
        </div>
        <AddDeviceModal
          userId={userId}
          onDeviceAdded={handleDeviceAdded}
        />
      </div>

      {userDevices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>まだデバイスが登録されていません</p>
          <p className="text-sm">「デバイスを追加」から設定を始めましょう</p>
        </div>
      ) : (
        <DragDropDeviceList
          userDevices={userDevices}
          userId={userId}
          onDevicesChange={handleDevicesChange}
        />
      )}
    </div>
  )
}