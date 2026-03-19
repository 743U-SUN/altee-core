"use client"

import React, { useState } from "react"
import Image from "next/image"
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface ContentModalProps {
  isOpen: boolean
  onClose: () => void
  dialogTitle: string
  imageStorageKey?: string | null
  title?: string | null
  content?: string | null
  linkUrl?: string | null
  buttonText?: string | null
  imageAlt?: string
}

export function ContentModal({
  isOpen,
  onClose,
  dialogTitle,
  imageStorageKey,
  title,
  content,
  linkUrl,
  buttonText,
  imageAlt = "画像",
}: ContentModalProps) {
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
    if (linkUrl) {
      try {
        window.open(linkUrl, '_blank', 'noopener,noreferrer')
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
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 画像 */}
          {imageStorageKey && !imageError && (
            <div className="relative w-full">
              {isImageLoading && (
                <div className="w-full h-64 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">読み込み中...</span>
                </div>
              )}
              <Image
                src={getPublicUrl(imageStorageKey)}
                alt={title || imageAlt}
                width={800}
                height={600}
                className={`w-full h-auto max-h-96 object-contain rounded-lg ${isImageLoading ? 'hidden' : ''}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* タイトル */}
          {title && (
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {title}
              </h3>
            </div>
          )}

          {/* 内容 */}
          {content && (
            <div className="space-y-3">
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            </div>
          )}

          {/* ボタン */}
          {linkUrl && buttonText && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLinkClick}
                className="inline-flex items-center gap-2"
                size="lg"
              >
                {buttonText}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
