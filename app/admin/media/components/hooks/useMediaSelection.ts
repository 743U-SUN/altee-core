import { useState, useCallback, useMemo } from 'react'

interface MediaFileBase {
  id: string
}

export function useMediaSelection<T extends MediaFileBase>(mediaFiles: T[]) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(mediaFiles.map(file => file.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }, [mediaFiles])

  const handleSelectFile = useCallback((fileId: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(fileId)
      } else {
        newSelected.delete(fileId)
      }
      return newSelected
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set())
  }, [])

  const isAllSelected = useMemo(() => {
    return mediaFiles.length > 0 && mediaFiles.every(file => selectedFiles.has(file.id))
  }, [mediaFiles, selectedFiles])

  const isIndeterminate = useMemo(() => {
    return selectedFiles.size > 0 && selectedFiles.size < mediaFiles.length
  }, [selectedFiles, mediaFiles])

  return {
    selectedFiles,
    handleSelectAll,
    handleSelectFile,
    clearSelection,
    isAllSelected,
    isIndeterminate
  }
}
