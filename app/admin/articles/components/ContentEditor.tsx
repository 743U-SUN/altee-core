'use client'

import { Suspense, useRef } from 'react'
import { Control, useFormContext } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MarkdownPreview } from '@/components/ui/markdown-preview'
import { MarkdownToolbar } from '@/components/ui/markdown-toolbar'
import { Edit, Eye } from 'lucide-react'
import type { FormValues } from './types'

interface ContentEditorProps {
  control: Control<FormValues>
  isSubmitting: boolean
}

export function ContentEditor({ control, isSubmitting }: ContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const form = useFormContext<FormValues>()

  const handleMarkdownInsert = (text: string, type: 'wrap' | 'insert' = 'insert') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = form.getValues('content')
    const selectedText = currentValue.slice(start, end)

    let newText = ''
    let newCursorPosition = start

    if (type === 'wrap' && selectedText) {
      // 選択テキストを囲む
      newText = text + selectedText + text
      newCursorPosition = start + text.length + selectedText.length + text.length
    } else if (type === 'wrap') {
      // 選択なしの場合、カーソル位置にwrap用テキストを挿入
      newText = text + text
      newCursorPosition = start + text.length
    } else {
      // 通常の挿入
      newText = text
      newCursorPosition = start + text.length
    }

    const newValue = 
      currentValue.slice(0, start) + 
      newText + 
      currentValue.slice(end)
      
    form.setValue('content', newValue, { shouldValidate: true })
    
    // カーソル位置を設定
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>本文</CardTitle>
        <CardDescription>Markdown形式で記事の内容を記述してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <Tabs defaultValue="edit" className="w-full">
                <div className="sticky top-[69px] z-5 bg-card border-b border-border pt-2 pb-2 mb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      編集
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      プレビュー
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="edit" className="mt-0">
                  <div className="sticky top-[120px] z-4 bg-card">
                    <MarkdownToolbar 
                      onInsert={handleMarkdownInsert}
                      disabled={isSubmitting}
                    />
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="# 記事タイトル

記事の内容をMarkdown形式で記述してください。

## 見出し2

段落テキスト。**太字**や*斜体*、[リンク](https://example.com)なども使用できます。

- リスト項目1
- リスト項目2
- [x] チェックボックス
- [ ] 未完了タスク

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| データ1 | データ2 | データ3 |

:smile: 絵文字も使用できます :thumbsup:

```javascript
// コードブロック
console.log('Hello, World!');
```"
                      className="min-h-[400px] font-mono border-t-0 rounded-t-none"
                      {...field}
                      ref={(e) => {
                        field.ref(e)
                        textareaRef.current = e
                      }}
                    />
                  </FormControl>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[400px] border rounded-md p-4 bg-muted/30">
                    {field.value ? (
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-12">
                          <div className="text-muted-foreground">プレビューを読み込み中...</div>
                        </div>
                      }>
                        <MarkdownPreview content={field.value} />
                      </Suspense>
                    ) : (
                      <div className="text-muted-foreground text-center py-12">
                        プレビューする内容がありません。<br />
                        編集タブで記事の内容を入力してください。
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}