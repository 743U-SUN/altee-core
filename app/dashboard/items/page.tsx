import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserItems } from "@/app/actions/content/item-actions"
import { getUserPcBuild } from "@/app/actions/content/pc-build-actions"
import type { UserItemWithDetails } from "@/types/item"
import { UserItemListSection } from "./components/UserItemListSection"
import { PcBuildManagementSection } from "./components/PcBuildManagementSection"
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'アイテム管理',
  robots: { index: false, follow: false },
}

export default async function UserItemsPage() {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 並行データ取得
  const [userItems, pcBuildResult, categories, brands] = await Promise.all([
    getUserItems(),
    getUserPcBuild(),
    prisma.itemCategory.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const pcBuild = pcBuildResult.success ? (pcBuildResult.data ?? null) : null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">マイアイテム</h1>
        <p className="text-muted-foreground">
          アイテムとPCスペック情報を管理します
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <Tabs defaultValue="items">
          <TabsList className="mb-6">
            <TabsTrigger value="items">アイテム</TabsTrigger>
            <TabsTrigger value="pc-specs">PC Specs</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>登録アイテム</CardTitle>
                <CardDescription>
                  ドラッグ&ドロップで並び替えができます。設定したアイテムは公開プロフィールに表示されます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserItemListSection
                  initialUserProducts={userItems as UserItemWithDetails[]}
                  userId={session.user.id}
                  categories={categories}
                  brands={brands}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pc-specs">
            <Card>
              <CardHeader>
                <CardTitle>PCスペック管理</CardTitle>
                <CardDescription>
                  使用しているPCのスペック情報を登録します。公開すると訪問者がPCの構成を確認できます。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PcBuildManagementSection
                  initialPcBuild={pcBuild}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
