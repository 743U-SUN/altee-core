"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { NotificationModal } from "./NotificationModal"
import { isNotificationUnread, setNotificationReadCookie } from "@/lib/cookie-utils"
import type { UserNotification } from "@/types/notifications"

interface NotificationIconProps {
  notification: UserNotification
  userId: string
}

export function NotificationIcon({ notification, userId }: NotificationIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  // 未読状態をチェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unreadStatus = isNotificationUnread(userId, notification.updatedAt.toString())
      setHasUnread(unreadStatus)
    }
  }, [userId, notification.updatedAt])

  const handleClick = () => {
    setIsModalOpen(true)
    
    // モーダルを開いた時点で既読状態にする
    if (hasUnread) {
      setNotificationReadCookie(userId)
      setHasUnread(false)
    }
  }

  // 通知が無効化されているか、すべての項目が空の場合は表示しない
  const hasContent = notification.title || notification.content || notification.linkUrl || notification.imageId
  if (!notification.isEnabled || !hasContent) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 rounded-md hover:bg-accent"
        onClick={handleClick}
        title="お知らせ"
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        )}
      </Button>

      <NotificationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        notification={notification}
      />
    </>
  )
}