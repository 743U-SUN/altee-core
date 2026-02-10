# Phase 2 実装計画

> 計画日: 2025-12-31
> 実装者: Claude Code (Claude Sonnet 4.5)
> 目標: 商品とカテゴリの管理画面を構築

---

## 目標

Phase 1で構築したデータベーススキーマを基に、管理者が商品とカテゴリを管理できる画面を実装します。

---

## 実装内容

### 1. バリデーションスキーマ (`lib/validation/product.ts`)

Zodスキーマで商品とカテゴリのバリデーションを定義します。

**実装内容**:
```typescript
// ProductCategory
- name: 1-100文字
- slug: 小文字英数字・ハイフン・アンダースコアのみ (^[a-z0-9-_]+$)
- parentId: optional
- productType: ProductType enum
- requiresCompatibilityCheck: boolean
- icon: optional (Lucideアイコン名)
- description: optional
- sortOrder: number (default 0)

// Product
- name: 1-200文字
- description: optional
- categoryId: required
- brandId: optional
- amazonUrl: optional URL
- customImageUrl: optional URL
- asin: optional (Amazon ASIN形式)
```

**Gemini One Opusレビュー指摘対応**:
- slugバリデーション: `^[a-z0-9-_]+$` 正規表現で制約
- 重複チェック: Server Action側で実装

---

### 2. カテゴリ管理 (`/admin/categories`)

#### 2.1 Server Actions (`app/admin/categories/actions.ts`)

**実装内容**:
- `getCategoriesAction()` - カテゴリ一覧取得（階層構造含む）
- `createCategoryAction(data)` - カテゴリ作成（slugバリデーション・重複チェック）
- `updateCategoryAction(id, data)` - カテゴリ更新
- `deleteCategoryAction(id)` - カテゴリ削除（子カテゴリチェック）

**重要な実装ポイント**:
1. **slugの重複チェック**: 作成・更新時に必ず実施
2. **階層構造の検証**: 親カテゴリが存在するか確認
3. **削除時の安全性**: 子カテゴリまたは商品が紐づいている場合はエラー

#### 2.2 UI Components

**ページ構成**:
```
app/admin/categories/
├── page.tsx                    # カテゴリ一覧ページ
├── new/page.tsx                # カテゴリ新規作成
├── [id]/page.tsx               # カテゴリ編集
├── actions.ts                  # Server Actions
└── components/
    ├── CategoryList.tsx        # カテゴリ一覧表示（階層構造）
    ├── CategoryForm.tsx        # カテゴリフォーム
    ├── CategoryFormFields.tsx  # フォームフィールド
    └── DeleteCategoryButton.tsx # 削除ボタン
```

**表示項目**:
- カテゴリ名（階層表示）
- slug
- 商品タイプ
- 互換性チェック有無
- アイコン
- 並び順
- 作成日

**機能**:
- 階層構造の表示（インデント）
- ドラッグ&ドロップでの並び替え（将来実装）
- 親カテゴリの選択（ドロップダウン）

---

### 3. 商品管理 (`/admin/products`)

#### 3.1 Server Actions (`app/admin/products/actions.ts`)

**実装内容**:
- `getProductsAction(filters)` - 商品一覧取得（フィルタ・ページング対応）
- `getProductByIdAction(id)` - 商品詳細取得
- `createProductAction(data)` - 商品作成
- `updateProductAction(id, data)` - 商品更新
- `deleteProductAction(id)` - 商品削除
- `importProductsFromCSVAction(csvData)` - CSV一括登録

**フィルタ項目**:
- カテゴリ
- ブランド
- 商品タイプ
- 検索キーワード（名前・説明）

#### 3.2 UI Components

**ページ構成**:
```
app/admin/products/
├── page.tsx                    # 商品一覧ページ
├── new/page.tsx                # 商品新規作成
├── [id]/page.tsx               # 商品編集
├── import/page.tsx             # CSV一括登録
├── actions.ts                  # Server Actions
└── components/
    ├── ProductList.tsx         # 商品一覧表示
    ├── ProductFilters.tsx      # フィルタUI
    ├── ProductForm.tsx         # 商品フォーム
    ├── ProductBasicFields.tsx  # 基本情報フィールド
    ├── ProductImageFields.tsx  # 画像関連フィールド
    ├── CSVImportForm.tsx       # CSVインポートフォーム
    └── DeleteProductButton.tsx # 削除ボタン
```

**表示項目**:
- 商品画像（Amazon画像またはカスタム画像）
- 商品名
- カテゴリ
- ブランド
- 商品タイプ（category経由）
- 作成日

**機能**:
- Amazon URLからのOG情報自動取得（既存Device機能を流用）
- 画像プレビュー
- カテゴリ・ブランド選択（ドロップダウン）

---

### 4. CSV一括登録機能

#### 4.1 CSVフォーマット

```csv
name,description,categorySlug,brandName,amazonUrl,asin
Intel Core i9-14900K,第14世代インテルCore i9プロセッサー,cpu,Intel,https://www.amazon.co.jp/dp/...,B0CHBJXXXXX
AMD Ryzen 9 7950X,16コア32スレッドCPU,cpu,AMD,https://www.amazon.co.jp/dp/...,B0BBHXXXXX
```

**必須フィールド**:
- name
- categorySlug

**オプションフィールド**:
- description
- brandName (存在しない場合は自動作成)
- amazonUrl
- asin

#### 4.2 インポート処理フロー

1. CSVファイルをアップロード
2. バリデーション実行
   - 必須フィールドチェック
   - categorySlugの存在確認
   - 重複チェック（name + categoryId）
3. プレビュー表示
4. 一括登録実行
5. 結果表示（成功・失敗件数）

**エラーハンドリング**:
- 行ごとのエラー表示
- 失敗した行だけを再度インポート可能

---

### 5. 初期データ投入（seed.ts更新）

PCパーツの初期カテゴリを追加します。

**カテゴリ階層構造**:
```
PCパーツ (pc-parts)
├── CPU (cpu)
├── マザーボード (motherboard)
├── メモリ (memory)
├── グラフィックボード (gpu)
├── ストレージ (storage)
│   ├── SSD (ssd)
│   └── HDD (hdd)
├── 電源ユニット (psu)
├── PCケース (case)
└── CPUクーラー (cpu-cooler)

周辺機器 (peripherals)
├── マウス (mouse) ※既存
├── キーボード (keyboard) ※既存
├── ディスプレイ (display)
└── ヘッドセット (headset)

食品 (food)
├── 飲料 (beverages)
└── お菓子 (snacks)

本 (books)
├── 技術書 (tech-books)
└── ビジネス書 (business-books)

マイク (microphones)
├── コンデンサーマイク (condenser)
└── ダイナミックマイク (dynamic)
```

**実装方針**:
- 既存のマウス・キーボードカテゴリは維持
- 新規カテゴリを追加
- productType, requiresCompatibilityCheck を適切に設定
  - PC_PART: requiresCompatibilityCheck = true
  - その他: requiresCompatibilityCheck = false

---

## 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js Server Actions | データ取得・更新 |
| Zod | バリデーション |
| react-hook-form | フォーム管理 |
| shadcn/ui | UIコンポーネント |
| Prisma | データベースアクセス |
| papaparse | CSVパース |

---

## 実装順序

1. ✅ バリデーションスキーマ作成 (`lib/validation/product.ts`)
2. ✅ カテゴリServer Actions (`app/admin/categories/actions.ts`)
3. ✅ カテゴリUI (`app/admin/categories/*`)
4. ✅ 商品Server Actions (`app/admin/products/actions.ts`)
5. ✅ 商品UI (`app/admin/products/*`)
6. ✅ CSVインポート機能 (`app/admin/products/import/*`)
7. ✅ 初期データ追加 (`prisma/seed.ts`)
8. ✅ テスト（TypeScript/ESLint/Playwright）
9. ✅ 実装ログ作成
10. ✅ Git commit

---

## 完了条件

- [ ] `/admin/categories` でカテゴリのCRUD操作が可能
- [ ] slugバリデーション（`^[a-z0-9-_]+$`）が動作
- [ ] `/admin/products` で商品のCRUD操作が可能
- [ ] CSVインポートが正常動作
- [ ] TypeScript errors: 0
- [ ] ESLint errors: 0
- [ ] MCP Playwrightで動作確認完了
- [ ] Git commit完了
- [ ] `docs/LOGS/unified-product-system/phase2-implementation.md` 生成完了

---

## リスク管理

### 想定される問題

1. **階層構造の表示が複雑**
   - 対策: 既存のCategory構造を参考にする
   - フラット表示 + インデントで対応

2. **CSVインポートのエラーハンドリング**
   - 対策: 行ごとのエラーを明確に表示
   - プレビュー機能で事前確認

3. **既存Deviceシステムとの競合**
   - 対策: 完全に独立したルート (`/admin/products`) を使用
   - Deviceシステムには一切手を加えない

### ロールバック戦略

- 各機能ごとにGit commit
- 問題が発生した場合は前のcommitに戻る
- データベースは変更しないため、ロールバックは容易

---

**計画者**: Claude Code (Claude Sonnet 4.5)
**計画日時**: 2025-12-31 15:50 JST
**次のアクション**: バリデーションスキーマの実装開始

以上
