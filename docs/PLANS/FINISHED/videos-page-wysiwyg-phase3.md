# Phase 3: Server Actions 更新 - 詳細実装計画

## 概要

既存の Server Actions に `page` パラメータ対応を追加し、YouTube PubSubHubbub 管理用の専用 Server Action を新設する。デフォルト値 `'profile'` により既存呼び出し元は変更不要。

---

## 3.1 section-actions.ts の page 対応

**ファイル:** `app/actions/user/section-actions.ts`

### 3.1.1 `getUserSections` の変更

```typescript
// 変更前
export async function getUserSections(userId: string): Promise<UserSection[] | null>

// 変更後
export async function getUserSections(
  userId: string,
  page: string = 'profile'  // デフォルト値で後方互換
): Promise<UserSection[] | null>

// where 句に page フィルタ追加
where: { userId, page },
```

### 3.1.2 `createSection` の変更

```typescript
// 変更前
export async function createSection(userId: string, sectionType: string, data: unknown = {})

// 変更後
export async function createSection(
  userId: string, sectionType: string, data: unknown = {}, page: string = 'profile'
)
```

**内部ロジック変更:**

1. **sortOrder 算出を page スコープに:**
```typescript
// 変更前
const maxSortOrder = await prisma.userSection.findFirst({
  where: { userId },
  orderBy: { sortOrder: 'desc' },
})

// 変更後
const maxSortOrder = await prisma.userSection.findFirst({
  where: { userId, page },
  orderBy: { sortOrder: 'desc' },
})
```

2. **create 時に page を含める:**
```typescript
const section = await prisma.userSection.create({
  data: { userId, sectionType, sortOrder, page, data: sectionData as never, ... },
})
```

### 3.1.3 `moveSectionOrder` の変更

```typescript
// セクションの page を取得
const section = await prisma.userSection.findUnique({
  where: { id: sectionId },
  select: { userId: true, sortOrder: true, page: true },  // page 追加
})

// 同一 page 内のセクションのみ取得
const allSections = await prisma.userSection.findMany({
  where: { userId: session.user.id, page: section.page },  // page フィルタ追加
  orderBy: { sortOrder: 'asc' },
})
```

### 3.1.4 `extractImageKeys` の拡張

`videos-profile` は画像を持たない（テキストのみ）。`youtube-latest`, `youtube-recommended`, `niconico-recommended` のサムネイルは外部URLであり R2 の storageKey ではないため、追加は実質不要。ただし明示的 case の追加を検討。

---

## 3.2 profile-editor の userSections クエリに page フィルタ追加

### `app/dashboard/profile-editor/page.tsx` (L39)

```diff
 userSections: {
+  where: { page: 'profile' },
   orderBy: { sortOrder: 'asc' },
 },
```

### `lib/handle-utils.ts` (L132-135) - `getUserByHandle`

```diff
 userSections: {
-  where: { isVisible: true },
+  where: { isVisible: true, page: 'profile' },
   orderBy: { sortOrder: 'asc' },
 },
```

公開ページ (`app/[handle]/page.tsx`) が `getUserByHandle` を使うため、videos セクションが混入しないよう明示フィルタが必要。

---

## 3.3 YouTube PubSubHubbub 管理用 Server Action

**ファイル:** `app/actions/social/youtube-actions.ts` に追加

### `updateYouTubeLatestSection`

```typescript
export async function updateYouTubeLatestSection(
  sectionId: string,
  newData: { channelId: string; rssFeedLimit: number }
): Promise<{ success: boolean; error?: string }>
```

### PubSubHubbub 管理フロー

```
ユーザーが YouTubeLatestEditModal で channelId を変更して保存
  → updateYouTubeLatestSection(sectionId, { channelId, rssFeedLimit })
    → Zod バリデーション
    → セクション所有者 + sectionType 確認
    → 現在の data.channelId と比較
      → 変更あり:
        → 旧 channelId があれば unsubscribeFromYoutubePush(旧ID)
        → 新 channelId があれば subscribeToYoutubePush(新ID)
      → 変更なし: PubSubHubbub操作なし
    → prisma.userSection.update({ data: { channelId, rssFeedLimit } })
    → revalidatePath
```

**重要:** PubSubHubbub の subscribe/unsubscribe は外部APIコール（202 Accepted、非同期処理）。失敗してもセクション更新は成功とする。

### 既存 `updateYoutubeChannel` との共存

Phase 3 時点では旧 `updateYoutubeChannel` はそのまま残す。理由:
- `dashboard/platforms/` からまだ呼ばれている
- ライブ配信機能が `User.youtubeChannelId` を参照
- Phase 10（データマイグレーション）まで並行稼働

---

## 3.4 `deleteSection` の PubSubHubbub 対応

**追加コード（画像クリーンアップの直後に）:**

```typescript
if (section.sectionType === 'youtube-latest') {
  const sectionData = section.data as { channelId?: string } | null
  if (sectionData?.channelId) {
    await unsubscribeFromYoutubePush(sectionData.channelId).catch((err) =>
      console.error('[deleteSection] PubSubHubbub unsubscribe failed:', err)
    )
  }
}
```

---

## 後方互換性の確認ポイント

| 変更箇所 | 既存呼び出し元 | 互換性保証方法 |
|---------|-------------|-------------|
| `getUserSections(userId, page?)` | 直接呼び出し箇所なし（Prisma直接クエリ使用） | デフォルト値 `'profile'` |
| `createSection(userId, type, data, page?)` | `AddSectionModal.tsx` L77 | 第4引数省略時 `'profile'` |
| `moveSectionOrder(sectionId, direction)` | `EditableSectionRenderer.tsx` L50 | section.page を内部で自動判定 |
| `deleteSection(sectionId)` | `EditableSectionRenderer.tsx` L63 | PubSubHubbub unsubscribe は内部ロジック |
| `profile-editor/page.tsx` クエリ | サーバーコンポーネント内部 | `where: { page: 'profile' }` で明示化 |
| `handle-utils.ts` getUserByHandle | `[handle]/page.tsx` | `where: { page: 'profile' }` で profile のみ返す |

---

## 検証方法

### 静的チェック
```bash
npm run lint && npx tsc --noEmit
```

### 回帰テスト

| テスト項目 | 期待結果 |
|-----------|---------|
| プロフィール編集ページ表示 | 既存セクションが全て表示される |
| セクション追加 | `page='profile'` で作成される |
| セクション移動 | 同一 page 内でのみ移動 |
| セクション削除 | 正常に削除される |
| 公開プロフィールページ | profile セクションのみ表示 |

### PubSubHubbub テスト（Phase 6 のエディタ実装後）

| テスト項目 | 期待結果 |
|-----------|---------|
| channelId 設定 | `subscribeToYoutubePush` が呼ばれる |
| channelId 変更 | 旧IDに unsubscribe、新IDに subscribe |
| channelId 削除 | 旧IDに unsubscribe |
| セクション削除 | 設定済みの channelId に unsubscribe |

---

## 実装順序

1. `getUserSections` に `page` パラメータ追加
2. `createSection` に `page` パラメータ追加 + sortOrder の page スコープ化
3. `moveSectionOrder` の同一 page 内フィルタ追加
4. `extractImageKeys` の明示的 case 追加
5. `profile-editor/page.tsx` の where 条件追加
6. `handle-utils.ts` の `getUserByHandle` に page フィルタ追加
7. `updateYouTubeLatestSection` Server Action 新規追加
8. `deleteSection` の PubSubHubbub unsubscribe 対応
9. lint + tsc チェック + 回帰テスト
