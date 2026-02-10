# Phase 3 実装計画

## 概要

Phase 3 では、ユーザー向けの商品管理機能を実装します。既存の Device システムを Product システムに移行し、ダッシュボードと公開ページで統一商品管理を利用できるようにします。

## 目標

1. `/dashboard/devices` を `/dashboard/products` に移行
2. `/@handle/devices` を `/@handle/products` に移行
3. 既存 Device UI の互換性を維持
4. Phase 2 レビュー指摘事項の修正

## 実装戦略

### アプローチ

**段階的移行**を採用します：
1. Product 用の新しいページ・コンポーネントを作成
2. 既存 Device ページは当面維持（リダイレクトまたは並行運用）
3. データモデルの統合（UserDevice と UserProduct の共存）

### 互換性の考慮

- UserDevice は既存のまま維持
- UserProduct を新規作成し、Product とリレーション
- 将来的に UserDevice → UserProduct へのマイグレーションパスを用意

## 実装内容

### 1. Phase 2 レビュー指摘事項の修正

#### 1.1 brandId の "null" 文字列変換

**ファイル**: `app/admin/products/actions.ts`

**変更内容**:
```typescript
// createProductAction と updateProductAction で変換処理を追加
const validated = productSchema.parse({
  ...data,
  brandId: data.brandId === 'null' ? null : data.brandId,
})
```

**優先度**: 高（Phase 2 レビュー指摘）

### 2. ダッシュボード商品管理 (`/dashboard/products`)

#### 2.1 必要なコンポーネント

既存の Device コンポーネントを参考に、Product 用に作成：

1. **ProductListSection** (← UserDeviceListSection)
   - ユーザーの商品一覧表示
   - カテゴリごとのグループ化
   - ドラッグ&ドロップでの並び替え

2. **ProductCard** (← UserDeviceCard)
   - 商品カード表示
   - 画像、名前、ブランド、カテゴリ
   - 編集・削除ボタン

3. **AddProductModal** (← AddDeviceModal)
   - 既存商品を選択して追加
   - 商品検索・フィルタ

4. **EditProductModal** (← EditUserDeviceModal)
   - カスタム名、説明の編集
   - 表示・非表示の切り替え

5. **DeleteProductButton** (← DeleteUserDeviceButton)
   - 削除確認ダイアログ

#### 2.2 Server Actions

**ファイル**: `app/dashboard/products/actions.ts`

必要なアクション:
- `getUserProductsAction`: ユーザーの商品一覧取得
- `addUserProductAction`: 商品をユーザーに追加
- `updateUserProductAction`: ユーザー商品の更新
- `deleteUserProductAction`: ユーザー商品の削除
- `reorderUserProductsAction`: 並び順の更新

#### 2.3 データフロー

```
User → UserProduct → Product → ProductCategory
                   → Brand
```

### 3. 公開ページ (`/@handle/products`)

#### 3.1 必要なコンポーネント

1. **UserPublicProductList** (← UserPublicDeviceList)
   - 公開されている商品の一覧
   - カテゴリごとのセクション

2. **UserPublicProductCard** (← UserPublicDeviceCard)
   - 商品情報の表示
   - Amazon リンク
   - カスタム説明

#### 3.2 Server Actions

**ファイル**: `app/[handle]/products/actions.ts`

必要なアクション:
- `getPublicUserProductsAction`: 公開商品一覧の取得

### 4. Prisma スキーマの拡張

#### 4.1 UserProduct モデルの追加

```prisma
model UserProduct {
  id          String   @id @default(cuid())
  userId      String
  productId   String
  customName  String?  // カスタム商品名
  description String?  // カスタム説明
  sortOrder   Int      @default(0)
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@unique([userId, productId])
  @@index([userId, sortOrder])
  @@index([userId, isPublic])
}
```

#### 4.2 Product モデルへのリレーション追加

```prisma
model Product {
  // ... existing fields
  userProducts UserProduct[]
}

model User {
  // ... existing fields
  userProducts UserProduct[]
}
```

### 5. バリデーションスキーマ

**ファイル**: `lib/validation/product.ts`

追加するスキーマ:
```typescript
export const userProductSchema = z.object({
  productId: z.string().min(1),
  customName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
})

export type UserProductInput = z.infer<typeof userProductSchema>
```

## 実装手順

### Step 1: Phase 2 修正（優先）
1. `app/admin/products/actions.ts` に brandId 変換処理を追加
2. TypeScript・ESLint チェック
3. 動作確認

### Step 2: Prisma スキーマ拡張
1. `UserProduct` モデルを追加
2. マイグレーション作成・実行
3. Prisma Client 再生成

### Step 3: バリデーション追加
1. `lib/validation/product.ts` に `userProductSchema` 追加
2. TypeScript チェック

### Step 4: ダッシュボード実装
1. Server Actions 作成 (`app/dashboard/products/actions.ts`)
2. コンポーネント作成（ProductCard, AddProductModal など）
3. ページ作成 (`app/dashboard/products/page.tsx`)
4. ブラウザテスト

### Step 5: 公開ページ実装
1. Server Actions 作成 (`app/[handle]/products/actions.ts`)
2. コンポーネント作成（PublicProductList など）
3. ページ作成 (`app/[handle]/products/page.tsx`)
4. ブラウザテスト

### Step 6: 最終検証
1. TypeScript・ESLint チェック
2. MCP Playwright テスト
3. 実装ログ作成
4. Git コミット

## 完了条件

- [ ] Phase 2 の brandId 変換処理が修正済み
- [ ] UserProduct モデルが作成され、マイグレーション完了
- [ ] ダッシュボードで商品の追加・編集・削除・並び替えが可能
- [ ] 公開ページで商品が正しく表示される
- [ ] TypeScript errors: 0
- [ ] ESLint errors: 0
- [ ] MCP Playwright テスト完了
- [ ] Git コミット作成済み
- [ ] 実装ログ作成済み

## 既存 Device システムとの関係

### 並行運用

Phase 3 では以下を並行運用：
- `/dashboard/devices` - 既存のまま
- `/dashboard/products` - 新規作成
- `/@handle/devices` - 既存のまま
- `/@handle/products` - 新規作成

### 将来的なマイグレーション

Phase 4 以降で検討：
- UserDevice データを UserProduct に移行
- `/devices` ルートを `/products` にリダイレクト
- 旧 Device UI の廃止

## リスクと対策

### リスク 1: データモデルの複雑化

**リスク**: UserDevice と UserProduct が並存することで、コードが複雑化

**対策**:
- 明確なネーミング規則を使用
- 将来のマイグレーションパスを文書化

### リスク 2: UI の一貫性

**リスク**: Device UI と Product UI で操作性が異なる

**対策**:
- 既存 Device コンポーネントを参考にして、同じ UX パターンを採用
- コンポーネント名とファイル構造を統一

### リスク 3: パフォーマンス

**リスク**: リレーションが増えることでクエリが遅くなる

**対策**:
- 適切なインデックスを設定
- N+1 問題を回避（include で一括取得）

## 次のステップ

実装計画の承認後、以下の順序で実装を開始：

1. ✅ Phase 2 レビュー修正
2. ✅ Prisma スキーマ拡張
3. ✅ バリデーション追加
4. ✅ ダッシュボード実装
5. ✅ 公開ページ実装
6. ✅ 最終検証

---

**作成日**: 2025-12-31
**作成者**: Claude Code (Claude Sonnet 4.5)
