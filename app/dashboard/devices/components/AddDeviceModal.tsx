'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { extractAsinFromUrl, fetchOgData, createDevice, createUserDevice, searchDevices, getDeviceCategories, getBrands, getDevicesByCategory } from "@/app/actions/device-actions"
import { UserDeviceWithDetails } from "@/types/device"
import { Device, DeviceCategory, DeviceAttribute, CategoryAttribute } from '@prisma/client'

type SearchDeviceResult = Device & {
  category: DeviceCategory
  brand: { id: string, name: string } | null
  attributes: (DeviceAttribute & {
    categoryAttribute: CategoryAttribute
  })[]
}
import { DeviceImage } from "@/components/devices/device-image"

const userDeviceSchema = z.object({
  isPublic: z.boolean().default(true),
  review: z.string().optional(),
})

const newDeviceSchema = z.object({
  amazonUrl: z.string().min(1, 'Amazon URLを入力してください'),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  brandId: z.string().optional(),
  ...userDeviceSchema.shape
})

interface AddDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onDeviceAdded: (userDevice: UserDeviceWithDetails) => void
  userId: string
}

type Tab = 'existing' | 'new'

export function AddDeviceModal({ isOpen, onClose, onDeviceAdded, userId }: AddDeviceModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('existing')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchDeviceResult[]>([])
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [brands, setBrands] = useState<{ id: string, name: string }[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<SearchDeviceResult | null>(null)
  const [ogData, setOgData] = useState<{ title?: string, description?: string, image?: string } | null>(null)
  const [isLoadingOg, setIsLoadingOg] = useState(false)

  const existingDeviceForm = useForm({
    resolver: zodResolver(userDeviceSchema),
    defaultValues: {
      isPublic: true,
    }
  })

  const newDeviceForm = useForm({
    resolver: zodResolver(newDeviceSchema),
    defaultValues: {
      amazonUrl: '',
      categoryId: '',
      brandId: 'none',
      isPublic: true,
    }
  })

  // モーダルが開かれたときにカテゴリとブランドを取得
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      getDeviceCategories().then(setCategories)
      getBrands().then(setBrands)
    }
  }, [isOpen, categories.length])

  // デバイス検索・フィルタ
  const handleSearch = async () => {
    setIsSearching(true)
    try {
      if (searchQuery.trim()) {
        // 検索クエリがある場合
        const results = await searchDevices(searchQuery, selectedCategoryId === 'all' ? undefined : selectedCategoryId || undefined, selectedBrandId === 'all' ? undefined : selectedBrandId || undefined)
        setSearchResults(results)
      } else {
        // 検索クエリがない場合はカテゴリ・ブランドフィルタのみ
        const results = await getDevicesByCategory(selectedCategoryId === 'all' ? undefined : selectedCategoryId || undefined, selectedBrandId === 'all' ? undefined : selectedBrandId || undefined)
        setSearchResults(results)
      }
    } catch {
      toast.error('検索に失敗しました')
    } finally {
      setIsSearching(false)
    }
  }

  // カテゴリまたはブランド変更時に自動検索
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
  }

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId)
  }

  // カテゴリ・ブランド変更時に自動検索
  useEffect(() => {
    if (isOpen && (selectedCategoryId !== '' || selectedBrandId !== '' || searchQuery.trim() !== '')) {
      handleSearch()
    }
  }, [selectedCategoryId, selectedBrandId, isOpen])

  // Amazon URL から OG データ取得
  const handleFetchOgData = async (url: string) => {
    setIsLoadingOg(true)
    try {
      // ASIN抽出
      const asinResult = await extractAsinFromUrl(url)
      if (!asinResult.success) {
        toast.error(asinResult.error || 'URLの解析に失敗しました')
        return
      }

      // OG情報取得
      const ogResult = await fetchOgData(url)
      if (!ogResult.success) {
        toast.error(ogResult.error || 'デバイス情報の取得に失敗しました')
        return
      }

      setOgData(ogResult.data || null)
      toast.success('デバイス情報を取得しました')
    } catch {
      toast.error('情報の取得に失敗しました')
    } finally {
      setIsLoadingOg(false)
    }
  }

  // 既存デバイスからの登録
  const handleExistingDeviceSubmit = async (data: z.infer<typeof userDeviceSchema>) => {
    if (!selectedDevice) return

    setIsSubmitting(true)
    try {
      const result = await createUserDevice(userId, {
        deviceId: selectedDevice.id,
        ...data,
      })

      if (result.success && result.userDevice) {
        toast.success('デバイスを登録しました')
        onDeviceAdded(result.userDevice as UserDeviceWithDetails)
        onClose()
        resetForms()
      } else {
        toast.error(result.error || 'デバイスの登録に失敗しました')
      }
    } catch {
      toast.error('登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 新規デバイス作成＆登録
  const handleNewDeviceSubmit = async (data: z.infer<typeof newDeviceSchema>) => {
    if (!ogData) {
      toast.error('まずデバイス情報を取得してください')
      return
    }

    setIsSubmitting(true)
    try {
      // ASINチェック
      const asinResult = await extractAsinFromUrl(data.amazonUrl)
      if (!asinResult.success) {
        toast.error('無効なAmazon URLです')
        return
      }

      // デバイス作成
      const deviceResult = await createDevice({
        asin: asinResult.asin!,
        name: ogData.title || 'デバイス名',
        description: ogData.description,
        categoryId: data.categoryId,
        brandId: data.brandId === 'none' ? undefined : data.brandId,
        amazonUrl: data.amazonUrl,
        amazonImageUrl: ogData.image,
        ogTitle: ogData.title,
        ogDescription: ogData.description,
      })

      if (!deviceResult.success || !deviceResult.device) {
        toast.error(deviceResult.error || 'デバイスの作成に失敗しました')
        return
      }

      // ユーザーデバイス登録
      const userDeviceResult = await createUserDevice(userId, {
        deviceId: deviceResult.device.id,
        isPublic: data.isPublic,
        review: data.review,
      })

      if (userDeviceResult.success && userDeviceResult.userDevice) {
        toast.success('デバイスを登録しました')
        onDeviceAdded(userDeviceResult.userDevice as UserDeviceWithDetails)
        onClose()
        resetForms()
      } else {
        toast.error(userDeviceResult.error || 'デバイスの登録に失敗しました')
      }
    } catch {
      toast.error('登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForms = () => {
    setActiveTab('existing')
    setSearchQuery('')
    setSearchResults([])
    setSelectedCategoryId('all')
    setSelectedBrandId('all')
    setSelectedDevice(null)
    setOgData(null)
    existingDeviceForm.reset()
    newDeviceForm.reset()
  }

  const handleClose = () => {
    resetForms()
    onClose()
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>デバイスを追加</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">既存デバイスから選択</TabsTrigger>
            <TabsTrigger value="new">新しいデバイスを作成</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
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
                <Select onValueChange={handleCategoryChange} value={selectedCategoryId}>
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
                
                <Select onValueChange={handleBrandChange} value={selectedBrandId}>
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
                          src={device.amazonImageUrl}
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
              <Form {...existingDeviceForm}>
                <form onSubmit={existingDeviceForm.handleSubmit(handleExistingDeviceSubmit)} className="space-y-4">

                  <FormField
                    control={existingDeviceForm.control}
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

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      キャンセル
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      登録
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <Form {...newDeviceForm}>
              <form onSubmit={newDeviceForm.handleSubmit(handleNewDeviceSubmit)} className="space-y-4">
                <div className="flex space-x-2">
                  <FormField
                    control={newDeviceForm.control}
                    name="amazonUrl"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Amazon URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://amazon.co.jp/dp/..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-8">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleFetchOgData(newDeviceForm.getValues('amazonUrl'))}
                      disabled={isLoadingOg}
                    >
                      {isLoadingOg ? <Loader2 className="h-4 w-4 animate-spin" /> : '情報取得'}
                    </Button>
                  </div>
                </div>

                {ogData && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {ogData.image && (
                          <DeviceImage
                            src={ogData.image}
                            alt={ogData.title || '商品画像'}
                            width={80}
                            height={80}
                            className="w-20 h-20"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{ogData.title}</h4>
                          {ogData.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {ogData.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newDeviceForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="カテゴリを選択..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newDeviceForm.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ブランド（任意）</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="ブランドを選択..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">指定しない</SelectItem>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>


                <FormField
                  control={newDeviceForm.control}
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

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !ogData}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    作成＆登録
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}