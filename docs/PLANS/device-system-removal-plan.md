# Deviceシステム削除計画

## 概要

開発段階（データゼロ）を活かし、旧Deviceシステムを完全に削除してProductシステムに一本化します。

**作成日**: 2025-12-31
**レビュアー**: Claude Code (Claude Sonnet 4.5) & Gemini One Opus
**ステータス**: 計画策定完了 → 実行待ち

---

## 1. 削除の理由

### 1.1 システムの重複

現在、以下の2つのシステムが並行稼働：

| システム | 用途 | 状態 |
|---------|------|------|
| Device | 旧デバイス管理 | 削除対象 |
| Product | 新商品管理（25カテゴリ） | 維持・拡張 |

**問題点**:
- 機能がほぼ同じ（CRUD、カテゴリ、ブランド、画像管理）
- 二重メンテナンスコスト
- 新規開発者の混乱

### 1.2 絶好のタイミング

- ✅ 開発段階でデータゼロ
- ✅ データ移行不要
- ✅ ユーザー影響ゼロ
- ✅ 後戻りコストも低い

---

## 2. 削除対象の詳細

### 2.1 Prismaスキーマから削除

```prisma
// 削除対象モデル（6つ）
model Device
model DeviceCategory
model UserDevice
model DeviceAttribute
model CategoryAttribute
enum AttributeType
```

**影響範囲**:
- `Device`: 商品マスター（旧）
- `DeviceCategory`: デバイスカテゴリ（マウス、キーボードなど）
- `UserDevice`: ユーザー所有デバイス
- `DeviceAttribute`: デバイスの属性値（DPI、重量など）
- `CategoryAttribute`: カテゴリごとの属性定義
- `AttributeType`: 属性の型定義（SELECT、NUMBER、TEXT、BOOLEAN）

### 2.2 ディレクトリ・ファイルから削除

```bash
削除対象:
├── app/admin/devices/              # 管理画面
├── app/dashboard/devices/          # ユーザーダッシュボード
├── app/[handle]/devices/           # 公開ページ（存在する場合）
├── app/devices/                    # 公開デバイス一覧ページ ← 追加
├── components/devices/             # Deviceコンポーネント
├── types/device.ts                 # Device型定義
├── app/actions/device-actions.ts   # Device Server Actions（存在する場合）
└── public/images/device-placeholder.svg  # プレースホルダー画像 ← 追加
```

### 2.3 保持対象（重要）

```bash
維持必須:
├── app/admin/attributes/           # ブログ用Category/Tag管理
│   ├── categories/                 # ブログカテゴリ
│   └── tags/                       # ブログタグ
├── app/admin/categories/           # Product用カテゴリ管理
├── app/admin/products/             # Product管理
├── app/dashboard/products/         # ユーザーProduct管理
├── app/[handle]/products/          # Product公開ページ
└── app/admin/articles/             # ブログ記事管理
```

**理由**:
- `/admin/attributes`: **ブログシステム用** (`Category`、`Tag`)
- `/admin/categories`: **Productシステム用** (`ProductCategory`)
- 名前が似ているが別物！

---

## 3. 実装手順

### Phase 1: バックアップ（5分）

```bash
# 念のため現在の状態をコミット
git add .
git commit -m "backup: Before device system removal"
```

### Phase 2: Prismaスキーマ編集（15分）

**ファイル**: `prisma/schema.prisma`

**削除対象モデル**:
```prisma
// これらを完全に削除
model Device { ... }
model DeviceCategory { ... }
model UserDevice { ... }
model DeviceAttribute { ... }
model CategoryAttribute { ... }
enum AttributeType { ... }
```

**確認事項**:
- ブログ用の `Category`、`Tag` は削除しない
- Product用の `ProductCategory` は削除しない
- `Brand` は共通で使用されるため削除しない

### Phase 3: マイグレーション実行（5分）

```bash
# マイグレーション作成
npx prisma migrate dev --name remove_device_system

# 期待される出力:
# ✅ Device テーブル削除
# ✅ DeviceCategory テーブル削除
# ✅ UserDevice テーブル削除
# ✅ DeviceAttribute テーブル削除
# ✅ CategoryAttribute テーブル削除
```

### Phase 4: ディレクトリ・ファイル削除（10分）

```bash
# Device関連ディレクトリを削除
rm -rf app/admin/devices/
rm -rf app/dashboard/devices/
rm -rf app/[handle]/devices/  # 存在する場合
rm -rf app/devices/           # 公開デバイス一覧ページ
rm -rf components/devices/

# Device関連ファイルを削除
rm -f types/device.ts
rm -f app/actions/device-actions.ts  # 存在する場合
rm -f public/images/device-placeholder.svg
```

### Phase 5: インポート削除（30分）

**検索コマンド**:
```bash
# Device関連のインポートを検索
grep -r "from '@/types/device'" app/ --include="*.tsx" --include="*.ts"
grep -r "device-actions" app/ --include="*.tsx" --include="*.ts"
grep -r "UserDevice" app/ --include="*.tsx" --include="*.ts"
grep -r "DeviceCategory" app/ --include="*.tsx" --include="*.ts"
```

**対応**:
- 見つかったファイルからインポートを削除
- 使用箇所があれば適切に修正またはコメントアウト

### Phase 6: ナビゲーション・リンク修正（20分）

**対象ファイル**:
1. `app/admin/page.tsx` (行19) - `/admin/devices` へのリンク削除
2. `app/[handle]/layout.tsx` (行155) - `/@{handle}/devices` へのリンク削除
3. `lib/layout-config.ts` (行182, 241) - ナビゲーション項目削除
   - `/admin/devices`
   - `/dashboard/devices`
4. `middleware.ts` (行11) - `'devices'` パス保護設定削除
5. その他のナビゲーションファイル

**修正内容例**:
```typescript
// app/admin/page.tsx - 行19付近
// Before
<Link href="/admin/devices">デバイス管理</Link>

// After（削除）

// lib/layout-config.ts - 行182, 241付近
// Before
{
  name: "デバイス",
  url: "/admin/devices",
  icon: Monitor
}

// After（削除）

// middleware.ts - 行11付近
// Before
'devices', // /devicesページ

// After（削除）
```

### Phase 7: 品質チェック（15分）

```bash
# TypeScriptチェック
npx tsc --noEmit

# 期待: 0 errors

# ESLintチェック
npx eslint . --max-warnings=0

# 期待: 0 errors, 0 warnings

# ビルドチェック
npm run build

# 期待: ビルド成功
```

### Phase 8: コミット（5分）

```bash
git add .
git commit -m "refactor: Remove Device system and consolidate to Product system

- Remove Device, DeviceCategory, UserDevice models
- Remove DeviceAttribute, CategoryAttribute models
- Remove AttributeType enum
- Remove /admin/devices, /dashboard/devices directories
- Remove device-actions and device types
- Keep /admin/attributes (for blog Category/Tag)
- Keep /admin/categories (for ProductCategory)

BREAKING CHANGE: Device system completely removed in favor of Product system"
```

---

## 4. リスク分析

### 4.1 想定されるリスク

| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|---------|------|
| データ消失 | なし | 0% | データゼロのため影響なし |
| インポートエラー | 中 | 30% | grep検索で全箇所確認 |
| ビルドエラー | 中 | 20% | TypeScript/ESLintで事前確認 |
| 見落としファイル | 低 | 10% | git statusで未追跡ファイル確認 |

### 4.2 ロールバックプラン

**Phase 1のバックアップから復元**:
```bash
git reset --hard <backup-commit-hash>
```

**またはマイグレーション巻き戻し**:
```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## 5. 削除後の最終構成

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

2. 商品管理システム（Product）
   ├── ProductCategory (25種類 + 階層構造対応)
   ├── Product
   └── UserProduct

   管理画面: /admin/products/, /admin/categories/
   ダッシュボード: /dashboard/products/
   公開ページ: /@handle/products/

3. 共通
   ├── Brand（商品・デバイス共通）
   └── User
```

### 5.2 削減される複雑性

**Before（削除前）**:
- モデル数: 3システム × 平均5モデル = 15モデル
- 管理画面: `/admin/devices`, `/admin/products`, `/admin/attributes`
- ユーザーページ: `/dashboard/devices`, `/dashboard/products`

**After（削除後）**:
- モデル数: 2システム × 平均5モデル = 10モデル
- 管理画面: `/admin/products`, `/admin/categories`, `/admin/attributes`
- ユーザーページ: `/dashboard/products`

**削減率**: 約33%のモデル削減、メンテナンスコスト大幅減

---

## 6. 将来的な拡張

### 6.1 Attributes機能の再実装（必要時）

Productに属性機能が必要になった場合:

```prisma
model ProductAttribute {
  id        String @id @default(cuid())
  productId String
  key       String  // "DPI", "重量" など
  value     String  // "25600", "63g" など

  product Product @relation(...)

  @@unique([productId, key])
  @@map("product_attributes")
}
```

**判断基準**:
- ユーザーからの要望
- 実際の使用データ分析
- 商品説明文では不十分な証拠

### 6.2 カテゴリ属性定義（必要時）

カテゴリごとの属性定義が必要になった場合:

```prisma
model ProductCategoryAttribute {
  id           String @id @default(cuid())
  categoryId   String
  name         String
  type         AttributeType
  required     Boolean @default(false)

  category ProductCategory @relation(...)

  @@map("product_category_attributes")
}
```

**ただし**: まずはYAGNI原則に従い、実装しない

---

## 7. チェックリスト

### 実行前

- [ ] 現在の状態をGitコミット（バックアップ）
- [ ] `/admin/attributes` がブログ用であることを再確認
- [ ] `/admin/categories` がProduct用であることを再確認
- [ ] データベースが空であることを確認

### 実行中

- [ ] Prismaスキーマからモデル削除（6モデル）
- [ ] マイグレーション実行成功
- [ ] ディレクトリ削除完了（app/devices含む）
- [ ] プレースホルダー画像削除
- [ ] インポート削除完了
- [ ] リンク削除完了（app/admin/page.tsx 行19）
- [ ] リンク削除完了（app/[handle]/layout.tsx 行155）
- [ ] ナビゲーション修正完了（lib/layout-config.ts 行182, 241）
- [ ] ミドルウェア修正完了（middleware.ts 行11）

### 実行後

- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors
- [ ] `npm run build` 成功
- [ ] 開発サーバー起動成功
- [ ] `/admin/products` アクセス可能
- [ ] `/dashboard/products` アクセス可能
- [ ] `/admin/attributes` アクセス可能（ブログ用）
- [ ] `/admin/categories` アクセス可能（Product用）
- [ ] Git commit完了

---

## 8. 完了条件

以下の全てが満たされた時、削除完了とする:

1. ✅ Deviceモデルがデータベースに存在しない
2. ✅ Device関連ディレクトリが存在しない
3. ✅ TypeScript/ESLintエラーゼロ
4. ✅ ビルド成功
5. ✅ 全ての管理画面が正常動作
6. ✅ Git commitに記録

---

## 9. レビューフィードバック（Gemini One Opus）

### 9.1 追加で発見された削除対象

Gemini One Opusのレビューにより、以下の削除漏れが発見されました：

**ディレクトリ・ファイル**:
1. ✅ `app/devices/` - 公開デバイス一覧ページ
   - `components/DeviceCard.tsx`
   - `components/DeviceFilters.tsx`
   - `components/DeviceListSection.tsx`
   - `page.tsx`

2. ✅ `public/images/device-placeholder.svg` - プレースホルダー画像

**リンク・ナビゲーション**:
3. ✅ `app/admin/page.tsx` (行19) - `/admin/devices` へのリンク
4. ✅ `app/[handle]/layout.tsx` (行155) - `/@{handle}/devices` へのリンク
5. ✅ `lib/layout-config.ts` (行182, 241) - ナビゲーション定義
   - `/admin/devices`
   - `/dashboard/devices`
6. ✅ `middleware.ts` (行11) - `'devices'` パス保護設定

### 9.2 レビュー結果

**評価**: ✅ 計画自体は良好、ただし削除漏れあり

**結論**: 上記の追加削除対象を計画書に反映済み

**レビュアー**: Gemini One Opus
**レビュー日**: 2025-12-31

---

## 10. 参考資料

- [Product R2画像保存機能 実装ログ](../LOGS/unified-product-system/r2-image-storage-implementation.md)
- [Phase 3 Part 2 実装ログ](../LOGS/unified-product-system/phase3-part2-implementation.md)
- [Phase 3 Part 2 レビューレポート](../LOGS/unified-product-system/phase3-part2-review.md)

---

**作成日**: 2025-12-31
**作成者**: Claude Code (Claude Sonnet 4.5)
**レビュー**: Gemini One Opus
**承認**: ユーザー承認待ち
