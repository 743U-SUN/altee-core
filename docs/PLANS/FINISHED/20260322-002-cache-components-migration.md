---
title: "cacheComponents Phase 2: Data Layer（クエリキャッシュ化 + 無効化）"
type: plan
date: 2026-03-22
updated: 2026-03-22
status: draft
parent: 20260322-cache-components-migration.md
---

## 概要

親計画 `20260322-cache-components-migration.md` の Phase 2 を実装するための詳細設計書。公開クエリ関数を `React.cache()` → `'use cache'` + `cacheLife()` + `cacheTag()` に移行し、全 Server Actions に `updateTag()` を追加してキャッシュの即時無効化を実現する。変更対象ファイル 27 件。

## 参照した公式ドキュメント

| ドキュメント | エージェント | 主な知見 |
|-------------|------------|---------|
| `01-getting-started/08-caching.md` | Data Layer, Perf | `'use cache'` でデータ/UI レベルキャッシュ。引数+クロージャがキャッシュキー。cookies/headers 不可。Server Action から revalidation 呼び出しでクライアントキャッシュ全クリア |
| `01-getting-started/09-revalidating.md` | Data Layer, Perf | `updateTag`: Server Actions のみ、即時 expire（read-your-own-writes）。`revalidateTag('tag', 'max')`: stale-while-revalidate。タグベースはパスベースより精密 |
| `03-api-reference/01-directives/use-cache.md` | All | `import 'server-only'` と共存可能。React.cache は `'use cache'` 内で隔離。キャッシュキー = Build ID + Function ID + シリアライズ済み引数。Date はシリアライズ可能。セルフホスト環境ではインメモリ LRU |
| `03-api-reference/04-functions/cacheLife.md` | Data Layer, Perf | `'minutes'` = stale 5m / revalidate 1m / expire 1h。`'hours'` = stale 5m / revalidate 1h / expire 1d。`seconds` はプリレンダリングから除外。クライアント側は最低30秒 stale が強制 |
| `03-api-reference/04-functions/cacheTag.md` | Data Layer | 複数タグを `cacheTag('tag1', 'tag2')` で付与可能。タグ最大長 256 文字、最大 128 個。冪等 |
| `03-api-reference/04-functions/updateTag.md` | Data Layer, Perf | Server Actions 限定。即時 expire。`revalidateTag` とは異なり stale content を返さない |
| `02-guides/migrating-to-cache-components.md` | Data Layer | route segment configs → `'use cache'` + `cacheLife()` 置換パターン |
| `03-api-reference/05-config/01-next-config-js/cacheComponents.md` | Arch | PPR + useCache + dynamicIO + Activity を統一制御 |
| `02-guides/streaming.md` | Arch | notFound() が Suspense 内で HTTP 200 を返す。redirect() がクライアントサイドリダイレクトになる |
| `02-guides/instant-navigation.md` | Perf | キャッシュ済みデータは即表示、動的データは fallback 後ストリーミング |
| `02-guides/preserving-ui-state.md` | Perf | Activity で最大3ルート保持。`useLayoutEffect` cleanup で hide 時に state リセット可能 |
| `02-guides/prefetching.md` | Perf | PPR 有効時、static shell がプリフェッチされ即ストリーミング。revalidation は関連プリフェッチをサイレントに更新 |

### データ取得設計

| データ | 取得方法 | キャッシュ戦略 | 理由 |
|--------|---------|--------------|------|
| getUserByHandle | SC direct | `'use cache'` + `cacheLife('minutes')` + 3タグ | 公開プロフィール。全訪問者に共有される。FAQ/News 含むため複数タグ |
| getPublicFaqByHandle | SC direct | `'use cache'` + `cacheLife('minutes')` | 公開 FAQ。handle ごとにキャッシュ |
| getPublicNewsByHandle | SC direct | `'use cache'` + `cacheLife('minutes')` | 公開ニュース一覧。handle ごとにキャッシュ |
| getPublicNewsSection | SC direct | `'use cache'` + `cacheLife('minutes')` | ニュースセクション設定。news タグで無効化 |
| getPublicNewsArticle | SC direct | `'use cache'` + `cacheLife('minutes')` | 個別記事。handle+slug でキャッシュ |
| getUserPublicItemsByHandle | SC direct | `'use cache'` + `cacheLife('minutes')` | 公開アイテム。handle ごとにキャッシュ |
| getVideoPageData | SC direct | `'use cache'` + `cacheLife('minutes')` | 動画ページ。handle ごとにキャッシュ |
| getActivePresets | SC direct | `'use cache'` + `cacheLife('hours')` | 背景プリセット。全ユーザー共有、更新頻度低い |
| cachedAuth | SC direct | `React.cache()` 据え置き | cookies 依存 |
| getDashboard* 系 | SC direct | `React.cache()` 据え置き | cookies 依存 |

### キャッシュ戦略

| 対象 | 方式 | TTL | タグ | 無効化トリガー |
|------|------|-----|------|--------------|
| getUserByHandle | `'use cache'` | `'minutes'` (stale 5m / revalidate 1m / expire 1h) | `profile-${handle}`, `faq-${handle}`, `news-${handle}` | プロフィール/キャラクター/セクション/テーマ/FAQ/ニュース変更 |
| getPublicFaqByHandle | `'use cache'` | `'minutes'` | `faq-${handle}` | FAQ カテゴリ/質問の CRUD |
| getPublicNewsByHandle | `'use cache'` | `'minutes'` | `news-${handle}` | ニュース記事の CRUD、公開/非公開トグル |
| getPublicNewsSection | `'use cache'` | `'minutes'` | `news-${handle}` | ニュースセクション設定変更 |
| getPublicNewsArticle | `'use cache'` | `'minutes'` | `news-article-${handle}-${slug}`, `news-${handle}` | 記事の更新/削除 |
| getUserPublicItemsByHandle | `'use cache'` | `'minutes'` | `items-${handle}` | アイテムの CRUD |
| getVideoPageData | `'use cache'` | `'minutes'` | `videos-${handle}` | ビデオセクションの変更 |
| getActivePresets | `'use cache'` | `'hours'` (stale 5m / revalidate 1h / expire 1d) | `presets` | プリセットの CRUD、isActive トグル |

### キャッシュタグ命名規約

```
パターン: {resource}-{normalizedHandle}
正規化: normalizeHandle() from lib/validations/shared.ts

profile-${handle}                    // getUserByHandle（プロフィール/テーマ/セクション変更）
faq-${handle}                        // getPublicFaqByHandle + getUserByHandle 内 FAQ
news-${handle}                       // getPublicNewsByHandle + getPublicNewsSection
news-article-${handle}-${slug}       // getPublicNewsArticle（個別記事）
items-${handle}                      // getUserPublicItemsByHandle
videos-${handle}                     // getVideoPageData
presets                              // getActivePresets（グローバル、handle 非依存）
```

---

## 実装詳細

### Step 1: クエリ関数の `'use cache'` 移行（6ファイル）

#### 1.1 `lib/handle-utils.ts` — `getUserByHandle`

**現状**:
```ts
import { cache } from 'react'
export const getUserByHandle = cache(async (handle: string) => {
  const normalizedHandle = handle.startsWith('@')
    ? handle.slice(1).toLowerCase()
    : handle.toLowerCase()
  // ...Prisma query...
})
```

**変更内容**:
1. `import { cache } from 'react'` → 削除（他に cache を使う関数がないため）
2. `import { cacheLife, cacheTag } from 'next/cache'` を追加
3. `import { normalizeHandle } from '@/lib/validations/shared'` を追加
4. `export const getUserByHandle = cache(async (handle: string) => {` → `export async function getUserByHandle(handle: string) {`
5. 関数冒頭に `'use cache'` ディレクティブ追加
6. インライン正規化ロジック `handle.startsWith('@') ? ...` → `normalizeHandle(handle)` に統一
7. `cacheLife('minutes')` 追加
8. `cacheTag(\`profile-${normalized}\`, \`faq-${normalized}\`, \`news-${normalized}\`)` 追加
9. try-catch + null 返却パターンは維持（エラーキャッシュは `cacheLife('minutes')` で自然 expire）

**変更後**:
```ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { normalizeHandle } from '@/lib/validations/shared'
import { isReservedHandle } from '@/lib/reserved-handles'

export async function getUserByHandle(handle: string) {
  'use cache'
  const normalized = normalizeHandle(handle)
  cacheLife('minutes')
  cacheTag(`profile-${normalized}`, `faq-${normalized}`, `news-${normalized}`)

  try {
    if (isReservedHandle(normalized)) return null
    const user = await prisma.user.findUnique({ ... })
    return user
  } catch {
    return null
  }
}
```

**注意**: `handleSchema` import は `checkHandleAvailability` でのみ使用されているため残す。`cache` import のみ削除。

#### 1.2 `lib/queries/faq-queries.ts` — `getPublicFaqByHandle`

**変更内容**:
1. `import { cache } from 'react'` → 削除（`getDashboardFaqCategories` は cookies 依存で `React.cache()` 据え置き→ Phase 3 で import 整理）
   - **修正**: `getDashboardFaqCategories` もこのファイルに `cache` import を使っているため、`cache` import は残す
2. `import { cacheLife, cacheTag } from 'next/cache'` を追加
3. `export const getPublicFaqByHandle = cache(async (handle: string): Promise<FaqActionResult> => {` → `export async function getPublicFaqByHandle(handle: string): Promise<FaqActionResult> {`
4. 関数冒頭に `'use cache'` 追加
5. `cacheLife('minutes')` + `cacheTag(\`faq-${normalized}\`)` 追加
6. 既存の `normalizeHandle` 使用はそのまま（既に import 済み）

**変更後**:
```ts
import 'server-only'
import { cache } from 'react'           // getDashboardFaqCategories 用に残す
import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'
import type { FaqActionResult } from '@/types/faq'

// Dashboard 用は React.cache() のまま
export const getDashboardFaqCategories = cache(async (userId: string) => { ... })

// 公開 FAQ → 'use cache' に移行
export async function getPublicFaqByHandle(handle: string): Promise<FaqActionResult> {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`faq-${normalized}`)

  try {
    const user = await prisma.user.findUnique({ ... })
    if (!user || !user.isActive) return { success: false, error: 'ユーザーが見つかりません' }
    return { success: true, data: user.faqCategories }
  } catch {
    return { success: false, error: 'FAQの取得に失敗しました' }
  }
}
```

#### 1.3 `lib/queries/news-queries.ts` — 3 公開関数 + `getPublicUserByHandle` 削除

**変更内容**:
1. `getPublicUserByHandle`（内部ヘルパー、`React.cache`）を**削除**
2. `getPublicNewsByHandle` 内にユーザー検索ロジックをインライン化
3. `getPublicNewsSection` 内にユーザー検索ロジックをインライン化
4. 3 関数すべてを `'use cache'` に移行
5. `import { cacheLife, cacheTag } from 'next/cache'` を追加
6. `cache` import は Dashboard 関数群が不要（`getDashboardNewsById`, `getDashboardNews`, `getDashboardNewsSection` は `cache` ラップなし）→ `cache` import 削除可能

**`getPublicNewsByHandle` 変更後**:
```ts
export async function getPublicNewsByHandle(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`news-${normalized}`)

  // getPublicUserByHandle をインライン化
  const user = await prisma.user.findUnique({
    where: { handle: normalized },
    select: { id: true, isActive: true },
  })
  if (!user || !user.isActive) return []

  return prisma.userNews.findMany({
    where: { userId: user.id, published: true, adminHidden: false },
    orderBy: { sortOrder: 'asc' },
    include: { thumbnail: { select: { storageKey: true } } },
  })
}
```

**`getPublicNewsSection` 変更後**:
```ts
export async function getPublicNewsSection(handle: string): Promise<UserSection | null> {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`news-${normalized}`)

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
    select: { id: true, isActive: true },
  })
  if (!user || !user.isActive) return null

  const section = await prisma.userSection.findFirst({
    where: { userId: user.id, page: 'news', sectionType: 'news-list', isVisible: true },
  })
  return section ? toUserSection(section) : null
}
```

**`getPublicNewsArticle` 変更後**:
```ts
export async function getPublicNewsArticle(handle: string, slug: string) {
  'use cache'
  const decodedSlug = decodeURIComponent(slug)
  const validatedSlug = slugSchema.parse(decodedSlug)
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`news-article-${normalized}-${validatedSlug}`, `news-${normalized}`)

  const user = await prisma.user.findUnique({ ... })
  if (!user || !user.isActive) return null
  const news = await prisma.userNews.findFirst({ ... })
  return news ? { ...news, characterName: user.characterInfo?.characterName ?? null } : null
}
```

**重要**: `getPublicNewsArticle` は slug をキャッシュタグに含める。slug はバリデーション済みの `validatedSlug` を使用し、256 文字制限内に収まる（slug の最大長は 200 文字）。

#### 1.4 `lib/queries/item-queries.ts` — `getUserPublicItemsByHandle`

**変更内容**:
1. `getUserPublicItemsByHandle` を `'use cache'` に移行
2. `import { cacheLife, cacheTag } from 'next/cache'` を追加
3. `cache` import は `getDashboardUserItems`, `getDashboardUserPcBuild` で使用→残す

**変更後**:
```ts
export async function getUserPublicItemsByHandle(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`items-${normalized}`)

  try {
    const user = await prisma.user.findUnique({ ... })
    if (!user || !user.isActive) return { success: false as const, error: '...' }
    const userItems = await prisma.userItem.findMany({ ... })
    return { success: true as const, data: userItems }
  } catch {
    return { success: false as const, error: '...' }
  }
}
```

#### 1.5 `lib/queries/video-queries.ts` — `getVideoPageData`

**変更内容**:
1. `import { cache } from 'react'` → 削除（このファイルは `getVideoPageData` のみ）
2. `import { cacheLife, cacheTag } from 'next/cache'` を追加
3. `'use cache'` に移行

**変更後**:
```ts
export async function getVideoPageData(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`videos-${normalized}`)

  const user = await prisma.user.findUnique({ ... })
  if (!user || !user.isActive) return null
  return user
}
```

#### 1.6 `lib/sections/preset-queries.ts` — `getActivePresets`

**変更内容**:
1. `import { cache } from 'react'` → 削除
2. `import { cacheLife, cacheTag } from 'next/cache'` を追加
3. `'use cache'` + `cacheLife('hours')` + `cacheTag('presets')` に移行

**変更後**:
```ts
export async function getActivePresets(): Promise<SectionBackgroundPreset[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('presets')

  const presets = await prisma.sectionBackgroundPreset.findMany({ ... })
  return presets.map((p) => { ... })
}
```

---

### Step 2: ページレベル `React.cache()` ラッパー削除（4ファイル）

#### 2.1 `app/[handle]/faqs/page.tsx`

**変更内容**:
1. `import { cache } from 'react'` を削除
2. `const getCachedFaq = cache(async (handle: string) => { ... })` を削除
3. `getCachedFaq(handle)` → `getPublicFaqByHandle(handle)` に置換

**注意**: `generateMetadata` と page 本体で `getPublicFaqByHandle` を2回呼ぶことになるが、`'use cache'` がクロスリクエストキャッシュしているため同一 handle のキャッシュが即返却される。リクエスト内の dedup は不要。

**ただし**: FAQ ページの `generateMetadata` は handle からメタデータを生成しているだけで、`getPublicFaqByHandle` を呼んでいない。そのため置換は page 本体の1箇所のみ:
```ts
// Before
const [result, presets] = await Promise.all([
  getCachedFaq(handle),
  getActivePresets(),
])
// After
const [result, presets] = await Promise.all([
  getPublicFaqByHandle(handle),
  getActivePresets(),
])
```

#### 2.2 `app/[handle]/news/page.tsx`

**変更内容**:
1. `import { cache } from 'react'` を削除
2. `const getCachedNews = cache(...)` を削除
3. `getCachedNews(handle)` → `getPublicNewsByHandle(handle)` に置換

同様に `generateMetadata` は handle のみ使用で `getCachedNews` は呼ばない。page 本体の1箇所のみ置換。

#### 2.3 `app/[handle]/news/[slug]/page.tsx`

**変更内容**:
1. `import { cache } from 'react'` を削除
2. `const getCachedArticle = cache(...)` を削除
3. `getCachedArticle(handle, slug)` → `getPublicNewsArticle(handle, slug)` に置換（2箇所: `generateMetadata` と page 本体）

**重要**: このページは `generateMetadata` と page 本体の両方で `getCachedArticle` を呼んでいる。`'use cache'` 移行後は同一引数での呼び出しがキャッシュヒットするため問題なし。

#### 2.4 `app/[handle]/items/page.tsx`

**変更内容**:
1. `import { cache, Suspense } from 'react'` → `import { Suspense } from 'react'`（`cache` のみ削除）
2. `const getPageData = cache(...)` を削除
3. `getPageData(handle)` → 個別関数の `Promise.all` に展開

```ts
// Before
const { itemsResult, pcBuildResult } = await getPageData(handle)

// After
const [itemsResult, pcBuildResult] = await Promise.all([
  getUserPublicItemsByHandle(handle),
  getPublicPcBuildByHandle(handle),
])
```

`generateMetadata` も同様に展開。

**注意**: `getPublicPcBuildByHandle` は `app/actions/content/pc-build-actions.ts` 内の Server Action。これは `'use cache'` 移行対象外（Server Action 内の読み取り関数のため）。ただし、将来的に `lib/queries/` に移行する候補。

---

### Step 3: Server Actions に `updateTag` 追加（17ファイル）

すべての Server Actions で以下のパターンを適用:

```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'

// 既存の revalidatePath はそのまま残す（ダッシュボード用）
revalidatePath('/dashboard/...')

// 公開ページのキャッシュ無効化を追加
if (session.user.handle) {
  const handle = normalizeHandle(session.user.handle)
  updateTag(`tag-${handle}`)
}
```

**重要な設計判断**:
- `session.user.handle` は `string | null | undefined` 型（`types/next-auth.d.ts` 確認済み）
- `handle` の null チェックは必須
- `normalizeHandle()` は `@` プレフィックスの除去 + lowercase を行う
- `session.user.handle` は DB から取得された値でありすでに正規化済みだが、安全のため `normalizeHandle()` を通す（`@` なしの lowercase が保証される）

#### 3.1 `app/actions/content/faq-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数と追加コード**: 全 mutation（8関数）
- `createFaqCategory`: `revalidatePath("/dashboard/faqs")` の後に追加
- `updateFaqCategory`: 同上
- `deleteFaqCategory`: 同上
- `reorderFaqCategories`: 同上
- `createFaqQuestion`: 同上
- `updateFaqQuestion`: 同上
- `deleteFaqQuestion`: 同上
- `updateFaqCategorySettings`: 同上
- `reorderFaqQuestions`: 同上

**追加パターン**（各 `revalidatePath` の直後）:
```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`faq-${h}`)
  updateTag(`profile-${h}`)
}
```

**理由**: `getUserByHandle` が FAQ カテゴリ+質問を include しているため `profile-${handle}` も無効化必須。

#### 3.2 `app/actions/content/user-news-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `createUserNews`: `news-${h}`, `profile-${h}` 追加
- `updateUserNews`: `news-${h}`, `profile-${h}` 追加
- `deleteUserNews`: `news-${h}`, `profile-${h}` 追加
- `reorderUserNews`: `news-${h}`, `profile-${h}` 追加
- `toggleUserNewsPublished`: `news-${h}`, `profile-${h}` 追加
- `updateNewsListSettings`: `news-${h}` のみ追加（セクション設定はプロフィールに影響しない）

**パターン**:
```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`news-${h}`)
  updateTag(`profile-${h}`)
}
```

**`updateNewsListSettings`** のみ:
```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`news-${h}`)
}
```

**補足**: 既存の `revalidatePath(`/@${session.user.handle}/news`)` は `updateNewsListSettings` のみに存在。他の関数にはない。`updateTag` 追加で公開ページのキャッシュ無効化が網羅される。

#### 3.3 `app/actions/content/item-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `createUserItem`: `items-${h}` 追加
- `updateUserItem`: `items-${h}` 追加
- `deleteUserItem`: `items-${h}` 追加
- `reorderUserItems`: `items-${h}` 追加

**パターン**:
```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`items-${h}`)
}
```

**注意**: これらの関数は既に `revalidatePath(`/@${session.user.handle}/items`)` を持っている。`updateTag` は並列で追加。

#### 3.4 `app/actions/content/pc-build-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `upsertUserPcBuild`
- `addPcBuildPart`
- `updatePcBuildPart`
- `deletePcBuildPart`
- `reorderPcBuildParts`

**変更箇所**: 既存の `revalidateUserPaths` ヘルパー関数を拡張するのが最もシンプル:

```ts
function revalidateUserPaths(handle: string | null | undefined) {
  after(() => {
    revalidatePath('/dashboard/items')
    if (handle) {
      revalidatePath(`/@${handle}/items`)
      const h = normalizeHandle(handle)
      updateTag(`items-${h}`)
    }
  })
}
```

**注意**: `after()` 内の `updateTag` は Server Action のコンテキストで実行されるため有効。`after()` は Server Actions 内で使用可能。

**重要な確認事項**: `after()` コールバック内での `updateTag` の動作を Phase 2 実装時に検証する必要がある。公式ドキュメントでは `updateTag` は "Server Actions only" と記載。`after()` 内がこのスコープに含まれるかは未確定。
- **安全策**: `after()` の外で `updateTag` を直接呼び、`after()` 内の `revalidatePath` はそのまま残す:

```ts
// after() の前に updateTag を実行
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`items-${h}`)
}
revalidateUserPaths(session.user.handle)
```

→ 各呼び出し元（`upsertUserPcBuild` 等）で `updateTag` を直接追加し、`revalidateUserPaths` はそのまま残す方針を推奨。

#### 3.5 `app/actions/user/profile-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateUserProfile`: `profile-${h}` 追加
- `updateThemeSettings`（namecard）: `profile-${h}` 追加

**現状の問題**: `updateUserProfile` は `revalidatePath("/dashboard/profile-editor")` のみ。公開ページの `revalidatePath` が欠落。`updateTag('profile-${handle}')` の追加で同時に解消。

```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`profile-${h}`)
}
```

**`getNamecardImages`** と **`getBackgroundImages`** は読み取り専用 → 変更不要。

#### 3.6 `app/actions/user/character-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**: 全 update（4関数）
- `updateBasicInfo`: `profile-${h}` 追加
- `updateActivitySettings`: `profile-${h}` 追加
- `updateGameSettings`: `profile-${h}` 追加
- `updateCollabSettings`: `profile-${h}` 追加

**現状の問題**: これらは `revalidatePath("/dashboard/character")` など dashboard パスのみ。公開ページの revalidation 欠落。`updateTag` で解消。

```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`profile-${h}`)
}
```

`getCharacterInfo` は読み取り専用 → 変更不要。

#### 3.7 `app/actions/user/section-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**: 全 mutation（6関数）
- `createSection`: `profile-${h}` 追加。ビデオセクション（`page === 'videos'`）の場合は `videos-${h}` も追加
- `updateSection`: `profile-${h}` 追加。ビデオセクション（`section.page === 'videos'`）の場合は `videos-${h}` も追加
- `deleteSection`: `profile-${h}` 追加
- `reorderSections`: `profile-${h}` 追加
- `updateSectionSettings`: `profile-${h}` 追加
- `moveSectionOrder`: `profile-${h}` 追加

**`createSection` の例**:
```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`profile-${h}`)
  if (page === 'videos') {
    updateTag(`videos-${h}`)
  }
}
```

**`updateSection` の例**（`section.page` を参照して判定）:
```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`profile-${h}`)
  if (section.page === 'videos') {
    updateTag(`videos-${h}`)
  }
}
```

`getUserSections` は読み取り専用（`cachedAuth` 依存）→ 変更不要。

#### 3.8 `app/actions/user/theme-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateUserThemeSettings`: `profile-${h}` 追加
- `updateThemeBackground`: `profile-${h}` 追加

**既存コードの handle チェック**: これらの関数は既に `if (session.user.handle)` チェックを持つ。その中に `updateTag` を追加:

```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`profile-${h}`)
  revalidatePath(`/@${session.user.handle}`)
}
```

#### 3.9 `app/actions/user/notification-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateUserNotification`: `profile-${h}` 追加
- `deleteUserNotification`: `profile-${h}` 追加

```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`profile-${h}`)
}
```

`getUserNotification` と `markNotificationAsRead` は読み取り専用 → 変更不要。

#### 3.10 `app/actions/user/contact-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateUserContact`: `profile-${h}` 追加
- `deleteUserContact`: `profile-${h}` 追加

`getUserContact` は読み取り専用 → 変更不要。

#### 3.11 `app/actions/user/gift-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateUserGift`: `profile-${h}` 追加
- `deleteUserGift`: `profile-${h}` 追加

`getUserGift` は読み取り専用 → 変更不要。

#### 3.12 `app/actions/social/youtube-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**: 公開ページに影響する全 mutation
- `updateYoutubeChannel`: `videos-${h}`, `profile-${h}` 追加
- `addRecommendedVideo`: `videos-${h}`, `profile-${h}` 追加
- `deleteRecommendedVideo`: `videos-${h}`, `profile-${h}` 追加
- `reorderRecommendedVideos`: `videos-${h}`, `profile-${h}` 追加
- `toggleRecommendedVideosVisibility`: `videos-${h}`, `profile-${h}` 追加
- `updateYouTubeLatestSection`: `videos-${h}`, `profile-${h}` 追加

```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`videos-${h}`)
  updateTag(`profile-${h}`)
}
```

読み取り専用関数（`extractChannelIdFromUrl`, `getMyRssFeedVideos`, `getUserYoutubeSettings`, `fetchPublicYoutubeRss`, `getYouTubeMetadata`）→ 変更不要。

#### 3.13 `app/actions/social/twitch-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateTwitchChannel`: `videos-${h}`, `profile-${h}` 追加
- `updateLivePriority`: `videos-${h}`, `profile-${h}` 追加

```ts
if (session.user.handle) {
  const h = normalizeHandle(session.user.handle)
  updateTag(`videos-${h}`)
  updateTag(`profile-${h}`)
}
```

読み取り専用関数（`createTwitchEventSubSubscription`, `deleteTwitchEventSubSubscription`, `getTwitchEventSubSubscriptionStatus`, `getUserTwitchSettings`）→ 変更不要。ただし `createTwitchEventSubSubscription` / `deleteTwitchEventSubSubscription` はEventSubの管理であり公開ページのデータには直接影響しない。

#### 3.14 `app/actions/social/niconico-actions.ts`

**分析結果**: `getNiconicoMetadata` は読み取り専用（YouTube oEmbed 相当のメタデータ取得）。公開ページのデータ変更なし。

**結論**: **変更不要**。親計画で「link/disconnect」と記載されていたが、実際のコードではニコニコの link/disconnect 操作は `section-actions.ts` の `createSection`/`deleteSection`（`youtube-latest` セクション）で管理されている。niconico-actions.ts 自体には mutation がない。

#### 3.15 `app/actions/admin/section-background-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
```

**影響する関数**: 全 mutation（5関数）
- `createPresetAction`: `presets` タグ追加
- `updatePresetAction`: `presets` タグ追加
- `deletePresetAction`: `presets` タグ追加
- `togglePresetActiveAction`: `presets` タグ追加
- `updatePresetSortOrderAction`: `presets` タグ追加

**パターン**: handle 非依存のグローバルタグ
```ts
updateTag('presets')
```

`getPresetsAction` と `getPresetByIdAction` は読み取り専用 → 変更不要。

#### 3.16 `app/actions/admin/user-news-admin-actions.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
import { prisma } from '@/lib/prisma'  // 既に import 済み
```

**影響する関数**:
- `adminToggleNewsHidden`: `news-${h}`, `profile-${h}` 追加

**handle 取得方法**: Admin 操作では `session.user.handle` は管理者のハンドル。対象ユーザーの handle を取得する必要がある:

```ts
export async function adminToggleNewsHidden(newsId: string) {
  await requireAdmin()
  const validatedNewsId = cuidSchema.parse(newsId)

  const news = await prisma.userNews.findUnique({
    where: { id: validatedNewsId },
    select: { id: true, adminHidden: true, userId: true },
  })
  if (!news) throw new Error('記事が見つかりません')

  // 対象ユーザーの handle を取得
  const targetUser = await prisma.user.findUnique({
    where: { id: news.userId },
    select: { handle: true },
  })

  const updated = await prisma.userNews.update({
    where: { id: validatedNewsId },
    data: { adminHidden: !news.adminHidden },
  })

  revalidatePath(`/admin/users/${news.userId}`)

  // 対象ユーザーの公開キャッシュ無効化
  if (targetUser?.handle) {
    const h = normalizeHandle(targetUser.handle)
    updateTag(`news-${h}`)
    updateTag(`profile-${h}`)
  }

  return { success: true, data: updated }
}
```

#### 3.17 `app/actions/admin/user-management.ts`

**追加 import**:
```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'
```

**影響する関数**:
- `updateUserHandle`: 旧・新 handle の**全タグ**を無効化

```ts
// ハンドル更新後
if (currentUser.handle) {
  const oldH = normalizeHandle(currentUser.handle)
  updateTag(`profile-${oldH}`)
  updateTag(`faq-${oldH}`)
  updateTag(`news-${oldH}`)
  updateTag(`items-${oldH}`)
  updateTag(`videos-${oldH}`)
}
const newH = normalizeHandle(normalizedHandle)
updateTag(`profile-${newH}`)
updateTag(`faq-${newH}`)
updateTag(`news-${newH}`)
updateTag(`items-${newH}`)
updateTag(`videos-${newH}`)
```

- `toggleUserActive`: 対象ユーザーの公開キャッシュを全無効化

```ts
const targetUser = await prisma.user.findUnique({
  where: { id: validatedUserId },
  select: { isActive: true, name: true, handle: true },
})
// ...更新後...
if (targetUser?.handle) {
  const h = normalizeHandle(targetUser.handle)
  updateTag(`profile-${h}`)
  updateTag(`faq-${h}`)
  updateTag(`news-${h}`)
  updateTag(`items-${h}`)
  updateTag(`videos-${h}`)
}
```

- `deleteUser`: 削除後はキャッシュが自然 expire するため `updateTag` 不要（ユーザーが存在しなくなれば `handleExists()` で 404 が返る）。ただし、即時反映が望ましい場合は handle 取得して全タグ無効化。

```ts
// 削除前に handle を取得
const user = await prisma.user.findUnique({
  where: { id: validatedUserId },
  select: { name: true, email: true, handle: true },
})
// ...削除後...
if (user?.handle) {
  const h = normalizeHandle(user.handle)
  updateTag(`profile-${h}`)
  updateTag(`faq-${h}`)
  updateTag(`news-${h}`)
  updateTag(`items-${h}`)
  updateTag(`videos-${h}`)
}
```

**admin ヘルパー関数の提案**: handle 変更 / ユーザー削除 / 無効化で共通のパターンが生まれるため:

```ts
// admin/user-management.ts のファイル内ヘルパー
function invalidateAllUserTags(handle: string) {
  const h = normalizeHandle(handle)
  updateTag(`profile-${h}`)
  updateTag(`faq-${h}`)
  updateTag(`news-${h}`)
  updateTag(`items-${h}`)
  updateTag(`videos-${h}`)
}
```

---

### Server Actions 設計テーブル（updateTag 追加の全量）

| Server Action ファイル | 関数 | 追加する updateTag | handle 取得方法 |
|-----------------------|------|-------------------|----------------|
| `content/faq-actions.ts` | 全 mutation（9関数） | `faq-${h}`, `profile-${h}` | `session.user.handle` |
| `content/user-news-actions.ts` | create/update/delete/toggle/reorder（5関数） | `news-${h}`, `profile-${h}` | `session.user.handle` |
| `content/user-news-actions.ts` | `updateNewsListSettings` | `news-${h}` | `session.user.handle` |
| `content/item-actions.ts` | create/update/delete/reorder（4関数） | `items-${h}` | `session.user.handle` |
| `content/pc-build-actions.ts` | upsert/add/update/delete/reorder（5関数） | `items-${h}` | `session.user.handle` |
| `user/profile-actions.ts` | `updateUserProfile`, `updateThemeSettings` | `profile-${h}` | `session.user.handle` |
| `user/character-actions.ts` | 全 update（4関数） | `profile-${h}` | `session.user.handle` |
| `user/section-actions.ts` | 全 mutation（6関数） | `profile-${h}` + 条件付き `videos-${h}` | `session.user.handle` |
| `user/theme-actions.ts` | `updateUserThemeSettings`, `updateThemeBackground` | `profile-${h}` | `session.user.handle` |
| `user/notification-actions.ts` | update/delete（2関数） | `profile-${h}` | `session.user.handle` |
| `user/contact-actions.ts` | update/delete（2関数） | `profile-${h}` | `session.user.handle` |
| `user/gift-actions.ts` | update/delete（2関数） | `profile-${h}` | `session.user.handle` |
| `social/youtube-actions.ts` | 6 mutation 関数 | `videos-${h}`, `profile-${h}` | `session.user.handle` |
| `social/twitch-actions.ts` | channel/priority（2関数） | `videos-${h}`, `profile-${h}` | `session.user.handle` |
| `social/niconico-actions.ts` | — | — | **変更不要**（mutation なし） |
| `admin/section-background-actions.ts` | 全 mutation（5関数） | `presets` | 不要（グローバルタグ） |
| `admin/user-news-admin-actions.ts` | `adminToggleNewsHidden` | `news-${h}`, `profile-${h}` | DB から対象ユーザーの handle を取得 |
| `admin/user-management.ts` | `updateUserHandle` | 旧・新 handle の全タグ | DB の旧 handle + 新 handle |
| `admin/user-management.ts` | `toggleUserActive`, `deleteUser` | 対象ユーザーの全タグ | DB から対象ユーザーの handle を取得 |

---

## アーキテクチャ設計

### 変更レイヤー

Phase 2 はコンポーネントツリー・RSC 境界・ルーティング構造の変更なし。変更は以下3レイヤーに限定:

```
レイヤー1: lib/ クエリ関数（React.cache → 'use cache' 移行）
├── lib/handle-utils.ts         getUserByHandle          → 'use cache' + cacheTag(profile, faq, news)
├── lib/queries/faq-queries.ts  getPublicFaqByHandle     → 'use cache' + cacheTag(faq)
├── lib/queries/news-queries.ts getPublicNewsByHandle    → 'use cache' + cacheTag(news)
│                               getPublicNewsSection     → 'use cache' + cacheTag(news)
│                               getPublicNewsArticle     → 'use cache' + cacheTag(news-article, news)
│                               getPublicUserByHandle    → 削除（インライン化）
├── lib/queries/item-queries.ts getUserPublicItemsByHandle → 'use cache' + cacheTag(items)
├── lib/queries/video-queries.ts getVideoPageData        → 'use cache' + cacheTag(videos)
└── lib/sections/preset-queries.ts getActivePresets      → 'use cache' + cacheTag(presets)

レイヤー2: app/actions/ Server Actions（updateTag 追加）
└── 16 ファイル（niconico-actions.ts は変更不要）

レイヤー3: app/[handle]/*/page.tsx（ローカル cache() ラッパー削除）
└── 4 ファイル
```

### 設計判断

| 判断 | 選択 | 理由 |
|------|------|------|
| `session.user.handle` が null の場合 | updateTag をスキップ | handle 未設定ユーザーに公開ページは存在しない |
| `getPublicUserByHandle` の削除方法 | 各関数にインライン化 | `'use cache'` のキャッシュで dedup。キャッシュ管理がシンプル |
| `updateTag` ヘルパーの共通化 | インライン記述（admin のみヘルパー） | 各 Action のタグ組み合わせが異なる。admin の全タグ無効化のみヘルパー化 |
| `cacheTag` の呼び出し方 | vararg 形式 `cacheTag('tag1', 'tag2')` | 公式 API がサポート。コード量削減 |
| `getPublicPcBuildByHandle` の扱い | Phase 2 スコープ外 | `'use server'` ファイル内で `'use cache'` 不可。将来的に `lib/queries/` に移動検討 |

## パフォーマンス設計

### キャッシュキー構成と空間

| 関数 | キャッシュキー引数 | キー空間 | 返り値サイズ |
|------|-------------------|---------|------------|
| `getUserByHandle(handle)` | `string` | ユーザー数 | 大（profile+FAQ+News 3件） |
| `getPublicFaqByHandle(handle)` | `string` | ユーザー数 | 中（カテゴリ+質問配列） |
| `getPublicNewsByHandle(handle)` | `string` | ユーザー数 | 中（ニュース配列） |
| `getPublicNewsSection(handle)` | `string` | ユーザー数 | 小（セクション1件） |
| `getPublicNewsArticle(handle, slug)` | `string, string` | ユーザー数×記事数 | 中（記事1件） |
| `getUserPublicItemsByHandle(handle)` | `string` | ユーザー数 | 中〜大（アイテム配列） |
| `getVideoPageData(handle)` | `string` | ユーザー数 | 小（セクション+characterName） |
| `getActivePresets()` | なし | 1 | 小（グローバル共有） |

### cacheLife プロファイル動作

**`'minutes'` プロファイル（公開クエリ全般）:**
- 0〜5分: stale データを即返却（revalidation なし）
- 5分〜1時間: stale を返しつつバックグラウンドで1分ごとに revalidate
- 1時間後: キャッシュエントリ expire → 次回リクエストで同期的再フェッチ
- **`updateTag()` 呼び出し時**: 即座に expire → 次回リクエストでフレッシュデータ取得

### キャッシュヒット率予測

| シナリオ | ヒット率 | 備考 |
|---------|---------|------|
| 公開プロフィール閲覧（通常） | 99%+ | 閲覧 >>> 編集。stale 5分間はすべてヒット。ユーザー間でキャッシュ共有 |
| ダッシュボード編集直後の確認 | 0%（意図的） | `updateTag` で即時 expire → read-your-own-writes |
| ビルド直後の初回アクセス | 0% | static shell は即返却。データは初回フェッチ後キャッシュ |
| サーバー再起動後 | 0% | インメモリ LRU のためクリア。数分で再キャッシュ |

### Cascade Invalidation の影響

`getUserByHandle` に3タグ（profile, faq, news）を付与する設計の影響:

| updateTag 呼び出し | 無効化される関数 | 不要な再フェッチ |
|-------------------|----------------|----------------|
| `faq-${handle}` | `getUserByHandle` + `getPublicFaqByHandle` | getUserByHandle のプロフィール/テーマ/ニュースデータ |
| `news-${handle}` | `getUserByHandle` + `getPublicNewsByHandle` + Section + Article | getUserByHandle の FAQ/プロフィールデータ |
| `profile-${handle}` | `getUserByHandle` のみ | なし |
| `items-${handle}` | `getUserPublicItemsByHandle` のみ | cascade なし |
| `videos-${handle}` | `getVideoPageData` のみ | cascade なし |
| `presets` | `getActivePresets` のみ | cascade なし（全ユーザーに影響） |

**評価**: FAQ/News 編集時の `getUserByHandle` cascade は許容範囲。編集頻度は低く、`cacheLife('minutes')` で即座に再キャッシュ。将来的に `getUserByHandle` を分割すれば解消可能。

### generateMetadata と page の dedup

`React.cache()` はリクエスト内 dedup だったが、`'use cache'` はクロスリクエストキャッシュ。同一引数での呼び出しはキャッシュヒットで即返却。**ただしキャッシュミス時は2回の DB クエリが発生しうる**（`generateMetadata` と page が別々に実行）。公開ページではキャッシュヒット率99%+のため実質的に問題なし。

### Activity-based Navigation + キャッシュの相互作用

| シナリオ | 動作 |
|---------|------|
| `/@alice` → `/@alice/faqs` → 戻る | Activity が DOM を保持。追加フェッチなし |
| ダッシュボードで FAQ 編集 → `/@alice/faqs` に遷移 | `updateTag` でクライアントキャッシュ全クリア → フレッシュデータで表示 |
| Activity で保持中に別ユーザーが更新 | stale time 内は古いデータ。次回 revalidation で更新（最大5分遅延） |

### メモリ考慮事項

セルフホスト環境でインメモリ LRU キャッシュ。1ユーザーあたり最大8エントリ（7クエリ + N記事）。`cacheLife('minutes')` の expire 1時間で自然回収。ニュース記事の多いユーザーは `getPublicNewsArticle` エントリが増えるが、アクセスのないエントリは LRU で先に追い出される。

## DB スキーマ変更

なし。Phase 2 はキャッシュ戦略の変更のみで、データモデルの変更は不要。

## 既存コード再利用

| 項目 | 場所 | 再利用方法 |
|------|------|----------|
| `normalizeHandle()` | `lib/validations/shared.ts` | 全キャッシュタグ生成に統一使用 |
| `queryHandleSchema` | `lib/validations/shared.ts` | 公開クエリのバリデーションに継続使用 |
| `cuidSchema` | `lib/validations/shared.ts` | Server Actions の ID バリデーションに継続使用 |
| try-catch + null/error 返却 | 全クエリ関数 | エラーハンドリングパターン維持 |
| `revalidatePath` | 全 Server Actions | ダッシュボード用にそのまま残す |

## セキュリティチェックリスト

- [x] 全 Server Actions に認証チェック（既存の `requireAuth()` / `requireAdmin()` は変更なし）
- [x] 全入力に Zod バリデーション（既存パターン維持）
- [x] IDOR 防止（所有権検証は既存パターン維持）
- [x] `revalidatePath` のパス正確性（`/@handle` 等）— 既存のまま維持
- [x] `normalizeHandle()` による cache tag の正規化（`@` プレフィックス + 大文字混入を防止）
- [x] Admin 操作時の handle 取得はクライアント入力ではなく DB から取得

## リスクと軽減策

| リスク | 重要度 | 軽減策 |
|--------|--------|--------|
| `after()` 内の `updateTag` が有効か不明 | HIGH | pc-build-actions の各関数で `after()` の外で直接 `updateTag` を呼ぶ。`revalidateUserPaths` はそのまま残す |
| `'use cache'` 内での Zod parse エラー（throw）がキャッシュされる可能性 | MEDIUM | 実装時に検証。問題があれば `safeParse` に変更 |
| エラー結果（null / `{ success: false }`）がキャッシュされる | LOW | try-catch パターン維持。`cacheLife('minutes')` で revalidate 1分 / expire 1時間で自然回復 |
| `getUserByHandle` の cascade invalidation | LOW | FAQ/News 編集頻度は低い。`cacheLife('minutes')` で即座に再キャッシュ。将来的に分割で最適化 |
| `getPublicNewsArticle` の slug タグ長 | LOW | slug 最大200文字 + プレフィックス → 256文字制限内。バリデーション済み |
| Admin の `adminToggleNewsHidden` で追加 DB クエリ | LOW | `select: { handle: true }` の軽量クエリ1件追加のみ |
| キャッシュミス時の generateMetadata + page 二重フェッチ | LOW | キャッシュヒット率99%+。ミス時の追加コストは1 DB roundtrip (~1ms) |
| サーバー再起動でインメモリキャッシュ消失 | LOW | `cacheLife('minutes')` で数分以内に再キャッシュ。warm-up スクリプトは任意 |

## 要確認事項

1. **`after()` コールバック内の `updateTag`** [要検証]
   公式ドキュメントでは `updateTag` は "Server Actions only" と記載。`after()` 内がこのスコープに含まれるか要検証。pc-build-actions.ts のみ影響。**安全策**: `after()` の外で直接呼び出し。

2. **`'use cache'` 内で Zod が throw した場合** [要検証]
   `queryHandleSchema.parse()` が不正 handle で throw する。`'use cache'` がエラーをキャッシュするか再実行するかは公式ドキュメントに明記なし。実装時に検証し、必要なら `safeParse` に変更。

3. **`getPublicPcBuildByHandle` の将来的な移動** [スコープ外]
   現在 `pc-build-actions.ts`（`'use server'`）内の読み取り専用関数。`'use cache'` 化するには `lib/queries/` に移動が必要。items ページのキャッシュ効果を最大化するなら移動が望ましいが、Phase 2 スコープ外。

4. **`niconico-actions.ts` の除外確認** [確認済み]
   親計画に「link/disconnect」と記載されていたが、実コードには `getNiconicoMetadata`（読み取り専用）のみ。ニコニコの link/disconnect は `section-actions.ts` で管理。**変更不要**。

## 実装順序

1. クエリ関数の `'use cache'` 移行（Step 1: 6ファイル）→ ビルド確認
2. ページレベルの cache() ラッパー削除（Step 2: 4ファイル）→ ビルド確認
3. Server Actions に `updateTag` 追加（Step 3: 16ファイル）→ ビルド確認
4. ブラウザ検証（親計画の Phase 2 検証項目に準拠）

## 検証計画

```bash
# 各ステップ後
npx tsc --noEmit && npm run lint && npm run build
```

### ブラウザ検証（Step 3 完了後）
- `/@handle` にアクセス → キャッシュから返ること（DB クエリが発生しないこと）
- 異なるユーザーからの同一 `/@handle` → キャッシュ共有を確認
- ダッシュボードで FAQ 編集 → `/@handle/faqs` が即座に更新されること
- ニュース記事を作成 → `/@handle/news` に反映されること
- テーマ変更 → `/@handle` に反映されること
- admin が背景プリセット変更 → 全プロフィールページに反映されること
- admin が handle 変更 → 旧・新 handle のキャッシュが無効化されること
