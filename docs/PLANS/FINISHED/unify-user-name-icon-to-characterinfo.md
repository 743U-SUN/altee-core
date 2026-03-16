# ユーザー名・アイコンの CharacterInfo 統一計画

## Context

ユーザーの名前・アイコンデータが `User`、`UserProfile`、`CharacterInfo` の3テーブルに分散しており、画面ごとに異なるフィールドが使われている。`CharacterInfo` に一元化することで、管理・フィルタリング・表示を統一する。

---

## 現状の問題

### 名前に関するフィールド（3箇所に分散）

```
User テーブル
├── name               ← OAuthの名前（Google/Discord自動設定）ユーザーは変更不可
├── characterName      ← 表示名（セットアップ時に設定、profile-editorで変更可）
├── handle             ← URL用ハンドル（@okome 等）
├── image              ← OAuthアバター（自動設定）
├── customImageKey     ← ★完全に未使用（書き込み処理なし）
└── preferredImageProvider ← ★完全に未使用（TS参照ゼロ）

UserProfile テーブル
├── avatarImageId      ← カスタムアバター（ヘッダー・ネームカード用 1:1正方形）
└── characterImageId   ← キャラクター画像（プロフィール左カラム用 9:16縦長）

CharacterInfo テーブル
├── characterName      ← キャラクターネーム（User.characterNameとは完全に別物!）
└── iconImageKey       ← キャラクターアイコン
```

### 各画面で使われているデータ（バラバラ）

| 画面 | 名前のソース | アイコンのソース |
|------|-------------|----------------|
| **ナビ（ヘッダー・サイドバー）** | `User.characterName` → `User.name` → `'ユーザー'` | `UserProfile.avatarImage` → `User.image` |
| **初回セットアップ** | → `User.characterName` に保存 | - |
| **プロフィールエディター** | `User.characterName` を編集 | `UserProfile.avatarImageId` を編集 |
| **キャラクター設定** | `CharacterInfo.characterName` を編集 | `CharacterInfo.iconImageKey` を編集 |
| **Admin ユーザー一覧** | `User.name`（OAuth名のみ!） | `User.image`（OAuthアバターのみ!） |
| **公開プロフィール** | `User.characterName` | `UserProfile.avatarImage` |

### 具体的な問題点

1. **Admin一覧がOAuth名を表示** → Google名「田中太郎」は見えるが活動名が見えない
2. **Admin検索がname/emailのみ** → characterNameやhandleで検索できない
3. **`User.characterName` と `CharacterInfo.characterName` が同名** → 別データなのに紛らわしい
4. **`User.customImageKey` / `preferredImageProvider` が完全にデッドフィールド**
5. **名前を変更する場所が2箇所** → profile-editor と dashboard/character で別々のフィールドを編集

---

## 方針

| 項目 | 現状 | 統一後 |
|------|------|--------|
| **表示名** | `User.characterName` | **`CharacterInfo.characterName`** |
| **アイコン** | `UserProfile.avatarImageId` (MediaFile FK) | **`CharacterInfo.iconImageKey`** (R2 key) |
| **OAuth名** | `User.name` | そのまま残す（フォールバック用） |
| **OAuthアバター** | `User.image` | そのまま残す（フォールバック用） |

**表示名フォールバック**: `CharacterInfo.characterName || User.name || 'ユーザー'`
**アイコンフォールバック**: `CharacterInfo.iconImageKey` → `User.image` → デフォルト

---

## 実装ステップ

### Step 1: セットアップ時の CharacterInfo 作成

**ファイル**: `app/dashboard/setup/actions.ts`

現在 `completeUserSetup()` は `User.characterName` に書き込んでいる。これを変更:
- `CharacterInfo` を `upsert` で作成し、`characterName` を保存
- `User.characterName` への書き込みは削除

※現在 CharacterInfo はセットアップ時に作成されていない（/dashboard/character 訪問時に初めて作成される）ため、ここでの作成が必須。

### Step 2: セッション（auth）の読み取り元を変更

**ファイル**: `auth.ts`

セッションコールバックが `User.characterName` を読んでいる。変更:
- `include: { characterInfo: { select: { characterName: true } } }` を追加
- `session.user.characterName = dbUser.characterInfo?.characterName`

### Step 3: ナビゲーション用データ取得の変更

**ファイル**: `lib/user-data.ts` の `getUserNavData()`

現在: `User.characterName` + `UserProfile.avatarImage.storageKey`
変更後: `CharacterInfo.characterName` + `CharacterInfo.iconImageKey`

```typescript
include: {
  characterInfo: {
    select: { characterName: true, iconImageKey: true }
  }
}
```

アイコンURL: `getPublicUrl(characterInfo.iconImageKey)` → `User.image` フォールバック

### Step 4: プロフィールエディター（HeaderEditModal）の変更

**ファイル**: `app/actions/user/profile-actions.ts`

`updateUserProfile()` が `User.characterName` と `UserProfile.avatarImageId` を更新している。変更:
- 名前の更新先を `CharacterInfo.characterName` に変更
- アイコンの更新先を `CharacterInfo.iconImageKey` に変更
- `UserProfile.avatarImageId` への書き込みを削除

**ファイル**: `components/user-profile/HeaderEditModal.tsx`
- 名前とアイコンのデータソースを CharacterInfo に切り替え

### Step 5: 公開プロフィールページの変更

**ファイル**: `lib/handle-utils.ts` の `getUserByHandle()`
- `CharacterInfo` をincludeに追加

**ファイル**: `app/[handle]/layout.tsx`
- `characterName` と `avatarImageUrl` を CharacterInfo から取得

### Step 6: Admin ページの変更

**ファイル**: `app/actions/admin/user-management.ts`
- `getUserList()` の select に `characterInfo: { select: { characterName: true, iconImageKey: true } }` 追加
- 検索条件に `characterInfo: { characterName: { contains: ..., mode: "insensitive" } }` を追加

**ファイル**: `app/admin/users/components/UserListClient.tsx`
- 表示名: `characterName`（CharacterInfo経由）
- アイコン: `iconImageUrl`（CharacterInfo.iconImageKey経由）

**ファイル**: `app/admin/users/components/UserList.tsx`
- サーバー側で iconImageKey → URL 変換してクライアントに渡す

**ファイル**: `app/admin/users/[id]/page.tsx`
- 詳細ページでも CharacterInfo のデータを表示

### Step 7: データマイグレーション

既存データの移行スクリプト作成:

```sql
-- 1. CharacterInfo が存在しないユーザーに新規作成
INSERT INTO character_info (id, user_id, character_name, created_at, updated_at)
SELECT gen_random_uuid(), u.id, u."characterName", NOW(), NOW()
FROM users u
LEFT JOIN character_info ci ON ci.user_id = u.id
WHERE ci.id IS NULL AND u."characterName" IS NOT NULL;

-- 2. 既存 CharacterInfo の characterName が NULL のものを User.characterName からコピー
UPDATE character_info ci
SET character_name = u."characterName"
FROM users u
WHERE ci.user_id = u.id
  AND ci.character_name IS NULL
  AND u."characterName" IS NOT NULL;

-- 3. UserProfile.avatarImageId の MediaFile.storageKey → CharacterInfo.iconImageKey にコピー
UPDATE character_info ci
SET icon_image_key = mf.storage_key
FROM user_profiles up
JOIN media_files mf ON mf.id = up.avatar_image_id
WHERE ci.user_id = up.user_id
  AND ci.icon_image_key IS NULL
  AND up.avatar_image_id IS NOT NULL;
```

### Step 8: レガシーフィールドの整理

**削除対象（Prismaスキーマ + マイグレーション）**:
- `User.characterName` → 削除（CharacterInfoに移行済み）
- `User.customImageKey` → 削除（完全に未使用）
- `User.preferredImageProvider` → 削除（完全に未使用）
- `UserProfile.avatarImageId` → 削除（CharacterInfoに移行済み）
- `UserProfile.avatarImage` リレーション → 削除

**残すもの**:
- `User.name` (OAuth参照、フォールバック用)
- `User.image` (OAuthアバター、フォールバック用)
- `UserProfile.characterImageId` (9:16縦長画像、アイコンとは別概念)

---

## 影響ファイル一覧

| カテゴリ | ファイル | 変更内容 |
|---------|---------|---------|
| セットアップ | `app/dashboard/setup/actions.ts` | CharacterInfo作成追加、User.characterName書き込み削除 |
| 認証 | `auth.ts` | セッション読み取り元をCharacterInfoに変更 |
| ナビデータ | `lib/user-data.ts` | getUserNavDataの読み取り元変更 |
| プロフィール編集 | `app/actions/user/profile-actions.ts` | 更新先をCharacterInfoに変更 |
| プロフィール編集 | `components/user-profile/HeaderEditModal.tsx` | データソース変更 |
| 公開ページ | `lib/handle-utils.ts` | CharacterInfo include追加 |
| 公開ページ | `app/[handle]/layout.tsx` | 読み取り元変更 |
| Admin | `app/actions/admin/user-management.ts` | select/検索条件にCharacterInfo追加 |
| Admin | `app/admin/users/components/UserListClient.tsx` | 表示をCharacterInfo経由に変更 |
| Admin | `app/admin/users/components/UserList.tsx` | データ中継変更 |
| Admin | `app/admin/users/[id]/page.tsx` | 詳細表示変更 |
| スキーマ | `prisma/schema.prisma` | レガシーフィールド削除+コメント改善 |
| マイグレーション | 新規SQLスクリプト | 既存データの移行 |

---

## 統一後の状態

```
User テーブル（認証・OAuth情報のみ）
├── name        ← OAuth名（フォールバック用に残す）
├── handle      ← URL用ハンドル（変更なし）
└── image       ← OAuthアバター（フォールバック用に残す）

CharacterInfo テーブル（表示名・アイコン・キャラ設定すべて集約）
├── characterName   ← サイト全体の表示名 ★統一先
├── iconImageKey    ← サイト全体のアイコン ★統一先
├── nameReading     ← 読み方
├── gender, species, element, ...  ← キャラ属性
└── （その他キャラ設定フィールド）

UserProfile テーブル（プロフィールレイアウト・テーマ設定のみ）
├── characterImageId    ← 9:16縦長画像（アイコンとは別概念、残す）
├── characterBackgroundKey
├── themePreset / themeSettings
└── bannerImageKey
```

---

## 検証方法

1. `npm run lint && npx tsc --noEmit` で型エラーゼロ確認
2. `/dashboard/setup` で新規ユーザーセットアップ → CharacterInfo が作成されること
3. ナビゲーション（ヘッダー・サイドバー）に CharacterInfo の名前・アイコンが表示されること
4. `/dashboard/profile-editor` で名前・アイコン変更 → CharacterInfo が更新されること
5. `/dashboard/character` の基本情報と同じデータが使われていること
6. `/@handle` 公開ページに正しい名前・アイコンが表示されること
7. `/admin/users` 一覧に CharacterInfo の名前が表示・検索できること
8. データマイグレーション後、既存ユーザーのデータが正しく移行されていること