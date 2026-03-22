---
title: "cacheComponents Phase 1: Structure（フラグ有効化 + Suspense 対応）"
type: plan
date: 2026-03-22
updated: 2026-03-23
status: draft
---

## 概要

親計画（`20260322-cache-components-migration.md`）の Phase 1 詳細。`cacheComponents: true` を有効化し、3つの主要レイアウト（handle, dashboard, admin）を Suspense 境界で再構成、7つの `loading.tsx` を追加してビルドを通す。PPR の static shell 配信と Activity-based navigation が有効になる。

## 要件

- `next.config.ts` に `cacheComponents: true` を追加
- Nginx ストリーミング対応の `X-Accel-Buffering: no` ヘッダーを追加
- `[handle]/layout.tsx`: `handleExists()` を Suspense 前に配置（HTTP 404 保証）+ `HandleLayoutContent` 抽出 + `HandleLayoutSkeleton` 作成
- `dashboard/layout.tsx`: `DashboardLayoutContent` 抽出 + `DashboardLayoutSkeleton` 作成
- `admin/layout.tsx`: `AdminLayoutContent` 抽出 + `AdminLayoutSkeleton` 作成
- 不足している 7 ルートに `loading.tsx` を追加
- `npm run build` を通す（反復的なビルドエラー修正を含む）

## 参照した公式ドキュメント

| ドキュメント | エージェント | 主な知見 |
|-------------|------------|---------|
| `01-getting-started/05-server-and-client-components.md` | Architecture | SC はデフォルト。children パターンで SC を CC 内にネスト可能 |
| `01-getting-started/03-layouts-and-pages.md` | Architecture | レイアウトはナビゲーション間で再レンダリングされない。`params` は `Promise` で `await` 必須 |
| `03-api-reference/03-file-conventions/layout.md` | Architecture | **cacheComponents 有効時、`loading.js` は Suspense 境界として機能。レイアウト内の未キャッシュデータアクセスは Suspense 必須（ビルドエラーで検知）** |
| `02-guides/streaming.md` | Architecture, Performance | **`notFound()` が Suspense 内で発火すると HTTP 200。** `checkSlugExists` パターンが公式推奨。`X-Accel-Buffering: no` で Nginx バッファリング回避 |
| `01-getting-started/08-caching.md` | Data Layer | **cacheComponents 有効時、未キャッシュ・未 Suspense のランタイムデータアクセスはビルドエラー** |
| `03-api-reference/01-directives/use-cache.md` | Data Layer | `React.cache` は `'use cache'` 内で隔離される — Phase 1 では問題なし（`'use cache'` 未使用） |
| `02-guides/migrating-to-cache-components.md` | Data Layer | route segment configs → `'use cache'` に置換。現コードベースに route segment configs は 0 件で競合なし |
| `02-guides/prefetching.md` | Performance | **PPR 有効時、`loading.js` がないルートはプリフェッチされない** |
| `02-guides/preserving-ui-state.md` | Performance | Activity で最大3ルートの DOM を `display: none` で保持。Effects は hide 時 cleanup、visible 時再作成 |
| `05-config/01-next-config-js/cacheComponents.md` | Architecture | PPR + useCache + dynamicIO + Activity を統一制御 |

## アーキテクチャ設計

### コンポーネントツリー（Phase 1 変更後）

```
RootLayout (SC, sync, 変更なし)
│
├── [handle]/layout.tsx (SC, async) ★MODIFY
│   ├── isReservedHandle() ← sync, Suspense 前（変更なし）
│   ├── handleExists() ← 軽量 select {id:true}, Suspense 前 ★ADD CALL
│   └── <Suspense fallback={<HandleLayoutSkeleton />}> ★ADD
│       └── HandleLayoutContent (SC, async) ★EXTRACT
│           ├── getUserByHandle() → テーマ・プロフィールデータ
│           └── <UserThemeProvider> (CC)
│               └── <ProfileLayout> (CC)
│                   ├── <Suspense fallback={null}>
│                   │   └── ProfileHeaderWrapper (SC, async)
│                   ├── {children} ← pages（loading.tsx で Suspense）
│                   └── MobileBottomNav, FloatingElements
│
├── dashboard/layout.tsx (SC, async) ★MODIFY
│   └── <Suspense fallback={<DashboardLayoutSkeleton />}> ★ADD
│       └── DashboardLayoutContent (SC, async) ★EXTRACT
│           ├── cachedAuth() → redirect if !session
│           ├── getUserNavData()
│           └── <DashboardLayoutClient> (CC)
│
├── admin/layout.tsx (SC, async) ★MODIFY
│   └── <Suspense fallback={<AdminLayoutSkeleton />}> ★ADD
│       └── AdminLayoutContent (SC, async) ★EXTRACT
│           ├── cachedAuth() → redirect if !admin
│           ├── Promise.all([getAdminStats(), getUserNavData()])
│           └── <BaseLayout variant="admin"> (CC)
│
├── app/loading.tsx ★NEW (Suspense for app/page.tsx)
├── articles/loading.tsx ★NEW
├── items/loading.tsx ★NEW
├── items/pc-parts/loading.tsx ★NEW
├── auth/signin/loading.tsx ★NEW
├── auth/error/loading.tsx ★NEW
└── demo/loading.tsx ★NEW
```

### RSC 境界テーブル

| Component | Type | 理由 |
|-----------|------|------|
| `HandleLayout` (export default) | SC (async) | `await params` + `isReservedHandle` + `handleExists()` + Suspense wrapper |
| `HandleLayoutContent` ★NEW | SC (async) | `getUserByHandle` + テーマ計算。Suspense 内で実行 |
| `HandleLayoutSkeleton` ★NEW | SC (sync) | 静的スケルトン。テーマ未確定なので中立デザイン（`bg-background`） |
| `DashboardLayoutContent` ★NEW | SC (async) | `cachedAuth()` + `getUserNavData()` + redirect。Suspense 内で実行 |
| `DashboardLayoutSkeleton` ★NEW | SC (sync) | BaseLayout のシェル構造を模したスケルトン |
| `AdminLayoutContent` ★NEW | SC (async) | `cachedAuth()` + `getAdminStats()` + `getUserNavData()`。Suspense 内 |
| `AdminLayoutSkeleton` ★NEW | SC (sync) | BaseLayout admin variant のスケルトン |
| 全 loading.tsx (7ファイル) ★NEW | SC (sync) | 静的スケルトン。クライアントバンドル追加なし |

### 設計判断

| 判断 | 決定 | 理由 |
|------|------|------|
| *LayoutContent の配置 | **layout.tsx 同一ファイル** | 既存パターン（`ProfileHeaderWrapper` が layout.tsx 内に定義）に従う。各ファイルは追加後も 120-270 行でコンパクト |
| *LayoutSkeleton の配置 | **layout.tsx 同一ファイル** | Content と同じファイルに配置。ファイル数抑制 |
| `handleExists()` の正規化 | **`normalizeHandle()` に統一** | 現在は `handle.toLowerCase()` のみ。Phase 2 でキャッシュタグに `normalizeHandle()` を使うため、Phase 1 で先行統一。`@` プレフィックス対応も堅牢になる |
| `await params` の位置 | **Suspense 前** | `isReservedHandle()` と `handleExists()` に handle 値が必要。正しい HTTP 404 保証に必須 |
| Dashboard/Admin の redirect | **Suspense 内で許容** | proxy.ts が第一防衛線。Suspense 内の redirect はクライアントサイドリダイレクトだが、SEO 影響なし |

## データレイヤー設計（Phase 1 スコープ）

### Phase 1 でのデータフロー変更

| データ | 変更前 | 変更後 | 補足 |
|--------|--------|--------|------|
| `handleExists(handle)` | layout.tsx 内に定義あるが未使用 | **Suspense 前で呼び出し追加** | `select: {id: true}` 極軽量、キャッシュしない |
| `getUserByHandle(handle)` | layout 本体で直接呼び出し | **HandleLayoutContent に移動**（Suspense 内） | React.cache() dedup 維持 |
| `cachedAuth()` | layout 本体で直接呼び出し | ***LayoutContent に移動**（Suspense 内） | React.cache() 維持 |
| `getUserNavData()` | layout 本体で直接呼び出し | ***LayoutContent に移動**（Suspense 内） | React.cache() 維持 |
| `getAdminStats()` | layout 本体で直接呼び出し | **AdminLayoutContent に移動**（Suspense 内） | 変更なし |

### React.cache() dedup の検証

**結論: Phase 1 で dedup は正常に動作する。**

`React.cache()` はリクエスト単位のメモイゼーションで、Suspense 境界とは無関係。以下の全てで同一リクエスト内 dedup が有効:
- `generateMetadata` での `getUserByHandle(handle)`
- `HandleLayoutContent` での `getUserByHandle(handle)`
- `ProfileHeaderWrapper` での `getUserByHandle(handle)`
- 各 `[handle]/*` page での `getUserByHandle(handle)`

### handleExists() の改善（Phase 1 で実施）

`normalizeHandle()` を使用するよう変更:

```ts
import { normalizeHandle } from '@/lib/validations/shared'

export async function handleExists(handle: string): Promise<boolean> {
  try {
    const normalized = normalizeHandle(handle)
    const user = await prisma.user.findUnique({
      where: { handle: normalized },
      select: { id: true },
    })
    return !!user
  } catch {
    return false
  }
}
```

### handleExists() + getUserByHandle() の二重クエリ

Phase 1 では 2 回の DB クエリが発生:
1. `handleExists()`: `select: {id: true}` のみ（インデックスヒット、<1ms）
2. `getUserByHandle()`: フルデータ取得（include 付き）

正しい HTTP 404 保証のためのトレードオフとして許容。Phase 2 で `getUserByHandle` を `'use cache'` に移行後はキャッシュヒット時にクエリ 0 回になり、`handleExists()` の 1 回のみ。

## パフォーマンス設計

### PPR Static Shell 分析

| ルート | Static Shell の内容 | 恩恵 |
|--------|-------------------|------|
| `[handle]/*` | HandleLayoutSkeleton が即表示 → HandleLayoutContent がストリーミング | **最大**: 全訪問者に同一 shell を即返却 |
| `dashboard/*` | DashboardLayoutSkeleton が即表示 → DashboardLayoutContent がストリーミング | **中**: auth 依存で常に動的だが、レイアウト構造を即表示 |
| `admin/*` | AdminLayoutSkeleton が即表示 → AdminLayoutContent がストリーミング | **中**: 同上 |
| `app/page.tsx` 等 | loading.tsx のスケルトンが即表示 → page がストリーミング | **中**: `getUserNavData()` が cookies 依存だが、プリフェッチは有効化 |

### loading.tsx 設計（7ファイル）

#### app/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="min-h-screen">
      {/* ヘッダーバー */}
      <div className="h-14 border-b px-4 flex items-center">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="p-6 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        {/* Card grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### app/articles/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function ArticlesLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-14 border-b px-4 flex items-center">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        {/* フィルタータブ */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        {/* 記事カードグリッド */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### app/items/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function ItemsLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-14 border-b px-4 flex items-center">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        {/* カテゴリグリッド */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### app/items/pc-parts/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function PcPartsLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-14 border-b px-4 flex items-center">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="p-6 space-y-6">
        {/* パンくず + ヘッダー */}
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        {/* フィルタータブ */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        {/* 商品カードグリッド */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

#### app/auth/signin/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md border rounded-lg bg-white p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-32 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        {/* Buttons */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
        {/* Separator + link */}
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  )
}
```

#### app/auth/error/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function AuthErrorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md border rounded-lg bg-white p-6 space-y-6">
        {/* Icon + Header */}
        <div className="text-center space-y-3">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-7 w-40 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        {/* Alert */}
        <Skeleton className="h-16 w-full rounded-md" />
        {/* Buttons */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
```

#### app/demo/loading.tsx

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function DemoLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}
```

### レイアウトスケルトン設計（3コンポーネント）

#### HandleLayoutSkeleton

ProfileLayout の実構造（1 カラム: `min-h-screen flex flex-col`）に合わせる。テーマ CSS 変数は未設定のため中立的な `bg-background` を使用:

```tsx
function HandleLayoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* プロフィールヘッダー相当 */}
      <div className="w-full p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      {/* コンテンツ領域 */}
      <main className="flex-1 w-full p-6 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </main>
    </div>
  )
}
```

**注意**: 既存の `app/[handle]/loading.tsx` は 2 カラム構造だが、`ProfileLayout` は 1 カラム。Phase 1 で `HandleLayoutSkeleton` を正しい 1 カラム構造で作成し、既存の `loading.tsx` も更新して一貫性を確保する。

#### DashboardLayoutSkeleton

BaseLayout の構造（サイドバー + メインエリア）を模倣:

```tsx
function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <div className="hidden lg:block w-[350px] border-r p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      {/* メイン */}
      <div className="flex-1">
        <div className="h-14 border-b px-4 flex items-center">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### AdminLayoutSkeleton

DashboardLayoutSkeleton と同構造で admin variant 用:

```tsx
function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block w-[350px] border-r p-4 space-y-4">
        <Skeleton className="h-8 w-24" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1">
        <div className="h-14 border-b px-4 flex items-center">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Activity-based Navigation の影響

| リスク | コンポーネント | 重要度 | Phase 1 対策 |
|--------|-------------|--------|-------------|
| 送信済みフォームの draft 保持 | `UserNewsForm` | HIGH | Phase 1 では対処不要。Phase 3 で callback ref `form.reset()` 追加 |
| DnD + セクション編集 state 保持 | `EditableProfileClient` | MEDIUM | **望ましい動作**: 設定途中で別ページを見て戻れる |
| SWR revalidation | `FaqManagementSection` 等 | MEDIUM | Phase 1 後の手動テストで検証 |
| Admin 全般 | Admin ページ | LOW | state 保持は基本的に有益。対応不要 |

### Nginx ストリーミング設定

`next.config.ts` の `headers()` に追加:

```ts
async headers() {
  return [
    {
      source: '/:path*{/}?',
      headers: [
        {
          key: 'X-Accel-Buffering',
          value: 'no',
        },
      ],
    },
  ]
},
```

## スコープ

### ファイル操作テーブル

| # | 操作 | ファイル | 内容 | 依存 |
|---|------|---------|------|------|
| 1 | 変更 | `next.config.ts` | `cacheComponents: true` + `headers()` に `X-Accel-Buffering: no` | — |
| 2 | 変更 | `lib/handle-utils.ts` | `handleExists()` 内の正規化を `normalizeHandle()` に統一 | — |
| 3 | 変更 | `app/[handle]/layout.tsx` | `handleExists()` 呼び出し追加 + `HandleLayoutContent` 抽出 + `HandleLayoutSkeleton` + Suspense wrap | #2 |
| 4 | 変更 | `app/[handle]/loading.tsx` | 2 カラム → 1 カラムに修正（ProfileLayout の実構造に合わせる） | #3 |
| 5 | 変更 | `app/dashboard/layout.tsx` | `DashboardLayoutContent` 抽出 + `DashboardLayoutSkeleton` + Suspense wrap | — |
| 6 | 変更 | `app/admin/layout.tsx` | `AdminLayoutContent` 抽出 + `AdminLayoutSkeleton` + Suspense wrap | — |
| 7 | 新規 | `app/loading.tsx` | Home ページ用スケルトン | — |
| 8 | 新規 | `app/articles/loading.tsx` | 記事一覧スケルトン | — |
| 9 | 新規 | `app/items/loading.tsx` | アイテム一覧スケルトン | — |
| 10 | 新規 | `app/items/pc-parts/loading.tsx` | PC パーツスケルトン | — |
| 11 | 新規 | `app/auth/signin/loading.tsx` | サインインスケルトン | — |
| 12 | 新規 | `app/auth/error/loading.tsx` | エラーページスケルトン | — |
| 13 | 新規 | `app/demo/loading.tsx` | Demo 汎用スケルトン | — |
| 14 | 変更 | ビルドエラーが出た追加ファイル | 反復修正（Suspense 追加等） | #1 |

### 実装順序

1. **Step A**: `next.config.ts` に `cacheComponents: true` + `headers()` 追加（#1）
2. **Step B**: `lib/handle-utils.ts` の `handleExists()` 正規化統一（#2）
3. **Step C**: 3つのレイアウト変更を並列実行（#3, #5, #6）
4. **Step D**: `app/[handle]/loading.tsx` 更新（#4）
5. **Step E**: 7つの loading.tsx を作成（#7-#13）— 並列実行可能
6. **Step F**: `npm run build` 実行 → ビルドエラーを反復修正（#14）
7. **Step G**: 最終ビルド検証（`npx tsc --noEmit && npm run lint && npm run build`）

**ファイル数**: 変更 6、新規 7（+ ビルドエラー修正分）

## レイアウト変更の詳細設計

### [handle]/layout.tsx の変更

```tsx
// 変更前: HandleLayout 本体で getUserByHandle を直接呼び出し
export default async function HandleLayout({ children, params }: HandleLayoutProps) {
  const { handle } = await params
  if (isReservedHandle(handle)) notFound()

  const targetUser = await getUserByHandle(handle) // ← ここが動的
  if (!targetUser || !targetUser.profile) notFound()
  // ... テーマ計算 + JSX
}

// 変更後: handleExists → Suspense → HandleLayoutContent に分離
export default async function HandleLayout({ children, params }: HandleLayoutProps) {
  const { handle } = await params
  if (isReservedHandle(handle)) notFound()

  const exists = await handleExists(handle)  // 軽量チェック（Suspense 前）
  if (!exists) notFound()                     // 正しい HTTP 404

  return (
    <Suspense fallback={<HandleLayoutSkeleton />}>
      <HandleLayoutContent handle={handle}>{children}</HandleLayoutContent>
    </Suspense>
  )
}

async function HandleLayoutContent({ handle, children }: { handle: string; children: ReactNode }) {
  const targetUser = await getUserByHandle(handle)
  if (!targetUser || !targetUser.profile) notFound()  // プロフィール未設定のエッジケース

  const themePreset = targetUser.profile.themePreset || 'claymorphic'
  const themeSettings = resolveThemeSettings(targetUser.profile.themeSettings)
  const backgroundStyle = calculateBackgroundStyle(themeSettings)

  return (
    <UserThemeProvider themePreset={themePreset} themeSettings={themeSettings}>
      <ProfileLayout
        header={
          <Suspense fallback={null}>
            <ProfileHeaderWrapper handle={handle} />
          </Suspense>
        }
        bottomNav={/* ... 既存のまま ... */}
        floatingElements={/* ... 既存のまま ... */}
        backgroundStyle={backgroundStyle}
      >
        {children}
      </ProfileLayout>
    </UserThemeProvider>
  )
}
```

**generateMetadata は変更なし** — `getUserByHandle()` の `React.cache()` dedup は `HandleLayoutContent` の呼び出しとも同一リクエスト内で有効。

### dashboard/layout.tsx の変更

```tsx
// 変更後
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  )
}

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await cachedAuth()
  if (!session?.user) redirect('/auth/signin')
  if (!session.user.isActive) redirect('/auth/suspended')

  const user = await getUserNavData()

  return (
    <DashboardLayoutClient
      user={user}
      sidebarContent={<DashboardSidebarContent userId={session.user.id} />}
      sidebarRoutes={[
        { path: '/dashboard/character', content: <CharacterSidebarContent /> },
      ]}
    >
      {children}
    </DashboardLayoutClient>
  )
}
```

### admin/layout.tsx の変更

```tsx
// 変更後
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await cachedAuth()
  if (!session?.user?.email) redirect('/auth/signin')
  if (!session.user.isActive) redirect('/auth/suspended')
  if (session.user.role !== 'ADMIN') redirect('/unauthorized')

  const [stats, user] = await Promise.all([getAdminStats(), getUserNavData()])
  const adminSidebarContent = getSidebarContent("admin", stats)

  return (
    <BaseLayout
      variant="admin"
      user={user}
      overrides={{ secondSidebar: { content: adminSidebarContent } }}
    >
      {children}
    </BaseLayout>
  )
}
```

## リスクと軽減策

| リスク | 重要度 | 軽減策 |
|--------|--------|--------|
| `cacheComponents: true` でビルドエラーが多発 | 中 | エラーメッセージが具体的にファイルを指示。loading.tsx 追加 + layout Suspense 化で大半カバー。残りは反復修正 |
| `handleExists()` のレイテンシが static shell 送信を遅延 | 低 | `select: {id: true}` + DB インデックスで <5ms。Phase 1 完了後に計測 |
| Activity で SWR `revalidateOnFocus` が発火しない | 中 | Phase 1 後の手動テストで検証。問題時は `revalidateOnMount: true` で対応 |
| `withSerwist()` と cacheComponents の互換性 | 低 | 公式ドキュメントに記載なし。ビルド時に判明するため即対応可能 |
| 既存 `[handle]/loading.tsx` のレイアウト不整合 | 低 | Phase 1 で 1 カラムに修正（ProfileLayout の実構造に合わせる） |

## 確認事項の決定結果

| 項目 | 決定 | 理由 |
|------|------|------|
| `unstable_instant` の導入 | **Phase 1-3 では見送り** | `unstable_` prefix で API 安定性が不明。stable になってから導入で十分 |
| `[handle]/loading.tsx` の更新 | **1 カラムに修正する** | 以前は 2 カラムだったが現在は 1 カラム（ProfileLayout）に変更済み。スケルトンも合わせる |

## 検証計画

### ビルド検証

```bash
npx tsc --noEmit && npm run lint && npm run build
```

### ブラウザ検証（Phase 1 完了後）

| # | 検証項目 | 期待動作 |
|---|---------|---------|
| 1 | `/@handle` にアクセス | HandleLayoutSkeleton → コンテンツがストリーミング表示 |
| 2 | 存在しない `/@handle` にアクセス | HTTP 404 ステータスコード |
| 3 | `/dashboard` 未ログイン | スケルトン → サインインにリダイレクト |
| 4 | `/dashboard` ログイン | DashboardLayoutSkeleton → コンテンツ表示 |
| 5 | `/admin` 管理者ログイン | AdminLayoutSkeleton → コンテンツ表示 |
| 6 | ブラウザの戻る/進む | Activity で component state が保持される |
| 7 | Dashboard フォームの Activity 保持 | 入力途中のデータが保持される（Phase 3 で詳細検証） |
| 8 | `/` にアクセス | loading.tsx スケルトン → コンテンツ表示 |
| 9 | Chrome DevTools で TTFB 確認 | ストリーミングによる改善を確認 |
