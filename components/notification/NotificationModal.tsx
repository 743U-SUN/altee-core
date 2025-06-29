"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { UserNotification } from "@/types/notifications"

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  notification: UserNotification
}

export function NotificationModal({ isOpen, onClose, notification }: NotificationModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Reset image states when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsImageLoading(true)
      setImageError(false)
    }
  }, [isOpen])

  const handleLinkClick = () => {
    if (notification.linkUrl) {
      try {
        window.open(notification.linkUrl, '_blank', 'noopener,noreferrer')
      } catch {
        toast.error("リンクを開けませんでした")
      }
    }
  }

  const handleImageError = () => {
    setImageError(true)
    setIsImageLoading(false)
    toast.error("画像の読み込みに失敗しました")
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>お知らせ</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 画像 */}
          {notification.image && notification.image.storageKey && !imageError && (
            <div className="relative w-full">
              {isImageLoading && (
                <div className="w-full h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">読み込み中...</span>
                </div>
              )}
              
              <img 
                src={`/api/files/${notification.image.storageKey}`}
                alt={notification.title || "お知らせ画像"}
                className={`w-full h-auto max-h-96 object-contain rounded-lg ${isImageLoading ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* タイトル */}
          {notification.title && (
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {notification.title}
              </h3>
            </div>
          )}

          {/* 内容 */}
          {notification.content && (
            <div className="space-y-3">
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {notification.content}
              </div>
            </div>
          )}

          {/* ボタン */}
          {notification.linkUrl && notification.buttonText && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2"
                size="lg"
              >
                {notification.buttonText}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}