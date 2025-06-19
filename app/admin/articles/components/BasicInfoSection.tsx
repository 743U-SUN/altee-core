'use client'

import { Control } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { FormValues } from './types'

interface BasicInfoSectionProps {
  control: Control<FormValues>
  onTitleChange: (title: string) => void
  onSlugChange: () => void
}

export function BasicInfoSection({ control, onTitleChange, onSlugChange }: BasicInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本情報</CardTitle>
        <CardDescription>記事の基本的な情報を入力してください。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input 
                  placeholder="記事のタイトルを入力"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    onTitleChange(e.target.value)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>スラッグ</FormLabel>
              <FormControl>
                <Input 
                  placeholder="article-slug"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    onSlugChange()
                  }}
                />
              </FormControl>
              <FormDescription>
                URLに使用されます。英数字とハイフンのみ使用可能です。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>要約（任意）</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="記事の簡単な要約を入力"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                記事一覧やSEOで使用されます。500文字以内で入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}