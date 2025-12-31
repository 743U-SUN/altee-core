import { ProductCategory, Product, UserProduct, User } from '@prisma/client'

// 商品詳細情報の型
export type ProductWithDetails = Product & {
  category: ProductCategory
  brand?: { id: string; name: string } | null
  userProducts: (UserProduct & {
    user: Pick<User, 'name' | 'handle'>
  })[]
}

// ユーザー商品詳細情報の型
export type UserProductWithDetails = UserProduct & {
  product: ProductWithDetails
}

// ユーザー公開ページ用の商品詳細型（他ユーザー情報を含まない）
export type ProductForUserPage = Product & {
  category: ProductCategory
  brand?: { id: string; name: string } | null
}

// ユーザー公開ページ用のユーザー商品型
export type UserProductForPublicPage = UserProduct & {
  product: ProductForUserPage
}
