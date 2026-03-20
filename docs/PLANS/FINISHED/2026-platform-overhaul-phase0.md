# Phase 0: 準備・クリーンアップ 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-24
> **完了日**: 2026-02-24
> **見積もり**: 3-4日
> **依存関係**: なし（Phase 0はすべての開始点）
> **ステータス**: ✅ 完了

---

## 🎉 完了報告（2026-02-24）

### 実施内容

Phase 0「準備・クリーンアップ」のすべてのタスクを完了しました。

**完了したタスク**：

1. ✅ **0.1 不要ファイル削除** - `app/u/`、`app/g/`を削除
2. ✅ **0.2 Route Groups作成** - 不要と判断しスキップ（URLが異なるため）
3. ✅ **0.3 ディレクトリ構造変更** - Server Actions構造を確認
4. ✅ **0.4a リンクタイプ機能の移行** - `app/actions/admin/link-type-actions.ts`を新規作成
5. ✅ **0.4b 依存コンポーネントの削除/更新** - `app/dashboard/userdata/`を削除
6. ✅ **0.4c データベーステーブル削除** - `UserData`、`UserLink`テーブルを削除
7. ✅ **0.5 旧Server Actions削除** - `userdata-actions.ts`、`link-actions.ts`を削除
8. ✅ **0.6 FAQルート整理** - `app/[handle]/faq/`を削除

**データベース変更**：
- マイグレーション `20260224005200_remove_userdata_userlink` を作成・適用
- `UserData`テーブル削除
- `UserLink`テーブル削除
- `FaqCategory`、`FaqQuestion`テーブルは維持（専用FAQページで使用）

**コード変更**：
- Prismaスキーマ更新（User、MediaFile、LinkType、LinkTypeIconからの参照削除）
- `lib/handle-utils.ts` - userLinks参照削除
- 管理画面コンポーネント更新（使用数表示削除、統計タブ削除）
- tsconfig.json - backupsディレクトリを除外

**検証結果**：
- ✅ `npm run build` - 成功
- ✅ `npx tsc --noEmit` - 型エラーなし
- ✅ Prisma Client再生成 - 成功
- ✅ マイグレーション適用 - 成功

### 次のステップ

Phase 0が完了したため、Phase 1「テーマシステム基盤」に進むことができます。

---

## 概要

Phase 0は、大規模改修の土台を作る「準備・クリーンアップ」フェーズです。
既存ユーザーが0人であるため、後方互換性を考慮せずに旧システムを削除し、
新しいディレクトリ構造への移行を行います。

**重要な前提**:
- 既存ユーザー: 0人
- 後方互換性: 不要
- データマイグレーション: 不要

---

## タスク一覧

### 0.1 不要ファイル削除（優先度: HIGH）

**依存**: なし
**見積もり**: 0.5日

#### 削除対象ファイル/ディレクトリ

| パス | 理由 |
|-----|------|
| `app/u/` | 不要なルート（旧URLスキーム） |
| `app/g/` | 不要なルート（存在する場合） |

#### 作業手順

```bash
# 1. 削除前の確認
ls -la app/u/ app/g/ 2>/dev/null

# 2. 削除実行
rm -rf app/u/ app/g/

# 3. 関連インポートの確認
grep -r "from.*app/u" app/ lib/ components/
grep -r "from.*app/g" app/ lib/ components/
```

#### 検証

- [ ] `app/u/`が削除されている
- [ ] `app/g/`が削除されている（存在した場合）
- [ ] 関連インポートエラーがないこと
- [ ] `npm run lint`がパス

---

### 0.2 Route Groups作成（スキップ）

> **決定**: Route Groupsは不採用。現状のディレクトリ構造（`auth/`, `dashboard/`, `admin/`）を維持。
> 各フォルダに`layout.tsx`を配置することでレイアウト共有は既に実現済み。
> URL構造は `/dashboard/*`, `/admin/*`, `/auth/*` のまま。

**ステータス**: ✅ スキップ（不要と判断）

---

### 0.3 ディレクトリ構造変更（優先度: HIGH）

**依存**: 0.1
**見積もり**: 0.5日

#### Server Actions構造の整理

```
# 現状
app/actions/
├── media/
├── content/
├── auth/
├── user/
│   ├── userdata-actions.ts   # 削除対象
│   ├── profile-actions.ts
│   └── ...
├── admin/
├── social/
└── link/
    └── link-actions.ts       # 分割対象

# 変更後
app/actions/
├── media/
├── content/
├── auth/
├── user/
│   ├── profile-actions.ts
│   └── ...
├── admin/
│   └── link-type-actions.ts  # 新規（0.4aで作成）
├── social/
└── link/                     # 削除（0.5で実施）
```

#### コンポーネント構造の整理

```
# 主な変更
components/user-profile/  →  components/profile/（Phase 3で実施、Phase 0では保留）
lib/theme-presets.ts      →  lib/themes/（Phase 1で実施）
lib/section-registry.ts   →  lib/sections/（Phase 2で実施）
```

**注意**: Phase 0ではServer Actions以外の大きな構造変更は行わない

#### 検証

- [ ] ディレクトリ構造が計画通り
- [ ] `npm run lint`がパス
- [ ] `npm run build`がパス

---

### 0.4a リンクタイプ機能の移行（優先度: HIGH）

**依存**: 0.3
**見積もり**: 0.5日

#### 現状分析

`app/actions/link/link-actions.ts`には以下の機能が含まれる：
1. **リンクタイプ管理**（管理者機能）→ 残す、移行
2. **ユーザーリンク管理**（UserLink）→ 削除対象

#### 移行するアクション

```typescript
// app/actions/admin/link-type-actions.ts（新規作成）

// リンクタイプ一覧取得
export async function getLinkTypes()

// リンクタイプ作成
export async function createLinkType()

// リンクタイプ更新
export async function updateLinkType()

// リンクタイプ削除
export async function deleteLinkType()

// リンクタイプアイコン管理
export async function addLinkTypeIcon()
export async function removeLinkTypeIcon()
export async function setDefaultLinkTypeIcon()
```

#### 作業手順

1. `app/actions/admin/link-type-actions.ts`を新規作成
2. `app/actions/link/link-actions.ts`からリンクタイプ関連コードを移行
3. 管理画面のインポートを更新（`app/admin/links/`）
4. テスト実行

#### 更新が必要なファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/admin/links/page.tsx` | インポート先変更 |
| `app/admin/links/components/LinkTypeTable.tsx` | インポート先変更 |
| `app/admin/links/components/AddLinkTypeModal.tsx` | インポート先変更 |
| `app/admin/links/components/EditLinkTypeModal.tsx` | インポート先変更 |

#### 検証

- [ ] `app/actions/admin/link-type-actions.ts`が作成されている
- [ ] 管理画面のリンクタイプ一覧が表示される
- [ ] リンクタイプの作成・編集・削除が動作する
- [ ] アイコンのアップロード・選択が動作する

---

### 0.4b 依存コンポーネントの削除/更新（優先度: HIGH）

**依存**: 0.4a
**見積もり**: 0.5日

#### 削除対象ディレクトリ/ファイル

| パス | 理由 |
|-----|------|
| `app/dashboard/userdata/` | UserSection統合済み |
| `app/dashboard/userdata/add-userdata-modal.tsx` | 上記に含まれる |
| `app/dashboard/userdata/edit-userdata-modal.tsx` | 上記に含まれる |
| `app/dashboard/userdata/userdata-list-section.tsx` | 上記に含まれる |
| `app/dashboard/userdata/components/` | 上記に含まれる |

#### ダッシュボードサイドバーの更新

`components/sidebar-content/DashboardSidebarContent.tsx`から以下を削除：
- UserData関連のメニュー項目
- Links関連のメニュー項目（UserLink用）

#### 作業手順

```bash
# 1. ダッシュボード userdata 削除
rm -rf app/dashboard/userdata/

# 2. サイドバーからメニュー項目削除
# DashboardSidebarContent.tsx を編集

# 3. 依存関係の確認
grep -r "userdata" app/dashboard/ components/
```

#### 検証

- [ ] `app/dashboard/userdata/`が削除されている
- [ ] サイドバーにUserData/Links項目がない
- [ ] `/dashboard`が正常に動作する
- [ ] エラーログがないこと

---

### 0.4c データベーステーブル削除（優先度: HIGH）

**依存**: 0.4b
**見積もり**: 0.5日

#### 削除対象テーブル

| テーブル | Prismaモデル | 理由 |
|---------|-------------|------|
| `user_data` | `UserData` | UserSectionに統合済み |
| `user_links` | `UserLink` | UserSectionに統合済み |

#### 残すテーブル（削除しない）

| テーブル | Prismaモデル | 理由 |
|---------|-------------|------|
| `faq_categories` | `FaqCategory` | 専用FAQページで使用 |
| `faq_questions` | `FaqQuestion` | 専用FAQページで使用 |
| `link_types` | `LinkType` | 管理者機能で使用 |
| `link_type_icons` | `LinkTypeIcon` | 管理者機能で使用 |

#### 作業手順

1. **DBバックアップ（必須）**

```bash
# Dockerコンテナでバックアップ
docker compose -f compose.dev.yaml exec db pg_dump -U postgres altee_dev > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Prismaスキーマ更新**

```prisma
// 削除するモデル
// model UserData { ... }  // 削除
// model UserLink { ... }  // 削除

// Userモデルから以下を削除
model User {
  // ...
  // userLinks  UserLink[]   // 削除
  // userData   UserData[]   // 削除
  // ...
}

// MediaFileモデルから以下を削除
model MediaFile {
  // ...
  // linkIcons  UserLink[]  @relation("LinkIcon")  // 削除
  // ...
}
```

3. **マイグレーション実行**

```bash
# マイグレーション作成
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
npx prisma migrate dev --name remove_userdata_userlink

# Prisma Client再生成
npx prisma generate
```

4. **型エラーの解消**

マイグレーション後に発生する型エラーを修正：
- `User`型からの`userLinks`、`userData`参照を削除
- `MediaFile`型からの`linkIcons`参照を削除

#### 検証

- [ ] `UserData`テーブルが削除されている
- [ ] `UserLink`テーブルが削除されている
- [ ] `FaqCategory`テーブルが**残っている**
- [ ] `FaqQuestion`テーブルが**残っている**
- [ ] `LinkType`テーブルが**残っている**
- [ ] `npx prisma migrate dev`でエラーなし
- [ ] `npm run build`がパス

---

### 0.5 旧Server Actions削除（優先度: HIGH）

**依存**: 0.4c
**見積もり**: 0.25日

#### 削除対象ファイル

| ファイル | 理由 |
|---------|------|
| `app/actions/user/userdata-actions.ts` | UserDataテーブル削除済み |
| `app/actions/link/link-actions.ts` | リンクタイプ機能移行済み、UserLink削除済み |
| `app/actions/link/`ディレクトリ | 空になるため |

#### 残すファイル（削除しない）

| ファイル | 理由 |
|---------|------|
| `app/actions/content/faq-actions.ts` | 専用FAQページで使用 |
| `lib/faq-compat.ts` | FAQSection表示で使用 |

#### 作業手順

```bash
# 1. 削除実行
rm app/actions/user/userdata-actions.ts
rm app/actions/link/link-actions.ts
rmdir app/actions/link/  # 空なら削除

# 2. インポートエラーの確認
npm run lint
npm run build
```

#### 検証

- [ ] `userdata-actions.ts`が削除されている
- [ ] `link-actions.ts`が削除されている
- [ ] `faq-actions.ts`が**残っている**
- [ ] `npm run build`がパス

---

### 0.6 FAQルート整理（優先度: MEDIUM）

**依存**: 0.5
**見積もり**: 0.25日

#### 現状

```
app/
├── [handle]/
│   ├── faq/      # 旧ルート（削除）
│   └── faqs/     # 新ルート（残す）
```

#### 作業手順

```bash
# 1. 旧FAQルート削除
rm -rf app/\[handle\]/faq/

# 2. リダイレクトの設定（オプション）
# next.config.tsでリダイレクト設定も可能
```

#### 検証

- [ ] `/[handle]/faq/`が404になる
- [ ] `/[handle]/faqs/`が正常に動作する
- [ ] `app/dashboard/faqs/`が正常に動作する

---

## Phase 0 完了チェックリスト

### ファイル削除確認

- [ ] `app/u/`が削除されている
- [ ] `app/dashboard/userdata/`が削除されている
- [ ] `app/actions/user/userdata-actions.ts`が削除されている
- [ ] `app/actions/link/link-actions.ts`が削除されている
- [ ] `app/[handle]/faq/`が削除されている

### ファイル残存確認

- [ ] `app/actions/content/faq-actions.ts`が**残っている**
- [ ] `lib/faq-compat.ts`が**残っている**
- [ ] `app/dashboard/faqs/`が**残っている**
- [ ] `app/[handle]/faqs/`が**残っている**

### データベース確認

- [ ] `UserData`テーブルが削除されている
- [ ] `UserLink`テーブルが削除されている
- [ ] `FaqCategory`テーブルが**残っている**
- [ ] `FaqQuestion`テーブルが**残っている**
- [ ] `LinkType`テーブルが**残っている**
- [ ] `LinkTypeIcon`テーブルが**残っている**

### 新規ファイル確認

- [ ] `app/actions/admin/link-type-actions.ts`が作成されている

### ディレクトリ構造確認

- [x] `app/auth/`が存在する（Route Groupsは不採用）
- [x] `app/dashboard/`が存在する
- [x] `app/admin/`が存在する
- [x] 各フォルダに`layout.tsx`でレイアウト共有

### 動作確認

- [ ] `/auth/signin`が正常にアクセス可能
- [ ] `/dashboard`が正常にアクセス可能
- [ ] `/admin`が正常にアクセス可能
- [ ] `/admin/links`でリンクタイプ管理が動作する
- [ ] `/[handle]/faqs`が正常に動作する
- [ ] `npm run lint`がパス
- [ ] `npx tsc --noEmit`がパス
- [ ] `npm run build`がパス

---

## 依存関係グラフ

```
0.1 不要ファイル削除
    │
    ▼
0.2 Route Groups作成（スキップ）
    │
    ▼
0.3 ディレクトリ構造変更
    │
    ▼
0.4a リンクタイプ機能の移行
    │
    ▼
0.4b 依存コンポーネントの削除/更新
    │
    ▼
0.4c データベーステーブル削除
    │
    ▼
0.5 旧Server Actions削除
    │
    ▼
0.6 FAQルート整理
    │
    ▼
[Phase 0 完了] → Phase 1へ
```

---

## リスク管理

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| DBマイグレーション失敗 | 低 | 高 | 必ずバックアップを取得してから実行 |
| インポートパス漏れ | 中 | 中 | grep/IDEで全検索、CI/CDでビルド確認 |
| 管理画面リンクタイプ機能の動作不良 | 低 | 中 | 移行前にテストケースを確認 |

---

## 次のPhaseへの引き継ぎ

Phase 0が完了したら、以下の状態になっている必要があります：

1. **クリーンなコードベース**: 不要なファイル/テーブルが削除済み
2. **整理されたディレクトリ構造**: 各フォルダに`layout.tsx`でレイアウト共有（Route Groupsは不採用）
3. **分離された管理機能**: リンクタイプ管理が`admin/`に移行済み
4. **維持されたFAQ機能**: 専用FAQページが正常動作

これにより、Phase 1のテーマシステム基盤構築に集中できます。

---

**最終更新**: 2026-02-24
