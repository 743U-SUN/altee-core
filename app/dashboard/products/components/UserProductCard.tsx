'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Eye, EyeOff, ExternalLink } from "lucide-react"
import { UserProductWithDetails } from "@/types/product"
import { ProductImage } from "@/components/products/product-image"
import { EditUserProductModal } from "./EditUserProductModal"
import { DeleteUserProductButton } from "./DeleteUserProductButton"

interface UserProductCardProps {
  userProduct: UserProductWithDetails
  userId: string
  onUpdate: (updatedUserProduct: UserProductWithDetails) => void
  onDelete: (deletedId: string) => void
}

export function UserProductCard({ userProduct, userId, onUpdate, onDelete }: UserProductCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleUpdate = (updatedUserProduct: UserProductWithDetails) => {
    onUpdate(updatedUserProduct)
    setIsEditModalOpen(false)
  }

  const handleDelete = () => {
    onDelete(userProduct.id)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {userProduct.product.category.name}
              </Badge>
              {userProduct.isPublic ? (
                <Eye className="h-3 w-3 text-green-600" />
              ) : (
                <EyeOff className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => userProduct.product.amazonUrl && window.open(userProduct.product.amazonUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Amazon で見る
                </DropdownMenuItem>
                <DeleteUserProductButton
                  userProductId={userProduct.id}
                  userId={userId}
                  productName={userProduct.product.name}
                  onDelete={handleDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <ProductImage
              imageStorageKey={userProduct.product.imageStorageKey}
              customImageUrl={userProduct.product.customImageUrl}
              amazonImageUrl={userProduct.product.amazonImageUrl}
              alt={userProduct.product.name}
              width={80}
              height={80}
              className="w-20 h-20 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {userProduct.product.name}
              </h3>
              <div className="flex flex-col space-y-1 mt-1">
                {userProduct.product.brand && (
                  <div className="text-xs text-muted-foreground">
                    {userProduct.product.brand.name}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  ASIN: {userProduct.product.asin}
                </div>
              </div>
            </div>
          </div>

          {/* レビュー */}
          {userProduct.review && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {userProduct.review}
            </p>
          )}

          {/* 公開ステータス */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {userProduct.isPublic ? '公開中' : '非公開'}
              </span>
              <div className="text-xs text-muted-foreground">
                {new Date(userProduct.createdAt).toLocaleDateString('ja-JP')} 登録
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userProduct={userProduct}
        userId={userId}
        onUpdate={handleUpdate}
      />
    </>
  )
}
