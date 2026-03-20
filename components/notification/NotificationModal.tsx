"use client"

import { ContentModal } from "./ContentModal"
import type { UserNotification } from "@/types/notifications"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notification: UserNotification
}

export function NotificationModal({ isOpen, onClose, notification }: NotificationModalProps) {
  return (
    <ContentModal
      isOpen={isOpen}
      onClose={onClose}
      dialogTitle="お知らせ"
      imageStorageKey={notification.image?.storageKey}
      title={notification.title}
      content={notification.content}
      linkUrl={notification.linkUrl}
      buttonText={notification.buttonText}
      imageAlt="お知らせ画像"
    />
  )
}
