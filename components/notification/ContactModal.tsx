"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { UserContact } from "@/types/contacts"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  contact: UserContact
}

export function ContactModal({ isOpen, onClose, contact }: ContactModalProps) {
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
    if (contact.linkUrl) {
      try {
        window.open(contact.linkUrl, '_blank', 'noopener,noreferrer')
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
          <DialogTitle>連絡方法</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 画像 */}
          {contact.image && !imageError && (
            <div className="relative w-full">
              {isImageLoading && (
                <div className="w-full h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">読み込み中...</span>
                </div>
              )}
              <img 
                src={`/api/files/${contact.image.storageKey}`}
                alt={contact.title || "連絡方法画像"}
                className={`w-full h-auto max-h-96 object-contain rounded-lg ${isImageLoading ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* タイトル */}
          {contact.title && (
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {contact.title}
              </h3>
            </div>
          )}

          {/* 内容 */}
          {contact.content && (
            <div className="space-y-3">
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {contact.content}
              </div>
            </div>
          )}

          {/* ボタン */}
          {contact.linkUrl && contact.buttonText && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2"
                size="lg"
              >
                {contact.buttonText}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}