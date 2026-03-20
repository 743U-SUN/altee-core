# ヘッダー編集モーダル実装計画

## 概要

`dashboard/profile-editor` で、PCヘッダー左部分（アイコン＋ネームカード）をクリックしてモーダルを開き、以下を編集できるようにする。

1. **アイコン** - ユーザーがアップロードする汎用アイコン（推奨: 500×500px 正方形）
2. **キャラクター名** - テキスト入力
3. **ネームカード** - 4:1の背景画像または背景色（管理者プリセット / ユーザーアップロード / カラー選択）

---

## 環境構成（Docker）

```yaml
# compose.dev.yaml
services:
  app:           # Next.js 16 開発サーバー → localhost:3000
  db:            # PostgreSQL 17.4         → localhost:5433
  prisma-studio: # Prisma Studio           → localhost:5555
```

**ストレージ**: 開発環境は Cloudflare R2（本番と同一）。MinIO は使用していない。

```
STORAGE_ENDPOINT=https://*.r2.cloudflarestorage.com
STORAGE_BUCKET=altee-images
NEXT_PUBLIC_STORAGE_URL=http://localhost:3000/api/files
DATABASE_URL=postgresql://postgres:password@db:5432/altee_dev?schema=public
```

**開発環境の起動:**
```bash
docker compose -f compose.dev.yaml up -d
```

**DB マイグレーション手順:**
```bash
# Dockerコンテナ内で実行（推奨）
docker exec -it altee-core-dev npx prisma migrate dev --name <migration-name>

# またはホストから直接
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  npm run db:migrate
```

**今回 DB マイグレーションは不要**: `themeSettings` は既存の JSON 型フィールドを拡張するだけ。

---

## 現状把握

### 既存インフラ（そのまま活用）

| 機能 | 場所 | 状況 |
|------|------|------|
| `UserProfile.avatarImageId` (FK → MediaFile) | `prisma/schema.prisma` | **フィールド存在、UI未実装** |
| `User.characterName` | `prisma/schema.prisma` | フィールド存在、UI未実装 |
| `updateUserProfile()` | `app/actions/user/profile-actions.ts` | `avatarImageId`, `characterName` 対応済み |
| `ImageUploader` コンポーネント | `components/image-uploader/` | R2 直接アップロード対応済み |
| `EditModal` コンポーネント | `components/user-profile/EditModal.tsx` | Dialog 基盤（再利用する） |
| `getBackgroundImages()` | `app/actions/user/profile-actions.ts` | `uploadType: 'BACKGROUND'` 取得パターン |
| `imageEditType === 'profile'` の TODO | `app/dashboard/profile-editor/EditableProfileClient.tsx` L141 | 実装待ちコメントあり |

### 既存のバグ（今回修正）
`UserProfileLayout` が `ProfileHeader` に `avatarImageUrl` を渡していない → アイコンが表示されていない。

---

## タスク一覧（優先度・依存関係付き）

### Phase 1: avatarImageUrl の配線修正（バグ修正・DB不要）

**P1-1** `UserProfileLayout` に `avatarImageUrl` prop を追加して `ProfileHeader` へ渡す
- `components/user-profile/UserProfileLayout.tsx` (L13-26, L89-96)

**P1-2** `EditableProfileClient` に `avatarImageUrl`, `avatarImageId` props を追加
- `app/dashboard/profile-editor/EditableProfileClient.tsx` (L14-45)

**P1-3** `app/dashboard/profile-editor/page.tsx` で `avatarImage` を include して URL 生成
```typescript
profile: {
  include: {
    avatarImage: { select: { storageKey: true } }
  }
}
// URL: `/api/files/${profile.avatarImage.storageKey}`
```

**P1-4** `app/[handle]/layout.tsx` でも avatarImageUrl を渡す（公開ページ）
- **⚠️ 追加: `getUserByHandle()` またはlayout内クエリで `avatarImage: { select: { storageKey: true } }` を include する変更も必要**（URL生成のため）

---

### Phase 2: ProfileHeader クリック対応（依存: P1 完了後）

**P2-1** `ProfileHeader` の左部分（アイコン + ネームカードエリア）を `isEditable` 時にクリック可能にする
- `components/user-profile/ProfileHeader.tsx` (L59-81)
- **⚠️ 追加: `ProfileHeader` の props interface に `onImageEdit?: (type: 'banner' | 'character' | 'profile') => void` を追加**（現在なし）
- **⚠️ 追加: `UserProfileLayout` から `ProfileHeader` へ `onImageEdit` を渡す配線**（現在なし）
- ラッパー div に `onClick={() => onImageEdit?.('profile')}` を追加
- ホバーオーバーレイで鉛筆アイコンを表示（CharacterColumn の EditOverlay パターン参照）
- スタイル: `cursor-pointer group` + `group-hover:opacity-100`

---

### Phase 3: ThemeSettings 型拡張（依存なし・DB不要）

**P3-1** `ThemeSettings` に `namecard` フィールドを追加
- `types/profile-sections.ts`

```typescript
interface ThemeSettings {
  // ...既存フィールド...
  namecard?: {
    type: 'preset' | 'color' | 'image'
    color?: string    // 背景色 hex (#ffffff 等)
    imageKey?: string // R2 ストレージキー
  }
}
```

**P3-2** `ProfileHeader` のネームカード部分を `themeSettings.namecard` から背景適用
- `components/user-profile/ProfileHeader.tsx` (L77-81)
- `type='color'` → `style={{ backgroundColor: color }}`
- `type='image'` → `style={{ backgroundImage: 'url(/api/files/...)', backgroundSize: 'cover' }}`

---

### Phase 4: サーバーアクション追加（依存: P3-1）

**P4-1** `updateThemeSettings()` を `profile-actions.ts` に追加
- 既存 `themeSettings` JSON に**マージ**（上書き禁止）

```typescript
// 既存設定を取得してマージ
const current = profile.themeSettings as ThemeSettings ?? {}
const merged = { ...current, namecard: newNamecard }
await prisma.userProfile.update({ data: { themeSettings: merged } })
```

**P4-2** `getNamecardImages()` を `profile-actions.ts` に追加
```typescript
// 管理者が tag ["namecard"] 付きでアップロードした BACKGROUND 画像を取得
where: {
  uploadType: 'BACKGROUND',
  tags: { array_contains: ['namecard'] },
  deletedAt: null,
}
```
→ 既存の `getBackgroundImages()` と同じパターン
- **⚠️ 注意: `tags` は `Json?` 型。`array_contains` は PostgreSQL JSON 配列に対して動作するが、管理者が `["namecard"]` 形式で保存している前提。実装時に MediaFile.tags の保存形式を確認すること。**

---

### Phase 5: HeaderEditModal 実装（依存: Phase 3, 4 完了後）

**P5-1** `components/user-profile/HeaderEditModal.tsx` 新規作成

`CharacterImageModal` と同じパターン（`EditModal` + `Tabs` 3タブ構成）:

**タブ 1: アイコン**
```
推奨: 500×500px 正方形
- 現在のアイコン表示（avatarImageUrl があれば）+ 削除ボタン
- ImageUploader:
    mode="immediate"
    maxFiles={1}
    maxSize={5MB}
    folder="user-icons"
    rounded={true}
    previewSize="small"
- 保存: updateUserProfile({ avatarImageId: uploadedFiles[0].id })
- 削除: updateUserProfile({ avatarImageId: null })
```

**タブ 2: キャラクター名**
```
- Input (max 30文字)
- 現在値を初期値に設定
- 保存: updateUserProfile({ characterName: value })
```

**タブ 3: ネームカード**
```
RadioGroup で 3択:
  [A] プリセット画像（管理者提供）
      - getNamecardImages() で取得
      - 4:1 比率サムネイル表示（BannerImageModal パターン参照）
      - 選択した storageKey → imageKey に保存
  [B] 背景色
      - 6色プリセットパレット（テーマカラーベース）
      - input[type=color] でカスタム色指定も可
  [C] カスタム画像アップロード
      - 推奨: 800×200px (4:1)
      - ImageUploader:
          mode="immediate"
          maxFiles={1}
          folder="namecard-images"
- 保存: updateThemeSettings({ namecard: { type, color?, imageKey? } })
```

---

### Phase 6: EditableProfileClient 配線（依存: Phase 2, 5 完了後）

**P6-1** `imageEditType === 'profile'` に `HeaderEditModal` を配置
- `app/dashboard/profile-editor/EditableProfileClient.tsx` L141（現 TODO コメント箇所）

```tsx
{imageEditType === 'profile' && (
  <HeaderEditModal
    isOpen={true}
    onClose={handleImageEditClose}
    currentAvatarImageId={avatarImageId}
    currentAvatarImageUrl={avatarImageUrl}
    currentCharacterName={characterName}
    currentThemeSettings={themeSettings}
  />
)}
```

---

### Phase 7: 管理者側プリセット管理（独立タスク）

**P7-1** ネームカードプリセット画像のアップロード運用方法
- 既存 `/admin/media/upload` で `uploadType: BACKGROUND` + tag `["namecard"]` を指定してアップロード
- 新規管理ページは不要（既存 MediaTable でフィルタ確認可能）

**P7-2** 画像仕様
- サイズ: 800×200px 以上（4:1 比率）
- 形式: WebP 推奨（自動変換される）
- 管理上の命名規則: `namecard-[テーマ名]-[連番]`

---

## 変更ファイル一覧

| ファイル | 種別 | 主な変更 |
|---------|------|---------|
| `types/profile-sections.ts` | 修正 | `ThemeSettings.namecard` フィールド追加 |
| `components/user-profile/UserProfileLayout.tsx` | 修正 | `avatarImageUrl` prop 追加・ProfileHeader へ通過 |
| `components/user-profile/ProfileHeader.tsx` | 修正 | `avatarImageUrl` 受取 + 編集時クリック化 + namecard 背景反映 |
| `components/user-profile/HeaderEditModal.tsx` | **新規** | 3タブ編集モーダル（アイコン/名前/ネームカード） |
| `app/actions/user/profile-actions.ts` | 修正 | `updateThemeSettings()`, `getNamecardImages()` 追加 |
| `app/dashboard/profile-editor/EditableProfileClient.tsx` | 修正 | `avatarImageUrl/Id` props + `HeaderEditModal` 配線 |
| `app/dashboard/profile-editor/page.tsx` | 修正 | avatarImage fetch・URL 生成・props 渡し |
| `app/[handle]/layout.tsx` | 修正 | avatarImageUrl を UserProfileLayout に渡す |

**DB マイグレーション: 不要**（`themeSettings` は既存 JSON フィールドの型拡張のみ）

---

## 潜在リスクと対策

| リスク | 対策 |
|--------|------|
| `themeSettings` JSON の上書きで他設定が消える | `updateThemeSettings` はマージ処理必須（spread でシャローマージ） |
| ネームカード画像の縦横比ずれ | CSS `object-fit: cover` + `aspect-[4/1]` クラスで強制 |
| 管理者プリセット未登録時の空状態 | タブ A に「まだ画像がありません」表示、他タブは常時使用可能 |
| `user-icons` フォルダの日付階層対象外問題 | `image-upload-actions.ts` の対象フォルダリストに `user-icons` が含まれているか確認 |
| モバイルはヘッダーが非表示（PCのみ） | モバイル対応は別タスク（Floating area での編集は将来対応） |

---

## テスト戦略

**開発環境の起動:**
```bash
docker compose -f compose.dev.yaml up -d
# アプリ:         http://localhost:3000
# Prisma Studio: http://localhost:5555
```

**テスト手順（`/testing` skill で MCP Playwright 使用）:**
1. `/dashboard/profile-editor` を開く
2. ヘッダー左部分（アイコン＋ネームカードエリア）をホバー → 編集アイコン表示を確認
3. クリック → `HeaderEditModal` が開くことを確認
4. **Tab 1 アイコン**: 画像アップロード → 保存後ヘッダーアイコンに反映
5. **Tab 2 キャラクター名**: 名前変更 → 保存後ネームカードに反映
6. **Tab 3 ネームカード背景色**: 色選択 → 保存後ネームカード背景色が変わる
7. **Tab 3 カスタム画像**: 画像アップロード → 保存後ネームカード背景に反映
8. 公開ページ `/@handle` でも変更が反映されること確認

---

## 実装順序（推奨）

```
P1（バグ修正・配線）
  → P3（型定義）
  → P4（Server Actions）
  → P2（クリック対応）
  → P5（モーダル実装）
  → P6（配線）
  → P7（管理者側）
```

- **P1** は即効性があり（既存バグ修正）、先行して単独リリース可能
- **P3, P4** は P5 の前提として先に完了させる
- **P7** は完全に独立していて、実装前でも管理者が準備可能
