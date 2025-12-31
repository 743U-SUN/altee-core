# Product → Item 大規模リネーム計画

## 概要

Productシステムを「Item」に統一し、より日本語圏ユーザーに馴染みやすく、将来的な拡張性の高いシステムに刷新します。

**作成日**: 2025-12-31
**レビュアー**: Claude Code (Claude Sonnet 4.5)
**ステータス**: 計画策定完了 → 実行待ち

---

## 1. リネームの理由

### 1.1 ユーザビリティ向上

| 観点 | Product | Item |
|------|---------|------|
| 日本語の馴染み | "プロダクト"（カタカナ） | "アイテム"（一般的） |
| 文字数 | 7文字 | 5文字 |
| 意味の広さ | 商品に限定的 | デバイス、商品、ツール全般 |
| URL長 | `/products` (8文字) | `/items` (5文字) |

### 1.2 将来的な拡張性

**現在のスコープ**:
- PC周辺機器（マウス、キーボード等）
- 一般商品（飲料、食品等）

**将来的な拡張可能性**:
- ソフトウェア（アプリ、プラグイン等）
- サービス（サブスク、ツール等）
- デジタル商品（テーマ、素材等）

→ "Product"は物理的商品を連想させるが、"Item"は全てを包含可能

### 1.3 絶好のタイミング

- ✅ 開発段階でデータゼロ
- ✅ ユーザー影響ゼロ
- ✅ 後からやるとコストが指数関数的に増加
- ✅ Device削除と同時実行で最終的なコードベースが最もクリーン

---

## 2. 変更対象の全体像

### 2.1 Prismaスキーマ（3モデル）

```prisma
// Before
model Product { ... }
model ProductCategory { ... }
model UserProduct { ... }
enum ProductType { ... }

// After
model Item { ... }
model ItemCategory { ... }
model UserItem { ... }
enum ItemType { ... }
```

### 2.2 ディレクトリ構造

```bash
Before:
├── app/admin/products/              → app/admin/items/
├── app/admin/categories/            → app/admin/item-categories/
├── app/dashboard/products/          → app/dashboard/items/
├── app/[handle]/products/           → app/[handle]/items/
├── app/actions/product-actions.ts   → app/actions/item-actions.ts
├── app/actions/category-actions.ts  → (維持: ブログ用Category管理)
├── components/products/             → components/items/
├── types/product.ts                 → types/item.ts
├── lib/validation/product.ts        → lib/validation/item.ts
├── docs/GUIDES/product-management-guide.md  → item-management-guide.md
└── prisma/seed.ts                   → ItemCategory用に更新

After:
├── app/admin/items/
├── app/admin/item-categories/
├── app/dashboard/items/
├── app/[handle]/items/
├── app/items/                       # 公開アイテム一覧（新規作成）
├── app/actions/item-actions.ts
├── app/actions/category-actions.ts  # ブログ用（維持、コメント追加）
├── components/items/                # ProductImageから移行
├── types/item.ts
├── lib/validation/item.ts
├── docs/GUIDES/item-management-guide.md
└── prisma/seed.ts                   # ItemCategory対応
```

### 2.3 R2画像フォルダ・プレースホルダー

```bash
R2フォルダ:
Before: product-images/{asin}.{ext}
After:  item-images/{asin}.{ext}

プレースホルダー画像:
Before: /images/product-placeholder.svg
After:  /images/item-placeholder.svg
```

### 2.4 URL構造

```bash
Before:
/admin/products              → /admin/items
/admin/categories            → /admin/item-categories
/dashboard/products          → /dashboard/items
/@{handle}/products          → /@{handle}/items

After:
/admin/items
/admin/item-categories
/dashboard/items
/@{handle}/items
/items                       # 公開アイテム一覧（新規）
```

---

## 3. 実装手順（10フェーズ）

### Phase 0: バックアップ・準備（10分）

```bash
# 現在の状態をコミット
git add .
git commit -m "backup: Before Product→Item migration"

# データベースバックアップ（念のため）
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  pg_dump > backups/pre-item-migration-$(date +%Y%m%d-%H%M%S).sql
```

**確認事項**:
- [ ] データベースが空であることを確認
- [ ] `/admin/attributes` がブログ用であることを再確認
- [ ] `/admin/categories` が現在ProductCategory管理であることを確認

---

### Phase 1: Prismaスキーマ変更（30分）

#### 1.1 モデル名変更

**ファイル**: `prisma/schema.prisma`

```prisma
// 変更前: 行627-708
model ProductCategory { ... }
model Product { ... }
model UserProduct { ... }
enum ProductType { ... }

// 変更後
model ItemCategory { ... }
model Item { ... }
model UserItem { ... }
enum ItemType { ... }
```

**詳細な変更内容**:

1. **ProductCategory → ItemCategory** (行627-648)
```prisma
model ItemCategory {
  id                         String       @id @default(cuid())
  name                       String       // "CPU", "飲料", "マウス"
  slug                       String       @unique
  parentId                   String?      // 親カテゴリID（階層構造用）
  itemType                   ItemType     @default(GENERAL)  // ← 変更
  requiresCompatibilityCheck Boolean      @default(false)
  icon                       String?
  description                String?
  sortOrder                  Int          @default(0)
  createdAt                  DateTime     @default(now())
  updatedAt                  DateTime     @updatedAt

  // リレーション
  parent       ItemCategory?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     ItemCategory[] @relation("CategoryHierarchy")
  items        Item[]         // ← 変更

  @@index([itemType])        // ← 変更
  @@index([sortOrder])
  @@map("item_categories")   // ← 変更
}
```

2. **ProductType → ItemType** (行710-719)
```prisma
enum ItemType {
  PC_PART         // PCパーツ（マザーボード、CPU、GPU等）
  PERIPHERAL      // PC周辺機器（マウス、キーボード、ヘッドセット等）
  BEVERAGE        // 飲料（エナジードリンク、コーヒー等）
  FOOD            // 食品（お菓子、サプリメント等）
  FURNITURE       // 家具（デスク、チェア等）
  ELECTRONICS     // 家電（モニター、スピーカー等）
  GENERAL         // その他一般商品
}
```

3. **Product → Item** (行654-686)
```prisma
model Item {
  id             String        @id @default(cuid())
  name           String        // アイテム名
  description    String?       // アイテム説明
  categoryId     String        // カテゴリID
  brandId        String?       // ブランドID（オプショナル）

  // 画像管理
  amazonUrl          String?   // Amazon URL
  amazonImageUrl     String?   // Amazon OG画像URL
  customImageUrl     String?   // カスタム画像URL（手動指定）
  imageStorageKey    String?   // R2保存画像キー

  // OG情報
  ogTitle        String?       // OG情報から取得したタイトル
  ogDescription  String?       // OG情報から取得した説明

  // Amazon固有情報
  asin           String?       @unique // Amazon商品識別番号

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // リレーション
  category       ItemCategory  @relation(fields: [categoryId], references: [id])
  brand          Brand?        @relation("ItemBrand", fields: [brandId], references: [id])  // ← 変更
  userItems      UserItem[]    // ← 変更

  @@index([categoryId])
  @@index([brandId])
  @@index([createdAt])
  @@map("items")               // ← 変更
}
```

4. **UserProduct → UserItem** (行689-708)
```prisma
model UserItem {
  id             String    @id @default(cuid())
  userId         String
  itemId         String    // ← 変更
  isPublic       Boolean   @default(true)
  review         String?
  sortOrder      Int       @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  item           Item      @relation(fields: [itemId], references: [id], onDelete: Cascade)  // ← 変更

  @@unique([userId, itemId])  // ← 変更
  @@index([userId])
  @@index([itemId])           // ← 変更
  @@index([isPublic])
  @@index([sortOrder])
  @@map("user_items")         // ← 変更
}
```

5. **User モデルのリレーション更新** (行35付近)
```prisma
model User {
  // ...
  userProducts  UserProduct[]  // 削除
  userItems     UserItem[]     // 追加
  // ...
}
```

6. **Brand モデルのリレーション更新** (行570付近)
```prisma
model Brand {
  // ...
  products Product[] @relation("ProductBrand")  // 削除
  items    Item[]    @relation("ItemBrand")     // 追加
  // ...
}
```

#### 1.2 マイグレーション作成・実行

```bash
# マイグレーション作成
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  npx prisma migrate dev --name product_to_item_migration

# 期待される出力:
# ✅ ProductCategory → ItemCategory テーブルリネーム
# ✅ Product → Item テーブルリネーム
# ✅ UserProduct → UserItem テーブルリネーム
# ✅ ProductType → ItemType enumリネーム
# ✅ 全リレーション更新
# ✅ 全インデックス更新
```

**警告**: テーブル名変更なので、既存データがある場合はデータ移行SQLが生成される。今回はデータゼロなので問題なし。

---

### Phase 2: 型定義・バリデーション移行（45分）

#### 2.1 types/item.ts 作成

**ファイル**: `types/item.ts`（新規作成）

**元ファイル**: `types/product.ts`

**変更内容**:
```typescript
// types/item.ts
import { Item, ItemCategory, UserItem, Brand } from '@prisma/client'

// Item型（リレーション含む）
export type ItemWithDetails = Item & {
  category: ItemCategory
  brand: Brand | null
  userItems: UserItem[]
}

// ItemCategory型（リレーション含む）
export type ItemCategoryWithDetails = ItemCategory & {
  parent: ItemCategory | null
  children: ItemCategory[]
  items: Item[]
  _count: {
    items: number
  }
}

// UserItem型（リレーション含む）
export type UserItemWithDetails = UserItem & {
  item: ItemWithDetails
}

// フィルタ型
export type ItemFilters = {
  categoryId?: string
  brandId?: string
  search?: string
  itemType?: string
}
```

#### 2.2 lib/validation/item.ts 作成

**ファイル**: `lib/validation/item.ts`（新規作成）

**元ファイル**: `lib/validation/product.ts`

**変更内容**:
```typescript
// lib/validation/item.ts
import { z } from 'zod'

// ItemType enum values
const itemTypes = [
  'PC_PART',
  'PERIPHERAL',
  'BEVERAGE',
  'FOOD',
  'FURNITURE',
  'ELECTRONICS',
  'GENERAL',
] as const

// ===== ItemCategory Validation =====
export const itemCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名を入力してください').max(50),
  slug: z.string().min(1).max(50),
  parentId: z.string().optional(),
  itemType: z.enum(itemTypes).default('GENERAL'),
  requiresCompatibilityCheck: z.boolean().default(false),
  icon: z.string().optional(),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int().default(0),
})

export type ItemCategoryInput = z.infer<typeof itemCategorySchema>

// ===== Item Validation =====
export const itemSchema = z.object({
  name: z.string().min(1, 'アイテム名を入力してください').max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  brandId: z.string().optional(),
  amazonUrl: z.string().url().optional().or(z.literal('')),
  amazonImageUrl: z.string().url().optional().or(z.literal('')),
  customImageUrl: z.string().url().optional().or(z.literal('')),
  imageStorageKey: z.string().optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  asin: z.string().max(20).optional(),
})

export type ItemInput = z.infer<typeof itemSchema>

// ===== UserItem Validation =====
export const userItemSchema = z.object({
  itemId: z.string().min(1, 'アイテムを選択してください'),
  isPublic: z.boolean().default(true),
  review: z.string().max(1000).optional(),
})

export type UserItemInput = z.infer<typeof userItemSchema>

// UserItem更新用
export const userItemUpdateSchema = userItemSchema.extend({
  id: z.string(),
})

export type UserItemUpdate = z.infer<typeof userItemUpdateSchema>

// ===== CSV Import =====
export type ItemCSVRow = {
  name: string
  description?: string
  categorySlug: string
  brandName?: string
  amazonUrl?: string
  asin?: string
}

export type CSVImportResult = {
  success: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data: ItemCSVRow
  }>
}
```

---

### Phase 3: Server Actions移行（90分）

#### 3.1 app/actions/item-actions.ts 作成

**元ファイル**: `app/actions/product-actions.ts`

**主要な変更**:

1. **インポート変更**
```typescript
// Before
import { userProductSchema, type UserProductInput } from '@/lib/validation/product'

// After
import { userItemSchema, type UserItemInput } from '@/lib/validation/item'
```

2. **全関数名変更**
```typescript
// Before → After
checkUserProductExists      → checkUserItemExists
getUserProducts             → getUserItems
createUserProduct           → createUserItem
updateUserProduct           → updateUserItem
deleteUserProduct           → deleteUserItem
reorderUserProducts         → reorderUserItems
getUserPublicProductsByHandle → getUserPublicItemsByHandle
getProducts                 → getItems
```

3. **Prisma呼び出し変更**
```typescript
// Before
await prisma.userProduct.findUnique({ ... })
await prisma.product.findMany({ ... })

// After
await prisma.userItem.findUnique({ ... })
await prisma.item.findMany({ ... })
```

4. **revalidatePath 変更**
```typescript
// Before
revalidatePath('/dashboard/products')
revalidatePath(`/@${user.handle}/products`)

// After
revalidatePath('/dashboard/items')
revalidatePath(`/@${user.handle}/items`)
```

**全体で約370行のファイル**

#### 3.2 app/admin/items/actions.ts 作成

**元ファイル**: `app/admin/products/actions.ts`

**主要な変更**:

1. **R2画像関数名変更**
```typescript
// Before → After
deleteProductImageFromR2        → deleteItemImageFromR2
downloadAndUploadProductImage   → downloadAndUploadItemImage
refreshProductImage             → refreshItemImage
```

2. **R2フォルダパス変更**
```typescript
// Before
const folder = 'product-images'

// After
const folder = 'item-images'
```

3. **Admin用Server Actions変更**
```typescript
// Before → After
getCategoriesAction    → getItemCategoriesAction
getBrandsAction        → (維持: Brand共通)
getProductsAction      → getItemsAction
createProductAction    → createItemAction
updateProductAction    → updateItemAction
deleteProductAction    → deleteItemAction
importProductsFromCSV  → importItemsFromCSV
refreshProductImage    → refreshItemImage
```

4. **Prisma呼び出し変更**
```typescript
// Before
await prisma.productCategory.findMany({ ... })
await prisma.product.create({ ... })

// After
await prisma.itemCategory.findMany({ ... })
await prisma.item.create({ ... })
```

5. **revalidatePath 変更**
```typescript
// Before
revalidatePath('/admin/products')

// After
revalidatePath('/admin/items')
```

**全体で約610行のファイル**

#### 3.3 app/admin/item-categories/actions.ts 作成

**元ファイル**: `app/admin/categories/actions.ts`

**主要な変更**:

1. **関数名変更**
```typescript
// Before → After
getCategoriesAction       → getItemCategoriesAction
getCategoryByIdAction     → getItemCategoryByIdAction
createCategoryAction      → createItemCategoryAction
updateCategoryAction      → updateItemCategoryAction
deleteCategoryAction      → deleteItemCategoryAction
reorderCategoriesAction   → reorderItemCategoriesAction
```

2. **Prisma呼び出し変更**
```typescript
// Before
await prisma.productCategory.findMany({ ... })

// After
await prisma.itemCategory.findMany({ ... })
```

3. **revalidatePath 変更**
```typescript
// Before
revalidatePath('/admin/categories')

// After
revalidatePath('/admin/item-categories')
```

---

### Phase 4: 管理画面UI移行（120分）

#### 4.1 app/admin/items/ 作成

**元ディレクトリ**: `app/admin/products/`

**ディレクトリ構造**:
```bash
app/admin/items/
├── page.tsx
├── new/
│   └── page.tsx
├── [id]/
│   └── page.tsx
├── components/
│   ├── ProductForm.tsx          → ItemForm.tsx
│   ├── ProductList.tsx          → ItemList.tsx
│   ├── ProductTable.tsx         → ItemTable.tsx
│   ├── DeleteProductButton.tsx  → DeleteItemButton.tsx
│   ├── CategorySelect.tsx       → (維持)
│   ├── BrandSelect.tsx          → (維持)
│   ├── ImageSection.tsx         → (維持)
│   └── shared/
│       ├── AmazonUrlSection.tsx    → (維持)
│       ├── CustomImageSection.tsx  → (維持)
│       └── OGInfoDisplay.tsx       → (維持)
└── actions.ts
```

**主要な変更内容**:

1. **page.tsx**
```typescript
// Before
export const metadata = {
  title: '商品管理 | 管理画面',
  description: '商品の作成・編集・削除',
}

// After
export const metadata = {
  title: 'アイテム管理 | 管理画面',
  description: 'アイテムの作成・編集・削除',
}
```

2. **ItemForm.tsx**（ProductForm.tsx から）
```typescript
// インポート変更
import { itemSchema, type ItemInput } from '@/lib/validation/item'
import { ItemWithDetails } from '@/types/item'

// Server Action変更
import { createItemAction, updateItemAction } from '../actions'

// Props型変更
interface ItemFormProps {
  item?: ItemWithDetails
  categories: ItemCategory[]
  brands: Brand[]
}

// フォーム変更
const form = useForm<ItemInput>({
  resolver: zodResolver(itemSchema),
  // ...
})

// Submit変更
const result = item
  ? await updateItemAction(item.id, values)
  : await createItemAction(values)

// UI変更
<h1>アイテム{item ? '編集' : '作成'}</h1>
```

3. **ItemList.tsx**（ProductList.tsx から）
```typescript
// Server Action変更
import { getItemsAction } from '../actions'

// データ取得変更
const items = await getItemsAction()

// UI変更
<h2>アイテム一覧</h2>
```

#### 4.2 app/admin/item-categories/ 作成

**元ディレクトリ**: `app/admin/categories/`

**ディレクトリ構造**:
```bash
app/admin/item-categories/
├── page.tsx
├── new/
│   └── page.tsx
├── [id]/
│   └── page.tsx
└── components/
    ├── CategoryForm.tsx         → ItemCategoryForm.tsx
    ├── CategoryList.tsx         → ItemCategoryList.tsx
    ├── CategoryTree.tsx         → ItemCategoryTree.tsx
    └── DeleteCategoryButton.tsx → DeleteItemCategoryButton.tsx
```

**主要な変更内容**:

1. **page.tsx**
```typescript
// Before
export const metadata = {
  title: 'カテゴリ管理 | 管理画面',
  description: '商品カテゴリの作成・編集・削除',
}

// After
export const metadata = {
  title: 'アイテムカテゴリ管理 | 管理画面',
  description: 'アイテムカテゴリの作成・編集・削除',
}
```

2. **ItemCategoryForm.tsx**
```typescript
// インポート変更
import { itemCategorySchema, type ItemCategoryInput } from '@/lib/validation/item'

// Server Action変更
import { createItemCategoryAction, updateItemCategoryAction } from '../actions'

// ItemType選択
<Select name="itemType">
  <option value="PC_PART">PCパーツ</option>
  <option value="PERIPHERAL">PC周辺機器</option>
  {/* ... */}
</Select>
```

---

### Phase 5: ダッシュボードUI移行（90分）

#### 5.1 app/dashboard/items/ 作成

**元ディレクトリ**: `app/dashboard/products/`

**ディレクトリ構造**:
```bash
app/dashboard/items/
├── page.tsx
└── components/
    ├── AddProductModal.tsx           → AddItemModal.tsx
    ├── EditUserProductModal.tsx      → EditUserItemModal.tsx
    ├── DeleteUserProductButton.tsx   → DeleteUserItemButton.tsx
    ├── ExistingProductSelector.tsx   → ExistingItemSelector.tsx
    ├── UserProductCard.tsx           → UserItemCard.tsx
    ├── UserProductListSection.tsx    → UserItemListSection.tsx
    └── DragDropProductList.tsx       → DragDropItemList.tsx
```

**主要な変更内容**:

1. **page.tsx**
```typescript
// インポート変更
import { getUserItems } from '@/app/actions/item-actions'

// Server Component
export default async function UserItemsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/signin')
  }

  const userItems = await getUserItems(session.user.id)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">マイアイテム</h1>
        <p className="mt-2 text-muted-foreground">
          あなたが所有・使用しているアイテムを管理
        </p>
      </div>

      <UserItemListSection userItems={userItems} />
    </div>
  )
}
```

2. **AddItemModal.tsx**
```typescript
// Server Action変更
import { createUserItem } from '@/app/actions/item-actions'

// フォーム変更
const form = useForm<UserItemInput>({
  resolver: zodResolver(userItemSchema),
  // ...
})

// Submit変更
const result = await createUserItem(session.user.id, values)
```

---

### Phase 6: 公開ページUI移行（120分）

#### 6.1 app/[handle]/items/ 作成

**元ディレクトリ**: `app/[handle]/products/`

**ディレクトリ構造**:
```bash
app/[handle]/items/
├── page.tsx
└── components/
    └── UserPublicProductList.tsx → UserPublicItemList.tsx
```

**主要な変更内容**:

1. **page.tsx**
```typescript
// Server Action変更
import { getUserPublicItemsByHandle } from '@/app/actions/item-actions'

// メタデータ変更
export async function generateMetadata({ params }: UserItemsPageProps) {
  const { handle } = await params
  const result = await getUserPublicItemsByHandle(handle)

  return {
    title: `${userName}さんのアイテム`,
    description: `${userName}さんが公開しているアイテム情報とレビュー`,
  }
}
```

#### 6.2 app/items/ 作成（新規）

**参考**: `app/devices/page.tsx`

**ディレクトリ構造**:
```bash
app/items/
├── page.tsx
└── components/
    ├── ItemCard.tsx
    ├── ItemFilters.tsx
    └── ItemListSection.tsx
```

**実装内容**:

1. **page.tsx**
```typescript
import { Suspense } from 'react'
import { Metadata } from 'next'
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getUserNavData } from "@/lib/user-data"
import { getPublicItems, getItemCategories, getBrands } from '@/app/actions/item-actions'
import { ItemListSection } from './components/ItemListSection'
import { PublicItemListSkeleton } from './components/PublicItemListSkeleton'

export const metadata: Metadata = {
  title: 'アイテム一覧 | ALTEE',
  description: 'PC周辺機器・商品のデータベース。スペック情報やユーザーレビューを確認できます。',
}

interface PublicItemsPageProps {
  searchParams: Promise<{
    category?: string
    brand?: string
    search?: string
  }>
}

export default async function PublicItemsPage({ searchParams }: PublicItemsPageProps) {
  const resolvedSearchParams = await searchParams
  const user = await getUserNavData()

  return (
    <BaseLayout variant="public" user={user}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">アイテム一覧</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            PC周辺機器・商品のデータベース。詳細なスペック情報やユーザーレビューを確認できます。
          </p>
        </div>

        <Suspense fallback={<PublicItemListSkeleton />}>
          <ItemContent searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </BaseLayout>
  )
}

async function ItemContent({ searchParams }: {
  searchParams: { category?: string; brand?: string; search?: string }
}) {
  const [items, categories, brands] = await Promise.all([
    getPublicItems(searchParams.category, searchParams.brand, searchParams.search),
    getItemCategories(),
    getBrands()
  ])

  return (
    <ItemListSection
      items={items}
      categories={categories}
      brands={brands}
      initialFilters={searchParams}
    />
  )
}
```

2. **ItemCard.tsx**（DeviceCard.tsx から移植）
```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { ItemImage } from "@/components/items/item-image"  // 新規作成必要
import { ItemWithDetails } from '@/types/item'
import { AmazonLinkButton } from './AmazonLinkButton'

interface ItemCardProps {
  item: ItemWithDetails
}

export function ItemCard({ item }: ItemCardProps) {
  const userCount = item.userItems.length

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
          <AmazonLinkButton amazonUrl={item.amazonUrl} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-start space-x-3">
          <ItemImage
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
            {item.asin && (
              <div className="text-xs text-muted-foreground mt-1">
                ASIN: {item.asin}
              </div>
            )}
          </div>
        </div>

        {item.description && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {item.description}
            </p>
          </div>
        )}

        <div className="pt-3 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {userCount}人が使用中
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Phase 7: コンポーネント作成（60分 → 90分）

#### 7.1 components/items/ 作成

**元ディレクトリ**: `components/products/`（ProductImageから移行）

**ディレクトリ構造**:
```bash
components/items/
└── item-image.tsx  # components/products/product-image.tsx から移行
```

**実装内容**:

```typescript
// components/items/item-image.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Package } from 'lucide-react'

interface ItemImageProps {
  imageStorageKey?: string | null
  customImageUrl?: string | null
  amazonImageUrl?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
}

export function ItemImage({
  imageStorageKey,
  customImageUrl,
  amazonImageUrl,
  alt,
  width = 200,
  height = 200,
  className = '',
}: ItemImageProps) {
  const [imageError, setImageError] = useState(false)

  // 優先順位: R2保存画像 > カスタム画像 > Amazon画像
  const imageUrl = imageStorageKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/item-images/${imageStorageKey.replace('item-images/', '')}`
    : customImageUrl || amazonImageUrl

  if (!imageUrl || imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={{ width, height }}
      >
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setImageError(true)}
    />
  )
}
```

**ProductImageからの主な変更点**:
1. **コンポーネント名**: `ProductImage` → `ItemImage`
2. **インターフェース名**: `ProductImageProps` → `ItemImageProps`
3. **プレースホルダーパス**: `/images/product-placeholder.svg` → `/images/item-placeholder.svg`
4. **R2パス**: `product-images/` → `item-images/`
5. **メモ化・最適化**: `components/products/product-image.tsx`の実装（React.memo等）をそのまま移行

#### 7.2 プレースホルダー画像作成

**ファイル**: `public/images/item-placeholder.svg`

**作成方法**:
```bash
# product-placeholder.svg をコピー（存在する場合）
cp public/images/product-placeholder.svg public/images/item-placeholder.svg

# または、新規作成（存在しない場合）
# シンプルなPackageアイコンのSVG
```

---

### Phase 8: ナビゲーション・設定更新（45分）

#### 8.1 lib/layout-config.ts 更新

**変更箇所**:

1. **管理画面ナビゲーション**
```typescript
// Before
{
  name: "商品",
  url: "/admin/products",
  icon: Package
},
{
  name: "カテゴリ",
  url: "/admin/categories",
  icon: FolderTree
},

// After
{
  name: "アイテム",
  url: "/admin/items",
  icon: Package
},
{
  name: "アイテムカテゴリ",
  url: "/admin/item-categories",
  icon: FolderTree
},
```

2. **ダッシュボードナビゲーション**
```typescript
// Before
{
  name: "商品",
  url: "/dashboard/products",
  icon: Package
},

// After
{
  name: "アイテム",
  url: "/dashboard/items",
  icon: Package
},
```

3. **ユーザー公開ページナビゲーション**（app/[handle]/layout.tsx内）
```typescript
// Before
{
  name: "商品",
  url: `/@${handle}/products`,
  icon: Package
},

// After
{
  name: "アイテム",
  url: `/@${handle}/items`,
  icon: Package
},
```

#### 8.2 middleware.ts 更新

**変更箇所**:

```typescript
// Before
const publicPaths = [
  // ...
  'products',  // /productsページ
]

// After
const publicPaths = [
  // ...
  'items',  // /itemsページ
]
```

#### 8.3 next.config.ts リダイレクト設定（新規）

**追加内容**:

```typescript
// next.config.ts
const nextConfig = {
  // ... 既存設定

  async redirects() {
    return [
      // Product → Item リダイレクト
      {
        source: '/admin/products/:path*',
        destination: '/admin/items/:path*',
        permanent: true,
      },
      {
        source: '/admin/categories/:path*',
        destination: '/admin/item-categories/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/products/:path*',
        destination: '/dashboard/items/:path*',
        permanent: true,
      },
      {
        source: '/@:handle/products/:path*',
        destination: '/@:handle/items/:path*',
        permanent: true,
      },
      // 将来的なDevice削除後のリダイレクト（Phase 10で追加）
      // {
      //   source: '/devices/:path*',
      //   destination: '/items/:path*',
      //   permanent: true,
      // },
    ]
  },
}
```

---

### Phase 9: R2画像・シードデータ確認（30分 → 45分）

**注意**: データがゼロなので、実際には移行不要。ただし、将来データが入った場合のための移行スクリプトを準備。

#### 9.1 R2画像フォルダ確認

```bash
# R2にproduct-images/フォルダが存在するか確認
# → 開発段階なので存在しないはず

# 将来データが入った場合の移行スクリプト
cat > scripts/migrate-product-to-item-images.sh << 'EOF'
#!/bin/bash

# product-images/ → item-images/ 移行スクリプト
# 注意: 本番環境では事前にバックアップ必須

echo "R2画像移行開始: product-images → item-images"

# AWS CLI または rclone を使用してコピー
# 例: rclone copy r2:altee-images/product-images r2:altee-images/item-images

# MediaFileテーブル更新
psql $DATABASE_URL -c "
  UPDATE media_files
  SET
    storage_key = REPLACE(storage_key, 'product-images/', 'item-images/'),
    container_name = 'item-images'
  WHERE container_name = 'product-images';
"

echo "R2画像移行完了"
EOF

chmod +x scripts/migrate-product-to-item-images.sh
```

#### 9.2 MediaFileテーブル確認

```bash
# MediaFileテーブルにproduct-images参照があるか確認
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  psql -c "SELECT COUNT(*) FROM media_files WHERE container_name = 'product-images';"

# → 開発段階なので0件のはず
```

#### 9.3 seed.ts 更新（重要！）

**ファイル**: `prisma/seed.ts`

**現状**: DeviceCategory用のシードデータが定義されている

**変更内容**:

1. **DeviceCategory → ItemCategory に更新**
```typescript
// Before (行8-33)
const mouseCategory = await prisma.deviceCategory.upsert({
  where: { slug: 'mouse' },
  update: {},
  create: {
    name: 'マウス',
    slug: 'mouse',
    icon: 'Mouse',
    description: 'PC用マウス・ポインティングデバイス',
    sortOrder: 1,
  },
})

// After
const mouseCategory = await prisma.itemCategory.upsert({
  where: { slug: 'mouse' },
  update: {},
  create: {
    name: 'マウス',
    slug: 'mouse',
    icon: 'Mouse',
    description: 'PC用マウス・ポインティングデバイス',
    itemType: 'PERIPHERAL',  // 追加
    sortOrder: 1,
  },
})
```

2. **CategoryAttribute削除**
```typescript
// Before (行36-60)
const mouseAttributes = [
  { name: 'DPI', type: 'NUMBER', unit: 'DPI', sortOrder: 1 },
  // ...
]

for (const attr of mouseAttributes) {
  await prisma.categoryAttribute.findFirst({ ... })
}

// After
// Attributes機能は削除（YAGNI原則）
// 将来必要になった場合はItemCategory用に再実装
```

3. **全カテゴリの更新**
```typescript
// keyboard, headset, monitor など全てのDeviceCategory → ItemCategory
// itemType を適切に設定:
// - マウス、キーボード、ヘッドセット → 'PERIPHERAL'
// - モニター → 'ELECTRONICS'
// - デスク、チェア → 'FURNITURE'
```

**実行後の確認**:
```bash
# シードデータ実行
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  npx prisma db seed

# 期待: ItemCategory が正常に作成される
```

---

### Phase 10: Device削除実行（90分）

**参照**: `docs/PLANS/device-system-removal-plan.md`

**手順**:

1. **Prismaスキーマから Device モデル削除**
```bash
# schema.prismaから以下を削除:
# - model Device
# - model DeviceCategory
# - model UserDevice
# - model DeviceAttribute
# - model CategoryAttribute
# - enum AttributeType
```

2. **マイグレーション実行**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  npx prisma migrate dev --name remove_device_system
```

3. **ディレクトリ・ファイル削除**
```bash
rm -rf app/admin/devices/
rm -rf app/dashboard/devices/
rm -rf app/[handle]/devices/
rm -rf app/devices/
rm -rf components/devices/
rm -f types/device.ts
rm -f app/actions/device-actions.ts
rm -f public/images/device-placeholder.svg
```

4. **インポート削除**
```bash
# Device関連のインポートを検索
grep -r "from '@/types/device'" app/ --include="*.tsx" --include="*.ts"
grep -r "device-actions" app/ --include="*.tsx" --include="*.ts"

# 見つかったファイルから手動削除
```

5. **ナビゲーション削除**
- `app/admin/page.tsx`: `/admin/devices` へのリンク削除
- `app/[handle]/layout.tsx`: `/@{handle}/devices` へのリンク削除
- `lib/layout-config.ts`: `/admin/devices`, `/dashboard/devices` 削除
- `middleware.ts`: `'devices'` パス保護設定削除

6. **リダイレクト追加**（next.config.ts）
```typescript
{
  source: '/devices/:path*',
  destination: '/items/:path*',
  permanent: true,
},
{
  source: '/@:handle/devices/:path*',
  destination: '/@:handle/items/:path*',
  permanent: true,
},
```

---

### Phase 11: 品質チェック（45分 → 60分）

#### 11.1 TypeScriptチェック

```bash
npx tsc --noEmit

# 期待: 0 errors
```

**よくあるエラー**:
- `Property 'product' does not exist` → `item` に変更漏れ
- `Cannot find module '@/types/product'` → `@/types/item` に変更漏れ

#### 11.2 ESLintチェック

```bash
npx eslint . --max-warnings=0

# 期待: 0 errors, 0 warnings
```

#### 11.3 ビルドチェック

```bash
npm run build

# 期待: ビルド成功
```

#### 11.4 開発サーバー起動

```bash
npm run dev

# 期待: エラーなく起動
```

#### 11.5 手動動作確認

**管理画面**:
- [ ] `/admin/items` アクセス可能
- [ ] アイテム作成フォーム動作
- [ ] `/admin/item-categories` アクセス可能
- [ ] カテゴリ作成フォーム動作

**ダッシュボード**:
- [ ] `/dashboard/items` アクセス可能
- [ ] アイテム追加モーダル動作
- [ ] ドラッグ&ドロップ並び替え動作

**公開ページ**:
- [ ] `/items` アクセス可能
- [ ] フィルタ・検索動作
- [ ] `/@{handle}/items` アクセス可能

**リダイレクト**:
- [ ] `/admin/products` → `/admin/items` リダイレクト
- [ ] `/dashboard/products` → `/dashboard/items` リダイレクト
- [ ] `/@test/products` → `/@test/items` リダイレクト
- [ ] `/devices` → `/items` リダイレクト

#### 11.6 MCP Playwright自動テスト（推奨）

**テスト対象**:

1. **管理画面 - アイテム一覧**
```typescript
// /admin/items アクセス
await mcp__playwright__browser_navigate({ url: 'http://localhost:3000/admin/items' })
const snapshot = await mcp__playwright__browser_snapshot()
const screenshot = await mcp__playwright__browser_take_screenshot({ fullPage: true })

// 新規作成ボタン確認
const hasButton = snapshot.includes('新規アイテム') || snapshot.includes('新規作成')
```

2. **公開ページ - アイテム一覧表示**
```typescript
await mcp__playwright__browser_navigate({ url: 'http://localhost:3000/items' })
const snapshot = await mcp__playwright__browser_snapshot()
const screenshot = await mcp__playwright__browser_take_screenshot({ fullPage: true })

// ページタイトル確認
const hasTitle = snapshot.includes('アイテム一覧')
```

3. **リダイレクト確認**
```typescript
// 旧URL → 新URLへのリダイレクト
await mcp__playwright__browser_navigate({ url: 'http://localhost:3000/admin/products' })
const currentUrl = await mcp__playwright__browser_evaluate({ script: 'window.location.href' })
// currentUrl === 'http://localhost:3000/admin/items' を確認
```

4. **コンソールエラー確認**
```typescript
const consoleMessages = await mcp__playwright__browser_console_messages()
// エラー・警告がないことを確認
```

**期待結果**:
- [ ] 全ページが正常に表示
- [ ] リダイレクトが正常動作
- [ ] コンソールエラーゼロ
- [ ] スクリーンショットで視覚的に確認

---

### Phase 12: Git Commit（10分）

```bash
git add .
git commit -m "refactor: Migrate Product system to Item system

Major Changes:
- Rename Product → Item, ProductCategory → ItemCategory, UserProduct → UserItem
- Rename ProductType → ItemType enum
- Update all URLs: /products → /items, /categories → /item-categories
- Update R2 folder: product-images → item-images
- Create public item listing page at /items
- Remove Device system completely
- Add redirects for old URLs

Database Changes:
- Migrate products table → items table
- Migrate product_categories table → item_categories table
- Migrate user_products table → user_items table

Breaking Changes:
- All Product-related APIs renamed to Item
- URL structure changed (permanent redirects added)
- Device system removed

Benefits:
- More user-friendly Japanese terminology (アイテム)
- Shorter URLs (/items vs /products)
- Better future extensibility (software, services, etc.)
- Eliminated Device/Product duplication

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Phase 13: ドキュメント更新（30分）

#### 13.1 GUIDEのリネーム・更新

**ファイル**: `docs/GUIDES/product-management-guide.md` → `item-management-guide.md`

**変更内容**:

1. **ファイルリネーム**
```bash
cd docs/GUIDES/
mv product-management-guide.md item-management-guide.md
```

2. **全内容の更新**
- 全ての「商品」→「アイテム」に変更
- 全ての「Product」→「Item」に変更
- 全ての「product」→「item」に変更
- URL例の更新: `/admin/products` → `/admin/items`
- パス例の更新: `app/admin/products/` → `app/admin/items/`
- モデル名の更新: `Product`, `ProductCategory`, `UserProduct` → `Item`, `ItemCategory`, `UserItem`
- スクリーンショットの更新（あれば再撮影）

3. **タイトル・説明の更新**
```markdown
Before:
# 商品管理ガイド

ALTEE の商品管理システムの使い方...

After:
# アイテム管理ガイド

ALTEE のアイテム管理システムの使い方...
```

#### 13.2 LOGS参照更新（オプショナル）

**対象**: `docs/LOGS/unified-product-system/*.md`

**変更内容**:
- 各ログファイルの冒頭に注釈追加（歴史的記録として保持）

```markdown
> **注意**: このログは Product システムの実装記録です。
> 2025-12-31以降、Productシステムは「Item」システムに名称変更されています。
> - Product → Item
> - ProductCategory → ItemCategory
> - UserProduct → UserItem
> - `/products` → `/items`
> - `/admin/products` → `/admin/items`
```

**影響度**: 低（歴史的記録の正確性向上）
**優先度**: 低（後日対応可）

#### 13.3 README更新（オプショナル）

**ファイル**: `README.md`（もしあれば）

**変更内容**:
- システム構成図の更新
- "Product" → "Item" への用語変更
- URL例の更新

**チェックリスト**:
- [ ] product-management-guide.md → item-management-guide.md リネーム完了
- [ ] ガイド内容の全面更新完了（Product → Item）
- [ ] LOGS注釈追加（オプショナル）

---

## 4. リスク分析

### 4.1 想定されるリスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| データ消失 | なし | 0% | データゼロのため影響なし |
| 型エラー大量発生 | 高 | 40% | TypeScript strict mode で全検出、段階的修正 |
| インポート漏れ | 中 | 30% | grep で全ファイル検索、手動確認 |
| R2画像消失 | なし | 0% | データゼロのため影響なし |
| ビルドエラー | 中 | 20% | Phase 11で事前検出 |
| リダイレクト設定漏れ | 低 | 10% | next.config.ts で一元管理 |

### 4.2 ロールバックプラン

**Phase 0のバックアップから復元**:
```bash
git reset --hard <backup-commit-hash>

# データベースも復元（必要な場合）
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  psql < backups/pre-item-migration-YYYYMMDD-HHMMSS.sql
```

**またはマイグレーション巻き戻し**:
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  npx prisma migrate resolve --rolled-back product_to_item_migration
```

---

## 5. 最終構成

### 5.1 システム構成

```
統合後のシステム:

1. ブログシステム
   ├── Category (ブログカテゴリ)
   ├── Tag (ブログタグ)
   ├── Article
   ├── ArticleCategory
   └── ArticleTag

   管理画面: /admin/attributes/

2. アイテム管理システム（Item）
   ├── ItemCategory (25種類 + 階層構造対応)
   ├── Item
   └── UserItem

   管理画面: /admin/items/, /admin/item-categories/
   ダッシュボード: /dashboard/items/
   公開ページ: /items, /@handle/items

3. 共通
   ├── Brand（商品・デバイス共通）
   └── User
```

### 5.2 削減される複雑性

**Before（移行前）**:
- モデル数: 12モデル（Device: 6, Product: 3, Blog: 3）
- URL構造: `/devices`, `/products`, `/categories`（混乱しやすい）
- 画像フォルダ: `device-images/`, `product-images/`
- 用語: "デバイス", "商品", "プロダクト"（統一感なし）

**After（移行後）**:
- モデル数: 6モデル（Item: 3, Blog: 3）
- URL構造: `/items`, `/item-categories`（シンプル）
- 画像フォルダ: `item-images/`
- 用語: "アイテム"（統一）

**削減率**:
- モデル数: 50%削減（12 → 6）
- コードベース: 約40%削減
- メンテナンスコスト: 大幅削減

---

## 6. 完了条件

以下の全てが満たされた時、移行完了とする:

1. ✅ Itemモデルがデータベースに存在
2. ✅ Productモデルがデータベースに存在しない
3. ✅ Deviceモデルがデータベースに存在しない
4. ✅ Item関連ディレクトリが存在
5. ✅ Product関連ディレクトリが存在しない
6. ✅ Device関連ディレクトリが存在しない
7. ✅ TypeScript/ESLintエラーゼロ
8. ✅ ビルド成功
9. ✅ 全ての管理画面が正常動作
10. ✅ 全ての公開ページが正常動作
11. ✅ リダイレクトが正常動作
12. ✅ Git commitに記録

---

## 7. チェックリスト

### 実行前

- [ ] 現在の状態をGitコミット（バックアップ）
- [ ] データベースが空であることを確認
- [ ] `/admin/attributes` がブログ用であることを再確認
- [ ] `/admin/categories` がProductCategory管理であることを確認

### Phase 1: Prismaスキーマ変更

- [ ] ProductCategory → ItemCategory リネーム完了
- [ ] Product → Item リネーム完了
- [ ] UserProduct → UserItem リネーム完了
- [ ] ProductType → ItemType リネーム完了
- [ ] User.userProducts → User.userItems 変更完了
- [ ] Brand.products → Brand.items 変更完了
- [ ] **Brand リレーション名変更完了（ProductBrand → ItemBrand）** ⚠️重要
- [ ] マイグレーション実行成功

### Phase 2: 型定義・バリデーション

- [ ] types/item.ts 作成完了
- [ ] lib/validation/item.ts 作成完了
- [ ] 全型定義のインポート確認

### Phase 3: Server Actions

- [ ] app/actions/item-actions.ts 作成完了
- [ ] app/admin/items/actions.ts 作成完了
- [ ] app/admin/item-categories/actions.ts 作成完了
- [ ] 全関数名変更確認
- [ ] 全Prisma呼び出し変更確認

### Phase 4-6: UI移行

- [ ] app/admin/items/ 作成完了
- [ ] app/admin/item-categories/ 作成完了
- [ ] app/dashboard/items/ 作成完了
- [ ] app/[handle]/items/ 作成完了
- [ ] app/items/ 作成完了（新規公開ページ）

### Phase 7: コンポーネント

- [ ] components/items/item-image.tsx 作成完了
- [ ] components/products/ → components/items/ 移行完了
- [ ] /images/item-placeholder.svg 作成完了

### Phase 8: ナビゲーション

- [ ] lib/layout-config.ts 更新完了
- [ ] middleware.ts 更新完了
- [ ] next.config.ts リダイレクト設定完了

### Phase 9: R2画像・シードデータ

- [ ] R2画像フォルダ確認（データゼロ確認）
- [ ] MediaFileテーブル確認（データゼロ確認）
- [ ] seed.ts 更新完了（DeviceCategory → ItemCategory）
- [ ] CategoryAttribute削除確認

### Phase 10: Device削除

- [ ] Prismaスキーマから Device モデル削除完了
- [ ] マイグレーション実行成功
- [ ] Device関連ディレクトリ削除完了
- [ ] Device関連インポート削除完了
- [ ] Device関連ナビゲーション削除完了
- [ ] Device→Itemリダイレクト設定完了

### Phase 11: 品質チェック

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] `npm run build` 成功
- [ ] 開発サーバー起動成功
- [ ] `/admin/items` アクセス可能
- [ ] `/admin/item-categories` アクセス可能
- [ ] `/dashboard/items` アクセス可能
- [ ] `/items` アクセス可能
- [ ] `/@{handle}/items` アクセス可能
- [ ] リダイレクト動作確認
- [ ] MCP Playwright自動テスト完了（推奨）
- [ ] コンソールエラーゼロ確認

### Phase 12: Git Commit

- [ ] Git commit完了
- [ ] コミットメッセージ詳細記載

### Phase 13: ドキュメント更新

- [ ] product-management-guide.md → item-management-guide.md リネーム完了
- [ ] ガイド内容の全面更新完了（Product → Item）
- [ ] LOGS注釈追加（オプショナル）

---

## 8. 実装時間の見積もり

| Phase | 内容 | 推定時間 |
|-------|------|---------|
| Phase 0 | バックアップ・準備 | 10分 |
| Phase 1 | Prismaスキーマ変更 | 30分 |
| Phase 2 | 型定義・バリデーション | 45分 |
| Phase 3 | Server Actions | 90分 |
| Phase 4 | 管理画面UI | 120分 |
| Phase 5 | ダッシュボードUI | 90分 |
| Phase 6 | 公開ページUI | 120分 |
| Phase 7 | コンポーネント | **90分** ⬆️ |
| Phase 8 | ナビゲーション・設定 | 45分 |
| Phase 9 | R2画像・シードデータ確認 | **45分** ⬆️ |
| Phase 10 | Device削除 | 90分 |
| Phase 11 | 品質チェック | **60分** ⬆️ |
| Phase 12 | Git Commit | 10分 |
| Phase 13 | **ドキュメント更新** | **30分** 🆕 |

**合計**: 約**13.5時間**（約**1.7日**）

**変更点**:
- Phase 7: 60分 → 90分（components/products/ 移行 + placeholder画像追加）
- Phase 9: 30分 → 45分（seed.ts更新追加）
- Phase 11: 45分 → 60分（MCP Playwright自動テスト追加）
- Phase 13: 新規追加（ドキュメント更新）
- 合計: 12.5時間 → 13.5時間

---

## 9. 参考資料

- [Device削除計画](./device-system-removal-plan.md)
- [Product R2画像保存機能 実装ログ](../LOGS/unified-product-system/r2-image-storage-implementation.md)
- [Phase 3 Part 2 実装ログ](../LOGS/unified-product-system/phase3-part2-implementation.md)

---

**作成日**: 2025-12-31
**作成者**: Claude Code (Claude Sonnet 4.5)
**承認**: ユーザー承認待ち
**ステータス**: 計画策定完了

---

## 10. レビュープロセス（Phase 3 Part 2と同様）

### 10.1 LOGSディレクトリ作成

```bash
mkdir -p docs/LOGS/product-to-item-migration
```

### 10.2 段階的レビューフロー

**ステップ1: 初期報告書作成**
- Claude Code が実装計画報告書を作成
- ファイル: `docs/LOGS/product-to-item-migration/migration-plan-report.md`
- 内容: 本計画書の要約版（見やすく整理）

**ステップ2: Gemini One Opus レビュー依頼**
- ユーザーが Gemini One Opus に報告書をレビュー依頼
- Gemini が以下を確認:
  - 見落とし箇所の検出
  - リスク評価の妥当性
  - Phase順序の最適性
  - 追加推奨事項

**ステップ3: レビュー結果記録**
- Gemini のレビュー結果を記録
- ファイル: `docs/LOGS/product-to-item-migration/gemini-review.md`
- 内容:
  - 発見された問題点
  - 推奨される修正
  - 追加すべき項目

**ステップ4: Claude Code による返信**
- Claude Code がレビュー結果を分析
- ファイル: `docs/LOGS/product-to-item-migration/claude-response.md`
- 内容:
  - 各指摘への対応方針
  - 計画書への反映内容
  - 修正の必要性判断

**ステップ5: 計画書更新 or 確定**
- 必要に応じて本計画書を更新
- または、レビュー結果を承認して実装開始

**ステップ6: 実装ログ作成**
- 各Phase実行時に実装ログを記録
- ファイル: `docs/LOGS/product-to-item-migration/implementation-log.md`
- 内容:
  - Phase別の実行結果
  - 発生した問題と解決策
  - TypeScript/ESLintエラー対応
  - 最終的な動作確認結果

### 10.3 ログファイル構成

```bash
docs/LOGS/product-to-item-migration/
├── migration-plan-report.md       # Claude初期報告書
├── gemini-review.md               # Geminiレビュー結果
├── claude-response.md             # Claudeの返信・対応方針
├── implementation-log.md          # 実装ログ（Phase別）
└── final-verification-report.md  # 最終検証レポート
```

---

## 11. 次のステップ

### ステップ1: 初期報告書作成（今すぐ）
```bash
# Claude Code が migration-plan-report.md を作成
# → ユーザーに確認を依頼
```

### ステップ2: Gemini レビュー依頼（ユーザー操作）
```bash
# ユーザーが migration-plan-report.md を Gemini に送信
# → Gemini が gemini-review.md を作成
```

### ステップ3: Claude 返信作成（Claude操作）
```bash
# Claude が gemini-review.md を分析
# → claude-response.md を作成
# → 必要に応じて本計画書を更新
```

### ステップ4: ユーザー最終承認
```bash
# ユーザーが全レビュー結果を確認
# → 実装開始のGo/No-Go判断
```

### ステップ5: 実装開始
```bash
# Phase 0 から順次実行
# → 各Phase完了時に implementation-log.md 更新
# → 問題発生時は即座に報告・対応
```

---

**重要**: この計画書は包括的ですが、実装中に予期しない問題が発生する可能性があります。Phase 3 Part 2 と同様に、段階的なレビュープロセスを経て、安全に実装を進めます。
