import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getMediaFiles, getMediaStats } from '@/app/actions/media-actions'
import { MediaTable } from './components/MediaTable'
import { MediaFilters } from './components/MediaFilters'
import { HardDrive, Image, FileText, Calendar } from 'lucide-react'
import { Suspense } from 'react'
import { MediaType } from '@prisma/client'

interface MediaPageProps {
  searchParams: Promise<{
    search?: string
    container?: string
    type?: MediaType
    month?: string
    page?: string
    tab?: string
  }>
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const session = await auth()

  // 3層認証アーキテクチャ：Page層での最終権限チェック
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const resolvedSearchParams = await searchParams
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10)
  const activeTab = resolvedSearchParams.tab || 'overview'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">メディア管理</h1>
        <p className="text-muted-foreground">
          アップロードされた画像ファイルの管理と統計情報を確認できます
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="files">ファイル一覧</TabsTrigger>
          <TabsTrigger value="statistics">統計情報</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<div>統計情報を読み込み中...</div>}>
            <MediaOverview />
          </Suspense>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <Suspense fallback={<MediaFiltersSkeleton />}>
            <MediaFiltersWrapper />
          </Suspense>
          
          <Suspense fallback={<div>ファイル一覧を読み込み中...</div>}>
            <MediaTable
              currentPage={currentPage}
              search={resolvedSearchParams.search}
              containerName={resolvedSearchParams.container}
              uploadType={resolvedSearchParams.type}
              month={resolvedSearchParams.month}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <Suspense fallback={<div>詳細統計を読み込み中...</div>}>
            <MediaStatistics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function MediaFiltersWrapper() {
  const { pagination } = await getMediaFiles({ limit: 1 }) // 総数取得のみ
  return <MediaFilters totalCount={pagination.total} />
}

function MediaFiltersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function MediaOverview() {
  const stats = await getMediaStats()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総ファイル数</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            サムネイル: {stats.thumbnailFiles} / コンテンツ: {stats.contentFiles}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">総容量</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          <p className="text-xs text-muted-foreground">
            全ファイルの合計サイズ
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">コンテナ数</CardTitle>
          <Image className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.containerStats.length}</div>
          <p className="text-xs text-muted-foreground">
            アクティブなコンテナ
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月のアップロード</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.monthlyStats[0]?.count || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.monthlyStats[0]?.month || '今月'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function MediaStatistics() {
  const stats = await getMediaStats()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>コンテナ別統計</CardTitle>
          <CardDescription>各コンテナのファイル数と容量</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.containerStats.map((container) => (
              <div key={container.containerName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{container.containerName}</span>
                  {container.warningThreshold && (
                    <Badge variant="destructive">容量警告</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {container.fileCount.toLocaleString()} ファイル • {formatFileSize(container.totalSize)}
                </div>
                <div className="text-xs text-muted-foreground">
                  制限: {container.fileCount > 500000 ? '50万ファイル超過' : `${(500000 - container.fileCount).toLocaleString()}ファイル残り`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>月別アップロード数</CardTitle>
          <CardDescription>過去12ヶ月のアップロード傾向</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.monthlyStats.slice(0, 6).map((month) => (
              <div key={month.month} className="flex justify-between">
                <span className="text-sm">{month.month}</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{month.count} ファイル</div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(month.totalSize)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}