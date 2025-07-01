'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Eye, EyeOff, ExternalLink } from "lucide-react"
import { UserDeviceWithDetails } from "@/types/device"
import { DeviceImage } from "@/components/devices/device-image"
import { EditUserDeviceModal } from "./EditUserDeviceModal"
import { DeleteUserDeviceButton } from "./DeleteUserDeviceButton"

interface UserDeviceCardProps {
  userDevice: UserDeviceWithDetails
  userId: string
  onUpdate: (updatedUserDevice: UserDeviceWithDetails) => void
  onDelete: (deletedId: string) => void
}

export function UserDeviceCard({ userDevice, userId, onUpdate, onDelete }: UserDeviceCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleUpdate = (updatedUserDevice: UserDeviceWithDetails) => {
    onUpdate(updatedUserDevice)
    setIsEditModalOpen(false)
  }

  const handleDelete = () => {
    onDelete(userDevice.id)
  }


  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {userDevice.device.category.name}
              </Badge>
              {userDevice.isPublic ? (
                <Eye className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => window.open(userDevice.device.amazonUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Amazon で見る
                </DropdownMenuItem>
                <DeleteUserDeviceButton
                  userDeviceId={userDevice.id}
                  userId={userId}
                  deviceName={userDevice.device.name}
                  onDelete={handleDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <DeviceImage
              src={userDevice.device.amazonImageUrl}
              alt={userDevice.device.name}
              width={80}
              height={80}
              className="w-20 h-20 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {userDevice.device.name}
              </h3>
              <div className="flex flex-col space-y-1 mt-1">
                {userDevice.device.brand && (
                  <div className="text-xs text-muted-foreground">
                    {userDevice.device.brand.name}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  ASIN: {userDevice.device.asin}
                </div>
              </div>
            </div>
          </div>

          {/* レビュー */}

          {userDevice.review && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {userDevice.review}
            </p>
          )}


          {/* 公開ステータス */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {userDevice.isPublic ? '公開中' : '非公開'}
              </span>
              <div className="text-xs text-muted-foreground">
                {new Date(userDevice.createdAt).toLocaleDateString('ja-JP')} 登録
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserDeviceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userDevice={userDevice}
        userId={userId}
        onUpdate={handleUpdate}
      />
    </>
  )
}