import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserItems } from "@/app/actions/item-actions"
import { UserItemWithDetails } from "@/types/item"
import { UserItemListSection } from "./components/UserItemListSection"
import { prisma } from '@/lib/prisma'

export default async function UserItemsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // ユーザーのアイテム一覧を取得
  const userItems = await getUserItems(session.user.id)

  // カテゴリとブランドを取得
  const categories = await prisma.itemCategory.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">マイアイテム</h1>
        <p className="text-muted-foreground">
          あなたが使用しているアイテムを管理します
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* アイテム一覧 */}
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
        </div>
      </div>
    </div>
  )
}
