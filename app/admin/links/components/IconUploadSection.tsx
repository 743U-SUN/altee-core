"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import type { UploadedFile } from "@/types/image-upload"

interface IconUploadSectionProps {
  currentIcon?: string | null
  onIconUploaded: (iconPath: string) => void
  onIconRemoved?: () => void
}

export function IconUploadSection({ 
  currentIcon, 
  onIconUploaded, 
  onIconRemoved 
}: IconUploadSectionProps) {
  const [uploadedIcon, setUploadedIcon] = useState<UploadedFile | null>(null)

  const handleIconUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0]
      console.log('Icon uploaded:', file) // デバッグログ
      setUploadedIcon(file)
      onIconUploaded(file.key)
    }
  }

  const handleIconDelete = () => {
    setUploadedIcon(null)
    onIconRemoved?.()
  }

  const getCurrentIconUrl = () => {
    if (uploadedIcon) {
      return uploadedIcon.url
    }
    if (currentIcon) {
      return `https://object-storage.c3j1.conoha.io/v1/AUTH_0bf5238d06034983a552682e781f9e25/${currentIcon}`
    }
    return null
  }

  return (
    <div className="space-y-3">
      <Label>
        デフォルトアイコン <span className="text-sm text-muted-foreground">（オプション、SVG推奨）</span>
      </Label>
      
      {/* 既存アイコン表示（currentIconがある場合のみ） */}
      {currentIcon && !uploadedIcon && (
        <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/50">
          <div className="w-8 h-8 flex items-center justify-center">
            {getCurrentIconUrl() ? (
              <Image
                src={getCurrentIconUrl()!}
                alt="アイコン"
                width={24}
                height={24}
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium">
              {uploadedIcon ? "新しいアイコンがアップロードされました" : "現在のアイコン"}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleIconDelete}
            className="text-destructive hover:text-destructive"
          >
            削除
          </Button>
        </div>
      )}

      {/* アップロード機能 */}
      <div className="border rounded-lg p-4">
        <ImageUploader
          mode="immediate"
          previewSize="small"
          maxFiles={1}
          maxSize={1024 * 1024} // 1MB
          folder="admin-links"
          value={uploadedIcon ? [uploadedIcon] : []}
          onUpload={handleIconUpload}
          onDelete={handleIconDelete}
          showPreview={true}
          className="min-h-[100px]"
        />
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• 推奨サイズ: 24x24px 以上</p>
        <p>• 対応形式: PNG, JPG, GIF, SVG</p>
        <p>• 最大ファイルサイズ: 1MB</p>
        <p>• SVGファイルは自動的にサニタイズされます</p>
      </div>
    </div>
  )
}