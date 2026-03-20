"use client"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { MediaType } from "@prisma/client"
import { useMediaSelection } from "./hooks/useMediaSelection"
import { useMediaDeletion } from "./hooks/useMediaDeletion"
import { BulkActionBar } from "./shared/BulkActionBar"
import { MediaTableRow } from "./shared/MediaTableRow"
import { MediaPagination } from "./shared/MediaPagination"
import type { AdminMediaFileView, MediaPaginationData } from "@/types/media"

interface MediaTableClientProps {
  mediaFiles: AdminMediaFileView[]
  pagination: MediaPaginationData
  search?: string
  containerName?: string
  uploadType?: MediaType
  month?: string
  storageUrl: string
}

export function MediaTableClient({
  mediaFiles,
  pagination,
  search,
  containerName,
  uploadType,
  month,
  storageUrl
}: MediaTableClientProps) {
  const {
    selectedFiles,
    handleSelectAll,
    handleSelectFile,
    clearSelection,
    isAllSelected,
    isIndeterminate
  } = useMediaSelection(mediaFiles)

  const {
    deletingFileId,
    bulkDeleting,
    handleDeleteFile,
    handleBulkDelete
  } = useMediaDeletion()

  if (mediaFiles.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          {search || containerName || uploadType || month
            ? '条件に一致するファイルが見つかりません'
            : 'アップロードされたファイルがありません'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 一括操作バー */}
      <BulkActionBar
        selectedCount={selectedFiles.size}
        bulkDeleting={bulkDeleting}
        onBulkDelete={() => handleBulkDelete(Array.from(selectedFiles), clearSelection)}
      />

      {/* テーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(ref) => {
                    if (ref) {
                      const inputElement = ref.querySelector('input') as HTMLInputElement
                      if (inputElement) {
                        inputElement.indeterminate = isIndeterminate
                      }
                    }
                  }}
                />
              </TableHead>
              <TableHead className="w-16">プレビュー</TableHead>
              <TableHead>ファイル名</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>サイズ</TableHead>
              <TableHead>アップロード者</TableHead>
              <TableHead>使用状況</TableHead>
              <TableHead>アップロード日</TableHead>
              <TableHead className="w-32">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaFiles.map((file) => (
              <MediaTableRow
                key={file.id}
                file={file}
                storageUrl={storageUrl}
                isSelected={selectedFiles.has(file.id)}
                onSelectChange={(checked) => handleSelectFile(file.id, checked)}
                onDelete={handleDeleteFile}
                isDeleting={deletingFileId === file.id}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      <MediaPagination pagination={pagination} />
    </div>
  )
}
