'use client'

import { UserDeviceForPublicPage } from '@/types/device'
import { UserPublicDeviceCard } from './UserPublicDeviceCard'

interface UserPublicDeviceListProps {
  userDevices: UserDeviceForPublicPage[]
  userName: string
}

export function UserPublicDeviceList({ userDevices, userName }: UserPublicDeviceListProps) {
  if (userDevices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            公開デバイスがありません
          </h3>
          <p className="text-sm text-muted-foreground">
            {userName}さんはまだデバイス情報を公開していません
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {userName}さんのデバイス
        </h2>
        <p className="text-muted-foreground">
          公開されているデバイス情報とレビューを確認できます
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userDevices.map((userDevice) => (
          <UserPublicDeviceCard
            key={userDevice.id}
            userDevice={userDevice}
          />
        ))}
      </div>
      
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {userDevices.length}個のデバイスが公開されています
        </p>
      </div>
    </div>
  )
}