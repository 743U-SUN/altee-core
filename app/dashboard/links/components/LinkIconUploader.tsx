"use client"

import { ImageUploader } from "@/components/image-uploader/image-uploader"
import type { UploadedFile } from "@/types/image-upload"

interface LinkIconUploaderProps {
  uploadedIcon: UploadedFile | null
  onUpload: (files: UploadedFile[]) => void
  onDelete: () => void
}

/**
 * リンク用アイコンアップローダーコンポーネント
 * 一貫したアイコンアップロード設定と説明文を提供
 */
export function LinkIconUploader({ uploadedIcon, onUpload, onDelete }: LinkIconUploaderProps) {
  return (
    <>
      <div className="border rounded-lg p-4">
        <ImageUploader
          mode="immediate"
          previewSize="small"
          maxFiles={1}
          maxSize={1024 * 1024} // 1MB
          folder="user-links"
          value={uploadedIcon ? [uploadedIcon] : []}
          onUpload={onUpload}
          onDelete={onDelete}
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
    </>
  )
}
