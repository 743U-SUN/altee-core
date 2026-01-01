'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Eye, EyeOff, ExternalLink } from "lucide-react"
import { UserItemWithDetails } from "@/types/item"
import { ProductImage } from "@/components/products/product-image"
import { EditUserItemModal } from "./EditUserItemModal"
import { DeleteUserItemButton } from "./DeleteUserItemButton"

interface UserItemCardProps {
  userItem: UserItemWithDetails
  userId: string
  onUpdate: (updatedUserItem: UserItemWithDetails) => void
  onDelete: (deletedId: string) => void
}

export function UserItemCard({ userItem, userId, onUpdate, onDelete }: UserItemCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleUpdate = (updatedUserItem: UserItemWithDetails) => {
    onUpdate(updatedUserItem)
    setIsEditModalOpen(false)
  }

  const handleDelete = () => {
    onDelete(userItem.id)
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {userItem.item.category.name}
              </Badge>
              {userItem.isPublic ? (
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
                  onClick={() => userItem.item.amazonUrl && window.open(userItem.item.amazonUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Amazon で見る
                </DropdownMenuItem>
                <DeleteUserItemButton
                  userItemId={userItem.id}
                  userId={userId}
                  itemName={userItem.item.name}
                  onDelete={handleDelete}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <ProductImage
              imageStorageKey={userItem.item.imageStorageKey}
              customImageUrl={userItem.item.customImageUrl}
              amazonImageUrl={userItem.item.amazonImageUrl}
              alt={userItem.item.name}
              width={80}
              height={80}
              className="w-20 h-20 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {userItem.item.name}
              </h3>
              <div className="flex flex-col space-y-1 mt-1">
                {userItem.item.brand && (
                  <div className="text-xs text-muted-foreground">
                    {userItem.item.brand.name}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  ASIN: {userItem.item.asin}
                </div>
              </div>
            </div>
          </div>

          {/* レビュー */}
          {userItem.review && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {userItem.review}
            </p>
          )}

          {/* 公開ステータス */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {userItem.isPublic ? '公開中' : '非公開'}
              </span>
              <div className="text-xs text-muted-foreground">
                {new Date(userItem.createdAt).toLocaleDateString('ja-JP')} 登録
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userItem={userItem}
        userId={userId}
        onUpdate={handleUpdate}
      />
    </>
  )
}
