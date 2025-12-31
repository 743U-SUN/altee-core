'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ProductCategory } from '@prisma/client'
import {
  productCategorySchema,
  type ProductCategoryInput,
  PRODUCT_TYPES,
} from '@/lib/validation/product'
import { createCategoryAction, updateCategoryAction } from '../actions'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface CategoryFormProps {
  category?: ProductCategory
  categories: ProductCategory[]
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProductCategoryInput>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      parentId: category?.parentId || null,
      productType: category?.productType || 'GENERAL',
      requiresCompatibilityCheck:
        category?.requiresCompatibilityCheck || false,
      icon: category?.icon || '',
      description: category?.description || '',
      sortOrder: category?.sortOrder || 0,
    },
  })

  const onSubmit = (data: ProductCategoryInput) => {
    startTransition(async () => {
      const result = category
        ? await updateCategoryAction(category.id, data)
        : await createCategoryAction(data)

      if (result.success) {
        toast.success(
          category
            ? 'カテゴリを更新しました'
            : 'カテゴリを作成しました'
        )
        router.push('/admin/categories')
        router.refresh()
      } else {
        toast.error(result.error || '操作に失敗しました')
      }
    })
  }

  // 親カテゴリの候補（編集時は自分自身と子孫を除外）
  const availableParents = categories.filter((c) => {
    if (!category) return true
    return c.id !== category.id
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリ名</FormLabel>
                <FormControl>
                  <Input placeholder="CPU" {...field} />
                </FormControl>
                <FormDescription>
                  表示されるカテゴリ名（1-100文字）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>スラッグ</FormLabel>
                <FormControl>
                  <Input placeholder="cpu" {...field} />
                </FormControl>
                <FormDescription>
                  URL用の識別子（小文字英数字、ハイフン、アンダースコアのみ）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>商品タイプ</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="商品タイプを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>このカテゴリの商品タイプ</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>親カテゴリ</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="親カテゴリなし（ルート）" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">
                      親カテゴリなし（ルート）
                    </SelectItem>
                    {availableParents.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>階層構造の親カテゴリ</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>アイコン</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cpu"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Lucideアイコン名（オプション）
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>並び順</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormDescription>
                  小さい数字ほど先頭に表示されます
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
                  placeholder="カテゴリの説明文"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                カテゴリの詳細説明（オプション）
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiresCompatibilityCheck"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>互換性チェックが必要</FormLabel>
                <FormDescription>
                  PCパーツなど、互換性チェックが必要な商品の場合にチェック
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending
              ? '保存中...'
              : category
                ? '更新する'
                : '作成する'}
          </Button>
          <Button
            type="button"
            variant="outline"
            asChild
            disabled={isPending}
          >
            <Link href="/admin/categories">キャンセル</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}
