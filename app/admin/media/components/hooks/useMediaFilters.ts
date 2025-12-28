import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function useMediaFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [containerName, setContainerName] = useState(searchParams.get('container') || '')
  const [uploadType, setUploadType] = useState(searchParams.get('type') || '')
  const [tags, setTags] = useState(searchParams.get('tags') || '')
  const [month, setMonth] = useState(searchParams.get('month') || '')

  const applyFilters = (overrides: Partial<{
    search: string
    containerName: string
    uploadType: string
    tags: string
    month: string
  }> = {}) => {
    const params = new URLSearchParams()

    const finalSearch = overrides.search !== undefined ? overrides.search : search
    const finalContainer = overrides.containerName !== undefined ? overrides.containerName : containerName
    const finalUploadType = overrides.uploadType !== undefined ? overrides.uploadType : uploadType
    const finalTags = overrides.tags !== undefined ? overrides.tags : tags
    const finalMonth = overrides.month !== undefined ? overrides.month : month

    if (finalSearch?.trim()) params.set('search', finalSearch.trim())
    if (finalContainer) params.set('container', finalContainer)
    if (finalUploadType) params.set('type', finalUploadType)
    if (finalTags?.trim()) params.set('tags', finalTags.trim())
    if (finalMonth) params.set('month', finalMonth)

    // ページをリセット
    params.delete('page')

    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setContainerName('')
    setUploadType('')
    setTags('')
    setMonth('')
    router.push('/admin/media')
  }

  const activeFiltersCount = [search, containerName, uploadType, tags, month].filter(Boolean).length

  return {
    search,
    setSearch,
    containerName,
    setContainerName,
    uploadType,
    setUploadType,
    tags,
    setTags,
    month,
    setMonth,
    applyFilters,
    clearFilters,
    activeFiltersCount
  }
}
