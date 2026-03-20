# Phase 5 実装ログ: ダッシュボードUI更新 (Product→Item)

**実施日**: 2026-01-01
**担当**: Claude Sonnet 4.5
**フェーズ**: Phase 5 - ダッシュボードUI更新
**ステータス**: ✅ 完了

---

## 概要

Phase 5では、ダッシュボードUI（`app/dashboard/products/`）の全ファイルをProduct→Item移行しました。
ディレクトリリネームと8ファイルの更新を実施し、TypeScriptエラー0で完了しています。

---

## 実施内容サマリー

| 項目 | 詳細 |
|------|------|
| **対象ディレクトリ** | `app/dashboard/products/` → `app/dashboard/items/` |
| **更新ファイル数** | 8ファイル |
| **TypeScriptエラー** | 0 (Phase 5範囲) |
| **Gitコミット** | `8a317af` |
| **所要時間** | 約60分 |

---

## ディレクトリリネーム

```bash
app/dashboard/products/ → app/dashboard/items/
```

**リネームコマンド**:
```bash
mv app/dashboard/products app/dashboard/items
```

---

## ファイル別変更詳細

### 1. page.tsx

**パス**: `app/dashboard/items/page.tsx`

#### 変更内容

**インポート更新**:
```typescript
// Before
import { getUserProducts } from "@/app/actions/product-actions"
import { UserProductWithDetails } from "@/types/product"

// After
import { getUserItems } from "@/app/actions/item-actions"
import { UserItemWithDetails } from "@/types/item"
```

**関数名変更**:
```typescript
// Before
export default async function UserProductsPage() {

// After
export default async function UserItemsPage() {
```

**データ取得**:
```typescript
// Before
const userProducts = await getUserProducts(session.user.id)
const categories = await prisma.productCategory.findMany({
  select: { id: true, name: true },
  orderBy: { name: 'asc' },
})

// After
const userItems = await getUserItems(session.user.id)
const categories = await prisma.itemCategory.findMany({
  select: { id: true, name: true },
  orderBy: { name: 'asc' },
})
```

**UI文言更新**:
```typescript
// Before
<h1 className="text-3xl font-bold tracking-tight">マイ商品</h1>
<p className="text-muted-foreground">
  あなたが使用している商品を管理します
</p>
<CardTitle>登録商品</CardTitle>
<CardDescription>
  ドラッグ&ドロップで並び替えができます。設定した商品は公開プロフィールに表示されます。
</CardDescription>

// After
<h1 className="text-3xl font-bold tracking-tight">マイアイテム</h1>
<p className="text-muted-foreground">
  あなたが使用しているアイテムを管理します
</p>
<CardTitle>登録アイテム</CardTitle>
<CardDescription>
  ドラッグ&ドロップで並び替えができます。設定したアイテムは公開プロフィールに表示されます。
</CardDescription>
```

**Props渡し**:
```typescript
// Before
<UserProductListSection
  initialUserProducts={userProducts as UserProductWithDetails[]}
  userId={session.user.id}
  categories={categories}
  brands={brands}
/>

// After
<UserProductListSection
  initialUserProducts={userItems as UserItemWithDetails[]}
  userId={session.user.id}
  categories={categories}
  brands={brands}
/>
```

---

### 2. AddProductModal.tsx

**パス**: `app/dashboard/items/components/AddProductModal.tsx`

#### 変更内容

**型定義更新**:
```typescript
// Before
import { UserProductWithDetails } from "@/types/product"

interface AddProductModalProps {
  isOpen?: boolean
  onClose?: () => void
  onProductAdded: (userProduct: UserProductWithDetails) => void
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
}

// After
import { UserItemWithDetails } from "@/types/item"

interface AddProductModalProps {
  isOpen?: boolean
  onClose?: () => void
  onProductAdded: (userItem: UserItemWithDetails) => void
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
}
```

**ハンドラー更新**:
```typescript
// Before
const handleProductAdded = useCallback((userProduct: UserProductWithDetails) => {
  onProductAdded(userProduct)
  // ...
}, [onProductAdded, controlledOnClose])

// After
const handleProductAdded = useCallback((userItem: UserItemWithDetails) => {
  onProductAdded(userItem)
  // ...
}, [onProductAdded, controlledOnClose])
```

**UI文言**:
```typescript
// Before
<Button size="sm">
  <Plus className="h-4 w-4 mr-2" />
  商品を追加
</Button>
<DialogTitle>商品を追加</DialogTitle>
<DialogDescription>
  既存の商品から選択してください。
</DialogDescription>

// After
<Button size="sm">
  <Plus className="h-4 w-4 mr-2" />
  アイテムを追加
</Button>
<DialogTitle>アイテムを追加</DialogTitle>
<DialogDescription>
  既存のアイテムから選択してください。
</DialogDescription>
```

---

### 3. DeleteUserProductButton.tsx

**パス**: `app/dashboard/items/components/DeleteUserProductButton.tsx`

#### 変更内容

**アクションインポート**:
```typescript
// Before
import { deleteUserProduct } from "@/app/actions/product-actions"

// After
import { deleteUserItem } from "@/app/actions/item-actions"
```

**削除ハンドラー**:
```typescript
// Before
const handleDelete = async () => {
  setIsDeleting(true)
  try {
    const result = await deleteUserProduct(userId, userProductId)

    if (result.success) {
      toast.success('商品を削除しました')
      onDelete()
      setIsOpen(false)
    } else {
      toast.error(result.error || '商品の削除に失敗しました')
    }
  } catch {
    toast.error('削除に失敗しました')
  } finally {
    setIsDeleting(false)
  }
}

// After
const handleDelete = async () => {
  setIsDeleting(true)
  try {
    const result = await deleteUserItem(userId, userProductId)

    if (result.success) {
      toast.success('アイテムを削除しました')
      onDelete()
      setIsOpen(false)
    } else {
      toast.error(result.error || 'アイテムの削除に失敗しました')
    }
  } catch {
    toast.error('削除に失敗しました')
  } finally {
    setIsDeleting(false)
  }
}
```

**確認ダイアログ**:
```typescript
// Before
<AlertDialogTitle>商品を削除しますか？</AlertDialogTitle>
<AlertDialogDescription className="space-y-2">
  <span className="block">
    <span className="font-medium">「{productName}」</span>
    をマイ商品から削除します。
  </span>
  <span className="block text-sm">
    この操作は取り消せません。商品自体は削除されず、あなたの登録のみが削除されます。
  </span>
</AlertDialogDescription>

// After
<AlertDialogTitle>アイテムを削除しますか？</AlertDialogTitle>
<AlertDialogDescription className="space-y-2">
  <span className="block">
    <span className="font-medium">「{productName}」</span>
    をマイアイテムから削除します。
  </span>
  <span className="block text-sm">
    この操作は取り消せません。アイテム自体は削除されず、あなたの登録のみが削除されます。
  </span>
</AlertDialogDescription>
```

---

### 4. DragDropProductList.tsx

**パス**: `app/dashboard/items/components/DragDropProductList.tsx` (303行)

#### 変更内容

**インポート更新**:
```typescript
// Before
import { UserProductWithDetails } from "@/types/product"
import { ProductImage } from "@/components/products/product-image"
import { deleteUserProduct, reorderUserProducts, updateUserProduct } from "@/app/actions/product-actions"

// After
import { UserItemWithDetails } from "@/types/item"
import { ProductImage } from "@/components/products/product-image"
import { deleteUserItem, reorderUserItems, updateUserItem } from "@/app/actions/item-actions"
```

**Props型定義**:
```typescript
// Before
interface DragDropProductListProps {
  userProducts: UserProductWithDetails[]
  userId: string
  onProductsChange: (products: UserProductWithDetails[]) => void
}

// After
interface DragDropProductListProps {
  userProducts: UserItemWithDetails[]
  userId: string
  onProductsChange: (products: UserItemWithDetails[]) => void
}
```

**State型**:
```typescript
// Before
const [activeItem, setActiveItem] = useState<UserProductWithDetails | null>(null)
const [editingProduct, setEditingProduct] = useState<UserProductWithDetails | null>(null)

// After
const [activeItem, setActiveItem] = useState<UserItemWithDetails | null>(null)
const [editingProduct, setEditingProduct] = useState<UserItemWithDetails | null>(null)
```

**並び替えハンドラー**:
```typescript
// Before
const result = await reorderUserProducts(userId, newProducts.map(product => product.id))

// After
const result = await reorderUserItems(userId, newProducts.map(product => product.id))
```

**公開設定切り替え**:
```typescript
// Before
const handleVisibilityToggle = async (product: UserProductWithDetails) => {
  const result = await updateUserProduct(userId, product.id, {
    isPublic: !product.isPublic
  })

  if (result.success) {
    const updatedProducts = userProducts.map(p =>
      p.id === product.id ? { ...p, isPublic: !p.isPublic } : p
    )
    onProductsChange(updatedProducts)
    toast.success(product.isPublic ? "商品を非公開にしました" : "商品を公開しました")
  } else {
    toast.error("表示設定の変更に失敗しました")
  }
}

// After
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
```

**削除ハンドラー**:
```typescript
// Before
const handleDeleteProduct = async (product: UserProductWithDetails) => {
  if (!confirm(`${product.product.name}を削除しますか？`)) return

  const result = await deleteUserProduct(userId, product.id)

  if (result.success) {
    const updatedProducts = userProducts.filter(p => p.id !== product.id)
    onProductsChange(updatedProducts)
    toast.success("商品を削除しました")
  } else {
    toast.error("商品の削除に失敗しました")
  }
}

// After
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
```

**更新ハンドラー**:
```typescript
// Before
const handleUpdate = (updatedProduct: UserProductWithDetails) => {
  const updatedProducts = userProducts.map(p =>
    p.id === updatedProduct.id ? updatedProduct : p
  )
  onProductsChange(updatedProducts)
  setEditingProduct(null)
}

// After
const handleUpdate = (updatedProduct: UserItemWithDetails) => {
  const updatedProducts = userProducts.map(p =>
    p.id === updatedProduct.id ? updatedProduct : p
  )
  onProductsChange(updatedProducts)
  setEditingProduct(null)
}
```

**ソート可能アイテム型**:
```typescript
// Before
function SortableProductItem({
  product,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  product: UserProductWithDetails
  onEdit: () => void
  onVisibilityToggle: () => void
  onDelete: () => void
})

// After
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
})
```

**カードコンポーネント型とフィールド参照**:
```typescript
// Before
function ProductItemCard({
  product,
  isDragging = false,
  dragHandleProps,
  onEdit,
  onVisibilityToggle,
  onDelete
}: {
  product: UserProductWithDetails
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  onEdit?: () => void
  onVisibilityToggle?: () => void
  onDelete?: () => void
}) {
  return (
    <div className={`border rounded-lg p-4 bg-card ${isDragging ? 'shadow-lg opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {/* ... */}
        <ProductImage
          imageStorageKey={product.product.imageStorageKey}
          customImageUrl={product.product.customImageUrl}
          amazonImageUrl={product.product.amazonImageUrl}
          alt={product.product.name}
          width={48}
          height={48}
          className="w-12 h-12 rounded"
        />
        {/* ... */}
        <div className="font-medium text-sm line-clamp-1 max-w-xs">{product.product.name}</div>
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {product.product.category.name}
        </Badge>
        {product.product.brand && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {product.product.brand.name}
          </Badge>
        )}
        {/* ... */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => product.product.amazonUrl && window.open(product.product.amazonUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// After
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
        {/* ... */}
        <ProductImage
          imageStorageKey={product.item.imageStorageKey}
          customImageUrl={product.item.customImageUrl}
          amazonImageUrl={product.item.amazonImageUrl}
          alt={product.item.name}
          width={48}
          height={48}
          className="w-12 h-12 rounded"
        />
        {/* ... */}
        <div className="font-medium text-sm line-clamp-1 max-w-xs">{product.item.name}</div>
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {product.item.category.name}
        </Badge>
        {product.item.brand && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {product.item.brand.name}
          </Badge>
        )}
        {/* ... */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => product.item.amazonUrl && window.open(product.item.amazonUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

---

### 5. EditUserProductModal.tsx

**パス**: `app/dashboard/items/components/EditUserProductModal.tsx`

#### 変更内容

**インポート更新**:
```typescript
// Before
import { updateUserProduct } from "@/app/actions/product-actions"
import { UserProductWithDetails } from "@/types/product"
import { ProductImage } from "@/components/products/product-image"

// After
import { updateUserItem } from "@/app/actions/item-actions"
import { UserItemWithDetails } from "@/types/item"
import { ProductImage } from "@/components/products/product-image"
```

**Props型定義**:
```typescript
// Before
interface EditUserProductModalProps {
  isOpen: boolean
  onClose: () => void
  userProduct: UserProductWithDetails
  userId: string
  onUpdate: (updatedUserProduct: UserProductWithDetails) => void
}

// After
interface EditUserProductModalProps {
  isOpen: boolean
  onClose: () => void
  userProduct: UserItemWithDetails
  userId: string
  onUpdate: (updatedUserProduct: UserItemWithDetails) => void
}
```

**Submit ハンドラー**:
```typescript
// Before
const onSubmit = async (data: z.infer<typeof userProductSchema>) => {
  setIsSubmitting(true)
  try {
    const result = await updateUserProduct(userId, userProduct.id, data)

    if (result.success) {
      toast.success('商品情報を更新しました')
      const updatedUserProduct = {
        ...userProduct,
        isPublic: data.isPublic,
        review: data.review || null,
      }
      onUpdate(updatedUserProduct)
      onClose()
    } else {
      toast.error(result.error || '商品情報の更新に失敗しました')
    }
  } catch {
    toast.error('更新に失敗しました')
  } finally {
    setIsSubmitting(false)
  }
}

// After
const onSubmit = async (data: z.infer<typeof userProductSchema>) => {
  setIsSubmitting(true)
  try {
    const result = await updateUserItem(userId, userProduct.id, data)

    if (result.success) {
      toast.success('アイテム情報を更新しました')
      const updatedUserProduct = {
        ...userProduct,
        isPublic: data.isPublic,
        review: data.review || null,
      }
      onUpdate(updatedUserProduct)
      onClose()
    } else {
      toast.error(result.error || 'アイテム情報の更新に失敗しました')
    }
  } catch {
    toast.error('更新に失敗しました')
  } finally {
    setIsSubmitting(false)
  }
}
```

**UI文言**:
```typescript
// Before
<DialogTitle>商品情報の編集</DialogTitle>
<DialogDescription>
  公開設定やレビュー内容を編集できます。
</DialogDescription>

{/* 商品情報表示 */}
<Card>
  <CardHeader className="pb-2">
    <div className="flex items-center space-x-2">
      <Badge variant="outline">
        {userProduct.product.category.name}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-start space-x-4">
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
        <h3 className="font-medium text-base leading-tight">
          {userProduct.product.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          ASIN: {userProduct.product.asin}
        </p>
        {userProduct.product.ogDescription && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {userProduct.product.ogDescription}
          </p>
        )}
      </div>
    </div>
  </CardContent>
</Card>

<FormDescription>
  この商品を他のユーザーに公開しますか？
</FormDescription>

// After
<DialogTitle>アイテム情報の編集</DialogTitle>
<DialogDescription>
  公開設定やレビュー内容を編集できます。
</DialogDescription>

{/* アイテム情報表示 */}
<Card>
  <CardHeader className="pb-2">
    <div className="flex items-center space-x-2">
      <Badge variant="outline">
        {userProduct.item.category.name}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-start space-x-4">
      <ProductImage
        imageStorageKey={userProduct.item.imageStorageKey}
        customImageUrl={userProduct.item.customImageUrl}
        amazonImageUrl={userProduct.item.amazonImageUrl}
        alt={userProduct.item.name}
        width={80}
        height={80}
        className="w-20 h-20 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base leading-tight">
          {userProduct.item.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          ASIN: {userProduct.item.asin}
        </p>
        {userProduct.item.ogDescription && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {userProduct.item.ogDescription}
          </p>
        )}
      </div>
    </div>
  </CardContent>
</Card>

<FormDescription>
  このアイテムを他のユーザーに公開しますか？
</FormDescription>
```

---

### 6. ExistingProductSelector.tsx

**パス**: `app/dashboard/items/components/ExistingProductSelector.tsx` (255行)

#### 変更内容

**インポート更新**:
```typescript
// Before
import { createUserProduct, getProducts, checkUserProductExists } from "@/app/actions/product-actions"
import { UserProductWithDetails } from "@/types/product"
import { Product, ProductCategory } from '@prisma/client'
import { ProductImage } from "@/components/products/product-image"

type SearchProductResult = Product & {
  category: ProductCategory
  brand: { id: string; name: string } | null
}

// After
import { createUserItem, getItems, checkUserItemExists } from "@/app/actions/item-actions"
import { UserItemWithDetails } from "@/types/item"
import { Item, ItemCategory } from '@prisma/client'
import { ProductImage } from "@/components/products/product-image"

type SearchProductResult = Item & {
  category: ItemCategory
  brand: { id: string; name: string } | null
}
```

**Props型定義**:
```typescript
// Before
interface ExistingProductSelectorProps {
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  onProductAdded: (userProduct: UserProductWithDetails) => void
}

// After
interface ExistingProductSelectorProps {
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  onProductAdded: (userItem: UserItemWithDetails) => void
}
```

**検索ハンドラー**:
```typescript
// Before
// 商品検索・フィルタ
const handleSearch = useCallback(async () => {
  setIsSearching(true)
  try {
    const result = await getProducts({
      search: searchQuery.trim() || undefined,
      categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      brandId: selectedBrandId === 'all' ? undefined : selectedBrandId,
    })

    if (result.success && result.data) {
      setSearchResults(result.data as SearchProductResult[])
    } else {
      setSearchResults([])
    }
  } catch {
    toast.error('検索に失敗しました')
  } finally {
    setIsSearching(false)
  }
}, [searchQuery, selectedCategoryId, selectedBrandId])

// After
// アイテム検索・フィルタ
const handleSearch = useCallback(async () => {
  setIsSearching(true)
  try {
    const result = await getItems({
      search: searchQuery.trim() || undefined,
      categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
      brandId: selectedBrandId === 'all' ? undefined : selectedBrandId,
    })

    if (result.success && result.data) {
      setSearchResults(result.data as SearchProductResult[])
    } else {
      setSearchResults([])
    }
  } catch {
    toast.error('検索に失敗しました')
  } finally {
    setIsSearching(false)
  }
}, [searchQuery, selectedCategoryId, selectedBrandId])
```

**登録ハンドラー**:
```typescript
// Before
// 既存商品からの登録
const handleSubmit = async (data: z.infer<typeof userProductSchema>) => {
  if (!selectedProduct) return

  setIsSubmitting(true)
  try {
    // ユーザー商品の重複チェック
    const alreadyRegistered = await checkUserProductExists(userId, selectedProduct.id)
    if (alreadyRegistered) {
      toast.error('この商品は既に登録されています')
      return
    }

    const result = await createUserProduct(userId, {
      productId: selectedProduct.id,
      ...data,
    })

    if (result.success && result.data) {
      toast.success('商品を登録しました')
      onProductAdded(result.data as UserProductWithDetails)
      // Reset form
      form.reset()
      setSelectedProduct(null)
      setSearchQuery('')
      setSearchResults([])
    } else {
      toast.error(result.error || '商品の登録に失敗しました')
    }
  } catch {
    toast.error('登録に失敗しました')
  } finally {
    setIsSubmitting(false)
  }
}

// After
// 既存アイテムからの登録
const handleSubmit = async (data: z.infer<typeof userProductSchema>) => {
  if (!selectedProduct) return

  setIsSubmitting(true)
  try {
    // ユーザーアイテムの重複チェック
    const alreadyRegistered = await checkUserItemExists(userId, selectedProduct.id)
    if (alreadyRegistered) {
      toast.error('このアイテムは既に登録されています')
      return
    }

    const result = await createUserItem(userId, {
      itemId: selectedProduct.id,
      ...data,
    })

    if (result.success && result.data) {
      toast.success('アイテムを登録しました')
      onProductAdded(result.data as UserItemWithDetails)
      // Reset form
      form.reset()
      setSelectedProduct(null)
      setSearchQuery('')
      setSearchResults([])
    } else {
      toast.error(result.error || 'アイテムの登録に失敗しました')
    }
  } catch {
    toast.error('登録に失敗しました')
  } finally {
    setIsSubmitting(false)
  }
}
```

**UI文言**:
```typescript
// Before
<Input
  placeholder="商品名、ASIN で検索..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
/>

// After
<Input
  placeholder="アイテム名、ASIN で検索..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
/>
```

**画像コンポーネント** (ProductImageを継続使用):
```typescript
<ProductImage
  imageStorageKey={product.imageStorageKey}
  customImageUrl={product.customImageUrl}
  amazonImageUrl={product.amazonImageUrl}
  alt={product.name}
  width={50}
  height={50}
  className="w-12 h-12"
/>
```

---

### 7. UserProductCard.tsx

**パス**: `app/dashboard/items/components/UserProductCard.tsx`

#### 変更内容

**インポート更新**:
```typescript
// Before
import { UserProductWithDetails } from "@/types/product"
import { ProductImage } from "@/components/products/product-image"

// After
import { UserItemWithDetails } from "@/types/item"
import { ProductImage } from "@/components/products/product-image"
```

**Props型定義**:
```typescript
// Before
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
  // ...
}

// After
interface UserProductCardProps {
  userProduct: UserItemWithDetails
  userId: string
  onUpdate: (updatedUserProduct: UserItemWithDetails) => void
  onDelete: (deletedId: string) => void
}

export function UserProductCard({ userProduct, userId, onUpdate, onDelete }: UserProductCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleUpdate = (updatedUserProduct: UserItemWithDetails) => {
    onUpdate(updatedUserProduct)
    setIsEditModalOpen(false)
  }
  // ...
}
```

**フィールド参照更新**:
```typescript
// Before
<Badge variant="outline" className="text-xs">
  {userProduct.product.category.name}
</Badge>

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

<ProductImage
  imageStorageKey={userProduct.product.imageStorageKey}
  customImageUrl={userProduct.product.customImageUrl}
  amazonImageUrl={userProduct.product.amazonImageUrl}
  alt={userProduct.product.name}
  width={80}
  height={80}
  className="w-20 h-20 flex-shrink-0"
/>

<h3 className="font-medium text-sm leading-tight line-clamp-2">
  {userProduct.product.name}
</h3>

{userProduct.product.brand && (
  <div className="text-xs text-muted-foreground">
    {userProduct.product.brand.name}
  </div>
)}

<div className="text-xs text-muted-foreground">
  ASIN: {userProduct.product.asin}
</div>

// After
<Badge variant="outline" className="text-xs">
  {userProduct.item.category.name}
</Badge>

<DropdownMenuItem
  onClick={() => userProduct.item.amazonUrl && window.open(userProduct.item.amazonUrl, '_blank')}
>
  <ExternalLink className="h-4 w-4 mr-2" />
  Amazon で見る
</DropdownMenuItem>

<DeleteUserProductButton
  userProductId={userProduct.id}
  userId={userId}
  productName={userProduct.item.name}
  onDelete={handleDelete}
/>

<ProductImage
  imageStorageKey={userProduct.item.imageStorageKey}
  customImageUrl={userProduct.item.customImageUrl}
  amazonImageUrl={userProduct.item.amazonImageUrl}
  alt={userProduct.item.name}
  width={80}
  height={80}
  className="w-20 h-20 flex-shrink-0"
/>

<h3 className="font-medium text-sm leading-tight line-clamp-2">
  {userProduct.item.name}
</h3>

{userProduct.item.brand && (
  <div className="text-xs text-muted-foreground">
    {userProduct.item.brand.name}
  </div>
)}

<div className="text-xs text-muted-foreground">
  ASIN: {userProduct.item.asin}
</div>
```

---

### 8. UserProductListSection.tsx

**パス**: `app/dashboard/items/components/UserProductListSection.tsx`

#### 変更内容

**インポート更新**:
```typescript
// Before
import { UserProductWithDetails } from "@/types/product"

// After
import { UserItemWithDetails } from "@/types/item"
```

**Props型定義**:
```typescript
// Before
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
  // ...
}

// After
interface UserProductListSectionProps {
  initialUserProducts: UserItemWithDetails[]
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
  const [userProducts, setUserProducts] = useState(initialUserProducts)

  const mutateUserProducts = (newProducts: UserItemWithDetails[]) => {
    setUserProducts(newProducts)
  }

  const handleProductsChange = (newProducts: UserItemWithDetails[]) => {
    mutateUserProducts(newProducts)
  }

  const handleProductAdded = (newProduct: UserItemWithDetails) => {
    const updatedProducts = [...userProducts, newProduct].sort((a, b) => a.sortOrder - b.sortOrder)
    mutateUserProducts(updatedProducts)
  }
  // ...
}
```

**UI文言**:
```typescript
// Before
<div>
  <h2 className="text-xl font-semibold">商品設定</h2>
  <p className="text-sm text-muted-foreground">
    使用している商品を管理できます（最大30個）
  </p>
</div>

{userProducts.length === 0 ? (
  <div className="text-center py-12 text-muted-foreground">
    <p>まだ商品が登録されていません</p>
    <p className="text-sm">「商品を追加」から設定を始めましょう</p>
  </div>
) : (
  // ...
)}

// After
<div>
  <h2 className="text-xl font-semibold">アイテム設定</h2>
  <p className="text-sm text-muted-foreground">
    使用しているアイテムを管理できます（最大30個）
  </p>
</div>

{userProducts.length === 0 ? (
  <div className="text-center py-12 text-muted-foreground">
    <p>まだアイテムが登録されていません</p>
    <p className="text-sm">「アイテムを追加」から設定を始めましょう</p>
  </div>
) : (
  // ...
)}
```

---

## 技術的な詳細

### 画像コンポーネントの扱い

当初、`ItemImage`コンポーネントを使用する設計でしたが、既存の`ProductImage`コンポーネントを継続使用することにしました。

**理由**:
- `ProductImage`コンポーネントは汎用的な画像表示機能を提供
- 新しいコンポーネントを作成するよりも、既存のコンポーネントを再利用する方が効率的
- 将来的にコンポーネント名を`ItemImage`にリネームすることは可能

**実装**:
```typescript
// 全ファイルで統一
import { ProductImage } from "@/components/products/product-image"

// 使用例
<ProductImage
  imageStorageKey={product.item.imageStorageKey}
  customImageUrl={product.item.customImageUrl}
  amazonImageUrl={product.item.amazonImageUrl}
  alt={product.item.name}
  width={80}
  height={80}
  className="w-20 h-20 flex-shrink-0"
/>
```

---

## TypeScript型チェック結果

### Phase 5範囲のエラー確認

```bash
npx tsc --noEmit 2>&1 | grep "app/dashboard/items"
```

**結果**: エラー0件 ✅

Phase 5で更新した全8ファイルでTypeScriptエラーは発生していません。

### 残存エラー

Phase 5以外の範囲で以下のエラーが残存していますが、これらは今後のPhaseで対応予定です:

- `app/[handle]/products/` (Phase 6で対応予定)
- `app/demo/database-test/` (Phase 9で対応予定)
- `prisma/seed.ts` (Phase 9で対応予定)

---

## Git コミット情報

**コミットハッシュ**: `8a317af`

**コミットメッセージ**:
```
feat: Complete Phase 5 - Dashboard UI migration (Product→Item)

Migrated all dashboard UI files from Product to Item terminology:
- Renamed directory: app/dashboard/products → app/dashboard/items
- Updated 8 component files with type and action changes
- Changed all UI text from "商品" to "アイテム"

Key changes:
- Types: UserProductWithDetails → UserItemWithDetails
- Actions: getUserProducts → getUserItems, deleteUserProduct → deleteUserItem, etc.
- Field references: product.* → item.*
- Image component: ItemImage → ProductImage (reusing existing component)

Files changed:
- page.tsx: Updated page component and Prisma queries
- AddProductModal.tsx: Updated types and UI text
- DeleteUserProductButton.tsx: Updated action calls and messages
- DragDropProductList.tsx: Updated DnD handlers and card rendering
- EditUserProductModal.tsx: Updated form and display logic
- ExistingProductSelector.tsx: Updated search and registration logic
- UserProductCard.tsx: Updated card display
- UserProductListSection.tsx: Updated section header and empty state

TypeScript errors in Phase 5 scope: 0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**変更統計**:
```
8 files changed, 1222 insertions(+)
```

**変更ファイル一覧**:
```
create mode 100644 app/dashboard/items/components/AddProductModal.tsx
create mode 100644 app/dashboard/items/components/DeleteUserProductButton.tsx
create mode 100644 app/dashboard/items/components/DragDropProductList.tsx
create mode 100644 app/dashboard/items/components/EditUserProductModal.tsx
create mode 100644 app/dashboard/items/components/ExistingProductSelector.tsx
create mode 100644 app/dashboard/items/components/UserProductCard.tsx
create mode 100644 app/dashboard/items/components/UserProductListSection.tsx
create mode 100644 app/dashboard/items/page.tsx
```

---

## Phase 6への準備

### 次フェーズの対象

**Phase 6: 公開ページUI** (`app/[handle]/products/`)

想定される作業:
1. ディレクトリリネーム: `app/[handle]/products/` → `app/[handle]/items/`
2. 公開プロフィールページの更新
3. ユーザーアイテム表示コンポーネントの更新
4. 型定義とServer Actionsの参照更新

---

## 品質チェックリスト

- [x] **全ファイル更新完了**: 8ファイル全て更新済み
- [x] **ディレクトリリネーム完了**: `products/` → `items/`
- [x] **TypeScriptエラー0**: Phase 5範囲で0エラー
- [x] **型定義更新**: `UserProductWithDetails` → `UserItemWithDetails`
- [x] **Server Actions更新**: 全てのアクション呼び出しを更新
- [x] **フィールド参照更新**: `product.*` → `item.*`
- [x] **UI文言更新**: "商品" → "アイテム" 全て変更
- [x] **Git コミット作成**: 8a317af
- [x] **実装ログ作成**: 本ドキュメント

---

## 所感・注意事項

### 成功要因

1. **段階的アプローチ**: 1ファイルずつ確実に更新
2. **型安全性**: TypeScriptの型チェックで問題を早期発見
3. **既存コンポーネント再利用**: ProductImageの継続使用で効率化
4. **一貫性**: 全ファイルで同じパターンを適用

### 注意が必要な箇所

1. **コンポーネント名**: `AddProductModal`, `DeleteUserProductButton`などのファイル名は旧名称のまま
   - 理由: コンポーネント内部のロジックと型は更新済み、ファイル名変更は大規模なリファクタリングになるため後回し

2. **変数名**: 一部の変数名(`userProduct`, `product`)は旧名称のまま
   - 理由: 内部変数名の変更は機能に影響しないため、優先度を下げた

3. **画像コンポーネント**: `ProductImage`を継続使用
   - 理由: 汎用的なコンポーネントのため、名称変更は不要と判断

### 今後の改善案

1. コンポーネントファイル名のリネーム（Phase 13で検討）
2. 内部変数名の統一（必要に応じて）
3. `ProductImage` → `ItemImage`へのリネーム検討（低優先度）

---

## Gemini レビューと修正作業

### 初回レビュー結果（条件付き却下）

**レビュー日**: 2026-01-01
**レビュアー**: Gemini One Opus
**結果**: ⚠️ **修正が必要 (Conditional Reject)**

**指摘事項**:
1. コンポーネントファイル名が旧名称のまま（7ファイル）
2. コンポーネント関数名が旧名称のまま
3. Phase 4との一貫性が損なわれている

詳細: [phase-5-gemini-review.md](./phase-5-gemini-review.md)

### 修正作業実施

**実施日**: 2026-01-01
**修正内容**: 全7コンポーネントのファイル名とコンポーネント名を統一

**修正ファイル一覧**:
1. `AddProductModal.tsx` → `AddItemModal.tsx`
2. `EditUserProductModal.tsx` → `EditUserItemModal.tsx`
3. `DeleteUserProductButton.tsx` → `DeleteUserItemButton.tsx`
4. `DragDropProductList.tsx` → `DragDropItemList.tsx`
5. `UserProductCard.tsx` → `UserItemCard.tsx`
6. `UserProductListSection.tsx` → `UserItemListSection.tsx`
7. `ExistingProductSelector.tsx` → `ExistingItemSelector.tsx`

**変更内容**:
- コンポーネント関数名: `*Product*` → `*Item*`
- インターフェース名: `*ProductProps` → `*ItemProps`
- 型定義名: `SearchProductResult` → `SearchItemResult`, `userProductSchema` → `userItemSchema`
- Props名、State変数名、ハンドラー名を全て統一
- インポート元更新: [page.tsx:6](../../dashboard/items/page.tsx#L6)

**Git コミット**:
```
Commit: b39fa86
Message: fix: Phase 5 corrections - Rename components from Product to Item
Files: 8 files changed, 196 insertions(+), 196 deletions(-)
```

詳細: [phase-5-corrections-reply.md](./phase-5-corrections-reply.md)

### 再レビュー結果（承認）

**レビュー日**: 2026-01-01
**レビュアー**: Gemini One Opus
**結果**: ✅ **承認 (Approved)**

**総合評価**:
> "Phase 5の修正作業が**完璧に完了**しています。前回のレビューで指摘したすべての項目が正確に対応され、Phase 4との一貫性も完全に保たれています。"

**確認項目**:
- ✅ ファイル名のリネーム（7件完了）
- ✅ コンポーネント名の統一
- ✅ インポート元の更新
- ✅ Phase 4との一貫性

**Geminiコメント**:
> "Phase 5の修正は完璧です。**Phase 6への進行を承認します。**"

詳細: [phase-5-gemini-re-review.md](./phase-5-gemini-re-review.md)

---

**Phase 5完了**: ✅ **承認済み**
**次フェーズ**: Phase 6 - 公開ページUI更新
**作成日**: 2026-01-01
**最終更新**: 2026-01-01
**作成者**: Claude Sonnet 4.5
