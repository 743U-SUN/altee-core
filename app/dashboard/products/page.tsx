import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserProducts } from "@/app/actions/product-actions"
import { UserProductWithDetails } from "@/types/product"
import { UserProductListSection } from "./components/UserProductListSection"
import { prisma } from '@/lib/prisma'

export default async function UserProductsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // ユーザーの商品一覧を取得
  const userProducts = await getUserProducts(session.user.id)

  // カテゴリとブランドを取得
  const categories = await prisma.productCategory.findMany({
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
        <h1 className="text-3xl font-bold tracking-tight">マイ商品</h1>
        <p className="text-muted-foreground">
          あなたが使用している商品を管理します
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* 商品一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>登録商品</CardTitle>
              <CardDescription>
                ドラッグ&ドロップで並び替えができます。設定した商品は公開プロフィールに表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserProductListSection
                initialUserProducts={userProducts as UserProductWithDetails[]}
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
