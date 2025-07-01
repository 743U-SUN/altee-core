'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Loader2 } from "lucide-react"
import { getPublicDevices } from '@/app/actions/device-actions'
import { DeviceCard } from './DeviceCard'
import { DeviceCategory } from '@prisma/client'
import { DeviceWithDetails } from '@/types/device'

interface DeviceListSectionProps {
  initialDevices: DeviceWithDetails[]
  categories: DeviceCategory[]
  brands: { id: string, name: string }[]
  initialFilters: {
    category?: string
    brand?: string
    search?: string
  }
}

export function DeviceListSection({ 
  initialDevices, 
  categories, 
  brands,
  initialFilters 
}: DeviceListSectionProps) {
  const router = useRouter()
  
  const [devices, setDevices] = useState<DeviceWithDetails[]>(initialDevices)
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '')
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialFilters.category || 'all')
  const [selectedBrandId, setSelectedBrandId] = useState(initialFilters.brand || 'all')
  const [isLoading, setIsLoading] = useState(false)

  // URLパラメータの更新
  const updateURL = useCallback((category: string, brand: string, search: string) => {
    const params = new URLSearchParams()
    if (category && category !== 'all') params.set('category', category)
    if (brand && brand !== 'all') params.set('brand', brand)  
    if (search.trim()) params.set('search', search.trim())
    
    const url = params.toString() ? `/devices?${params.toString()}` : '/devices'
    router.push(url, { scroll: false })
  }, [router])

  // 検索実行
  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    try {
      const results = await getPublicDevices(
        selectedCategoryId === 'all' ? undefined : selectedCategoryId,
        selectedBrandId === 'all' ? undefined : selectedBrandId,
        searchQuery.trim() || undefined
      )
      setDevices(results as DeviceWithDetails[])
      updateURL(selectedCategoryId, selectedBrandId, searchQuery)
    } catch (error) {
      console.error('検索エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategoryId, selectedBrandId, searchQuery, updateURL])

  // カテゴリ・ブランド変更時の自動検索
  useEffect(() => {
    handleSearch()
  }, [selectedCategoryId, selectedBrandId, handleSearch])

  // リセット機能
  const handleReset = () => {
    setSearchQuery('')
    setSelectedCategoryId('all')
    setSelectedBrandId('all')
    router.push('/devices')
  }

  return (
    <div className="space-y-6">
      {/* 検索・フィルタエリア */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="デバイス名、ASIN で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select onValueChange={setSelectedCategoryId} value={selectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="カテゴリで絞り込み..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのカテゴリ</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select onValueChange={setSelectedBrandId} value={selectedBrandId}>
            <SelectTrigger>
              <SelectValue placeholder="ブランドで絞り込み..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのブランド</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="w-full"
          >
            リセット
          </Button>
        </div>
      </div>

      {/* 結果表示 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {devices.length}件のデバイスが見つかりました
          </p>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">条件に合うデバイスが見つかりませんでした</p>
            <Button variant="outline" onClick={handleReset} className="mt-4">
              フィルタをリセット
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard 
                key={device.id} 
                device={device}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}