╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 PCパーツ管理 & 自作PC支援ツール - アーキテクチャ設計   

 Context

 現在の UserPcBuildPart はユーザーが自由テキストでパーツ名を入力する独立モデル。
 今後、以下を実現するためにカタログ基盤とスペック管理が必要：
 - パーツの属性管理（ソケット、チップメーカー、世代、TDP等）
 - 相性チェック（CPU↔マザボのソケット一致等）
 - ゲスト利用可能な自作PC支援ツール
 - 「○○人が使用中」表示の公開カタログ

 ---
 設計方針: ハイブリッド案（推奨）

 既存 Item + Brand + ItemCategory を活用し、PC固有スペックを PcPartSpec で拡張する

 ┌────────────────────────────────────┬──────────────────────────────────────────────────────────┐
 │                方針                │                           理由                           │
 ├────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ Item をPC部品のマスタにも使う      │ Admin CRUD・CSV Import・Amazon連携・画像管理が既に完備   │
 ├────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ PcPartSpec (1:1 with Item) を新設  │ カテゴリ別属性を specs: Json + Zod で管理                │
 ├────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ Brand を「チップメーカー」にも兼用 │ Intel/AMD/NVIDIA も Brand レコードとして登録             │
 ├────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ 互換性ルールはコードで実装         │ アルゴリズム的ルール（TDP合計 vs PSU容量等）はDB化不向き │
 ├────────────────────────────────────┼──────────────────────────────────────────────────────────┤
 │ ゲストビルドは localStorage        │ サーバーコスト0、登録誘導にもなる                        │
 └────────────────────────────────────┴──────────────────────────────────────────────────────────┘

 なぜ別テーブル案（CPU用/GPU用/RAM用...）を採用しないか

 CPU/GPU/RAM の属性はほぼ共通点がない。しかしカテゴリごとにテーブルを分けると 8テーブル以上
 増え、マイグレーション・Admin UI・クエリが複雑化する。specs: Json + Zod discriminated union で
 1テーブルに統一 し、バリデーションはアプリ層で保証するのがPCPartPicker等の実績あるパターン。

 ---
 データモデル（チップメーカー vs ブランドの区別）

 例: ASUS ROG Strix GeForce RTX 4090 OC

 Item テーブル:
   name: "ASUS ROG Strix GeForce RTX 4090 OC"
   brandId → Brand("ASUS")              ← 製品ブランド（販売元）
   categoryId → ItemCategory("GPU")

 PcPartSpec テーブル:
   chipMakerId → Brand("NVIDIA")        ← チップメーカー
   specs: { chipName: "RTX 4090", vram: 24, ... }

 CPU: Intel/AMD が chipMaker かつ brand になることが多い
 GPU: NVIDIA/AMD が chipMaker、ASUS/MSI/Gigabyte が brand（AIBパートナー）

 ---
 スキーマ変更

 1. PcPartSpec（新規）

 model PcPartSpec {
   id           String      @id @default(cuid())
   itemId       String      @unique
   item         Item        @relation(fields: [itemId], references: [id], onDelete: Cascade)
   partType     PcPartType
   chipMakerId  String?
   chipMaker    Brand?      @relation("ChipMaker", fields: [chipMakerId], references: [id])
   tdp          Int?                    // 消費電力(W) - 相性チェックで使用
   releaseDate  DateTime?
   specs        Json                    // カテゴリ別のZodバリデーション済みJSON
   createdAt    DateTime    @default(now())
   updatedAt    DateTime    @updatedAt

   @@index([partType])
   @@index([chipMakerId])
   @@map("pc_part_specs")
 }

 2. 既存モデルへの追記

 // Brand に追加
 chipSpecs   PcPartSpec[]  @relation("ChipMaker")

 // Item に追加
 pcPartSpec  PcPartSpec?
 buildParts  UserPcBuildPart[]

 // UserPcBuildPart に追加
 itemId      String?
 item        Item?  @relation(fields: [itemId], references: [id], onDelete: SetNull)
 @@index([itemId])

 3. UserPcBuildPart の挙動変更

 - itemId がある場合 → カタログから選択。表示名・画像・Amazon URLをItemから取得
 - itemId がない場合 → 従来通りフリーテキスト（後方互換）

 ---
 カテゴリ別 specs JSON 定義

 lib/validations/pc-part-specs.ts

 ┌──────────────┬─────────────────────────────────────────────────┬─────────────────────────────────┐
 │   カテゴリ   │                    主要属性                     │       相性チェック用キー        │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ CPU          │ socket, cores, threads, baseClock, boostClock,  │ socket, memoryType              │
 │              │ memoryType[], integratedGraphics                │                                 │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ GPU          │ chipName, vram, vramType, lengthMm, slots,      │ lengthMm, TDP                   │
 │              │ powerConnectors, recommendedPsu                 │                                 │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ マザーボード │ socket, chipset, formFactor, memoryType,        │ socket, formFactor, memoryType  │
 │              │ memorySlots, maxMemoryGb, m2Slots               │                                 │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ RAM          │ memoryType, capacityGb, modules, speed, latency │ memoryType                      │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ ストレージ   │ storageType, capacityGb, interface, formFactor, │ formFactor, interface           │
 │              │  readSpeed, writeSpeed                          │                                 │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ PSU          │ wattage, efficiency, modularity, formFactor     │ wattage                         │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ ケース       │ formFactor[], maxGpuLengthMm, maxCoolerHeightMm │ formFactor, maxGpuLengthMm,     │
 │              │                                                 │ maxCoolerHeightMm               │
 ├──────────────┼─────────────────────────────────────────────────┼─────────────────────────────────┤
 │ クーラー     │ coolerType, sockets[], heightMm, radiatorSize   │ sockets, heightMm               │
 └──────────────┴─────────────────────────────────────────────────┴─────────────────────────────────┘

 ---
 実装フェーズ

 Phase 1: カタログ基盤（PcPartSpec + Admin拡張）

 目標: Admin でPCパーツを構造化データとして登録・管理できる

 1. prisma/schema.prisma → PcPartSpec 追加、既存モデルにリレーション追記
 2. lib/validations/pc-part-specs.ts → カテゴリ別Zodスキーマ
 3. types/pc-part-spec.ts → TypeScript型定義
 4. app/admin/items/components/ItemForm.tsx → category.itemType === 'PC_PART' のとき PcPartSpec
 フォームを条件表示
 5. app/admin/items/components/PcPartSpecFields.tsx → 新規。partType に応じて動的フォーム切替
 6. Admin の Item 作成/更新アクション拡張 → PcPartSpec を同時に upsert

 変更ファイル:
 - prisma/schema.prisma
 - app/admin/items/components/ItemForm.tsx
 - app/admin/items/ 内の actions

 新規ファイル:
 - lib/validations/pc-part-specs.ts
 - types/pc-part-spec.ts
 - app/admin/items/components/PcPartSpecFields.tsx

 Phase 2: UserPcBuildPart ↔ Item カタログ連携

 目標: ユーザーがダッシュボードからカタログのパーツを選択できる

 1. UserPcBuildPart に itemId カラム追加（マイグレーション）
 2. lib/validations/pc-build.ts → itemId をオプショナルに追加
 3. app/actions/content/pc-build-actions.ts → itemId 対応
 4. app/dashboard/items/components/AddPcPartModal.tsx → 「カタログから選択 or 手動入力」切替UI
 5. app/[handle]/items/components/PcPartsList.tsx → Item リンク時は画像・ブランド表示

 変更ファイル:
 - prisma/schema.prisma
 - lib/validations/pc-build.ts
 - app/actions/content/pc-build-actions.ts
 - app/dashboard/items/components/AddPcPartModal.tsx
 - app/dashboard/items/components/EditPcPartModal.tsx
 - app/[handle]/items/components/PcPartsList.tsx

 Phase 3: 互換性チェックエンジン

 目標: ビルド内パーツの相性を自動判定

 lib/pc-compatibility/
   index.ts           → checkBuildCompatibility(parts[])
   types.ts           → CompatibilityResult, Issue型
   rules/
     cpu-motherboard.ts    → ソケット一致
     ram-motherboard.ts    → DDR規格一致、スロット数
     gpu-case.ts           → GPU長 vs ケース許容長
     cooler-cpu.ts         → ソケット互換
     cooler-case.ts        → クーラー高 vs ケース許容高
     motherboard-case.ts   → フォームファクタ一致
     psu-wattage.ts        → 合計TDP vs PSU容量

 - ダッシュボード・公開ページに互換性バッジ表示
 - Server Action で checkBuildCompatibility() を呼び出し

 Phase 4: ゲスト向け自作PC支援ツール

 目標: 未ログインでもPCビルドをシミュレーションできる

 - app/tools/pc-builder/page.tsx → 公開ページ（認証不要）
 - hooks/useGuestPcBuild.ts → localStorage でビルド状態管理
 - パーツカタログ検索は Server Action（読み取り専用、認証不要）
 - 互換性チェックはクライアントサイドで実行（specs JSON をパーツ取得時に同梱）
 - 「保存するにはログイン」で登録誘導

 Phase 5: 公開カタログ（/items/pc-parts/ 実データ化）

 目標: ダミーデータを実データに置換

 - app/items/pc-parts/page.tsx → 実データクエリに変更
 - app/items/pc-parts/[id]/page.tsx → パーツ詳細ページ（スペック・使用者一覧）
 - 「○人が使用中」は UserPcBuildPart.itemId からカウント

 将来拡張（今回スコープ外）

 - 複数PCビルド対応（UserPcBuild の @unique 解除 + isPrimary フラグ）
 - 価格追跡（小売価格の自動更新）
 - ボトルネック計算
 - ビルドの共有・比較機能

 ---
 検証方法

 1. Phase 1: Admin で CPU カテゴリの Item を作成 → PcPartSpec フォームが表示され socket / cores
 等を入力できる → DB保存確認
 2. Phase 2: ダッシュボードでパーツ追加時「カタログから選択」→ Item 検索 → 選択後に自動入力される →
 公開ページで画像・ブランド付き表示
 3. Phase 3: CPU(AM5) + マザボ(LGA1700) をビルドに入れる → 互換性エラーが表示される
 4. Phase 4: 未ログイン状態で /tools/pc-builder にアクセス → パーツ選択・互換性確認ができる →
 ブラウザリロード後もデータ残存


   実装サマリー

  全5フェーズを完了しました。

  Phase 1: カタログ基盤

  - prisma/schema.prisma - PcPartSpec モデル新規追加、Brand.chipSpecs/Item.pcPartSpec/Item.buildParts リレーション追加
  - lib/validations/pc-part-specs.ts - 8カテゴリ別Zodスキーマ + UI用フィールド定義
  - types/pc-part-spec.ts - TypeScript型定義
  - app/admin/items/components/PcPartSpecFields.tsx - partType に応じた動的フォーム（チップメーカー、TDP、カテゴリ別スペック）
  - app/admin/items/components/ItemForm.tsx - PcPartSpecFields 統合
  - app/admin/items/actions.ts - create/update で PcPartSpec の upsert/delete 対応

  Phase 2: UserPcBuildPart ↔ Item カタログ連携

  - prisma/schema.prisma - UserPcBuildPart.itemId 追加（オプション、SetNull）
  - lib/validations/pc-build.ts - itemId フィールド追加
  - app/actions/content/pc-build-actions.ts - itemId 対応、searchPcPartCatalog() 追加、取得時に Item 情報 include
  - app/dashboard/items/components/AddPcPartModal.tsx - 「カタログから選択 / 手動入力」切替タブUI
  - app/dashboard/items/components/EditPcPartModal.tsx - カタログ検索・リンク機能追加
  - app/[handle]/items/components/PcPartsList.tsx - Item リンク時は画像・ブランド表示
  - types/pc-build.ts - PcBuildPartWithItem 型追加

  Phase 3: 互換性チェックエンジン

  - lib/pc-compatibility/ - 7つの互換性ルール実装
    - CPU↔マザボ ソケット、RAM↔マザボ DDR規格・スロット数、GPU↔ケース 長さ、クーラー↔CPU ソケット、クーラー↔ケース 高さ、マザボ↔ケース フォームファクタ、PSU↔合計TDP
  - app/actions/content/pc-build-actions.ts - checkUserBuildCompatibility() Server Action

  Phase 4: ゲスト向け自作PC支援ツール

  - hooks/useGuestPcBuild.ts - localStorage ベースのビルド状態管理
  - app/tools/pc-builder/page.tsx - 公開ページ（認証不要）
  - app/tools/pc-builder/PcBuilderClient.tsx - パーツ追加、カタログ検索、互換性チェック、ログイン誘導

  Phase 5: 公開カタログ

  - app/items/pc-parts/page.tsx - ダミーデータ → 実データクエリに置換、使用者アバター表示
  - app/items/pc-parts/[id]/page.tsx - パーツ詳細ページ新規（スペック表・使用者一覧）