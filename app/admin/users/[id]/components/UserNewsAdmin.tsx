'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Newspaper, Eye, EyeOff } from 'lucide-react'
import { adminToggleNewsHidden } from '@/app/actions/admin/user-news-admin-actions'

interface NewsItem {
  id: string
  title: string
  slug: string
  published: boolean
  adminHidden: boolean
  createdAt: string | Date
}

interface UserNewsAdminProps {
  news: NewsItem[]
}

export function UserNewsAdmin({ news: initialNews }: UserNewsAdminProps) {
  const [news, setNews] = useState(initialNews)

  const handleToggleHidden = async (newsId: string) => {
    try {
      const result = await adminToggleNewsHidden(newsId)
      if (result.success) {
        setNews((prev) =>
          prev.map((item) =>
            item.id === newsId
              ? { ...item, adminHidden: !item.adminHidden }
              : item
          )
        )
        toast.success('非表示設定を変更しました')
      }
    } catch {
      toast.error('操作に失敗しました')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          ニュース記事
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            ニュース記事はありません
          </p>
        ) : (
          <div className="space-y-3">
            {news.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={item.published ? 'default' : 'secondary'}
                    >
                      {item.published ? '公開' : '下書き'}
                    </Badge>
                    {item.adminHidden && (
                      <Badge variant="destructive">強制非表示</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant={item.adminHidden ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleHidden(item.id)}
                >
                  {item.adminHidden ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      非表示中
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      表示中
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
