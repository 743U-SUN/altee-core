import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link2, Settings, BarChart3 } from 'lucide-react'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { LinkTypeTable } from './components/LinkTypeTable'

interface AdminLinksPageProps {
  searchParams: Promise<{
    tab?: string
  }>
}

export default async function AdminLinksPage({ searchParams }: AdminLinksPageProps) {
  const session = await auth()

  // 3層認証アーキテクチャ：Page層での最終権限チェック
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const resolvedSearchParams = await searchParams
  const activeTab = resolvedSearchParams.tab || 'types'

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">リンク管理</h1>
        <p className="text-muted-foreground">
          SNSリンクタイプとアイコンの管理、使用統計の確認ができます
        </p>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="types">リンクタイプ管理</TabsTrigger>
            <TabsTrigger value="statistics">使用統計</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="types" className="space-y-6">
          <Suspense fallback={<div>リンクタイプを読み込み中...</div>}>
            <LinkTypeTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <Suspense fallback={<div>統計情報を読み込み中...</div>}>
            <LinkStatistics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function LinkStatistics() {
  // リンクタイプ統計
  const linkTypes = await prisma.linkType.findMany({
    include: {
      _count: {
        select: {
          userLinks: true
        }
      }
    },
    orderBy: {
      sortOrder: 'asc'
    }
  })

  // 総使用統計
  const totalUserLinks = await prisma.userLink.count()
  const totalUsers = await prisma.user.count()
  const usersWithLinks = await prisma.user.count({
    where: {
      userLinks: {
        some: {}
      }
    }
  })

  // アクティブ率計算
  const linkUsageRate = totalUsers > 0 ? ((usersWithLinks / totalUsers) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* 基本統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総リンク数</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUserLinks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              全ユーザーの設定リンク数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">リンクタイプ数</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{linkTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              利用可能: {linkTypes.filter(t => t.isActive).length} / 
              無効: {linkTypes.filter(t => !t.isActive).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">利用ユーザー数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithLinks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              全ユーザーの {linkUsageRate}% が利用中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均リンク数</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersWithLinks > 0 ? (totalUserLinks / usersWithLinks).toFixed(1) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              1ユーザーあたり
            </p>
          </CardContent>
        </Card>
      </div>

      {/* リンクタイプ別使用統計 */}
      <Card>
        <CardHeader>
          <CardTitle>リンクタイプ別使用統計</CardTitle>
          <CardDescription>各サービスの利用状況と人気度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {linkTypes.map((linkType) => {
              const usageCount = linkType._count.userLinks
              const usagePercentage = totalUserLinks > 0 ? ((usageCount / totalUserLinks) * 100).toFixed(1) : "0"
              
              return (
                <div key={linkType.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{linkType.displayName}</span>
                      {linkType.isCustom && (
                        <Badge variant="secondary">カスタム</Badge>
                      )}
                      {!linkType.isActive && (
                        <Badge variant="destructive">無効</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{usageCount} 回使用</div>
                      <div className="text-xs text-muted-foreground">{usagePercentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(parseFloat(usagePercentage) * 2, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            
            {linkTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>リンクタイプがまだ作成されていません</p>
                <p className="text-sm">「リンクタイプを追加」から設定を始めましょう</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}