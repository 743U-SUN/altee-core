# Product→Item移行 実装ログ（Phase 3）

**実装日**: 2026-01-01
**実装者**: Claude Code (Claude Sonnet 4.5)
**対象フェーズ**: Phase 3: Server Actions

---

## 実装サマリー

### 完了したPhase

- ✅ **Phase 3**: Server Actions（90分予定 → 実際: 約60分）

### 次のPhase

- ⏳ **Phase 4**: 管理画面UI（120分予定）

---

## Phase 3: Server Actions

### 実施内容

#### 3.1 app/actions/item-actions.ts 更新

**ファイル**: `app/actions/item-actions.ts` (377行)

**変更内容**:

1. **関数名変更**
```typescript
// Before → After
getUserProducts → getUserItems
createUserProduct → createUserItem
updateUserProduct → updateUserItem
deleteUserProduct → deleteUserItem
reorderUserProducts → reorderUserItems
getUserPublicProductsByHandle → getUserPublicItemsByHandle
getProducts → getItems
```

2. **Prisma呼び出し変更**
```typescript
// Before
prisma.product.findMany(...)
prisma.product.create(...)
prisma.userProduct.findUnique(...)

// After
prisma.item.findMany(...)
prisma.item.create(...)
prisma.userItem.findUnique(...)
```

3. **フィールド名変更**
```typescript
// Before
productId: string
userProduct.productId

// After
itemId: string
userItem.itemId
```

4. **パスrevalidation変更**
```typescript
// Before
revalidatePath('/dashboard/products')
revalidatePath(`/@${user.handle}/products`)

// After
revalidatePath('/dashboard/items')
revalidatePath(`/@${user.handle}/items`)
```

5. **エラーメッセージ変更**
- "商品" → "アイテム" (全箇所)
- "ユーザー商品" → "ユーザーアイテム" (全箇所)

**主要な関数例**:

```typescript
// getUserItems関数（行31-46）
export async function getUserItems(userId: string) {
  const userItems = await prisma.userItem.findMany({
    where: { userId },
    include: {
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return userItems
}

// createUserItem関数（行51-131）
export async function createUserItem(userId: string, data: UserItemInput) {
  try {
    // バリデーション
    const validated = userItemSchema.parse(data)

    // アイテムの存在確認
    const item = await prisma.item.findUnique({
      where: { id: validated.itemId },
    })

    if (!item) {
      return {
        success: false,
        error: '指定されたアイテムが見つかりませんでした',
      }
    }

    // 既に追加されていないかチェック
    const exists = await checkUserItemExists(userId, validated.itemId)
    if (exists) {
      return {
        success: false,
        error: 'このアイテムは既に追加されています',
      }
    }

    // 新しいアイテムを追加
    const userItem = await prisma.userItem.create({
      data: {
        userId,
        itemId: validated.itemId,
        review: validated.review,
        isPublic: validated.isPublic,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
      include: { item: { include: { category: true, brand: true } } },
    })

    revalidatePath('/dashboard/items')
    if (user?.handle) {
      revalidatePath(`/@${user.handle}/items`)
    }

    return { success: true, data: userItem }
  } catch (error) {
    // ...
  }
}
```

#### 3.2 ディレクトリリネーム: categories → item-categories

**コマンド**:
```bash
mv app/admin/categories app/admin/item-categories
```

**影響範囲**:
- `app/admin/item-categories/[id]/page.tsx`
- `app/admin/item-categories/actions.ts`
- `app/admin/item-categories/components/`
- `app/admin/item-categories/new/page.tsx`
- `app/admin/item-categories/page.tsx`

#### 3.3 app/admin/item-categories/actions.ts 更新

**ファイル**: `app/admin/item-categories/actions.ts` (323行)

**変更内容**:

1. **インポート変更**
```typescript
// Before
import {
  productCategorySchema,
  type ProductCategoryInput,
} from '@/lib/validation/product'

// After
import {
  itemCategorySchema,
  type ItemCategoryInput,
} from '@/lib/validation/item'
```

2. **Prisma呼び出し変更**
```typescript
// Before
prisma.productCategory.findMany(...)
prisma.productCategory.create(...)

// After
prisma.itemCategory.findMany(...)
prisma.itemCategory.create(...)
```

3. **フィールド名変更**
```typescript
// Before
productType: validated.productType
_count: { select: { products: true, children: true } }

// After
itemType: validated.itemType
_count: { select: { items: true, children: true } }
```

4. **パスrevalidation変更**
```typescript
// Before
revalidatePath('/admin/categories')

// After
revalidatePath('/admin/item-categories')
```

5. **エラーメッセージ変更**
```typescript
// Before
error: `このカテゴリには${category._count.products}件の商品が紐づいています。先に商品を削除または移動してください。`

// After
error: `このカテゴリには${category._count.items}件のアイテムが紐づいています。先にアイテムを削除または移動してください。`
```

**主要な関数例**:

```typescript
// getCategoriesAction関数（行12-36）
export async function getCategoriesAction() {
  try {
    const categories = await prisma.itemCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            items: true,
            children: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return {
      success: false,
      error: 'カテゴリの取得に失敗しました',
    }
  }
}

// createCategoryAction関数（行75-135）
export async function createCategoryAction(input: ItemCategoryInput) {
  try {
    // バリデーション
    const validated = itemCategorySchema.parse(input)

    // slugの重複チェック
    const existingCategory = await prisma.itemCategory.findUnique({
      where: { slug: validated.slug },
    })

    if (existingCategory) {
      return {
        success: false,
        error: 'このスラッグは既に使用されています',
      }
    }

    // カテゴリ作成
    const category = await prisma.itemCategory.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        parentId: validated.parentId || null,
        itemType: validated.itemType,
        requiresCompatibilityCheck: validated.requiresCompatibilityCheck,
        icon: validated.icon || null,
        description: validated.description || null,
        sortOrder: validated.sortOrder,
      },
    })

    revalidatePath('/admin/item-categories')
    return { success: true, data: category }
  } catch (error) {
    // ...
  }
}
```

#### 3.4 ディレクトリリネーム: products → items

**コマンド**:
```bash
mv app/admin/products app/admin/items
```

**影響範囲**:
- `app/admin/items/[id]/page.tsx`
- `app/admin/items/actions.ts`
- `app/admin/items/components/`
- `app/admin/items/import/`
- `app/admin/items/new/page.tsx`
- `app/admin/items/page.tsx`

#### 3.5 app/admin/items/actions.ts 更新

**ファイル**: `app/admin/items/actions.ts` (657行)

**変更内容**:

1. **インポート変更**
```typescript
// Before
import {
  productSchema,
  type ProductInput,
  type ProductCSVRow,
  type CSVImportResult,
} from '@/lib/validation/product'

// After
import {
  itemSchema,
  type ItemInput,
  type ItemCSVRow,
  type CSVImportResult,
} from '@/lib/validation/item'
```

2. **関数名変更**
```typescript
// Before → After
getProductsAction → getItemsAction
getProductByIdAction → getItemByIdAction
createProductAction → createItemAction
updateProductAction → updateItemAction
deleteProductAction → deleteItemAction
importProductsFromCSVAction → importItemsFromCSVAction
downloadAndUploadProductImage → downloadAndUploadItemImage
deleteProductImageFromR2 → deleteItemImageFromR2
refreshProductImage → refreshItemImage
```

3. **型定義変更**
```typescript
// Before
interface GetProductsFilters { ... }
ProductInput
ProductCSVRow

// After
interface GetItemsFilters { ... }
ItemInput
ItemCSVRow
```

4. **Prisma呼び出し変更**
```typescript
// Before
prisma.product.findMany(...)
prisma.product.create(...)
prisma.productCategory.findUnique(...)

// After
prisma.item.findMany(...)
prisma.item.create(...)
prisma.itemCategory.findUnique(...)
```

5. **変数名変更**
```typescript
// Before
const product = await prisma.item...
const existingProduct = ...
const duplicateProduct = ...

// After
const item = await prisma.item...
const existingItem = ...
const duplicateItem = ...
```

6. **リレーション名変更**
```typescript
// Before
_count: { select: { userProducts: true } }

// After
_count: { select: { userItems: true } }
```

7. **画像フォルダ変更**
```typescript
// Before
const folder = 'product-images'

// After
const folder = 'item-images'
```

8. **パスrevalidation変更**
```typescript
// Before
revalidatePath('/admin/products')
revalidatePath(`/admin/products/${productId}`)

// After
revalidatePath('/admin/items')
revalidatePath(`/admin/items/${productId}`)
```

9. **エラーメッセージ変更**
```typescript
// Before
error: '商品が見つかりませんでした'
error: '商品の取得に失敗しました'
error: '商品の作成に失敗しました'

// After
error: 'アイテムが見つかりませんでした'
error: 'アイテムの取得に失敗しました'
error: 'アイテムの作成に失敗しました'
```

**主要な関数例**:

```typescript
// getItemsAction関数（行41-101）
export async function getItemsAction(filters: GetItemsFilters = {}) {
  try {
    const { categoryId, brandId, search, page = 1, perPage = 20 } = filters

    const where = {
      AND: [
        categoryId ? { categoryId } : {},
        brandId ? { brandId } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {},
      ],
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: true,
          brand: true,
          _count: {
            select: {
              userItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.item.count({ where }),
    ])

    return {
      success: true,
      data: {
        items,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    }
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return {
      success: false,
      error: 'アイテムの取得に失敗しました',
    }
  }
}

// createItemAction関数（行139-236）
export async function createItemAction(input: ItemInput) {
  try {
    // "null" 文字列を null に変換
    const normalizedInput = {
      ...input,
      brandId: input.brandId === 'null' ? null : input.brandId,
    }

    // バリデーション
    const validated = itemSchema.parse(normalizedInput)

    // カテゴリの存在確認
    const category = await prisma.itemCategory.findUnique({
      where: { id: validated.categoryId },
    })

    if (!category) {
      return {
        success: false,
        error: '指定されたカテゴリが見つかりませんでした',
      }
    }

    // 画像URLがある場合はR2にダウンロード・アップロード
    let imageStorageKey: string | undefined = validated.imageStorageKey || undefined
    const imageUrl = validated.customImageUrl || validated.amazonImageUrl
    if (imageUrl && validated.asin) {
      const uploadResult = await downloadAndUploadItemImage(imageUrl, validated.asin)
      if (uploadResult.success) {
        imageStorageKey = uploadResult.storageKey
      } else {
        console.error('画像アップロード失敗:', uploadResult.error)
        // 画像アップロード失敗してもアイテム作成は続行
      }
    }

    // アイテム作成
    const item = await prisma.item.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        categoryId: validated.categoryId,
        brandId: validated.brandId || null,
        amazonUrl: validated.amazonUrl || null,
        amazonImageUrl: validated.amazonImageUrl || null,
        customImageUrl: validated.customImageUrl || null,
        imageStorageKey,
        ogTitle: validated.ogTitle || null,
        ogDescription: validated.ogDescription || null,
        asin: validated.asin || null,
      },
    })

    revalidatePath('/admin/items')
    return { success: true, data: item }
  } catch (error) {
    // ...
  }
}

// downloadAndUploadItemImage関数（行524-600）
export async function downloadAndUploadItemImage(
  imageUrl: string,
  asin: string,
  uploaderId?: string
): Promise<{
  success: boolean
  storageKey?: string
  error?: string
}> {
  try {
    // アップロード者IDを取得
    let finalUploaderId = uploaderId
    if (!finalUploaderId) {
      const session = await auth()
      if (!session?.user?.id) {
        return { success: false, error: '認証が必要です' }
      }
      finalUploaderId = session.user.id
    }

    // 画像をダウンロード
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return { success: false, error: '画像のダウンロードに失敗しました' }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Content-Typeから拡張子を決定
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    let extension = 'jpg'
    if (contentType.includes('png')) extension = 'png'
    else if (contentType.includes('gif')) extension = 'gif'
    else if (contentType.includes('webp')) extension = 'webp'

    // ファイル名: item-images/{asin}.{ext}
    const fileName = `${asin}.${extension}`
    const folder = 'item-images'
    const storageKey = `${folder}/${fileName}`
    const fullStorageKey = `altee-images/${storageKey}`

    // R2にアップロード
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { storageClient } = await import('@/lib/storage')

    await storageClient.send(new PutObjectCommand({
      Bucket: 'altee-images',
      Key: storageKey,
      Body: buffer,
      ContentType: contentType,
    }))

    // MediaFileに記録（既存の場合は更新）
    await prisma.mediaFile.upsert({
      where: { storageKey: fullStorageKey },
      create: {
        storageKey: fullStorageKey,
        fileName,
        originalName: fileName,
        fileSize: buffer.length,
        mimeType: contentType,
        uploadType: 'SYSTEM',
        containerName: folder,
        uploaderId: finalUploaderId,
      },
      update: {
        fileName,
        originalName: fileName,
        fileSize: buffer.length,
        mimeType: contentType,
        uploaderId: finalUploaderId,
      }
    })

    return { success: true, storageKey }
  } catch (error) {
    console.error('アイテム画像ダウンロード・アップロードエラー:', error)
    return { success: false, error: '画像の保存に失敗しました' }
  }
}
```

---

## Phase 3 完了チェックリスト

### ✅ app/actions/item-actions.ts
- [x] 全関数名を Product → Item に変更
- [x] Prisma呼び出しを product → item に変更
- [x] フィールド名を productId → itemId に変更
- [x] userProducts → userItems に変更
- [x] パスrevalidationを /dashboard/products → /dashboard/items に変更
- [x] エラーメッセージを "商品" → "アイテム" に変更

### ✅ app/admin/item-categories/
- [x] ディレクトリを categories/ → item-categories/ にリネーム
- [x] actions.ts: ProductCategoryInput → ItemCategoryInput
- [x] actions.ts: productCategorySchema → itemCategorySchema
- [x] actions.ts: prisma.productCategory → prisma.itemCategory
- [x] actions.ts: productType → itemType
- [x] actions.ts: products → items (_count)
- [x] actions.ts: パスrevalidationを /admin/categories → /admin/item-categories に変更
- [x] actions.ts: エラーメッセージを "商品" → "アイテム" に変更

### ✅ app/admin/items/
- [x] ディレクトリを products/ → items/ にリネーム
- [x] actions.ts: 全関数名を Product → Item に変更
- [x] actions.ts: 全型定義を Product → Item に変更
- [x] actions.ts: prisma.product → prisma.item に変更
- [x] actions.ts: prisma.productCategory → prisma.itemCategory に変更
- [x] actions.ts: userProducts → userItems に変更
- [x] actions.ts: 画像フォルダを product-images → item-images に変更
- [x] actions.ts: パスrevalidationを /admin/products → /admin/items に変更
- [x] actions.ts: 全エラーメッセージを "商品" → "アイテム" に変更

---

## 発生した問題と解決策

### ✅ 問題1: 変数名の残存（linter検出）→ 解決済み

**問題**: 一部のreturn文で変数名が `product` のまま残っていた

**箇所**:
- `createItemAction` 関数: `return { success: true, data: product }` (行222)
- `updateItemAction` 関数: `return { success: true, data: product }` (行348)
- `deleteItemAction` 関数: `if (!product)`, `product._count`, `product.imageStorageKey` (行380, 388, 396)
- `refreshItemImage` 関数: パラメータ名 `productId` および変数参照 `product` (行605-636)

**原因**: `replace_all` で `const product =` は置換したが、return文や条件文の変数参照は別途修正が必要

**対応**: 全箇所を手動で修正完了
- `return { success: true, data: product }` → `return { success: true, data: item }`
- `product._count` → `item._count`
- `product.imageStorageKey` → `item.imageStorageKey`
- `refreshItemImage(productId: string)` → `refreshItemImage(itemId: string)`
- `console.error('Failed to create/update/delete product:')` → `console.error('Failed to create/update/delete item:')`

**コミット**: `d589972` で修正完了

---

## Gitコミット情報

### 初回コミット: `0b02d24`
**コミットメッセージ**:
```
feat: Complete Phase 3 - Server Actions migration (Product→Item)

- Updated app/actions/item-actions.ts (377 lines)
- Renamed app/admin/categories/ → app/admin/item-categories/
- Updated app/admin/item-categories/actions.ts (323 lines)
- Renamed app/admin/products/ → app/admin/items/
- Updated app/admin/items/actions.ts (657 lines)

Phase 3 完了。次のPhase 4（管理画面UI）に進む準備完了。
```

**変更統計**:
```
20 files changed, 365 insertions(+), 210 deletions(-)
```

### 修正コミット: `d589972`
**コミットメッセージ**:
```
fix: Correct remaining variable name references in items actions

- Fixed return statement: data: product → data: item (createItemAction, updateItemAction)
- Fixed variable references: product → item (deleteItemAction)
- Fixed function parameter: productId → itemId (refreshItemImage)
- Fixed console.error messages: 'product' → 'item'

All linter warnings resolved.
```

**変更統計**:
```
1 file changed, 20 insertions(+), 20 deletions(-)
```

**ファイル詳細**:
- `app/actions/item-actions.ts`: 修正済み
- `app/admin/categories/` → `app/admin/item-categories/`: リネーム
  - `[id]/page.tsx`: 移動
  - `actions.ts`: 修正済み
  - `components/`: 移動（内容は次Phase）
  - `new/page.tsx`: 移動
  - `page.tsx`: 移動
- `app/admin/products/` → `app/admin/items/`: リネーム
  - `[id]/page.tsx`: 移動
  - `actions.ts`: 修正済み
  - `components/`: 移動（内容は次Phase）
  - `import/`: 移動（内容は次Phase）
  - `new/page.tsx`: 移動
  - `page.tsx`: 移動

---

## 現在の状態

### 完了したファイル

```
✅ Phase 3完了:
├── app/actions/item-actions.ts                  # Server Actions (377行)
├── app/admin/item-categories/actions.ts         # Category Actions (323行)
└── app/admin/items/actions.ts                   # Item Actions (657行)

🔄 ディレクトリリネーム済み:
├── app/admin/categories/                        → app/admin/item-categories/
└── app/admin/products/                          → app/admin/items/

⚠️ 未完了（Phase 4で対応）:
├── app/admin/item-categories/components/        # UI Components
├── app/admin/item-categories/[id]/page.tsx      # Detail Page
├── app/admin/item-categories/new/page.tsx       # New Page
├── app/admin/item-categories/page.tsx           # List Page
├── app/admin/items/components/                  # UI Components
├── app/admin/items/import/                      # Import Page
├── app/admin/items/[id]/page.tsx                # Detail Page
├── app/admin/items/new/page.tsx                 # New Page
└── app/admin/items/page.tsx                     # List Page
```

### 次のPhase 4で実施する内容

```
⏳ Phase 4: 管理画面UI（120分予定）

app/admin/item-categories/ 配下:
├── [id]/page.tsx                                # ProductCategory → ItemCategory
├── new/page.tsx                                 # ProductCategory → ItemCategory
├── page.tsx                                     # ProductCategory → ItemCategory
└── components/
    ├── CategoryForm.tsx                         # ProductCategory → ItemCategory
    ├── CategoryList.tsx                         # ProductCategory → ItemCategory
    ├── CategoryListClient.tsx                   # ProductCategory → ItemCategory
    └── DeleteCategoryButton.tsx                 # ProductCategory → ItemCategory

app/admin/items/ 配下:
├── [id]/page.tsx                                # Product → Item
├── new/page.tsx                                 # Product → Item
├── page.tsx                                     # Product → Item
├── import/
│   ├── page.tsx                                 # Product → Item
│   └── components/CSVImportForm.tsx             # Product → Item
└── components/
    ├── ProductForm.tsx → ItemForm.tsx           # Rename + Update
    ├── ProductList.tsx → ItemList.tsx           # Rename + Update
    ├── ProductListClient.tsx → ItemListClient.tsx # Rename + Update
    └── DeleteProductButton.tsx → DeleteItemButton.tsx # Rename + Update
```

---

## Gemini One Opus レビュー依頼事項

以下の点について確認をお願いします：

### 1. Phase 3 の実装内容に漏れはないか

- ✅ `app/actions/item-actions.ts` (377行) の更新
- ✅ `app/admin/item-categories/actions.ts` (323行) の更新
- ✅ `app/admin/items/actions.ts` (657行) の更新
- ⚠️ 変数名の残存（linter検出済み、次Phaseで修正予定）

### 2. Server Actions の命名規則

- 関数名: `getItemsAction`, `createItemAction` など
- 型定義: `ItemInput`, `ItemCSVRow` など
- 変数名: `item`, `existingItem`, `duplicateItem` など

これらの命名規則は適切か？

### 3. パスrevalidationの網羅性

以下のパスが適切にrevalidateされているか：
- `/dashboard/items` (ユーザーダッシュボード)
- `/@${user.handle}/items` (公開ページ)
- `/admin/items` (管理画面アイテム一覧)
- `/admin/items/${id}` (管理画面アイテム詳細)
- `/admin/item-categories` (管理画面カテゴリ一覧)

### 4. 画像管理の変更

- 画像フォルダ: `product-images` → `item-images`
- 関数名: `downloadAndUploadProductImage` → `downloadAndUploadItemImage`
- 関数名: `deleteProductImageFromR2` → `deleteItemImageFromR2`

この変更により、既存のR2画像（`product-images/`）との互換性に問題はないか？

### 5. 次Phase（Phase 4）への準備状態

- UIコンポーネントの更新に必要なServer Actionsは全て更新済みか？
- インポート文の変更（`@/app/actions/product-actions` → `@/app/actions/item-actions`）の準備はできているか？

---

**実装者**: Claude Code (Claude Sonnet 4.5)
**実装日**: 2026-01-01
**ステータス**: Phase 3 完了、Phase 4 開始前レビュー待ち
