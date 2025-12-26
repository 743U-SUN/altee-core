'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { createUserDevice, searchDevices, getDevicesByCategory, checkUserDeviceExists } from "@/app/actions/device-actions"
import { UserDeviceWithDetails } from "@/types/device"
import { Device, DeviceCategory, DeviceAttribute, CategoryAttribute } from '@prisma/client'
import { DeviceImage } from "@/components/devices/device-image"

type SearchDeviceResult = Device & {
  category: DeviceCategory
  brand: { id: string, name: string } | null
  attributes: (DeviceAttribute & {
    categoryAttribute: CategoryAttribute
  })[]
}

const userDeviceSchema = z.object({
  isPublic: z.boolean().default(true),
  review: z.string().optional(),
})

interface ExistingDeviceSelectorProps {
  userId: string
  categories: { id: string, name: string }[]
  brands: { id: string, name: string }[]
  onDeviceAdded: (userDevice: UserDeviceWithDetails) => void
}

const ExistingDeviceSelectorComponent = ({
  userId,
  categories,
  brands,
  onDeviceAdded
}: ExistingDeviceSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchDeviceResult[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<SearchDeviceResult | null>(null)

  const form = useForm({
    resolver: zodResolver(userDeviceSchema),
    defaultValues: {
      isPublic: true,
    }
  })

  // デバイス検索・フィルタ
  const handleSearch = useCallback(async () => {
    setIsSearching(true)
    try {
      if (searchQuery.trim()) {
        const results = await searchDevices(
          searchQuery, 
          selectedCategoryId === 'all' ? undefined : selectedCategoryId, 
          selectedBrandId === 'all' ? undefined : selectedBrandId
        )
        setSearchResults(results)
      } else {
        const results = await getDevicesByCategory(
          selectedCategoryId === 'all' ? undefined : selectedCategoryId, 
          selectedBrandId === 'all' ? undefined : selectedBrandId
        )
        setSearchResults(results)
      }
    } catch {
      toast.error('検索に失敗しました')
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, selectedCategoryId, selectedBrandId])

  // カテゴリ・ブランド変更時に自動検索
  useEffect(() => {
    // 初期状態（all）での検索を実行
    handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedBrandId, searchQuery])

  // 既存デバイスからの登録
  const handleSubmit = async (data: z.infer<typeof userDeviceSchema>) => {
    if (!selectedDevice) return

    setIsSubmitting(true)
    try {
      // ユーザーデバイスの重複チェック
      const alreadyRegistered = await checkUserDeviceExists(userId, selectedDevice.id)
      if (alreadyRegistered) {
        toast.error('このデバイスは既に登録されています')
        return
      }

      const result = await createUserDevice(userId, {
        deviceId: selectedDevice.id,
        ...data,
      })

      if (result.success && result.userDevice) {
        toast.success('デバイスを登録しました')
        onDeviceAdded(result.userDevice as UserDeviceWithDetails)
        // Reset form
        form.reset()
        setSelectedDevice(null)
        setSearchQuery('')
        setSearchResults([])
      } else {
        toast.error(result.error || 'デバイスの登録に失敗しました')
      }
    } catch {
      toast.error('登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Input
            placeholder="デバイス名、ASIN で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            size="sm"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {searchResults.map((device) => (
            <Card 
              key={device.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedDevice?.id === device.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedDevice(device)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <DeviceImage
                    imageStorageKey={device.imageStorageKey}
                    customImageUrl={device.customImageUrl}
                    amazonImageUrl={device.amazonImageUrl}
                    alt={device.name}
                    width={50}
                    height={50}
                    className="w-12 h-12"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{device.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {device.category.name}
                      </Badge>
                      {device.brand && (
                        <Badge variant="secondary" className="text-xs">
                          {device.brand.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ASIN: {device.asin}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedDevice && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>レビュー</FormLabel>
                  <FormControl>
                    <Textarea placeholder="使用感や感想を入力..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              登録
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}

// Propsの比較関数 - categories と brands の配列が変わらない限り再レンダリングをスキップ
const arePropsEqual = (prevProps: ExistingDeviceSelectorProps, nextProps: ExistingDeviceSelectorProps) => {
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.categories.length === nextProps.categories.length &&
    prevProps.brands.length === nextProps.brands.length &&
    prevProps.onDeviceAdded === nextProps.onDeviceAdded
  )
}

// メモ化されたコンポーネントをエクスポート
export const ExistingDeviceSelector = memo(ExistingDeviceSelectorComponent, arePropsEqual)