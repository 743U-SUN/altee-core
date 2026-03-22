---
title: cacheComponents 有効化 & 全ページマイグレーション計画
type: plan
date: 2026-03-22
updated: 2026-03-22
status: draft
---

## 概要

Next.js 16 の `cacheComponents: true` を有効化し、PPR（Partial Prerendering）、`'use cache'` ディレクティブ、Activity-based navigation を全85ページに段階的に導入する。公開プロフィールページ（`[handle]/*`）は閲覧 >>> 編集のパターンで最もキャッシュ効果が高い。公式ドキュメントの推奨に従い `React.cache()` → `'use cache'` への移行も行う。

## 要件

- `cacheComponents: true` を有効化し、全ページのビルドを通す
- 公開クエリ関数を `React.cache()` → `'use cache'` + `cacheLife()` + `cacheTag()` に移行
- Server Actions に `updateTag()` を追加し、データ変更時にキャッシュを即時無効化
- dashboard/admin クエリは `React.cache()` のまま維持（`cookies()` 依存のため）
- `normalizeHandle()` をキャッシュタグ生成に統一使用
- PPR の static shell を最大化するための Suspense 境界設計

## 参照した公式ドキュメント

| ドキュメント | エージェント | 主な知見 |
|-------------|------------|---------|
| `01-getting-started/05-server-and-client-components.md` | Architecture | SC/CC 境界は `'use client'` で宣言。children パターンで SC を CC 内にネスト可能 |
| `01-getting-started/03-layouts-and-pages.md` | Architecture | レイアウトはナビゲーション間で再レンダリングされない。`params` は Promise として await 必須 |
| `03-api-reference/03-file-conventions/layout.md` | Architecture | **cacheComponents 有効時、loading.js は Suspense 境界として扱われる。レイアウト内の非キャッシュデータアクセスは独自の Suspense でラップ必須** |
| `02-guides/streaming.md` | Architecture, Performance | **notFound() が Suspense 内で発火すると HTTP 200 を返す（404 ではない）。redirect() もクライアントサイドリダイレクトになる** |
| `02-guides/preserving-ui-state.md` | Performance | Activity で DOM を `display: none` で保持（最大3ルート）。フォーム入力値、useState が保持される |
| `02-guides/prefetching.md` | Performance | PPR 有効時、static shell がプリフェッチされ即ストリーミング。loading.tsx がないルートはプリフェッチされない |
| `01-getting-started/08-caching.md` | Data Layer | `'use cache'` でデータ/UI レベルのキャッシュ。cookies/headers 不可 |
| `01-getting-started/09-revalidating.md` | Data Layer | `updateTag`: Server Actions のみ、即時 expire。`revalidateTag('tag', 'max')`: stale-while-revalidate |
| `03-api-reference/01-directives/use-cache.md` | All | 引数+クロージャ変数がキャッシュキー。`import 'server-only'` と共存可能。**React.cache は 'use cache' 内で隔離される** |
| `03-api-reference/04-functions/cacheLife.md` | Data Layer | プリセット: seconds/minutes/hours/days/weeks/max。`seconds` プロファイルはプリレンダリングから除外 |
| `03-api-reference/04-functions/updateTag.md` | Data Layer | Server Actions のみ使用可能。即時 expire（read-your-own-writes） |
| `02-guides/migrating-to-cache-components.md` | Data Layer | route segment configs → `'use cache'` + `cacheLife()` に置換 |
| `03-api-reference/05-config/01-next-config-js/cacheComponents.md` | Architecture | PPR + useCache + dynamicIO + Activity を統一制御 |
| `02-guides/instant-navigation.md` | Performance | キャッシュ済みデータは即表示、動的データは fallback 後ストリーミング |

## 現状のコードベース

| 項目 | 状態 |
|------|------|
| 総ページ数 | 85 |
| route segment config (`dynamic`, `revalidate` 等) | 0件 — 競合なし |
| 既存 `'use cache'` | 0件 — ゼロからの導入 |
| `React.cache()` 使用箇所 | lib/queries/ 全9ファイル、lib/auth.ts、lib/user-data.ts、lib/handle-utils.ts、lib/sections/preset-queries.ts |
| 既存 `loading.tsx` | 23ファイル |
| 既存 Suspense 境界 | [handle]/layout、admin の一部ページ |
| `next/dynamic` 使用 | 28ファイル（適切に遅延ロード済み） |

## cacheLife デフォルトプロファイル

| プロファイル | stale | revalidate | expire |
|-------------|-------|------------|--------|
| `'seconds'` | 30秒 | 1秒 | 1分 |
| `'minutes'` | 5分 | 1分 | 1時間 |
| `'hours'` | 5分 | 1時間 | 1日 |
| `'days'` | 5分 | 1日 | 1週間 |

- **stale**: キャッシュを即返却する期間（この間は revalidation も発生しない）
- **revalidate**: stale 期間後、バックグラウンド revalidation が発生する間隔
- **expire**: キャッシュエントリ自体が削除される期間
- クライアント側には最低30秒の stale time が強制される

## アーキテクチャ設計

### コンポーネントツリー（PPR 対応後）

```
RootLayout (SC, sync, 変更なし)
├── [handle]/layout.tsx (SC, async) ★MODIFY
│   ├── isReservedHandle() チェック ← sync, Suspense 前
│   ├── handleExists() 軽量チェック ← 404 ステータス保証 ★NEW
│   └── <Suspense fallback={<HandleLayoutSkeleton />}>
│       └── HandleLayoutContent (SC, async)
│           ├── getUserByHandle() → テーマ・プロフィールデータ
│           └── <UserThemeProvider> (CC, context)
│               └── <ProfileLayout> (CC)
│                   ├── <Suspense fallback={null}>
│                   │   └── ProfileHeaderWrapper (SC, async)
│                   ├── {children} ← pages
│                   └── MobileBottomNav, FloatingElements
│
├── dashboard/layout.tsx (SC, async) ★MODIFY
│   └── <Suspense fallback={<DashboardLayoutSkeleton />}>
│       └── DashboardLayoutContent (SC, async)
│           ├── cachedAuth() → redirect if !session
│           ├── getUserNavData()
│           └── <DashboardLayoutClient> (CC)
│
├── admin/layout.tsx (SC, async) ★MODIFY
│   └── <Suspense fallback={<AdminLayoutSkeleton />}>
│       └── AdminLayoutContent (SC, async)
│           ├── cachedAuth() → redirect if !admin
│           ├── Promise.all([getAdminStats(), getUserNavData()])
│           └── <BaseLayout> (CC)
```

### RSC 境界テーブル

| Component | Type | 理由 |
|-----------|------|------|
| `HandleLayout` | SC (async) | params await + 予約語チェック + handleExists + Suspense wrapper |
| `HandleLayoutContent` | SC (async) | getUserByHandle + テーマ計算 |
| `HandleLayoutSkeleton` | SC (sync) | 静的スケルトン ★NEW |
| `DashboardLayoutSkeleton` | SC (sync) | 静的スケルトン ★NEW |
| `AdminLayoutSkeleton` | SC (sync) | 静的スケルトン ★NEW |
| `UserThemeProvider` | CC | createContext |
| `ProfileLayout` | CC | DOM レイアウト |
| `DashboardLayoutClient` | CC | usePathname |
| Public query functions | N/A | `'use cache'` 対象 |
| Dashboard query functions | N/A | `React.cache()` 据え置き |

### notFound() の HTTP ステータスコード問題（既存計画からの変更点）

**公式ドキュメントの発見**: `notFound()` が Suspense 境界の内側で発火すると、HTTP 200 が既に送信されているため 404 ステータスコードが返せない。代わりに `<meta name="robots" content="noindex">` が注入される。

**対策**: `HandleLayout` 本体（Suspense の外側）で軽量な存在チェック `handleExists()` を行い、存在しない handle には正しい 404 を返す。フルデータ取得は Suspense 内の `HandleLayoutContent` で行う。

```tsx
export default async function HandleLayout({ children, params }: HandleLayoutProps) {
  const { handle } = await params
  if (isReservedHandle(handle)) notFound()

  // 軽量チェック: select { id: true } のみ
  const exists = await handleExists(handle)
  if (!exists) notFound()  // 正しい 404 ステータスコード

  return (
    <Suspense fallback={<HandleLayoutSkeleton />}>
      <HandleLayoutContent handle={handle}>{children}</HandleLayoutContent>
    </Suspense>
  )
}
```

- `handleExists()` は `select: { id: true }` のみの極軽量クエリ
- キャッシュ化しない（存在しない handle のキャッシュ管理が複雑になるため）
- `getUserByHandle()` のフルデータ取得は Suspense 内で実行

### redirect() の扱い（dashboard/admin）

`redirect()` も Suspense 内ではクライアントサイドリダイレクトになる。これは許容範囲:
1. `proxy.ts` が第一防衛線として認証チェック + リダイレクトを行う
2. レイアウト内の `redirect()` は proxy.ts をすり抜けた場合のフォールバック
3. SEO 影響なし（dashboard/admin は検索エンジンがクロールしない）

## データレイヤー設計

### クエリ関数の移行テーブル

#### 'use cache' に移行（公開データ）

| ファイル | 関数 | cacheLife | cacheTag |
|---------|------|----------|----------|
| `lib/handle-utils.ts` | `getUserByHandle` | `'minutes'` | `profile-${handle}`, `faq-${handle}`, `news-${handle}` |
| `lib/queries/faq-queries.ts` | `getPublicFaqByHandle` | `'minutes'` | `faq-${handle}` |
| `lib/queries/news-queries.ts` | `getPublicNewsByHandle` | `'minutes'` | `news-${handle}` |
| `lib/queries/news-queries.ts` | `getPublicNewsSection` | `'minutes'` | `news-${handle}` |
| `lib/queries/news-queries.ts` | `getPublicNewsArticle` | `'minutes'` | `news-article-${handle}-${slug}`, `news-${handle}` |
| `lib/queries/item-queries.ts` | `getUserPublicItemsByHandle` | `'minutes'` | `items-${handle}` |
| `lib/queries/video-queries.ts` | `getVideoPageData` | `'minutes'` | `videos-${handle}` |
| `lib/sections/preset-queries.ts` | `getActivePresets` | `'hours'` | `presets` |

#### React.cache() のまま維持（cookies 依存）

| ファイル | 関数 | 理由 |
|---------|------|------|
| `lib/auth.ts` | `cachedAuth` | `auth()` → cookies 依存 |
| `lib/user-data.ts` | `getUserNavData` | `cachedAuth()` → cookies 依存 |
| `lib/queries/faq-queries.ts` | `getDashboardFaqCategories` | requireAuth → cookies 依存 |
| `lib/queries/news-queries.ts` | `getDashboardNews`, `getDashboardNewsById` 等 | cookies 依存 |
| `lib/queries/item-queries.ts` | `getDashboardUserItems`, `getDashboardUserPcBuild` | cookies 依存 |
| `lib/queries/character-queries.ts` | `getDashboardCharacterInfo` | cookies 依存 |
| `lib/queries/theme-queries.ts` | `getUserThemeSettings` | cookies 依存 |
| `lib/queries/youtube-queries.ts` | `getDashboardYoutubeSettings` | cookies 依存 |
| `lib/queries/managed-profile-queries.ts` | 全関数 | 管理画面用、cookies 依存 |
| `lib/queries/article-queries.ts` | 全関数 | 管理画面用、cookies 依存 |

### 変換パターン

```ts
// Before
import { cache } from 'react'
export const getPublicFaqByHandle = cache(async (handle: string) => {
  // ... Prisma query
})

// After
import { cacheLife, cacheTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'

export async function getPublicFaqByHandle(handle: string) {
  'use cache'
  const normalized = normalizeHandle(handle)
  cacheLife('minutes')
  cacheTag(`faq-${normalized}`)
  // ... 同じ Prisma query（handle は normalized を使用）
}
```

### React.cache 隔離問題への対応

**問題**: `'use cache'` 内では `React.cache` が独立スコープで動作。`getPublicNewsByHandle` が内部で `getPublicUserByHandle`（React.cache）を呼んでいるが、移行後は dedup が効かなくなる。

**対策**: `getPublicUserByHandle` を削除し、必要なユーザー検索ロジックを各クエリ関数にインライン化。`'use cache'` のキャッシュキーに handle が含まれるため、同一 handle での重複呼び出しはキャッシュから即返却される。

### ページレベルの React.cache() ラッパー削除

`generateMetadata` と page の dedup 用に作られたローカル `cache()` ラッパーを削除。`'use cache'` がクロスリクエストでキャッシュするため不要:

- `app/[handle]/faqs/page.tsx`: `getCachedFaq` → `getPublicFaqByHandle` を直接呼ぶ
- `app/[handle]/news/page.tsx`: `getCachedNews` → `getPublicNewsByHandle` を直接呼ぶ
- `app/[handle]/news/[slug]/page.tsx`: `getCachedArticle` → `getPublicNewsArticle` を直接呼ぶ
- `app/[handle]/items/page.tsx`: `getPageData` → 個別関数を直接呼ぶ

### getUserByHandle のデータ重複問題

`getUserByHandle()` は FAQ カテゴリ + 質問 + ニュース最新3件を含む巨大クエリ。

**対策**: `getUserByHandle` に3タグを付与:
- `profile-${handle}`: プロフィール/キャラクター/セクション/テーマ変更時
- `faq-${handle}`: FAQ 変更時
- `news-${handle}`: ニュース変更時

いずれかの `updateTag()` でキャッシュが無効化される。テーマやセクションの無関係なデータも再フェッチされるが、`cacheLife('minutes')` で即座に再キャッシュされるため許容範囲。

**将来的な最適化**: `getUserByHandle()` から FAQ・News データを分離し、レイアウトはプロフィール+テーマ情報のみ取得するように再設計すれば、より精密な invalidation が可能。ただし今回のスコープ外。

### キャッシュタグ命名規約

```
パターン: {resource}-{normalizedHandle}
正規化: normalizeHandle() from lib/validations/shared.ts

profile-${handle}                    // getUserByHandle（メインプロフィール）
faq-${handle}                        // getPublicFaqByHandle + getUserByHandle 内 FAQ
news-${handle}                       // getPublicNewsByHandle + getPublicNewsSection
news-article-${handle}-${slug}       // getPublicNewsArticle（個別記事）
items-${handle}                      // getUserPublicItemsByHandle
videos-${handle}                     // getVideoPageData
presets                              // getActivePresets（グローバル）
```

### Server Actions の updateTag 設計

`revalidatePath()` はダッシュボード用に残し、`updateTag()` を**追加**する。

| Server Action ファイル | アクション | 追加する updateTag |
|-----------------------|-----------|-------------------|
| `content/faq-actions.ts` | 全 mutation | `faq-${handle}`, `profile-${handle}` |
| `content/user-news-actions.ts` | create/update/delete/toggle/reorder | `news-${handle}`, `profile-${handle}` |
| `content/user-news-actions.ts` | updateNewsListSettings | `news-${handle}` |
| `content/item-actions.ts` | create/update/delete/reorder | `items-${handle}` |
| `content/pc-build-actions.ts` | 全 mutation | `items-${handle}` |
| `user/profile-actions.ts` | updateUserProfile | `profile-${handle}` |
| `user/character-actions.ts` | 全 update | `profile-${handle}` |
| `user/section-actions.ts` | 全 mutation | `profile-${handle}` + ビデオセクションなら `videos-${handle}` |
| `user/theme-actions.ts` | 全 update | `profile-${handle}` |
| `user/notification-actions.ts` | update | `profile-${handle}` |
| `user/contact-actions.ts` | update | `profile-${handle}` |
| `user/gift-actions.ts` | update | `profile-${handle}` |
| `social/youtube-actions.ts` | 全 mutation | `videos-${handle}`, `profile-${handle}` |
| `social/twitch-actions.ts` | link/disconnect | `videos-${handle}`, `profile-${handle}` |
| `social/niconico-actions.ts` | link/disconnect | `videos-${handle}`, `profile-${handle}` |
| `admin/section-background-actions.ts` | 全 mutation | `presets` |
| `admin/user-news-admin-actions.ts` | 非表示等 | `news-${handle}`, `profile-${handle}` |
| `admin/user-management.ts` | handle 変更等 | 旧・新 handle の全タグ無効化 |

**補足**: `profile-actions.ts` と `character-actions.ts` は現在公開ページの `revalidatePath` が欠落しているが、`updateTag('profile-${handle}')` の追加で同時に解消される。

### updateTag パターン

```ts
import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'

// 既存の revalidatePath はそのまま残す（ダッシュボード用）
revalidatePath('/dashboard/news')

// 公開ページのキャッシュ無効化を追加
const handle = normalizeHandle(session.user.handle)
updateTag(`news-${handle}`)
updateTag(`profile-${handle}`)
```

## パフォーマンス設計

### PPR ページ別恩恵評価

| ページグループ | PPR 恩恵 | 理由 |
|---------------|---------|------|
| **`[handle]/*` (6ページ)** | **最大** | 公開ページ。全訪問者に同じ static shell を即返却。`'use cache'` でキャッシュヒット時は全コンテンツが即座に表示。TTFB 劇的改善 |
| **`items/pc-parts/*` (2ページ)** | **高** | 公開ページ。static shell（ヘッダー + フィルター UI + テーブル骨格）共通 |
| **`dashboard/*` (20ページ)** | **中** | auth 依存で常に動的だが、レイアウト構造を static shell として即表示可能 |
| **`admin/*` (25ページ)** | **中** | 同上 |
| **`auth/*` (3ページ)** | **低** | ページ自体がシンプル |
| **`demo/*` (19ページ)** | **なし** | テスト用 |

### loading.tsx 追加が必要なルート

| ルート | 取得データ | スケルトン内容 |
|--------|-----------|-------------|
| `app/loading.tsx` | `getUserNavData()` | BaseLayout シェル + カードグリッドのスケルトン |
| `app/articles/loading.tsx` | BaseLayout 使用 | BaseLayout シェル + 記事カードリストのスケルトン |
| `app/items/loading.tsx` | — | BaseLayout シェル + カテゴリカードグリッドのスケルトン |
| `app/items/pc-parts/loading.tsx` | Prisma 直接 + `getUserNavData()` | BaseLayout シェル + アイテムテーブルのスケルトン |
| `app/auth/signin/loading.tsx` | `auth()` | サインインカードのスケルトン |
| `app/auth/error/loading.tsx` | searchParams | エラーカードのスケルトン |
| `app/demo/loading.tsx` | 各種 | 汎用スケルトン（demo 全体で1つ） |

### Suspense 境界配置戦略

**原則**: 動的データアクセスを Suspense 境界の **内側** に押し下げ、static shell を最大化する。

#### HandleLayoutSkeleton の設計指針

- 実際のプロフィール画面のレイアウト（2カラム構造）と一致させる
- 高さの不一致は CLS を引き起こすため、`min-h-screen` + 固定高さのスケルトンブロックを使用
- テーマカラーのデフォルト値を CSS で定義しておき、テーマロード前のフラッシュを防ぐ

### Activity-based Navigation の影響

Activity により戻る/進むでコンポーネント state が保持される（最大3ルート）。

| リスク | コンポーネント | 問題 | 対策 |
|--------|-------------|------|------|
| HIGH | `UserNewsForm` | 送信後に古い draft が残る | callback ref で `form?.reset()` |
| MEDIUM | `EditableProfileClient` | 複雑な DnD + セクション編集 state | **望ましい動作**: 設定途中で別ページを見て戻れる |
| MEDIUM | `FaqManagementSection` | SWR の Activity re-show 時の revalidation | Phase 1 後に検証 |
| LOW | Admin ページ全般 | state 保持は基本的に有益 | 対応不要 |
| LOW | 認証ページ | ルートが離れていて Activity で保持されない | 対応不要 |

### @handle Rewrite と PPR の相互作用

**結論: 問題なし（Phase 1 で検証）**

1. `proxy.ts` はレンダリング前に実行 → PPR の static shell 生成に影響しない
2. `next.config.ts` の rewrites は URL レベル変換 → コンポーネントに渡される handle パラメータに影響なし
3. キャッシュキーは関数引数（handle 値）で決定 → rewrite は無関係
4. `@user` と `user` の正規化は `normalizeHandle()` で一元管理

## スコープ

### Phase 1: Structure（フラグ有効化 + Suspense 対応）

| 操作 | ファイル | 内容 |
|------|---------|------|
| 変更 | `next.config.ts` | `cacheComponents: true` 追加 + `X-Accel-Buffering: no` ヘッダー追加 |
| 変更 | `app/[handle]/layout.tsx` | `handleExists()` 追加 + Suspense wrap (`HandleLayoutContent` 抽出) |
| 新規 | `app/[handle]/layout.tsx` 内 or 別ファイル | `HandleLayoutSkeleton` コンポーネント |
| 新規 | `lib/handle-utils.ts` or `lib/queries/` | `handleExists()` 軽量クエリ関数 |
| 変更 | `app/dashboard/layout.tsx` | Suspense wrap (`DashboardLayoutContent` 抽出) |
| 新規 | `app/dashboard/layout.tsx` 内 or 別ファイル | `DashboardLayoutSkeleton` コンポーネント |
| 変更 | `app/admin/layout.tsx` | Suspense wrap (`AdminLayoutContent` 抽出) |
| 新規 | `app/admin/layout.tsx` 内 or 別ファイル | `AdminLayoutSkeleton` コンポーネント |
| 新規 | `app/loading.tsx` | Home ページ用スケルトン |
| 新規 | `app/articles/loading.tsx` | 記事一覧スケルトン |
| 新規 | `app/items/loading.tsx` | アイテム一覧スケルトン |
| 新規 | `app/items/pc-parts/loading.tsx` | PC パーツスケルトン |
| 新規 | `app/auth/signin/loading.tsx` | サインインスケルトン |
| 新規 | `app/auth/error/loading.tsx` | エラーページスケルトン |
| 新規 | `app/demo/loading.tsx` | Demo 汎用スケルトン |
| 変更 | その他ビルドエラーが出たファイル | 反復修正 |

**検証**: `npm run build` + ブラウザ確認（PPR 動作、Activity state 保持、@handle rewrite）

**ファイル数**: 新規 ~10、変更 ~4（+ ビルドエラー修正分）

### Phase 2: Data Layer（クエリキャッシュ化 + 無効化）

| 操作 | ファイル | 内容 |
|------|---------|------|
| 変更 | `lib/handle-utils.ts` | `getUserByHandle` を `'use cache'` に移行、正規化統一 |
| 変更 | `lib/queries/faq-queries.ts` | `getPublicFaqByHandle` を `'use cache'` に移行 |
| 変更 | `lib/queries/news-queries.ts` | 公開関数3つを `'use cache'` に移行、`getPublicUserByHandle` 削除/インライン化 |
| 変更 | `lib/queries/item-queries.ts` | `getUserPublicItemsByHandle` を `'use cache'` に移行 |
| 変更 | `lib/queries/video-queries.ts` | `getVideoPageData` を `'use cache'` に移行 |
| 変更 | `lib/sections/preset-queries.ts` | `getActivePresets` を `'use cache'` に移行 |
| 変更 | `app/[handle]/faqs/page.tsx` | ローカル `getCachedFaq` 削除 |
| 変更 | `app/[handle]/news/page.tsx` | ローカル `getCachedNews` 削除 |
| 変更 | `app/[handle]/news/[slug]/page.tsx` | ローカル `getCachedArticle` 削除 |
| 変更 | `app/[handle]/items/page.tsx` | ローカル `getPageData` 削除 |
| 変更 | `app/actions/content/faq-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/content/user-news-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/content/item-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/content/pc-build-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/profile-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/character-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/section-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/theme-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/notification-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/contact-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/user/gift-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/social/youtube-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/social/twitch-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/social/niconico-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/admin/section-background-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/admin/user-news-admin-actions.ts` | `updateTag` 追加 |
| 変更 | `app/actions/admin/user-management.ts` | `updateTag` 追加 |

**検証**: `npm run build` + ブラウザ確認（キャッシュ動作、updateTag による即時反映）

**ファイル数**: 変更 ~27

### Phase 3: Quality & Cleanup（最終仕上げ）

| 操作 | ファイル | 内容 |
|------|---------|------|
| 変更 | 移行済みクエリファイル6つ | `React.cache()` ラッパー + import 削除 |
| 変更 | `lib/handle-utils.ts` | インライン正規化ロジックを `normalizeHandle()` に統一 |
| 変更 | `CLAUDE.md` | キャッシング戦略セクション更新 |
| 検証 | — | Activity-based navigation の手動テスト |
| 検証 | — | SWR + Activity re-show の相互作用テスト |
| 検証 | — | 本番環境で Nginx ストリーミングが正しく動作することを確認 |
| 検証 | — | `npx tsc --noEmit && npm run lint && npm run build` |

**ファイル数**: 変更 ~8

## リスクと軽減策

| リスク | 重要度 | 軽減策 |
|--------|--------|--------|
| `notFound()` が Suspense 内で 200 OK を返す | **HIGH** | `handleExists()` を Suspense 前に配置し、正しい 404 を保証 |
| Phase 1 でビルドエラーが想定以上に多い | 中 | エラーメッセージが具体的にファイルを指定するので反復修正。loading.tsx 追加で大半カバー |
| `React.cache` が `'use cache'` 内で隔離される | 中 | `getPublicUserByHandle` を削除/インライン化。`'use cache'` 自体のキャッシュで dedup |
| Activity-based navigation でフォーム state が意図せず保持 | 中 | Phase 1 後に手動テスト。必要に応じて callback ref で form.reset() |
| `getUserByHandle` の cascade invalidation | 低 | 3タグ付与で対応。`cacheLife('minutes')` で即座に再キャッシュ |
| `'use cache'` 内でのエラーキャッシュ | 低 | クエリ関数内 try-catch で null 返却パターン維持。`cacheLife('minutes')` で自然 expire |
| Nginx バッファリングがストリーミングをブロック | 中 | Phase 1 で `next.config.ts` に `X-Accel-Buffering: no` ヘッダーを追加して対応 |
| サーバー再起動でインメモリキャッシュ消失 | 低 | `cacheLife('minutes')` で再キャッシュ高速。warm-up スクリプトは任意 |
| SWR の revalidateOnFocus が Activity re-show で発火しない可能性 | 中 | Phase 1 後に実機検証。問題があれば revalidateOnMount で対応 |

## 確認事項の決定結果

| 項目 | 決定 | 理由 |
|------|------|------|
| `handleExists()` のキャッシュ化 | **キャッシュしない** | 公式推奨パターン（streaming.md の `checkSlugExists` 例）に準拠。`select { id: true }` は極軽量。存在しない handle のキャッシュ管理の複雑さを回避 |
| `UserThemeProvider` の CSS 変数スコープ | **問題なし（確認済み）** | CSS 変数は `<div style={...}>` のインラインスタイルでスコープされており、`:root` には設定していない。Activity で DOM が `display: none` で残っても他ルートにリークしない |
| `app/page.tsx` 等の auth 依存ページ | **Phase 1 は `loading.tsx` 追加のみ** | `loading.tsx` は Suspense 境界として機能する（公式 streaming.md 確認済み）。将来的に `getUserNavData()` を Suspense 分離し PPR static shell を最大化する最適化を検討（後述） |
| Nginx ストリーミング設定 | **`X-Accel-Buffering: no` ヘッダーを Next.js 側で設定** | `next.config.ts` の `headers()` で全パスに適用。Nginx 設定変更不要で管理が楽 |

## 将来的な最適化（スコープ外）

### getUserNavData() の Suspense 分離による PPR 最大化

`app/page.tsx`、`app/articles/page.tsx`、`app/items/page.tsx` はコンテンツが静的だが、`getUserNavData()` → `cookies()` のせいでページ全体が動的になる。`getUserNavData()` を個別の `<Suspense>` 内に分離すれば、コンテンツ部分が PPR static shell に含まれ即時表示される。

```tsx
// 最適化後のイメージ
export default function HomePage() {
  return (
    <BaseLayout userSlot={
      <Suspense fallback={null}>
        <HeaderUser />  {/* ここだけ動的 */}
      </Suspense>
    }>
      静的コンテンツ...  {/* PPR static shell に含まれる */}
    </BaseLayout>
  )
}
```

`BaseLayout` の props 設計変更が必要。Phase 1-3 完了後の別タスクとして実施を推奨。

### getUserByHandle() からの FAQ・News データ分離

`getUserByHandle()` から FAQ カテゴリ + ニュース最新3件を分離し、各ページが個別クエリで取得するように再設計すれば、より精密なキャッシュ invalidation が可能。Phase 1-3 完了後の別タスクとして実施を推奨。

## 検証計画

### 各 Phase 共通のビルド検証

```bash
npx tsc --noEmit && npm run lint && npm run build
```

### Phase 1 後のブラウザ検証

- `/@handle` にアクセス → PPR static shell が即表示されること
- 存在しない `/@handle` → 404 ステータスコードが返ること
- `/dashboard` 未ログイン → サインインにリダイレクトされること
- `/dashboard` ログイン → レイアウトスケルトン → コンテンツが表示されること
- ブラウザの戻る/進む → Activity でコンポーネント state が保持されること
- ダッシュボードのフォームで Activity state 保持が問題を起こさないか確認

### Phase 2 後のブラウザ検証

- `/@handle` にアクセス → キャッシュから返ること（DB クエリが発生しないこと）
- 異なるユーザーからの同一 `/@handle` → キャッシュ共有を確認
- ダッシュボードで FAQ 編集 → `/@handle/faqs` が即座に更新されること
- ニュース記事を作成 → `/@handle/news` に反映されること
- テーマ変更 → `/@handle` に反映されること
- admin が背景プリセット変更 → 全プロフィールページに反映されること
- admin が handle 変更 → 旧・新 handle のキャッシュが無効化されること

### Phase 3 後の最終検証

- `npx tsc --noEmit && npm run lint && npm run build` が通ること
- 全 demo ページが正常にアクセスできること
- SWR + Activity re-show で stale データが更新されること
- 本番環境で Nginx ストリーミングが正しく動作すること
