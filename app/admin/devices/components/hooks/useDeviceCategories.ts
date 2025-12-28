import { useState, useEffect, useCallback } from 'react'
import { getDeviceCategories } from '@/app/actions/device-actions'
import type { DeviceCategoryWithAttributes } from '@/types/device'

export function useDeviceCategories(initialCategoryId?: string) {
  const [categories, setCategories] = useState<DeviceCategoryWithAttributes[]>([])
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategoryWithAttributes | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        const categoryData = await getDeviceCategories()
        setCategories(categoryData)

        // 初期カテゴリを設定
        if (initialCategoryId) {
          const category = categoryData.find((cat: DeviceCategoryWithAttributes) => cat.id === initialCategoryId)
          setSelectedCategory(category || null)
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [initialCategoryId])

  const updateSelectedCategory = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    setSelectedCategory(category || null)
  }, [categories])

  return {
    categories,
    selectedCategory,
    isLoading,
    updateSelectedCategory
  }
}
