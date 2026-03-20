'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { searchPcPartCatalog } from '@/app/actions/content/pc-build-actions'
import type { ItemWithPcPartSpec } from '@/types/pc-part-spec'

export function useCatalogSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ItemWithPcPartSpec[]>([])
  const [isSearching, startSearch] = useTransition()

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    startSearch(async () => {
      try {
        const result = await searchPcPartCatalog(searchQuery)
        if (result.success && result.data) {
          setSearchResults(result.data as ItemWithPcPartSpec[])
        }
      } catch {
        toast.error('検索に失敗しました')
      }
    })
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearching,
    handleSearch,
    clearSearch,
  }
}
