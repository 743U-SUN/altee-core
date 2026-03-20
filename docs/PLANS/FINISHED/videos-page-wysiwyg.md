# 計画: dashboard/platforms/ → dashboard/videos/ WYSIWYG化

## Context

現在の `dashboard/platforms/` はタブベースのUI（YouTube/Twitch/ニコニコ）で、プラットフォーム接続設定を管理している。これを `dashboard/videos/` に移行し、`dashboard/profile-editor` と同じ**セクションベースのWYSIWYG編集パターン**に変更する。各セクションはモーダルで追加・編集し、並べ替え可能にする。

**確定セクション**: プロフィール、YouTube最新動画、YouTubeおすすめ動画、ニコニコおすすめ動画

## 方針

- 既存の `UserSection` モデルに `page` カラム（`'profile' | 'videos'`）を追加
- プラットフォーム設定（channelId等）はセクションの `data` JSON内に統合
- 既存の Server Actions / EditableSectionRenderer を最大限再利用
- Twitch関連（EventSub, ライブ配信）は本計画のスコープ外

---

## Phase 1: データベース基盤

### 1.1 Prisma スキーマ修正
**ファイル:** `prisma/schema.prisma`

- `UserSection` に `page String @default("profile")` カラム追加
- インデックス追加: `@@index([userId, page, sortOrder])`
- 既存レコードはデフォルト値 `"profile"` で後方互換

### 1.2 マイグレーション実行
```bash
DATABASE_URL="..." npm run db:migrate -- --name add_section_page_column
```

---

## Phase 2: 型定義・レジストリ更新

### 2.1 型定義追加
**ファイル:** `types/profile-sections.ts`

- `UserSection` インターフェースに `page` フィールド追加
- 新しいセクションデータ型:

```typescript
// 動画ページプロフィール
interface VideosProfileData {
  title: string
  description?: string
}

// YouTube最新動画（channelIdをセクション内に統合）
interface YouTubeLatestData {
  channelId: string       // User.youtubeChannelId から移行
  rssFeedLimit: number    // User.youtubeRssFeedLimit から移行
}

// YouTubeおすすめ動画（YouTubeRecommendedVideoテーブルから移行）
interface YouTubeRecommendedData {
  items: Array<{
    id: string
    videoId: string
    title: string
    thumbnail: string
    sortOrder: number
  }>
}

// ニコニコおすすめ動画（新規）
interface NiconicoRecommendedData {
  items: Array<{
    id: string
    videoId: string    // sm/nm/so + 数字
    title: string
    thumbnail: string
    sortOrder: number
  }>
}
```

### 2.2 SectionDefinition に `page` フィールド追加
**ファイル:** `lib/sections/types.ts`

- `page?: 'profile' | 'videos'` フィールド追加（未指定 = `'profile'`）

### 2.3 SECTION_REGISTRY に4セクション追加
**ファイル:** `lib/sections/registry.ts`

| type | label | icon | maxInstances | page |
|------|-------|------|-------------|------|
| `videos-profile` | 動画ページプロフィール | Film | 1 | videos |
| `youtube-latest` | YouTube最新動画 | Rss | 1 | videos |
| `youtube-recommended` | YouTubeおすすめ動画 | ThumbsUp | 1 | videos |
| `niconico-recommended` | ニコニコおすすめ動画 | Tv2 | - | videos |

ユーティリティ関数追加: `getVideoPageSections()`, `getSectionsByPage(page)`

### 2.4 EDITOR_REGISTRY に4エディタ追加
**ファイル:** `lib/sections/editor-registry.ts`

### 2.5 型ガード追加
**ファイル:** `lib/sections/type-guards.ts`

---

## Phase 3: Server Actions 更新

### 3.1 section-actions.ts の page 対応
**ファイル:** `app/actions/user/section-actions.ts`

修正する関数:
- `getUserSections(userId, page?)` — `where: { userId, page }` フィルタ追加
- `createSection(userId, sectionType, data, page?)` — `page` パラメータ追加 + sortOrder算出をpage内スコープに
- `moveSectionOrder(sectionId, direction)` — 同一page内のセクションのみ対象に
- `extractImageKeys()` — `videos-profile` の画像キー対応追加

**重要:** デフォルト値 `'profile'` により既存呼び出し元は変更不要

### 3.2 profile-editor の userSections クエリにpageフィルタ追加
**ファイル:** `app/dashboard/profile-editor/page.tsx` (L39)

```diff
 userSections: {
+  where: { page: 'profile' },
   orderBy: { sortOrder: 'asc' },
 },
```

### 3.3 YouTube PubSubHubbub 管理用 Server Action
**ファイル:** `app/actions/social/youtube-actions.ts` に追加

- `updateYouTubeLatestSection(sectionId, newData)` — channelId変更時にPubSubHubbubのsubscribe/unsubscribeを実行してからupdateSectionを呼ぶ

---

## Phase 4: ニコニコサービス層（並行実装可能）

### 4.1 定数定義
**新規ファイル:** `services/niconico/constants.ts`

- `MAX_NICONICO_RECOMMENDED_VIDEOS = 6`
- Video ID パターン: `/^(sm|nm|so)\d+$/`
- URL抽出パターン: `nicovideo.jp/watch/`, `nico.ms/`
- oEmbed URL: `https://embed.nicovideo.jp/oembed`

### 4.2 Niconico API サービス
**新規ファイル:** `services/niconico/niconico-api.ts`

- `fetchNiconicoVideoMetadata(videoId)` — oEmbed APIでタイトル・サムネイル取得
- `extractNiconicoVideoId(input)` — URL/IDから動画ID抽出

### 4.3 NiconicoFacade コンポーネント
**新規ファイル:** `components/NiconicoFacade.tsx`

- 既存の `components/YouTubeFacade.tsx` と同じパターン
- サムネイル先表示 → クリックで`https://embed.nicovideo.jp/watch/{videoId}` iframe読み込み

### 4.4 Niconico Server Action
**新規ファイル:** `app/actions/social/niconico-actions.ts`

- `getNiconicoMetadata(url)` — URL入力からメタデータ取得

---

## Phase 5: 表示コンポーネント

### 5.1 VideosProfileSection
**新規:** `components/user-profile/sections/VideosProfileSection.tsx`
- タイトル + 説明文表示

### 5.2 YouTubeLatestSection
**新規:** `components/user-profile/sections/YouTubeLatestSection.tsx`
- `data.channelId` から useSWR + Server Action で RSS Feed 取得
- YouTubeFacade でグリッド表示
- 公開用 Server Action: `fetchPublicYoutubeRss(channelId, limit)` を追加（`app/actions/social/youtube-actions.ts`）

### 5.3 YouTubeRecommendedSection
**新規:** `components/user-profile/sections/YouTubeRecommendedSection.tsx`
- `data.items` から YouTubeFacade でグリッド表示

### 5.4 NiconicoRecommendedSection
**新規:** `components/user-profile/sections/NiconicoRecommendedSection.tsx`
- `data.items` から NiconicoFacade でグリッド表示

---

## Phase 6: エディタモーダル

### 6.1 VideosProfileEditModal
**新規:** `components/user-profile/sections/editors/VideosProfileEditModal.tsx`
- タイトル（最大50文字）+ 説明文（最大200文字）入力

### 6.2 YouTubeLatestEditModal
**新規:** `components/user-profile/sections/editors/YouTubeLatestEditModal.tsx`
- 既存の `YouTubeTabContent` のチャンネル設定部分をベースに
- channelId入力 + `extractChannelIdFromUrl` バリデーション
- rssFeedLimit Select (0-15)
- RSS Feedプレビュー表示
- 保存時は `updateYouTubeLatestSection()` でPubSubHubbub自動管理

### 6.3 YouTubeRecommendedEditModal
**新規:** `components/user-profile/sections/editors/YouTubeRecommendedEditModal.tsx`
- URL入力 → `getYouTubeMetadata()` でメタデータ自動取得
- ドラッグ&ドロップ並べ替え
- 最大6本制限

### 6.4 NiconicoRecommendedEditModal
**新規:** `components/user-profile/sections/editors/NiconicoRecommendedEditModal.tsx`
- URL入力 → `getNiconicoMetadata()` でメタデータ自動取得
- ドラッグ&ドロップ並べ替え
- 最大6本制限

---

## Phase 7: Dashboard Videos ページ

### 7.1 Videos ページ (Server Component)
**新規:** `app/dashboard/videos/page.tsx`

- `profile-editor/page.tsx` をベースに簡素化
- `prisma.userSection.findMany({ where: { userId, page: 'videos' } })` でセクション取得

### 7.2 EditableVideosClient
**新規:** `app/dashboard/videos/EditableVideosClient.tsx`

- 既存の `EditableSectionRenderer` をそのまま再利用
- 「セクションを追加」ボタン + AddVideoSectionModal

### 7.3 AddVideoSectionModal
**新規:** `app/dashboard/videos/components/AddVideoSectionModal.tsx`

- カテゴリ選択ステップ不要（セクション数が4つなので直接一覧表示）
- `getVideoPageSections()` でvideos用セクションのみ取得
- `createSection(userId, sectionType, defaultData, 'videos')` で作成

---

## Phase 8: ナビゲーション更新

### 8.1 サイドバーナビ変更
**ファイル:** `lib/layout-config.ts` (L228-231)

```diff
- { title: "プラットフォーム", url: "/dashboard/platforms", icon: Tv },
+ { title: "動画管理", url: "/dashboard/videos", icon: Video },
```

---

## Phase 9: 公開 Videos ページ移行

### 9.1 公開ページをセクションベースに書き換え
**ファイル:** `app/[handle]/videos/page.tsx`

- 現在: User.youtubeChannelId + YouTubeRecommendedVideo テーブルから直接取得
- 変更後: `userSections where { page: 'videos', isVisible: true }` → `SectionRenderer` で描画
- セクション0件の場合はフォールバック表示

### 9.2 既存プロフィール公開ページのpageフィルタ
**ファイル:** `app/[handle]/page.tsx` 等

- userSectionsクエリに `page: 'profile'` フィルタ追加

---

## Phase 10: データマイグレーション

### 10.1 マイグレーションスクリプト
**新規:** `scripts/migrate-youtube-to-sections.ts`

- `User.youtubeChannelId` + `youtubeRssFeedLimit` → `youtube-latest` セクション作成
- `YouTubeRecommendedVideo` テーブル → `youtube-recommended` セクション作成（data.itemsに変換）
- 旧フィールド・テーブルはしばらく残す（ライブ配信機能が `youtubeChannelId` を参照しているため）

---

## Phase 11: クリーンアップ（後日実施）

- `dashboard/platforms/` → `/dashboard/videos` へリダイレクト設定
- 安定稼働確認後、旧フィールド・テーブルを段階的に削除

---

## 変更ファイル一覧

| ファイル | 変更 | Phase |
|---------|------|-------|
| `prisma/schema.prisma` | 修正 | 1 |
| `types/profile-sections.ts` | 修正 | 2 |
| `lib/sections/types.ts` | 修正 | 2 |
| `lib/sections/registry.ts` | 修正 | 2 |
| `lib/sections/editor-registry.ts` | 修正 | 2 |
| `lib/sections/type-guards.ts` | 修正 | 2 |
| `app/actions/user/section-actions.ts` | 修正 | 3 |
| `app/dashboard/profile-editor/page.tsx` | 修正 | 3 |
| `app/actions/social/youtube-actions.ts` | 修正 | 3 |
| `services/niconico/constants.ts` | 新規 | 4 |
| `services/niconico/niconico-api.ts` | 新規 | 4 |
| `components/NiconicoFacade.tsx` | 新規 | 4 |
| `app/actions/social/niconico-actions.ts` | 新規 | 4 |
| `components/user-profile/sections/VideosProfileSection.tsx` | 新規 | 5 |
| `components/user-profile/sections/YouTubeLatestSection.tsx` | 新規 | 5 |
| `components/user-profile/sections/YouTubeRecommendedSection.tsx` | 新規 | 5 |
| `components/user-profile/sections/NiconicoRecommendedSection.tsx` | 新規 | 5 |
| `components/user-profile/sections/editors/VideosProfileEditModal.tsx` | 新規 | 6 |
| `components/user-profile/sections/editors/YouTubeLatestEditModal.tsx` | 新規 | 6 |
| `components/user-profile/sections/editors/YouTubeRecommendedEditModal.tsx` | 新規 | 6 |
| `components/user-profile/sections/editors/NiconicoRecommendedEditModal.tsx` | 新規 | 6 |
| `app/dashboard/videos/page.tsx` | 新規 | 7 |
| `app/dashboard/videos/EditableVideosClient.tsx` | 新規 | 7 |
| `app/dashboard/videos/components/AddVideoSectionModal.tsx` | 新規 | 7 |
| `lib/layout-config.ts` | 修正 | 8 |
| `app/[handle]/videos/page.tsx` | 修正 | 9 |
| `scripts/migrate-youtube-to-sections.ts` | 新規 | 10 |

## 再利用する既存コード

| コンポーネント/関数 | ファイル | 用途 |
|---|---|---|
| `EditableSectionRenderer` | `components/user-profile/EditableSectionRenderer.tsx` | videos編集ページのセクション描画 |
| `EditableSectionWrapper` | `components/user-profile/EditableSectionWrapper.tsx` | 移動/編集/削除ツールバー |
| `SectionRenderer` | `components/profile/SectionRenderer.tsx` | 公開ページの描画 |
| `SectionBand` | `components/profile/SectionBand.tsx` | 背景・パディング |
| `DeleteConfirmModal` | `app/dashboard/profile-editor/components/DeleteConfirmModal.tsx` | 削除確認 |
| `YouTubeFacade` | `components/YouTubeFacade.tsx` | YouTube遅延読み込み |
| `extractChannelIdFromUrl` | `app/actions/social/youtube-actions.ts` | チャンネルID抽出 |
| `getYouTubeMetadata` | `app/actions/social/youtube-actions.ts` | 動画メタデータ取得 |
| `fetchYoutubeRssFeed` | `services/youtube/youtube-api.ts` | RSS Feed取得 |
| `subscribeToYoutubePush` | `services/youtube/youtube-pubsubhubbub.ts` | PubSubHubbub管理 |

## 検証方法

1. `npm run lint && npx tsc --noEmit` — TypeScript/ESLintエラーゼロ確認
2. dashboard/videos/ でセクション追加・編集・削除・並べ替えの動作確認
3. `/@{handle}/videos` 公開ページでセクション表示確認
4. `/@{handle}` プロフィールページが影響を受けていないことを確認
5. ニコニコ動画のFacadeパターン（サムネイル→クリックでiframe）動作確認
6. YouTube channelId変更時のPubSubHubbub subscribe/unsubscribe確認

## リスク

| リスク | 影響 | 軽減策 |
|-------|------|-------|
| 既存プロフィールページの破壊 | 高 | `page`のデフォルト値`'profile'`で後方互換。Phase 3.2で明示的フィルタ追加 |
| データマイグレーション失敗 | 高 | 旧テーブル・カラムを残して並行稼働。ロールバック可能 |
| PubSubHubbub二重管理 | 中 | youtube-latestセクション専用のServer Actionで一元管理 |
| ニコニコoEmbed APIの信頼性 | 中 | タイムアウト設定 + 手動入力フォールバック |
