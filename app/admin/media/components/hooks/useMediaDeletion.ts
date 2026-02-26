import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteMediaFile, bulkDeleteMediaFiles } from '@/app/actions/media/media-actions'

export function useMediaDeletion() {
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileId(fileId)
    try {
      await deleteMediaFile(fileId)
      toast.success('ファイルを削除しました')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ファイルの削除に失敗しました')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleBulkDelete = async (fileIds: string[], onSuccess?: () => void) => {
    setBulkDeleting(true)
    try {
      const result = await bulkDeleteMediaFiles(fileIds)
      toast.success(`${result.deletedCount}件のファイルを削除しました`)
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '一括削除に失敗しました')
    } finally {
      setBulkDeleting(false)
    }
  }

  return {
    deletingFileId,
    bulkDeleting,
    handleDeleteFile,
    handleBulkDelete
  }
}
