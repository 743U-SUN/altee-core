import { useState } from 'react'

interface MediaFileBase {
  id: string
}

export function useMediaSelection<T extends MediaFileBase>(mediaFiles: T[]) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(mediaFiles.map(file => file.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(fileId)
      } else {
        newSelected.delete(fileId)
      }
      return newSelected
    })
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  const isAllSelected = mediaFiles.length > 0 && mediaFiles.every(file => selectedFiles.has(file.id))

  const isIndeterminate = selectedFiles.size > 0 && selectedFiles.size < mediaFiles.length

  return {
    selectedFiles,
    handleSelectAll,
    handleSelectFile,
    clearSelection,
    isAllSelected,
    isIndeterminate
  }
}
