'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import * as z from 'zod'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Search, Loader2 } from "lucide-react"
import { DeviceCategory } from '@prisma/client'

const searchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
})

interface DeviceFiltersProps {
  categories: DeviceCategory[]
  brands: { id: string, name: string }[]
  initialFilters: {
    category?: string
    brand?: string
    search?: string
  }
}

export function DeviceFilters({ categories, brands, initialFilters }: DeviceFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search: initialFilters.search || '',
      category: initialFilters.category || 'all',
      brand: initialFilters.brand || 'all',
    }
  })

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    startTransition(() => {
      const params = new URLSearchParams()
      if (values.search?.trim()) params.set('search', values.search.trim())
      if (values.category && values.category !== 'all') params.set('category', values.category)
      if (values.brand && values.brand !== 'all') params.set('brand', values.brand)
      
      const url = params.toString() ? `/devices?${params.toString()}` : '/devices'
      router.push(url)
    })
  }

  const handleReset = () => {
    form.reset({ search: '', category: 'all', brand: 'all' })
    startTransition(() => {
      router.push('/devices')
    })
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="デバイス名、ASIN で検索..."
                      {...field}
                      onKeyDown={(e) => e.key === 'Enter' && form.handleSubmit(onSubmit)()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isPending}
              size="sm"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリで絞り込み..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">すべてのカテゴリ</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ブランドで絞り込み..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">すべてのブランド</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <Button 
              type="button"
              variant="outline" 
              onClick={handleReset}
              disabled={isPending}
              className="w-full"
            >
              リセット
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}