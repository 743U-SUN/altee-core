'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { UserProductWithDetails } from "@/types/product"

// モーダルコンポーネントの遅延読み込み
const AddProductModal = dynamic(() => import('./AddProductModal').then(mod => ({ default: mod.AddProductModal })), {
  loading: () => <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

// DnD機能の遅延読み込み
const DragDropProductList = dynamic(() => import('./DragDropProductList').then(mod => ({ default: mod.DragDropProductList })), {
  loading: () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="w-12 h-12 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-1">
              <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              <div className="w-20 h-3 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-8 h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
  ssr: false
})

interface UserProductListSectionProps {
  initialUserProducts: UserProductWithDetails[]
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
}

export function UserProductListSection({
  initialUserProducts,
  userId,
  categories,
  brands
}: UserProductListSectionProps) {
  // データ管理（シンプル化）
  const [userProducts, setUserProducts] = useState(initialUserProducts)

  const mutateUserProducts = (newProducts: UserProductWithDetails[]) => {
    setUserProducts(newProducts)
  }

  const handleProductsChange = (newProducts: UserProductWithDetails[]) => {
    mutateUserProducts(newProducts)
  }

  const handleProductAdded = (newProduct: UserProductWithDetails) => {
    const updatedProducts = [...userProducts, newProduct].sort((a, b) => a.sortOrder - b.sortOrder)
    mutateUserProducts(updatedProducts)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">商品設定</h2>
          <p className="text-sm text-muted-foreground">
            使用している商品を管理できます（最大30個）
          </p>
        </div>
        <AddProductModal
          userId={userId}
          categories={categories}
          brands={brands}
          onProductAdded={handleProductAdded}
        />
      </div>

      {userProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>まだ商品が登録されていません</p>
          <p className="text-sm">「商品を追加」から設定を始めましょう</p>
        </div>
      ) : (
        <DragDropProductList
          userProducts={userProducts}
          userId={userId}
          onProductsChange={handleProductsChange}
        />
      )}
    </div>
  )
}
