'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UserDeviceWithDetails } from "@/types/device"
import { UserDeviceCard } from "./UserDeviceCard"
import { AddDeviceModal } from "./AddDeviceModal"

interface UserDeviceListSectionProps {
  initialUserDevices: UserDeviceWithDetails[]
  userId: string
}

export function UserDeviceListSection({ initialUserDevices, userId }: UserDeviceListSectionProps) {
  const [userDevices, setUserDevices] = useState(initialUserDevices)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleDeviceAdded = (newUserDevice: UserDeviceWithDetails) => {
    setUserDevices([newUserDevice, ...userDevices])
  }

  const handleDeviceUpdated = (updatedUserDevice: UserDeviceWithDetails) => {
    setUserDevices(devices => 
      devices.map(device => 
        device.id === updatedUserDevice.id ? updatedUserDevice : device
      )
    )
  }

  const handleDeviceDeleted = (deletedId: string) => {
    setUserDevices(devices => 
      devices.filter(device => device.id !== deletedId)
    )
  }

  if (userDevices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-sm">
          <p className="text-muted-foreground mb-4">
            まだデバイスが登録されていません
          </p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            最初のデバイスを追加
          </Button>
        </div>
        
        <AddDeviceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onDeviceAdded={handleDeviceAdded}
          userId={userId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {userDevices.length} 件のデバイスが登録されています
        </p>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          デバイスを追加
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userDevices.map((userDevice) => (
          <UserDeviceCard
            key={userDevice.id}
            userDevice={userDevice}
            userId={userId}
            onUpdate={handleDeviceUpdated}
            onDelete={handleDeviceDeleted}
          />
        ))}
      </div>

      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onDeviceAdded={handleDeviceAdded}
        userId={userId}
      />
    </div>
  )
}