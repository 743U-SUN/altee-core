import { getMediaFiles, MediaFilesFilter } from "@/app/actions/media-actions"
import { MediaTableClient } from "./MediaTableClient"
import { MediaType } from "@prisma/client"

interface MediaTableProps {
  currentPage?: number
  search?: string
  containerName?: string
  uploadType?: MediaType
  tags?: string
  month?: string
}

export async function MediaTable({ 
  currentPage = 1, 
  search, 
  containerName,
  uploadType,
  tags,
  month
}: MediaTableProps) {
  try {
    const filters: MediaFilesFilter = {
      page: currentPage,
      limit: 20,
      ...(search && { search }),
      ...(containerName && { containerName }),
      ...(uploadType && { uploadType }),
      ...(tags && { tags }),
      ...(month && { month }),
    }
    
    const { mediaFiles, pagination } = await getMediaFiles(filters)

    return (
      <MediaTableClient
        mediaFiles={mediaFiles}
        pagination={pagination}
        search={search}
        containerName={containerName}
        uploadType={uploadType}
        month={month}
        storageUrl={process.env.NEXT_PUBLIC_STORAGE_URL || ''}
      />
    )
  } catch (error) {
    console.error("MediaTable error:", error)
    
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          メディアファイルの読み込み中にエラーが発生しました
        </p>
      </div>
    )
  }
}