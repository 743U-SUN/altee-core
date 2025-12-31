'use client'

import { UserProductForPublicPage } from '@/types/product'
import { UserPublicProductCard } from './UserPublicProductCard'

interface UserPublicProductListProps {
  userProducts: UserProductForPublicPage[]
  userName: string
}

export function UserPublicProductList({ userProducts, userName }: UserPublicProductListProps) {
  if (userProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            公開商品がありません
          </h3>
          <p className="text-sm text-muted-foreground">
            {userName}さんはまだ商品情報を公開していません
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {userName}さんの商品
        </h2>
        <p className="text-muted-foreground">
          公開されている商品情報とレビューを確認できます
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userProducts.map((userProduct) => (
          <UserPublicProductCard
            key={userProduct.id}
            userProduct={userProduct}
          />
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {userProducts.length}個の商品が公開されています
        </p>
      </div>
    </div>
  )
}
