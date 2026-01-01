'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { GripVertical, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { UserItemWithDetails } from "@/types/item"
import { ProductImage } from "@/components/products/product-image"
import { Badge } from "@/components/ui/badge"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { deleteUserItem, reorderUserItems, updateUserItem } from "@/app/actions/item-actions"

// EditUserProductModalの遅延読み込み
const EditUserProductModal = dynamic(() => import('./EditUserProductModal').then(mod => ({ default: mod.EditUserProductModal })), {
  loading: () => <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

interface DragDropProductListProps {
  userProducts: UserItemWithDetails[]
  userId: string
  onProductsChange: (products: UserItemWithDetails[]) => void
}

export function DragDropProductList({ userProducts, userId, onProductsChange }: DragDropProductListProps) {
  const [activeItem, setActiveItem] = useState<UserItemWithDetails | null>(null)
  const [editingProduct, setEditingProduct] = useState<UserItemWithDetails | null>(null)

  // DnD センサー設定（モバイル対応）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const product = userProducts.find(p => p.id === event.active.id)
    setActiveItem(product || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) return

    const oldIndex = userProducts.findIndex((product) => product.id === active.id)
    const newIndex = userProducts.findIndex((product) => product.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newProducts = arrayMove(userProducts, oldIndex, newIndex)
    onProductsChange(newProducts)

    // サーバーで並び順を更新
    const result = await reorderUserItems(userId, newProducts.map(product => product.id))

    if (!result.success) {
      toast.error("並び替えに失敗しました")
      // エラー時は元の順序に戻す
      onProductsChange(userProducts)
    }
  }

  const handleVisibilityToggle = async (product: UserItemWithDetails) => {
    const result = await updateUserItem(userId, product.id, {
      isPublic: !product.isPublic
    })

    if (result.success) {
      const updatedProducts = userProducts.map(p =>
        p.id === product.id ? { ...p, isPublic: !p.isPublic } : p
      )
      onProductsChange(updatedProducts)
      toast.success(product.isPublic ? "アイテムを非公開にしました" : "アイテムを公開しました")
    } else {
      toast.error("表示設定の変更に失敗しました")
    }
  }

  const handleDeleteProduct = async (product: UserItemWithDetails) => {
    if (!confirm(`${product.item.name}を削除しますか？`)) return

    const result = await deleteUserItem(userId, product.id)

    if (result.success) {
      const updatedProducts = userProducts.filter(p => p.id !== product.id)
      onProductsChange(updatedProducts)
      toast.success("アイテムを削除しました")
    } else {
      toast.error("アイテムの削除に失敗しました")
    }
  }

  const handleUpdate = (updatedProduct: UserItemWithDetails) => {
    const updatedProducts = userProducts.map(p =>
      p.id === updatedProduct.id ? updatedProduct : p
    )
    onProductsChange(updatedProducts)
    setEditingProduct(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={userProducts.map(product => product.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {userProducts.map((product) => (
              <SortableProductItem
                key={product.id}
                product={product}
                onEdit={() => setEditingProduct(product)}
                onVisibilityToggle={() => handleVisibilityToggle(product)}
                onDelete={() => handleDeleteProduct(product)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem && (
            <ProductItemCard
              product={activeItem}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {editingProduct && (
        <EditUserProductModal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          userProduct={editingProduct}
          userId={userId}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}

// ソート可能なアイテム
function SortableProductItem({
  product,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  product: UserItemWithDetails
  onEdit: () => void
  onVisibilityToggle: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ProductItemCard
        product={product}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={onEdit}
        onVisibilityToggle={onVisibilityToggle}
        onDelete={onDelete}
      />
    </div>
  )
}

// アイテムカード
function ProductItemCard({
  product,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  product: UserItemWithDetails
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  onEdit?: () => void
  onVisibilityToggle?: () => void
  onDelete?: () => void
}) {
  return (
    <div className={`border rounded-lg p-4 bg-card ${isDragging ? 'shadow-lg opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-shrink-0">
          <ProductImage
            imageStorageKey={product.item.imageStorageKey}
            customImageUrl={product.item.customImageUrl}
            amazonImageUrl={product.item.amazonImageUrl}
            alt={product.item.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium text-sm line-clamp-1 max-w-xs">{product.item.name}</div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {product.item.category.name}
            </Badge>
            {product.item.brand && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {product.item.brand.name}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">
            {product.review || "レビューなし"}
          </div>
        </div>

        {!isDragging && onEdit && onVisibilityToggle && onDelete && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onVisibilityToggle}
            >
              {product.isPublic ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => product.item.amazonUrl && window.open(product.item.amazonUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
