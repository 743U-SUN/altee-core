'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Folder, Tag, Plus, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AttributeDashboardProps {
  categoryCount: number
  tagCount: number
}

export function AttributeDashboard({ categoryCount, tagCount }: AttributeDashboardProps) {
  // 統計データ
  const ATTRIBUTE_STATS = [
    {
      key: 'categories',
      label: 'カテゴリ',
      icon: Folder,
      href: '/admin/attributes/categories',
      count: categoryCount,
      description: '記事の主要分類',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      isAvailable: true,
    },
    {
      key: 'tags',
      label: 'タグ',
      icon: Tag,
      href: '/admin/attributes/tags',
      count: tagCount,
      description: '横断的な属性',
      color: 'bg-green-50 text-green-700 border-green-200',
      isAvailable: true,
    },
  {
    key: 'series',
    label: 'シリーズ',
    icon: BarChart3,
    href: '/admin/attributes/series',
    count: 0,
    description: '連載記事のグループ',
    color: 'bg-gray-50 text-gray-500 border-gray-200',
    isAvailable: false,
  },
  {
    key: 'settings',
    label: '属性設定',
    icon: Settings,
    href: '/admin/attributes/settings',
    count: null,
    description: '分類体系の設定',
    color: 'bg-gray-50 text-gray-500 border-gray-200',
    isAvailable: false,
  },
]

  return (
    <div className="space-y-6">
      {/* 概要 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {ATTRIBUTE_STATS.map((stat) => {
          const Icon = stat.icon
          
          return (
            <Card key={stat.key} className={cn(
              "relative",
              stat.isAvailable ? "hover:shadow-md transition-shadow" : "opacity-60"
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    {stat.count !== null ? (
                      <div className="text-2xl font-bold">{stat.count}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">設定</div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                  {!stat.isAvailable && (
                    <Badge variant="outline" className="text-xs">
                      予定
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* アクションカード */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* カテゴリ管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-blue-600" />
              <CardTitle>カテゴリ管理</CardTitle>
            </div>
            <CardDescription>
              記事の主要分類を作成・編集します。階層構造での整理が可能です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">カテゴリ数</span>
                <Badge variant="secondary">{categoryCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">使用中</span>
                <Badge variant="outline">-</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/attributes/categories" className="flex-1">
                <Button className="w-full">
                  <Folder className="mr-2 h-4 w-4" />
                  カテゴリを管理
                </Button>
              </Link>
              <Link href="/admin/attributes/categories/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* タグ管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-600" />
              <CardTitle>タグ管理</CardTitle>
            </div>
            <CardDescription>
              横断的な属性でコンテンツを分類します。柔軟な分類が可能です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">タグ数</span>
                <Badge variant="secondary">{tagCount}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">使用中</span>
                <Badge variant="outline">-</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/attributes/tags" className="flex-1">
                <Button className="w-full">
                  <Tag className="mr-2 h-4 w-4" />
                  タグを管理
                </Button>
              </Link>
              <Link href="/admin/attributes/tags/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 将来の機能プレビュー */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">将来の拡張予定</CardTitle>
          <CardDescription>
            以下の機能を順次追加予定です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">シリーズ管理</div>
                <div className="text-sm text-muted-foreground">連載記事のグループ化</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Settings className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">難易度管理</div>
                <div className="text-sm text-muted-foreground">記事の難易度レベル</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Badge className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="font-medium">実績バッジ</div>
                <div className="text-sm text-muted-foreground">記事の実績表示</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}