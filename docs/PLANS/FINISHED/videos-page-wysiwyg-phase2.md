# Phase 2: 型定義・レジストリ更新 - 詳細実装計画

## 概要

動画ページ用の4つのセクション（videos-profile, youtube-latest, youtube-recommended, niconico-recommended）の型定義、レジストリ登録、エディタ登録、型ガードを追加する。

---

## 2.1 型定義追加

**ファイル:** `types/profile-sections.ts`

### UserSection インターフェースに `page` フィールド追加

```typescript
export interface UserSection {
  // 既存フィールド...
  page: string  // "profile" | "videos"
}
```

### 新しいセクションデータ型

```typescript
// 動画ページプロフィール
export interface VideosProfileData {
  title: string
  description?: string
}

// YouTube最新動画（channelIdをセクション内に統合）
export interface YouTubeLatestData {
  channelId: string
  rssFeedLimit: number
}

// YouTubeおすすめ動画
export interface YouTubeRecommendedData {
  items: Array<{
    id: string
    videoId: string
    title: string
    thumbnail: string
    sortOrder: number
  }>
}

// ニコニコおすすめ動画
export interface NiconicoRecommendedData {
  items: Array<{
    id: string
    videoId: string    // sm/nm/so + 数字
    title: string
    thumbnail: string
    sortOrder: number
  }>
}
```

### エディタ Props 型エイリアス

```typescript
export type VideosProfileEditModalProps = BaseSectionEditorProps<VideosProfileData>
export type YouTubeLatestEditModalProps = BaseSectionEditorProps<YouTubeLatestData>
export type YouTubeRecommendedEditModalProps = BaseSectionEditorProps<YouTubeRecommendedData>
export type NiconicoRecommendedEditModalProps = BaseSectionEditorProps<NiconicoRecommendedData>
```

---

## 2.2 SectionDefinition に `page` フィールド追加

**ファイル:** `lib/sections/types.ts`

```typescript
export interface SectionDefinition {
  // 既存フィールド...
  page?: 'profile' | 'videos'  // 未指定 = 'profile'
}
```

---

## 2.3 SECTION_REGISTRY に4セクション追加

**ファイル:** `lib/sections/registry.ts`

```typescript
'videos-profile': {
  type: 'videos-profile',
  label: '動画ページプロフィール',
  icon: 'Film',
  description: '動画ページのタイトルと説明',
  category: 'main',
  priority: 'high',
  maxInstances: 1,
  page: 'videos',
  component: lazy(() =>
    import('@/components/user-profile/sections/VideosProfileSection').then(
      (m) => ({ default: m.VideosProfileSection })
    )
  ),
  defaultData: { title: '', description: '' },
},
'youtube-latest': {
  type: 'youtube-latest',
  label: 'YouTube最新動画',
  icon: 'Rss',
  description: 'YouTube RSS Feedから最新動画を表示',
  category: 'video',
  priority: 'medium',
  maxInstances: 1,
  page: 'videos',
  component: lazy(() =>
    import('@/components/user-profile/sections/YouTubeLatestSection').then(
      (m) => ({ default: m.YouTubeLatestSection })
    )
  ),
  defaultData: { channelId: '', rssFeedLimit: 6 },
},
'youtube-recommended': {
  type: 'youtube-recommended',
  label: 'YouTubeおすすめ動画',
  icon: 'ThumbsUp',
  description: 'おすすめのYouTube動画を表示',
  category: 'video',
  priority: 'medium',
  maxInstances: 1,
  page: 'videos',
  component: lazy(() =>
    import('@/components/user-profile/sections/YouTubeRecommendedSection').then(
      (m) => ({ default: m.YouTubeRecommendedSection })
    )
  ),
  defaultData: { items: [] },
},
'niconico-recommended': {
  type: 'niconico-recommended',
  label: 'ニコニコおすすめ動画',
  icon: 'Tv2',
  description: 'おすすめのニコニコ動画を表示',
  category: 'video',
  priority: 'medium',
  page: 'videos',
  component: lazy(() =>
    import('@/components/user-profile/sections/NiconicoRecommendedSection').then(
      (m) => ({ default: m.NiconicoRecommendedSection })
    )
  ),
  defaultData: { items: [] },
},
```

### ユーティリティ関数追加

```typescript
/** videos ページ用セクション定義を取得 */
export function getVideoPageSections(): SectionDefinition[] {
  return Object.values(SECTION_REGISTRY).filter((s) => s.page === 'videos')
}

/** 指定 page のセクション定義を取得 */
export function getSectionsByPage(page: string): SectionDefinition[] {
  return Object.values(SECTION_REGISTRY).filter(
    (s) => (s.page || 'profile') === page
  )
}
```

---

## 2.4 EDITOR_REGISTRY に4エディタ追加

**ファイル:** `lib/sections/editor-registry.ts`

```typescript
'videos-profile': {
  component: lazy(() =>
    import('@/components/user-profile/sections/editors/VideosProfileEditModal').then(
      (m) => ({ default: m.VideosProfileEditModal })
    )
  ),
  needsTitle: false,
},
'youtube-latest': {
  component: lazy(() =>
    import('@/components/user-profile/sections/editors/YouTubeLatestEditModal').then(
      (m) => ({ default: m.YouTubeLatestEditModal })
    )
  ),
  needsTitle: false,
},
'youtube-recommended': {
  component: lazy(() =>
    import('@/components/user-profile/sections/editors/YouTubeRecommendedEditModal').then(
      (m) => ({ default: m.YouTubeRecommendedEditModal })
    )
  ),
  needsTitle: false,
},
'niconico-recommended': {
  component: lazy(() =>
    import('@/components/user-profile/sections/editors/NiconicoRecommendedEditModal').then(
      (m) => ({ default: m.NiconicoRecommendedEditModal })
    )
  ),
  needsTitle: false,
},
```

---

## 2.5 型ガード追加

**ファイル:** `lib/sections/type-guards.ts`

```typescript
export function isVideosProfileData(data: unknown): data is VideosProfileData {
  if (!isRecord(data)) return false
  return hasStringProp(data, 'title')
}

export function isYouTubeLatestData(data: unknown): data is YouTubeLatestData {
  if (!isRecord(data)) return false
  return hasStringProp(data, 'channelId') && hasNumberProp(data, 'rssFeedLimit')
}

export function isYouTubeRecommendedData(data: unknown): data is YouTubeRecommendedData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}

export function isNiconicoRecommendedData(data: unknown): data is NiconicoRecommendedData {
  if (!isRecord(data)) return false
  return Array.isArray(data.items)
}
```

---

## 検証方法

```bash
npm run lint && npx tsc --noEmit
```

- 全ての型定義が正しく解決されること
- lazy import のパスが正しいこと（コンポーネントは Phase 5-6 で作成するため、この時点ではビルドエラーになる可能性あり → Phase 5-6 と並行実装が必要）
- 既存の SECTION_REGISTRY / EDITOR_REGISTRY のエントリに影響がないこと

---

## 後方互換性

- `SectionDefinition.page` はオプショナル（`page?: 'profile' | 'videos'`）なので、既存セクション定義は変更不要
- `getSectionsByPage('profile')` は `page` 未指定のセクションも含める（`(s.page || 'profile') === page`）
- `UserSection.page` は Prisma のデフォルト値 `'profile'` により既存レコードに影響なし
