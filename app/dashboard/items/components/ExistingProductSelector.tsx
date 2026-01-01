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
import { createUserItem, getItems, checkUserItemExists } from "@/app/actions/item-actions"
import { UserItemWithDetails } from "@/types/item"
import { Item, ItemCategory } from '@prisma/client'
import { ProductImage } from "@/components/products/product-image"

type SearchProductResult = Item & {
  category: ItemCategory
  brand: { id: string; name: string } | null
}

const userProductSchema = z.object({
  isPublic: z.boolean().default(true),
  review: z.string().optional(),
})

interface ExistingProductSelectorProps {
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  onProductAdded: (userItem: UserItemWithDetails) => void
}

const ExistingProductSelectorComponent = ({
  userId,
  categories,
  brands,
  onProductAdded
}: ExistingProductSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchProductResult[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SearchProductResult | null>(null)

  const form = useForm({
    resolver: zodResolver(userProductSchema),
    defaultValues: {
      isPublic: true,
    }
  })

  // アイテム検索・フィルタ
  const handleSearch = useCallback(async () => {
    setIsSearching(true)
    try {
      const result = await getItems({
        search: searchQuery.trim() || undefined,
        categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
        brandId: selectedBrandId === 'all' ? undefined : selectedBrandId,
      })

      if (result.success && result.data) {
        setSearchResults(result.data as SearchProductResult[])
      } else {
        setSearchResults([])
      }
    } catch {
      toast.error('検索に失敗しました')
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, selectedCategoryId, selectedBrandId])

  // カテゴリ・ブランド変更時に自動検索
  useEffect(() => {
    handleSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, selectedBrandId, searchQuery])

  // 既存アイテムからの登録
  const handleSubmit = async (data: z.infer<typeof userProductSchema>) => {
    if (!selectedProduct) return

    setIsSubmitting(true)
    try {
      // ユーザーアイテムの重複チェック
      const alreadyRegistered = await checkUserItemExists(userId, selectedProduct.id)
      if (alreadyRegistered) {
        toast.error('このアイテムは既に登録されています')
        return
      }

      const result = await createUserItem(userId, {
        itemId: selectedProduct.id,
        ...data,
      })

      if (result.success && result.data) {
        toast.success('アイテムを登録しました')
        onProductAdded(result.data as UserItemWithDetails)
        // Reset form
        form.reset()
        setSelectedProduct(null)
        setSearchQuery('')
        setSearchResults([])
      } else {
        toast.error(result.error || 'アイテムの登録に失敗しました')
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
            placeholder="アイテム名、ASIN で検索..."
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
          {searchResults.map((product) => (
            <Card
              key={product.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${selectedProduct?.id === product.id ? 'ring-2 ring-primary' : ''
                }`}
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <ProductImage
                    imageStorageKey={product.imageStorageKey}
                    customImageUrl={product.customImageUrl}
                    amazonImageUrl={product.amazonImageUrl}
                    alt={product.name}
                    width={50}
                    height={50}
                    className="w-12 h-12"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.category.name}
                      </Badge>
                      {product.brand && (
                        <Badge variant="secondary" className="text-xs">
                          {product.brand.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ASIN: {product.asin}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProduct && (
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

// Propsの比較関数
const arePropsEqual = (prevProps: ExistingProductSelectorProps, nextProps: ExistingProductSelectorProps) => {
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.categories.length === nextProps.categories.length &&
    prevProps.brands.length === nextProps.brands.length &&
    prevProps.onProductAdded === nextProps.onProductAdded
  )
}

export const ExistingProductSelector = memo(ExistingProductSelectorComponent, arePropsEqual)
