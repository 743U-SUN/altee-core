"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import type { UploadedFile } from "@/types/image-upload"

interface CustomIconUploadModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onIconSelected: (iconId: string) => void
}

export function CustomIconUploadModal({ 
  isOpen, 
  onOpenChange, 
  onIconSelected 
}: CustomIconUploadModalProps) {
  const [uploadedIcon, setUploadedIcon] = useState<UploadedFile | null>(null)

  const handleIconUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      const file = files[0]
      setUploadedIcon(file)
      toast.success("アイコンをアップロードしました")
    }
  }

  const handleConfirm = () => {
    if (uploadedIcon) {
      onIconSelected(uploadedIcon.id)
      onOpenChange(false)
      setUploadedIcon(null)
    }
  }

  const handleCancel = () => {
    setUploadedIcon(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>カスタムアイコンをアップロード</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <ImageUploader
              mode="immediate"
              previewSize="small"
              maxFiles={1}
              maxSize={1024 * 1024} // 1MB
              folder="user-links"
              onUpload={handleIconUpload}
              showPreview={true}
              className="min-h-[120px]"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 推奨サイズ: 24x24px 以上</p>
            <p>• 対応形式: PNG, JPG, GIF, SVG</p>
            <p>• 最大ファイルサイズ: 1MB</p>
            <p>• SVGファイルは自動的にサニタイズされます</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              キャンセル
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!uploadedIcon}
            >
              <Upload className="h-4 w-4 mr-2" />
              このアイコンを使用
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}