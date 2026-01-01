'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { ProductImage } from "@/components/products/product-image"
import { UserItemForPublicPage } from '@/types/item'

interface UserPublicItemCardProps {
  userItem: UserItemForPublicPage
}

export function UserPublicItemCard({ userItem }: UserPublicItemCardProps) {
  const { item } = userItem

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {item.category.name}
            </Badge>
            {item.brand && (
              <Badge variant="secondary" className="text-xs">
                {item.brand.name}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => item.amazonUrl && window.open(item.amazonUrl, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-start space-x-3">
          <ProductImage
            imageStorageKey={item.imageStorageKey}
            customImageUrl={item.customImageUrl}
            amazonImageUrl={item.amazonImageUrl}
            alt={item.name}
            width={80}
            height={80}
            className="w-20 h-20 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {item.name}
            </h3>
            <div className="text-xs text-muted-foreground mt-1">
              ASIN: {item.asin}
            </div>
          </div>
        </div>

        {/* ユーザーレビュー */}
        {userItem.review && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {userItem.review}
            </p>
          </div>
        )}

        {/* アイテム説明（レビューがない場合） */}
        {!userItem.review && item.description && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {item.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
