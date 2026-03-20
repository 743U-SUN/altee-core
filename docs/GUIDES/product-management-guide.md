# 統合商品管理システム 使用ガイド

## 概要

統合商品管理システムは、管理者が商品マスターを管理し、ユーザーが自分の使用している商品を登録・公開できる機能です。

### システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                    統合商品管理システム                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐          ┌──────────────────┐          │
│  │  管理者向け機能  │          │ ユーザー向け機能  │          │
│  │ (/admin/products)│          │(/dashboard/products)│       │
│  └─────────────────┘          └──────────────────┘          │
│         │                              │                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌─────────────────┐          ┌──────────────────┐          │
│  │  商品マスター    │◄─────────│  ユーザー商品    │          │
│  │   (Product)     │          │ (UserProduct)    │          │
│  └─────────────────┘          └──────────────────┘          │
│         │                              │                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌─────────────────┐          ┌──────────────────┐          │
│  │  カテゴリ/ブランド│          │  公開ページ      │          │
│  │  25カテゴリ      │          │ (@handle/products)│         │
│  └─────────────────┘          └──────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. 管理者向け機能

### 1.1 商品マスター管理 (`/admin/products`)

#### アクセス方法
- URL: `http://localhost:3000/admin/products`
- 権限: 管理者のみ

#### 機能一覧

**商品一覧**:
- ページネーション（20件/ページ）
- 検索（商品名、説明文）
- カテゴリフィルタ
- ブランドフィルタ
- 並び替え（作成日、更新日）

**商品登録**:
- Amazon ASIN から自動取得
- 手動入力
- CSV 一括インポート

**商品編集**:
- 基本情報（名前、説明、ASIN）
- カテゴリ・ブランド設定
- 画像管理（R2ストレージ）

**CSV インポート**:
- 部分成功許容（エラーがあっても成功分は登録）
- 詳細なエラーレポート
- テンプレートダウンロード可能

#### データモデル

```typescript
interface Product {
  id: string                    // CUID
  name: string                  // 商品名
  description: string | null    // 商品説明
  asin: string                  // Amazon ASIN（ユニーク）
  amazonUrl: string | null      // Amazon商品URL
  categoryId: string            // カテゴリID
  brandId: string | null        // ブランドID（オプション）
  imageStorageKey: string | null // R2ストレージキー
  customImageUrl: string | null  // カスタム画像URL
  amazonImageUrl: string | null  // Amazon画像URL
  ogDescription: string | null   // OG説明文
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 1.2 カテゴリ管理

**プリセットカテゴリ（25種類）**:
- マウス、キーボード、ヘッドセット
- モニター、マイク、ウェブカメラ
- マウスパッド、チェア、デスク
- スピーカー、オーディオインターフェース
- CPU、GPU、マザーボード、メモリ
- ストレージ、電源、PCケース、冷却システム
- ノートPC、タブレット、スマートフォン
- コントローラー、キャプチャーボード
- 照明、その他

**管理方法**:
- URL: `/admin/categories`
- CRUD操作（作成、編集、削除）
- 階層構造なし（フラット）

### 1.3 ブランド管理

**管理方法**:
- URL: `/admin/brands`
- CRUD操作
- 商品と1対多の関係

---

## 2. ユーザー向け機能

### 2.1 ダッシュボード (`/dashboard/products`)

#### アクセス方法
- URL: `http://localhost:3000/dashboard/products`
- 権限: ログインユーザー

#### 機能一覧

**商品追加**:
1. 「商品を追加」ボタンをクリック
2. 商品を検索（名前、ASIN）
3. カテゴリ・ブランドでフィルタ
4. 商品を選択
5. レビューを入力（オプション）
6. 「登録」をクリック

**商品編集**:
1. 商品カードの「︙」メニューから「編集」
2. レビューを編集
3. 公開/非公開を切り替え
4. 「更新」をクリック

**商品削除**:
1. 商品カードの「︙」メニューから「削除」
2. 削除確認ダイアログで「削除する」をクリック

**並び替え**:
1. 商品カードをドラッグ&ドロップ
2. 自動的に順序が保存される

**公開/非公開の切り替え**:
- 方法1: 編集モーダルで切り替え
- 方法2: リストビューの目のアイコンをクリック（クイックトグル）

#### データモデル

```typescript
interface UserProduct {
  id: string                    // CUID
  userId: string                // ユーザーID
  productId: string             // 商品ID
  review: string | null         // ユーザーレビュー
  isPublic: boolean             // 公開/非公開（デフォルト: true）
  sortOrder: number             // 表示順序
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 2.2 公開ページ (`/@handle/products`)

#### アクセス方法
- URL: `http://localhost:3000/@username/products`
- 権限: 全員（閲覧のみ）

#### 表示内容

**商品カード**:
- 商品画像（R2 → カスタム → Amazon の優先順）
- 商品名
- カテゴリ・ブランドバッジ
- ASIN
- ユーザーレビュー（あれば）
- 商品説明（レビューがない場合）
- Amazon リンクボタン

**レイアウト**:
- モバイル: 1列
- タブレット: 2列
- デスクトップ: 3列

**空状態**:
- 「公開商品がありません」メッセージ表示

---

## 3. 技術仕様

### 3.1 Server Actions

**場所**: `app/actions/product-actions.ts`

```typescript
// ユーザー商品管理
checkUserProductExists(userId, productId)      // 重複チェック
getUserProducts(userId)                        // 一覧取得
createUserProduct(userId, data)                // 追加
updateUserProduct(userId, userProductId, data) // 更新
deleteUserProduct(userId, userProductId)       // 削除
reorderUserProducts(userId, productIds)        // 並び替え

// 公開ページ
getUserPublicProductsByHandle(handle)          // 公開商品取得

// 商品検索
getProducts(params)                            // 検索・フィルタ
```

### 3.2 バリデーション

**場所**: `lib/validation/product.ts`

```typescript
// 商品マスター
productSchema: {
  name: string (必須)
  description: string | null
  asin: string (必須、Amazon形式)
  amazonUrl: string | null
  categoryId: string (必須)
  brandId: string | null
  ogDescription: string | null
}

// ユーザー商品
userProductSchema: {
  productId: string (必須)
  review: string | null
  isPublic: boolean (デフォルト: true)
  sortOrder: number (自動設定)
}
```

### 3.3 データベーススキーマ

**Product テーブル**:
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  asin TEXT UNIQUE NOT NULL,
  amazon_url TEXT,
  category_id TEXT NOT NULL REFERENCES product_categories(id),
  brand_id TEXT REFERENCES brands(id),
  image_storage_key TEXT,
  custom_image_url TEXT,
  amazon_image_url TEXT,
  og_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**UserProduct テーブル**:
```sql
CREATE TABLE user_products (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  review TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_product_id ON user_products(product_id);
CREATE INDEX idx_user_products_is_public ON user_products(is_public);
CREATE INDEX idx_user_products_sort_order ON user_products(sort_order);
```

---

## 4. UI コンポーネント

### 4.1 ダッシュボードコンポーネント

```
app/dashboard/products/
├── page.tsx                          # メインページ
└── components/
    ├── UserProductListSection.tsx    # リスト管理
    ├── DragDropProductList.tsx       # D&D リスト
    ├── UserProductCard.tsx           # 商品カード
    ├── AddProductModal.tsx           # 追加モーダル
    ├── ExistingProductSelector.tsx   # 商品選択
    ├── EditUserProductModal.tsx      # 編集モーダル
    └── DeleteUserProductButton.tsx   # 削除ボタン
```

### 4.2 公開ページコンポーネント

```
app/[handle]/products/
├── page.tsx                          # メインページ
└── components/
    ├── UserPublicProductList.tsx     # 商品一覧
    └── UserPublicProductCard.tsx     # 商品カード
```

### 4.3 共通コンポーネント

```
components/products/
└── product-image.tsx                 # 画像コンポーネント

types/
└── product.ts                        # 型定義
```

---

## 5. 使用例

### 5.1 ユーザーが商品を追加する流れ

```typescript
// 1. ダッシュボードページにアクセス
/dashboard/products

// 2. 「商品を追加」ボタンをクリック
<AddProductModal> が開く

// 3. 商品を検索
const products = await getProducts({
  search: "ロジクール",
  categoryId: "マウス",
})

// 4. 商品を選択してレビューを入力
const data = {
  productId: "cm5abc...",
  review: "軽くて使いやすい",
  isPublic: true,
}

// 5. Server Action で登録
const result = await createUserProduct(userId, data)

// 6. リストに追加される（sortOrder 自動設定）
sortOrder = maxSortOrder + 1

// 7. キャッシュ更新
revalidatePath('/dashboard/products')
revalidatePath('/@handle/products')
```

### 5.2 公開ページでの表示

```typescript
// 1. 公開ページにアクセス
/@usun/products

// 2. Server Action でデータ取得
const result = await getUserPublicProductsByHandle("usun")

// 3. 公開商品のみフィルタ
where: {
  userId: user.id,
  isPublic: true,
}

// 4. グリッド表示
<UserPublicProductList userProducts={result.data} />
```

---

## 6. パフォーマンス最適化

### 6.1 遅延読み込み

**モーダルコンポーネント**:
```typescript
const AddProductModal = dynamic(
  () => import('./AddProductModal'),
  { ssr: false }
)
```

**ドラッグ&ドロップ**:
```typescript
const DragDropProductList = dynamic(
  () => import('./DragDropProductList'),
  { ssr: false }
)
```

### 6.2 オプティミスティック更新

**並び替え**:
```typescript
// UI を即座に更新
const newProducts = arrayMove(userProducts, oldIndex, newIndex)
onProductsChange(newProducts)

// Server Action で保存
const result = await reorderUserProducts(userId, productIds)

// 失敗時はロールバック
if (!result.success) {
  onProductsChange(userProducts)
}
```

### 6.3 画像最適化

**優先順位**:
1. R2 ストレージ（`/api/files/${imageStorageKey}`）
2. カスタム画像URL
3. Amazon 画像URL
4. プレースホルダー

---

## 7. セキュリティ

### 7.1 認証・認可

**ダッシュボード**:
```typescript
const session = await auth()
if (!session?.user?.id) {
  redirect('/auth/signin')
}
```

**Server Actions**:
```typescript
// 所有権確認
const userProduct = await prisma.userProduct.findUnique({
  where: { id: userProductId },
})

if (userProduct.userId !== userId) {
  return { success: false, error: 'unauthorized' }
}
```

### 7.2 公開/非公開制御

```typescript
// 公開ページでは isPublic: true のみ表示
where: {
  userId: user.id,
  isPublic: true,
}
```

### 7.3 入力バリデーション

**クライアント側**:
- React Hook Form + Zod

**サーバー側**:
- Zod スキーマでバリデーション
- SQL インジェクション対策（Prisma ORM）

---

## 8. トラブルシューティング

### 8.1 商品が追加できない

**原因1: 重複**
- 同じ商品は1ユーザーにつき1つまで
- エラーメッセージ: "この商品は既に追加されています"

**原因2: 商品が存在しない**
- 管理者が商品マスターに登録していない
- エラーメッセージ: "指定された商品が見つかりませんでした"

### 8.2 並び替えが保存されない

**原因: ネットワークエラー**
- Server Action が失敗した
- 自動的に元の順序にロールバック
- エラートースト表示

### 8.3 画像が表示されない

**チェック項目**:
1. R2 ストレージキーが正しいか
2. カスタム画像URLが有効か
3. Amazon 画像URLが有効か
4. プレースホルダー画像が表示されているか

---

## 9. 開発者向け情報

### 9.1 新しいフィールドを追加する場合

**手順**:
1. Prisma スキーマを更新
2. マイグレーション作成
3. Zod スキーマを更新
4. Server Actions を更新
5. UI コンポーネントを更新

### 9.2 新しいカテゴリを追加する場合

**手順**:
1. `/admin/categories` にアクセス
2. 「カテゴリを追加」をクリック
3. 名前を入力
4. 保存

または:

```bash
DATABASE_URL="..." npx prisma studio
```

### 9.3 カスタマイズポイント

**表示件数の変更**:
```typescript
// app/actions/product-actions.ts
take: 50, // 検索結果の上限
```

**デフォルト公開設定**:
```typescript
// lib/validation/product.ts
isPublic: z.boolean().default(true), // false に変更
```

**画像優先順位**:
```typescript
// components/products/product-image.tsx
const getImageSrc = () => {
  // 優先順位を変更可能
}
```

---

## 10. 関連ドキュメント

- [Phase 1 実装ログ](../LOGS/unified-product-system/phase1-implementation.md) - データモデル設計
- [Phase 2 実装ログ](../LOGS/unified-product-system/phase2-implementation.md) - 管理画面実装
- [Phase 3 Part 1 実装ログ](../LOGS/unified-product-system/phase3-part1-implementation.md) - Server Actions
- [Phase 3 Part 2 実装ログ](../LOGS/unified-product-system/phase3-part2-implementation.md) - UI実装

---

**最終更新日**: 2025-12-31
**バージョン**: 1.0.0
**作成者**: Claude Code (Claude Sonnet 4.5)
