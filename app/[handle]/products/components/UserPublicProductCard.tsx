'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { ProductImage } from "@/components/products/product-image"
import { UserProductForPublicPage } from '@/types/product'

interface UserPublicProductCardProps {
  userProduct: UserProductForPublicPage
}

export function UserPublicProductCard({ userProduct }: UserPublicProductCardProps) {
  const { product } = userProduct

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {product.category.name}
            </Badge>
            {product.brand && (
              <Badge variant="secondary" className="text-xs">
                {product.brand.name}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => product.amazonUrl && window.open(product.amazonUrl, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-start space-x-3">
          <ProductImage
            imageStorageKey={product.imageStorageKey}
            customImageUrl={product.customImageUrl}
            amazonImageUrl={product.amazonImageUrl}
            alt={product.name}
            width={80}
            height={80}
            className="w-20 h-20 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {product.name}
            </h3>
            <div className="text-xs text-muted-foreground mt-1">
              ASIN: {product.asin}
            </div>
          </div>
        </div>

        {/* ユーザーレビュー */}
        {userProduct.review && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {userProduct.review}
            </p>
          </div>
        )}

        {/* 商品説明（レビューがない場合） */}
        {!userProduct.review && product.description && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {product.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
