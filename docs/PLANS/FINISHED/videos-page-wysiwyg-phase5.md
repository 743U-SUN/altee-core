# Phase 5: 表示コンポーネント - 詳細実装計画

## 概要

videos ページ用の4つの表示セクションコンポーネントを新規作成する。既存の `BaseSectionProps` パターンに従い、`ThemedCard` + `Badge` によるテーマ統一を維持する。

---

## 既存セクションの共通パターン（踏襲ルール）

1. **Props**: `BaseSectionProps` (`{ section: UserSection, isEditable: boolean }`)
2. **データ取得**: `section.data as XxxData` で型アサーション
3. **UIラッパー**: `ThemedCard` (size="md", className="w-full mb-6")
4. **タイトル表示**: `section.title` があれば `Badge variant="accent"` で表示
5. **空状態**: データが空の場合は `null` or `isEditable` 時のみプレースホルダー
6. **ソート**: `items` 配列は `.sort((a, b) => a.sortOrder - b.sortOrder)`

---

## 5.0 公開用 Server Action の追加

**ファイル:** `app/actions/social/youtube-actions.ts`

YouTubeLatestSection がクライアントサイドで RSS Feed を取得するための認証不要 Server Action。

```typescript
export async function fetchPublicYoutubeRss(
  channelId: string,
  limit: number = 6
): Promise<{
  success: boolean
  data?: Array<{ videoId: string; title: string; thumbnail?: string; publishedAt: string }>
  error?: string
}>
```

- `requireAuth()` を**呼ばない**（公開ページからのアクセスのため）
- channelId のフォーマットバリデーションは実施
- `fetchYoutubeRssFeed` 内の `next: { revalidate }` キャッシュにより頻繁な呼び出しでも安全

---

## 5.1 VideosProfileSection

**新規:** `components/user-profile/sections/VideosProfileSection.tsx`

最もシンプルなセクション。タイトル + 説明文表示。

```typescript
// Server Component として実装可能（クライアント操作なし）
export function VideosProfileSection({ section }: BaseSectionProps) {
  const data = section.data as VideosProfileData
  // ThemedCard + Badge + h2 + p で構成
}
```

- `whitespace-pre-wrap` で改行保持
- テーマCSS変数使用 (`--theme-text-primary`, `--theme-text-secondary`)

---

## 5.2 YouTubeLatestSection

**新規:** `components/user-profile/sections/YouTubeLatestSection.tsx`

`'use client'` 必須（useSWR使用）。

### データ取得フロー

```
[コンポーネント mount]
  → useSWR("youtube-rss-{channelId}-{limit}")
    → fetchPublicYoutubeRss(channelId, rssFeedLimit)
      → fetchYoutubeRssFeed(channelId, limit)
        → YouTube RSS Feed API (next.revalidate キャッシュ)
```

### 状態表示

| 状態 | 表示 |
|------|------|
| channelId未設定 or rssFeedLimit=0 | isEditable時: プレースホルダー / 非編集時: null |
| ローディング中 | Loader2 スピナー |
| エラー or データなし | isEditable時: エラーメッセージ / 非編集時: null |
| 正常 | YouTubeFacade グリッド + タイトル |

### レスポンシブグリッド

| 動画数 | モバイル | SM (640px+) | LG (1024px+) |
|--------|---------|-------------|--------------|
| 1本 | 1列 (max-w-md) | 1列 | 1列 |
| 2本 | 1列 | 2列 | 2列 |
| 3本+ | 1列 | 2列 | 3列 |

---

## 5.3 YouTubeRecommendedSection

**新規:** `components/user-profile/sections/YouTubeRecommendedSection.tsx`

`'use client'` 必須。外部API呼び出し不要。`section.data.items` から直接レンダリング。

```typescript
export function YouTubeRecommendedSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as YouTubeRecommendedData
  const sortedItems = [...(data.items || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  // ThemedCard + YouTubeFacade グリッド + タイトル
}
```

- 空状態: isEditable 時は ThumbsUp アイコン + メッセージ
- グリッドは YouTubeLatestSection と同一パターン

---

## 5.4 NiconicoRecommendedSection

**新規:** `components/user-profile/sections/NiconicoRecommendedSection.tsx`

`YouTubeRecommendedSection` とほぼ同一構造。`YouTubeFacade` の代わりに `NiconicoFacade` を使用。

```typescript
export function NiconicoRecommendedSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as NiconicoRecommendedData
  const sortedItems = [...(data.items || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  // ThemedCard + NiconicoFacade グリッド + タイトル
}
```

- 空状態: isEditable 時は Tv2 アイコン + メッセージ
- `NiconicoFacade` は `thumbnailUrl` を props で受け取る

---

## 共通ユーティリティ（オプション）

`getGridClassName` が3コンポーネントで重複。YAGNI 原則に従い、まず各コンポーネント内に定義し、実装完了後に共通化を検討。

```typescript
function getGridClassName(count: number): string {
  if (count === 1) return 'max-w-md mx-auto'
  if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-4'
  return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
}
```

---

## 実装順序

1. **5.0** `fetchPublicYoutubeRss` Server Action を追加
2. **5.1** `VideosProfileSection`（最もシンプル、パターン確認用）
3. **5.3** `YouTubeRecommendedSection`（外部API不要、次にシンプル）
4. **5.4** `NiconicoRecommendedSection`（5.3のほぼコピー）
5. **5.2** `YouTubeLatestSection`（useSWR + Server Action があるため最後に）

---

## 検証方法

1. `npm run lint && npx tsc --noEmit` でエラーゼロ確認
2. useSWR 動作確認（YouTubeLatestSection）:
   - 有効な channelId で RSS Feed が正常に取得・表示されること
   - `rssFeedLimit=0` で空表示になること
   - 無効な channelId でエラーハンドリングが正しく動作すること
3. レスポンシブ確認: モバイル/タブレット/デスクトップでグリッドレイアウト切り替え
4. Facade パターン確認: サムネイル→クリックでiframe読み込み
5. テーマ対応確認: 異なるテーマプリセットでの表示

---

## リスク

| リスク | 影響度 | 対策 |
|--------|--------|------|
| NiconicoFacade が Phase 4 で未完成 | 中 | Phase 4 完了後に実装。仮に先行する場合は YouTubeFacade で代替テスト |
| useSWR のキー重複 | 低 | channelId + rssFeedLimit をキーに含めて一意性確保 |
| RSS Feed のレスポンス遅延 | 低 | useSWR のローディング状態で対応。fetchYoutubeRssFeed のキャッシュで2回目以降は高速 |
