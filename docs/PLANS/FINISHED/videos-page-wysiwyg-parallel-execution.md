# 実装計画: dashboard/platforms/ → dashboard/videos/ WYSIWYG化

## Context

現在の `dashboard/platforms/` はタブベースのUI（YouTube設定管理）。これを `dashboard/videos/` に移行し、`dashboard/profile-editor` と同じ**セクションベースのWYSIWYG編集パターン**に変更する。4つの新セクション（videos-profile, youtube-latest, youtube-recommended, niconico-recommended）を追加し、既存の `EditableSectionRenderer` / `SectionRenderer` を再利用する。

---

## 実装バッチ（依存関係順）

### Batch 0: データベース基盤 (Phase 1) — サブエージェント: 1

**変更ファイル:**
- [schema.prisma](prisma/schema.prisma) L271-287 — `UserSection` に `page String @default("profile")` 追加 + `@@index([userId, page, sortOrder])` 追加

**手順:**
1. スキーマ修正
2. `DATABASE_URL="..." npm run db:migrate -- --name add_section_page_column`
3. `npm run db:generate`
4. `npm run lint && npx tsc --noEmit` で確認

---

### Batch 1: 型・レジストリ + ニコニコサービス基盤 — サブエージェント: 2 (並列)

#### Agent 1A: 型定義・レジストリ更新 (Phase 2)

| ファイル | 変更内容 |
|---------|---------|
| [types/profile-sections.ts](types/profile-sections.ts) | `UserSection` に `page: string` 追加、4つのデータ型 + エディタ Props 型追加 |
| [lib/sections/types.ts](lib/sections/types.ts) L30-43 | `SectionDefinition` に `page?: 'profile' \| 'videos'` 追加 |
| [lib/sections/registry.ts](lib/sections/registry.ts) L58-310 | 4セクション追加 + `getVideoPageSections()`, `getSectionsByPage()` 関数追加 |
| [lib/sections/editor-registry.ts](lib/sections/editor-registry.ts) | 4エディタ追加 (needsTitle: false) |
| [lib/sections/type-guards.ts](lib/sections/type-guards.ts) | 4型ガード追加 |
| 8 スタブファイル (新規) | tsc を通すため、表示コンポーネント4つ + エディタ4つの最小実装を作成 |

**スタブファイル:**
- `components/user-profile/sections/VideosProfileSection.tsx`
- `components/user-profile/sections/YouTubeLatestSection.tsx`
- `components/user-profile/sections/YouTubeRecommendedSection.tsx`
- `components/user-profile/sections/NiconicoRecommendedSection.tsx`
- `components/user-profile/sections/editors/VideosProfileEditModal.tsx`
- `components/user-profile/sections/editors/YouTubeLatestEditModal.tsx`
- `components/user-profile/sections/editors/YouTubeRecommendedEditModal.tsx`
- `components/user-profile/sections/editors/NiconicoRecommendedEditModal.tsx`

#### Agent 1B: ニコニコサービス基盤 (Phase 4.0-4.2) — Phase 1-3 と完全独立

| ファイル | 変更内容 |
|---------|---------|
| [next.config.ts](next.config.ts) L74付近 | `nicovideo.cdn.nimg.jp`, `tn.smilevideo.jp` を remotePatterns に追加 |
| `services/niconico/constants.ts` (新規) | 定数定義 (MAX_VIDEOS, ID_PATTERN, API_URL等) |
| `services/niconico/niconico-api.ts` (新規) | `extractNiconicoVideoId()`, `fetchNiconicoVideoMetadata()` — fast-xml-parser (導入済み) で getthumbinfo API を利用 |

---

### Batch 2: Server Actions + NiconicoFacade — サブエージェント: 2 (並列)

#### Agent 2A: Server Actions 更新 (Phase 3)

| ファイル | 変更内容 |
|---------|---------|
| [section-actions.ts](app/actions/user/section-actions.ts) | `getUserSections(userId, page='profile')` L15-29 — where に page フィルタ追加 |
| 同上 | `createSection(userId, type, data={}, page='profile')` L183-232 — page パラメータ追加、sortOrder を page スコープに |
| 同上 | `moveSectionOrder(sectionId, direction)` L396-454 — section.page を select に追加、同一 page 内フィルタ |
| 同上 | `deleteSection(sectionId)` L275-308 — youtube-latest セクション削除時の PubSubHubbub unsubscribe 追加 |
| [profile-editor/page.tsx](app/dashboard/profile-editor/page.tsx) L40-42 | `userSections: { where: { page: 'profile' }, orderBy: ... }` |
| [handle-utils.ts](lib/handle-utils.ts) L132-135 | `where: { isVisible: true, page: 'profile' }` に変更 |
| [youtube-actions.ts](app/actions/social/youtube-actions.ts) | `updateYouTubeLatestSection()` 新規追加 — channelId変更時のPubSubHubbub管理 |
| 同上 | `fetchPublicYoutubeRss()` 新規追加 — 認証不要の公開用RSS取得 |

**後方互換:** 全関数のデフォルト値 `'profile'` により既存呼び出し元は変更不要

#### Agent 2B: NiconicoFacade + Action (Phase 4.3-4.4) — Agent 1B に依存

| ファイル | 変更内容 |
|---------|---------|
| `components/NiconicoFacade.tsx` (新規) | [YouTubeFacade.tsx](components/YouTubeFacade.tsx) をテンプレートに。Props: `videoId, title?, thumbnailUrl?`。再生ボタン色 `bg-zinc-800/80`、iframe: `embed.nicovideo.jp/watch/{videoId}` |
| `app/actions/social/niconico-actions.ts` (新規) | `getNiconicoMetadata(url)` — 認証 + ID抽出 + メタデータ取得 |

---

### Batch 3: 表示コンポーネント + エディタモーダル — サブエージェント: 3 (並列)

スタブファイルを完全実装に置換する。

#### Agent 3A: VideosProfile (シンプル)

| ファイル | 内容 |
|---------|------|
| `VideosProfileSection.tsx` | ThemedCard + Badge + title(h2) + description(p, whitespace-pre-wrap) |
| `VideosProfileEditModal.tsx` | パターンA: title Input(max50) + description Textarea(max200) + Zodバリデーション + `updateSection()` |

#### Agent 3B: YouTube系 (3ファイル)

| ファイル | 内容 |
|---------|------|
| `YouTubeRecommendedSection.tsx` | data.items → YouTubeFacade グリッド表示。外部API不要 |
| `YouTubeLatestSection.tsx` | `'use client'` — useSWR + `fetchPublicYoutubeRss()` → YouTubeFacade グリッド。レスポンシブ(1/2/3列) |
| `YouTubeRecommendedEditModal.tsx` | パターンB+C+D: URL入力→`getYouTubeMetadata()`自動取得、@dnd-kit でドラッグ並べ替え、最大6本、`updateSection()` |
| `YouTubeLatestEditModal.tsx` | パターンA+C: channelId/URL入力 + `extractChannelIdFromUrl()`バリデーション + rssFeedLimit Select(0-15) + RSSプレビュー。保存は `updateYouTubeLatestSection()` |

**流用元:** [YouTubeTabContent.tsx](app/dashboard/platforms/components/YouTubeTabContent.tsx) の channelId入力・RSS表示ロジック

#### Agent 3C: ニコニコ系 (2ファイル)

| ファイル | 内容 |
|---------|------|
| `NiconicoRecommendedSection.tsx` | YouTubeRecommendedSection と同構造、NiconicoFacade 使用 |
| `NiconicoRecommendedEditModal.tsx` | YouTubeRecommendedEditModal と同構造、`getNiconicoMetadata()` 使用 |

---

### Batch 4: Dashboard Videos ページ (Phase 7) — サブエージェント: 1

| ファイル | 内容 |
|---------|------|
| `app/dashboard/videos/components/AddVideoSectionModal.tsx` (新規) | [AddSectionModal.tsx](app/dashboard/profile-editor/components/AddSectionModal.tsx) をベースに簡素化。カテゴリステップなし、`getVideoPageSections()` で4セクション直接表示、`createSection(..., 'videos')` |
| `app/dashboard/videos/EditableVideosClient.tsx` (新規) | `'use client'` — [EditableProfileClient](app/dashboard/profile-editor/EditableProfileClient.tsx) から大幅簡素化。画像編集state削除。`EditableSectionRenderer` 再利用 + 「セクションを追加」ボタン |
| `app/dashboard/videos/page.tsx` (新規) | Server Component — [profile-editor/page.tsx](app/dashboard/profile-editor/page.tsx) をベースに `userSections: { where: { page: 'videos' } }` でフィルタ。Metadata: `title: '動画管理'` |

---

### Batch 5: ナビゲーション + 公開ページ + マイグレーション — サブエージェント: 3 (並列)

#### Agent 5A: ナビゲーション (Phase 8)

| ファイル | 変更内容 |
|---------|---------|
| [layout-config.ts](lib/layout-config.ts) L226-231 | `"プラットフォーム" → "動画管理"`, URL → `/dashboard/videos`, icon → `Video` |
| [next.config.ts](next.config.ts) | redirects に `/dashboard/platforms` → `/dashboard/videos` 追加 |

#### Agent 5B: 公開 Videos ページ (Phase 9)

| ファイル | 変更内容 |
|---------|---------|
| [app/[handle]/videos/page.tsx](app/[handle]/videos/page.tsx) | 全面書き換え — `userSections where { page: 'videos', isVisible: true }` → `SectionRenderer` で描画。セクション0件時はフォールバック表示 |

#### Agent 5C: データマイグレーション (Phase 10)

| ファイル | 変更内容 |
|---------|---------|
| `scripts/migrate-youtube-to-sections.ts` (新規) | User.youtubeChannelId → youtube-latest セクション、YouTubeRecommendedVideo → youtube-recommended セクション。重複チェック + ロールバック手順付き |

---

## 再利用する既存コード

| コンポーネント/関数 | ファイル |
|---|---|
| `EditableSectionRenderer` | `components/user-profile/EditableSectionRenderer.tsx` |
| `EditableSectionWrapper` | `components/user-profile/EditableSectionWrapper.tsx` |
| `SectionRenderer` | `components/profile/SectionRenderer.tsx` |
| `DeleteConfirmModal` | `app/dashboard/profile-editor/components/DeleteConfirmModal.tsx` |
| `YouTubeFacade` | `components/YouTubeFacade.tsx` |
| `extractChannelIdFromUrl` | `app/actions/social/youtube-actions.ts` |
| `getYouTubeMetadata` | `app/actions/social/youtube-actions.ts` |
| `fetchYoutubeRssFeed` | `services/youtube/youtube-api.ts` |
| `subscribe/unsubscribeFromYoutubePush` | `services/youtube/youtube-pubsubhubbub.ts` |
| `@dnd-kit/core` + `@dnd-kit/sortable` | インストール済み |
| `fast-xml-parser` | インストール済み（ニコニコ API 用） |

---

## 検証方法

1. **各 Batch 完了時**: `npm run lint && npx tsc --noEmit` — エラーゼロ確認
2. **Batch 4 完了時**: `/dashboard/videos` でセクション追加・編集・削除・並べ替え動作確認
3. **Batch 5 完了時**:
   - `/@{handle}/videos` 公開ページでセクション表示確認
   - `/@{handle}` プロフィールページが影響を受けていないこと（videos セクション混入なし）
   - `/dashboard/platforms` → `/dashboard/videos` リダイレクト確認
4. ニコニコ動画の Facade パターン動作確認
5. YouTube channelId 変更時の PubSubHubbub subscribe/unsubscribe ログ確認

---

## Phase 11 (後日実施・本計画スコープ外)

- 旧 Server Actions 廃止（`updateYoutubeChannel`, `addRecommendedVideo` 等）
- PubSubHubbub Webhook の移行（`User.youtubeChannelId` → `UserSection.data.channelId`）
- 旧フィールド・テーブルの段階的削除
