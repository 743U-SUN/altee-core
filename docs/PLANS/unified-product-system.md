# 統合商品管理システム - 設計書

> 作成日: 2024-12-31
> ステータス: 設計完了、実装待ち

## 概要

PCパーツ、周辺機器、食品等を統一管理し、VTuberやビジターに提供するシステム。

### 主要機能

| 機能 | 説明 |
|------|------|
| コレクション | PCビルド、おすすめリスト等をまとめて管理 |
| 互換性チェック | CPU/マザボのソケット等をリアルタイム検証 |
| 価格比較 | 複数ECサイトの価格を取得・最安値表示 |
| お気に入り | ログイン有無問わずお気に入り保存 |
| 共有URL | PCビルドを1ヶ月有効なURLで共有 |
| AI情報収集 | Gemini APIで商品スペック自動抽出 |

---

## データベーススキーマ

### 商品管理

```prisma
// 商品カテゴリ（階層構造）
model ProductCategory {
  id           String   @id @default(cuid())
  name         String   // "CPU", "飲料"
  slug         String   @unique
  parentId     String?
  categoryType CategoryType @default(GENERAL)
  icon         String?
  sortOrder    Int      @default(0)
  
  parent       ProductCategory? @relation("Hierarchy", fields: [parentId], references: [id])
  children     ProductCategory[] @relation("Hierarchy")
  attributes   ProductAttribute[]
  products     Product[]
  
  @@map("product_categories")
}

enum CategoryType {
  PC_PART      // 互換性チェック対象
  PERIPHERAL   // 周辺機器
  FOOD         // 食品
  GENERAL      // その他
}

// 商品属性定義
model ProductAttribute {
  id                 String   @id @default(cuid())
  categoryId         String
  name               String   // "ソケット", "カロリー"
  slug               String
  type               AttributeType
  unit               String?  // "W", "kcal"
  options            Json?    // SELECT用選択肢
  isCompatibilityKey Boolean  @default(false)
  sortOrder          Int      @default(0)
  
  category           ProductCategory @relation(...)
  values             ProductAttributeValue[]
  
  @@unique([categoryId, slug])
  @@map("product_attributes")
}

// 商品マスタ
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  categoryId  String
  brandId     String?
  imageUrl    String?
  imageKey    String?
  
  category        ProductCategory @relation(...)
  brand           Brand? @relation(...)
  externalLinks   ProductExternalLink[]
  attributeValues ProductAttributeValue[]
  collectionItems CollectionItem[]
  favorites       UserFavorite[]
  
  @@map("products")
}

// 外部リンク（価格比較・アフィリエイト対応）
model ProductExternalLink {
  id           String   @id @default(cuid())
  productId    String
  siteName     String   // "Amazon", "ドスパラ"
  url          String
  affiliateUrl String?
  price        Int?
  lastChecked  DateTime?
  
  @@unique([productId, siteName])
  @@map("product_external_links")
}
```

### コレクション

```prisma
model Collection {
  id             String   @id @default(cuid())
  userId         String?  // nullならシステム管理
  name           String
  slug           String?
  description    String?
  imageKey       String?
  collectionType CollectionType
  isPublic       Boolean  @default(true)
  
  user           User? @relation(...)
  items          CollectionItem[]
  
  @@unique([userId, slug])
  @@map("collections")
}

enum CollectionType {
  PC_BUILD    // 互換性チェック有効
  DEVICE_SET  // 周辺機器セット
  CURATED     // キュレーションリスト
}

model CollectionItem {
  id           String @id @default(cuid())
  collectionId String
  productId    String
  quantity     Int    @default(1)
  note         String?
  sortOrder    Int    @default(0)
  
  @@unique([collectionId, productId])
  @@map("collection_items")
}
```

### 互換性ルール

```prisma
model CompatibilityRule {
  id                  String   @id @default(cuid())
  name                String   // "ソケット互換"
  ruleType            RuleType
  sourceCategoryId    String
  sourceAttributeSlug String
  targetCategoryId    String
  targetAttributeSlug String
  errorMessage        String
  severity            Severity @default(ERROR)
  isActive            Boolean  @default(true)
  
  @@map("compatibility_rules")
}

enum RuleType {
  MUST_MATCH      // 値一致
  GREATER_EQUAL   // source >= target
  LESS_EQUAL      // source <= target
}

enum Severity {
  ERROR    // ビルド不可
  WARNING  // 警告のみ
}
```

### お気に入り・共有

```prisma
// ログインユーザー用お気に入り
model UserFavorite {
  id        String   @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime @default(now())
  
  @@unique([userId, productId])
  @@map("user_favorites")
}

// PCビルド共有（1ヶ月有効）
model SharedBuild {
  id        String   @id @default(cuid())
  shareCode String   @unique
  buildData Json     // パーツIDリスト
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([expiresAt])
  @@map("shared_builds")
}
```

---

## ページ構成

```
/admin/
├── products/          # 商品CRUD
├── categories/        # カテゴリ・属性管理
├── compatibility/     # 互換性ルール管理
└── import/            # CSV一括登録

/dashboard/
├── pc/                # PCビルド管理
├── devices/           # 周辺機器（既存）
└── favorites/         # お気に入り管理

/@handle/
├── pc/                # PCスペック公開
└── devices/           # 周辺機器公開

/discover/             # ビジター向け
├── pc-builds/         # 人気PCビルド
└── zero-calorie/      # キュレーションリスト

/builds/:code          # 共有PCビルド
/builder/              # PCビルダー（ビジター可）
```

---

## 主要機能の実装方針

### Gemini API vs Cronの違い

| 項目 | Gemini API（AI情報収集） | Cron（価格取得） |
|------|--------------------------|------------------|
| 用途 | 商品スペック抽出 | 価格更新 |
| 処理内容 | HTML→構造化データ変換（AI） | HTML→価格抽出（正規表現） |
| API使用 | あり（無料枠15/日） | なし |
| 頻度 | 新規商品登録時のみ | 1日1回定期実行 |
| 精度 | 高（複雑なHTML対応） | 中（パターンマッチ） |

### 価格比較（Cronジョブ）

```typescript
// 1日1回実行、API不使用
async function updatePrices() {
  const links = await prisma.productExternalLink.findMany()
  for (const link of links) {
    const html = await fetchHtml(link.url)
    const price = extractPrice(html, link.siteName)
    await prisma.productExternalLink.update({
      where: { id: link.id },
      data: { price, lastChecked: new Date() }
    })
  }
}
```

### お気に入り（ハイブリッド）

- ログイン済み: DB（UserFavorite）に永続保存
- 未ログイン: LocalStorageに保存、ログイン後DBに同期

### 互換性チェック（リアルタイム）

- パーツ選択時にuseMemoで即座にチェック
- ルールはDBから取得してキャッシュ

---

## 消費電力計算機能（Phase 1で対応）

### 計算ロジック

```typescript
function calculateRequiredPSU(parts: Part[]): number {
  const totalTdp = parts.reduce((sum, part) => {
    const tdp = part.attributes.find(a => a.slug === 'tdp')?.value || 0
    return sum + Number(tdp) * (part.quantity || 1)
  }, 0)
  
  // 20%のマージンを推奨
  return Math.ceil(totalTdp * 1.2 / 50) * 50 // 50W単位で切り上げ
}
```

### 表示例

```
⚡ 推定消費電力: 425W
💡 推奨電源容量: 550W以上
```

---

## 初期PCパーツカテゴリ・属性定義

### CPU
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| ソケット | socket | SELECT | - | AM5, LGA1700等 |
| コア数 | cores | NUMBER | - | |
| スレッド数 | threads | NUMBER | - | |
| ベースクロック | base_clock | NUMBER | GHz | |
| ブーストクロック | boost_clock | NUMBER | GHz | |
| **TDP** | tdp | NUMBER | W | ⚡消費電力計算用 |

### GPU
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| VRAM | vram | NUMBER | GB | |
| メモリタイプ | memory_type | SELECT | - | GDDR6X等 |
| 長さ | length | NUMBER | mm | ケース互換用 |
| **TDP** | tdp | NUMBER | W | ⚡消費電力計算用 |

### マザーボード
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| ソケット | socket | SELECT | - | CPU互換用 |
| チップセット | chipset | SELECT | - | |
| フォームファクタ | form_factor | SELECT | - | ATX, mATX等 |
| メモリタイプ | memory_type | SELECT | - | DDR4, DDR5 |
| メモリスロット数 | memory_slots | NUMBER | - | |

### RAM
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| 容量 | capacity | NUMBER | GB | 1枚あたり |
| 規格 | type | SELECT | - | DDR4, DDR5 |
| 速度 | speed | NUMBER | MHz | |

### 電源 (PSU)
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| **容量** | wattage | NUMBER | W | 互換性チェック用 |
| 認証 | certification | SELECT | - | 80+ Bronze等 |
| モジュラー | modular | SELECT | - | Full/Semi/Non |

### PCケース
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| フォームファクタ | form_factor | SELECT | - | ATX対応等 |
| 最大GPU長 | max_gpu_length | NUMBER | mm | GPU互換用 |
| 最大クーラー高 | max_cooler_height | NUMBER | mm | |

### CPUクーラー
| 属性 | slug | type | 単位 | 備考 |
|------|------|------|------|------|
| 対応ソケット | sockets | TEXT | - | 複数対応 |
| 高さ | height | NUMBER | mm | ケース互換用 |
| 対応TDP | max_tdp | NUMBER | W | |

---

## 将来検討機能（PCPartPicker参考）

| 機能 | 説明 | 優先度 |
|------|------|--------|
| ~~消費電力計算~~ | ~~全パーツのTDPから必要電源を算出~~ | ✅ Phase 1で対応 |
| ビルドガイド | 用途別おすすめ構成テンプレート | 中 |
| 完成ビルドギャラリー | ユーザー投稿ビルドの一覧 | 中 |
| 価格アラート | 指定価格以下で通知 | 低 |
| コミュニティフォーラム | Q&A掲示板 | 低 |
| ベンチマーク表示 | CPU/GPUのスコア表示 | 低 |

---

## 実装フェーズ

### Phase 1: 基盤とコア型定義

**目標**: データベーススキーマを確立し、既存Deviceシステムとの互換性レイヤーを構築

**実装内容**:
- 新DBスキーマ作成（Product, ProductCategory, ProductType等）
- Prisma migration実行
- 既存Device→Product変換ユーティリティ
- 基本的な型定義とバリデーション

**Phase 1完了条件**:
- [ ] Prisma migrationが正常に実行され、DBスキーマが作成されている
- [ ] TypeScript errors: 0
- [ ] ESLint errors: 0
- [ ] 既存Deviceデータが新Productテーブルに移行されている
- [ ] `npm run dev` が正常に起動する
- [ ] Git commitで変更が保存されている
- [ ] `docs/LOGS/unified-product-system/phase1-implementation.md` にレビュー用の詳細ログが生成されている

### Phase 2: 管理画面とCRUD

**目標**: 商品とカテゴリの管理画面を構築

**実装内容**:
- `/admin/products` 商品CRUD画面
- `/admin/categories` カテゴリ・属性管理画面
- CSV一括登録機能
- PCパーツ初期データ投入

**Phase 2完了条件**:
- [ ] 管理画面で商品の作成・編集・削除が可能
- [ ] カテゴリと属性の管理が可能
- [ ] CSVインポートが正常動作
- [ ] TypeScript/ESLint errors: 0
- [ ] MCP Playwrightで動作確認済み
- [ ] Git commit済み
- [ ] 実装ログ生成済み

### Phase 3: ダッシュボードと公開ページ

**目標**: ユーザー向け機能を実装

**実装内容**:
- `/dashboard/devices` の `/dashboard/products` への移行
- `/@handle/devices` の `/@handle/products` への移行
- 既存Device UIの互換性維持

**Phase 3完了条件**:
- [ ] ダッシュボードで商品管理が可能
- [ ] 公開ページで商品が正しく表示される
- [ ] 既存のDeviceページと同等の機能を提供
- [ ] TypeScript/ESLint errors: 0
- [ ] MCP Playwrightで動作確認済み
- [ ] Git commit済み
- [ ] 実装ログ生成済み

---

## 実装ログ要件（Gemini One Opusレビュー用）

各Phaseの完了時に `docs/LOGS/unified-product-system/phaseN-implementation.md` を生成します。

### ログに含める情報

1. **変更の概要**
   - なぜこの変更を行ったのか（背景・目的）
   - 何を変更したのか（Before/After比較）
   - どのような影響があるのか

2. **変更ファイル詳細**
   - 各ファイルのパスと変更行数
   - 変更内容の具体的な説明（コードスニペット付き）
   - 変更理由と設計判断

3. **新規作成ファイル**
   - ファイルパスと役割
   - 主要な型定義・関数の説明
   - 設計上の判断理由とトレードオフ

4. **データベース変更**
   - Prisma schemaの変更内容（diff形式）
   - マイグレーションSQL（生成されたもの）
   - データ移行戦略と実行結果

5. **テスト結果**
   - TypeScript errors: 0の証跡（コマンド出力）
   - ESLint errors: 0の証跡（コマンド出力）
   - MCP Playwrightのスクリーンショット
   - 動作確認項目と結果

6. **技術的な判断とトレードオフ**
   - 複数の選択肢があった場合、なぜこの実装を選んだか
   - 妥協した点、今後の改善余地
   - パフォーマンス・セキュリティ・保守性の考慮

7. **レビューポイント**
   - 特に注意して見てほしい箇所
   - 懸念事項や代替案の検討が必要な点
   - アーキテクチャ上の重要な決定

8. **Git情報**
   - コミットハッシュ
   - コミットメッセージ
   - 変更ファイル数と行数

---

## リスク管理

### ロールバック戦略

- 各Phase完了時にgit commitで変更を保存
- 問題が発生した場合、前のPhaseのcommitに戻る
- データベース変更は `prisma migrate` で管理し、必要に応じてrollback可能

### 段階的な実装ルール

1. **Phase単位での完了確認**
   - 次のPhaseに進む前に必ず動作確認
   - TypeScript/ESLintエラーが0であることを確認
   - ユーザー承認を得てから次へ進む

2. **一度に変更しすぎない**
   - 1つのcommitで変更するファイルは最大10個程度
   - 大きな変更は複数のcommitに分割

3. **テストファースト**
   - 既存機能が壊れていないことを最優先
   - MCP Playwrightで必ず実際の画面を確認

### トラブル時の対応

1. **TypeScript/ESLintエラーが解消できない**
   - 前のcommitに戻って原因を調査
   - 変更を小さく分割して再実装

2. **データベースマイグレーションが失敗**
   - Docker環境を再起動
   - `prisma migrate reset` でクリーンスタート
   - マイグレーションファイルを修正

3. **既存機能が壊れた**
   - 即座にrollback
   - 影響範囲を特定してから再実装

---

## 決定事項まとめ

| 項目 | 決定 |
|------|------|
| AI情報収集 | Gemini API無料枠（超過時自動停止） |
| 互換性ルール管理 | DB管理（管理画面から編集可） |
| 既存Device | 削除して新システムに完全置換 |
| お気に入り保存 | ログイン: DB / 未ログイン: LocalStorage |
| 共有URL有効期限 | 1ヶ月 |
| 価格取得 | OGP/HTMLスクレイピング（API不使用） |
