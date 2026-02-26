'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Item, ItemCategory, Brand } from '@prisma/client'
import {
  itemSchema,
  type ItemInput,
} from '@/lib/validations/item'
import { createItemAction, updateItemAction } from '../actions'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface ItemFormProps {
  item?: Item
  categories: ItemCategory[]
  brands: Brand[]
}

export function ItemForm({ item, categories, brands }: ItemFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      categoryId: item?.categoryId || '',
      brandId: item?.brandId || '',
      amazonUrl: item?.amazonUrl || '',
      amazonImageUrl: item?.amazonImageUrl || '',
      customImageUrl: item?.customImageUrl || '',
      imageStorageKey: item?.imageStorageKey || '',
      ogTitle: item?.ogTitle || '',
      ogDescription: item?.ogDescription || '',
      asin: item?.asin || '',
    },
  })

  const onSubmit = (data: ItemInput) => {
    startTransition(async () => {
      const result = item
        ? await updateItemAction(item.id, data)
        : await createItemAction(data)

      if (result.success) {
        toast.success(
          item
            ? 'アイテムを更新しました'
            : 'アイテムを作成しました'
        )
        router.push('/admin/items')
        router.refresh()
      } else {
        toast.error(result.error || '操作に失敗しました')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/items">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
        </div>

        {/* 基本情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">基本情報</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>アイテム名</FormLabel>
                  <FormControl>
                    <Input placeholder="Intel Core i9-14900K" {...field} />
                  </FormControl>
                  <FormDescription>
                    アイテムの名称（1-200文字）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カテゴリ</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>アイテムのカテゴリ（必須）</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ブランド</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ブランドなし（オプション）" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">ブランドなし</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>アイテムのブランド（オプション）</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ASIN</FormLabel>
                  <FormControl>
                    <Input placeholder="B0CHBJXXXXX" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>
                    Amazonアイテム識別番号（10桁、オプション）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>説明</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="アイテムの詳細説明"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  アイテムの詳細説明（オプション）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 画像情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">画像情報</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="amazonUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amazon URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://www.amazon.co.jp/dp/..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    AmazonアイテムページのURL（オプション）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カスタム画像URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    手動で指定する画像URL（オプション）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amazonImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amazon画像URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="自動取得される画像URL"
                      {...field}
                      value={field.value || ''}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    Amazonから自動取得される画像URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageStorageKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>画像ストレージキー</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="R2ストレージのキー"
                      {...field}
                      value={field.value || ''}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    R2ストレージに保存された画像のキー
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* OG情報 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">OG情報（自動取得）</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="ogTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OGタイトル</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="自動取得されるタイトル"
                      {...field}
                      value={field.value || ''}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    OG情報から自動取得されたタイトル
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ogDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OG説明</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="自動取得される説明"
                      {...field}
                      value={field.value || ''}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    OG情報から自動取得された説明
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending
              ? '保存中...'
              : item
                ? '更新する'
                : '作成する'}
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
            disabled={isPending}
          >
            <Link href="/admin/items">キャンセル</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}
