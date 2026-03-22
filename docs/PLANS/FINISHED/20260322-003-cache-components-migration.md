---
title: "cacheComponents Phase 3: Quality & Cleanup（最終仕上げ）"
type: plan
date: 2026-03-22
updated: 2026-03-22
status: draft
parent: 20260322-cache-components-migration.md
---

## 概要

親計画（`20260322-cache-components-migration.md`）の Phase 3 詳細。Phase 1（Structure）と Phase 2（Data Layer）完了後の最終仕上げとして、不要な `React.cache()` ラッパーと import の除去、`normalizeHandle()` への正規化統一、CLAUDE.md のキャッシング戦略更新、そして Activity-based navigation / SWR re-show / Nginx ストリーミングの手動検証を行う。

## 要件

- Phase 2 で `'use cache'` に移行済みのクエリ関数から残存する `React.cache()` ラッパーと `import { cache }` を除去
- `lib/handle-utils.ts` の `getUserByHandle` 内のインライン正規化を `normalizeHandle()` に統一
- `news-queries.ts` の `getPublicUserByHandle` が Phase 2 で削除済みであることを確認
- ページレベルの `cache()` ラッパーが Phase 2 Step 2 で削除済みであることを確認（未完了なら実施）
- CLAUDE.md の Data fetching セクションを `'use cache'` 中心に更新
- Activity-based navigation でフォーム state 保持の問題がないか検証
- SWR + Activity re-show の動作を検証
- 本番環境で Nginx ストリーミングが正しく動作することを確認
- `npx tsc --noEmit && npm run lint && npm run build` が通ること

## 参照した公式ドキュメント

| ドキュメント | エージェント | 主な知見 |
|-------------|------------|---------|
| `02-guides/preserving-ui-state.md` | Architecture, Performance | Activity は DOM を `display: none` で保持（最大3ルート）。`useLayoutEffect` cleanup が hide 時に実行。フォームリセットは callback ref で `form?.reset()` |
| `03-api-reference/01-directives/use-cache.md` | All | **React.cache は `'use cache'` 内で隔離される**。移行済み関数を `React.cache()` でラップしても dedup 効果なし → 削除が正解 |
| `02-guides/streaming.md` | Architecture, Performance | Nginx は `X-Accel-Buffering: no` でバッファリング無効化。gzip 圧縮もチャンクをバッファリングする場合あり |
| `01-getting-started/08-caching.md` | Data Layer | `'use cache'` はクロスリクエストキャッシュ。同一引数は即返却。`React.cache` のリクエスト内 dedup は不要に |
| `02-guides/self-hosting.md` | Performance | `X-Accel-Buffering: no` の設定例。セルフホスティングでの Cache Components 動作確認済み |

## 前提条件（Phase 2 完了確認チェック）

Phase 3 実装開始前に以下を確認する。1つでも未完了なら Phase 2 を先に完了させること。

| チェック項目 | 確認コマンド |
|-------------|------------|
| 公開クエリ関数に `'use cache'` ディレクティブがある | `grep -r "use cache" lib/queries/ lib/handle-utils.ts lib/sections/` |
| `news-queries.ts` の `getPublicUserByHandle` が削除されている | `grep "getPublicUserByHandle" lib/queries/news-queries.ts` (結果が空) |
| Server Actions に `updateTag` が追加されている | `grep -r "updateTag" app/actions/` |
| ページレベル `cache()` ラッパーが削除済み (Phase 2 Step 2) | `grep "getCachedFaq\|getCachedNews\|getCachedArticle" app/\[handle\]/` (結果が空) |
| ビルドが通る | `npx tsc --noEmit && npm run build` |

## 実装詳細

### Step 1: `import { cache } from 'react'` 整理（クエリレイヤー）

Phase 2 で `'use cache'` に移行された関数から、残存する `React.cache()` ラッパーと不要な `import { cache }` を除去する。

**判断基準**: 同一ファイル内に `React.cache()` を使い続ける dashboard 関数がある場合、`import { cache }` は残す。

| ファイル | `cache` import | アクション | 理由 |
|---------|---------------|-----------|------|
| `lib/handle-utils.ts` | 削除 | `import { cache } from 'react'` 削除。`getUserByHandle` の `export const ... = cache(async ...)` → `export async function ...` に変形 | `getUserByHandle` のみが cache 使用 → Phase 2 で `'use cache'` 移行済み |
| `lib/queries/faq-queries.ts` | **残す** | `getPublicFaqByHandle` の `cache()` ラッパーのみ外す。`import { cache }` は残す | `getDashboardFaqCategories` が `cache()` を使用中 |
| `lib/queries/news-queries.ts` | 削除 | `import { cache } from 'react'` 削除。公開3関数の `cache()` ラッパーを外す | Dashboard 関数（`getDashboardNewsById`, `getDashboardNews`）は `cache()` 未使用 |
| `lib/queries/item-queries.ts` | **残す** | `getUserPublicItemsByHandle` の `cache()` ラッパーのみ外す。`import { cache }` は残す | `getDashboardUserItems`, `getDashboardUserPcBuild` が `cache()` 使用中 |
| `lib/queries/video-queries.ts` | 削除 | `import { cache } from 'react'` 削除。`getVideoPageData` の `cache()` ラッパーを外す | ファイル内唯一の関数が移行済み |
| `lib/sections/preset-queries.ts` | 削除 | `import { cache } from 'react'` 削除。`getActivePresets` の `cache()` ラッパーを外す | ファイル内唯一の関数が移行済み |

#### 変換パターン

```ts
// Before（Phase 2 完了後の中間状態: 'use cache' 追加済み + cache ラッパー残存）
import { cache } from 'react'

export const getVideoPageData = cache(async (handle: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag(`videos-${normalized}`)
  // ...
})

// After（Phase 3 完了後）
// import { cache } from 'react' を削除

export async function getVideoPageData(handle: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag(`videos-${normalized}`)
  // ...
}
```

**注意**: `export const fn = cache(async (...) => { ... })` は `export async function fn(...) { ... }` に変形する（アロー関数 → 関数宣言）。

#### ビルド確認

```bash
npx tsc --noEmit && npm run lint
```

### Step 2: `normalizeHandle()` 正規化統一（`lib/handle-utils.ts`）

**現状**: `getUserByHandle` 内でインライン正規化を使用:
```ts
const normalizedHandle = handle.startsWith('@')
  ? handle.slice(1).toLowerCase()
  : handle.toLowerCase()
```

**変更**: `normalizeHandle()` from `@/lib/validations/shared.ts` に置換:
```ts
import { normalizeHandle } from '@/lib/validations/shared'

// getUserByHandle 内で:
const normalized = normalizeHandle(handle)
```

**Phase 2 で対応済みの可能性あり**: Phase 2 計画に `normalizeHandle` 導入が含まれている。その場合は確認のみ。

**スコープ限定**: バリデーションスキーマの変更（`handleSchema` → `queryHandleSchema`）は行わない。正規化ロジックの統一のみ。

#### ビルド確認

```bash
npx tsc --noEmit && npm run lint
```

### Step 3: ページレベル `cache()` ラッパー削除確認（条件付き）

Phase 2 計画の Step 2 でページレベルの `cache()` ラッパー削除が含まれている。以下で完了確認:

```bash
grep -r "getCachedFaq\|getCachedNews\|getCachedArticle" app/\[handle\]/
grep "getPageData.*cache" app/\[handle\]/items/page.tsx
```

**結果が空**: Phase 2 で対応済み → Step 4 へ進む

**結果がヒット**: Phase 2 で未対応 → 以下の4ファイルを修正:

| ファイル | 削除対象 | 置換先 |
|---------|---------|--------|
| `app/[handle]/faqs/page.tsx` | `getCachedFaq` | `getPublicFaqByHandle` を直接呼び出し |
| `app/[handle]/news/page.tsx` | `getCachedNews` | `getPublicNewsByHandle` を直接呼び出し |
| `app/[handle]/news/[slug]/page.tsx` | `getCachedArticle` | `getPublicNewsArticle` を直接呼び出し（2箇所: `generateMetadata` + page 本体） |
| `app/[handle]/items/page.tsx` | `getPageData` | `Promise.all` を展開して個別関数を直接呼び出し（2箇所: `generateMetadata` + page 本体） |

**items/page.tsx の注意点**: `getPageData` は `getUserPublicItemsByHandle`（`'use cache'` 済み）と `getPublicPcBuildByHandle`（Server Action、`'use cache'` 対象外）をまとめている。展開後、`getPublicPcBuildByHandle` は `generateMetadata` と page 本体で2回呼ばれるが、軽量クエリ（`findFirst`）のため許容範囲。

### Step 4: CLAUDE.md キャッシング戦略セクション更新

`Data fetching` セクション（L66-L72）を以下のように更新:

**Before**:
```
Data fetching:
- Static → server components + Server Actions
- Interactive → client components + Server Actions + useSWR
- Mutations → Server Actions + useSWR.mutate (optimistic updates)
- Data access layer: lib/queries/ with `import 'server-only'` + `React.cache()`
- Parallel fetching: `Promise.all()` to avoid waterfalls
- Cross-request caching → `'use cache'` + `cacheLife()` + `cacheTag()`/`updateTag()`
```

**After**:
```
Data fetching:
- Static → server components + Server Actions
- Interactive → client components + Server Actions + useSWR
- Mutations → Server Actions + useSWR.mutate (optimistic updates)
- Data access layer: lib/queries/ with `import 'server-only'`
- Public queries → `'use cache'` + `cacheLife()` + `cacheTag()` (cross-request caching)
- Dashboard/admin queries → `React.cache()` (request-level dedup, cookies dependency)
- Cache invalidation → `updateTag()` in Server Actions (instant expire) + `revalidatePath()` for dashboard
- Parallel fetching: `Promise.all()` to avoid waterfalls
```

**追加**: Caching strategy セクション（RSC principles の後、L83 あたり）:

```
Caching strategy (`'use cache'` vs `React.cache()`):
- Same data used by `generateMetadata()` + page in one request → `'use cache'` handles both (cross-request cache hit)
- Public data (profiles, FAQ, news, items, videos) → `'use cache'` + `cacheLife()` + `cacheTag()`
- Auth-dependent data (dashboard, admin) → `React.cache()` (cookies dependency, cannot use `'use cache'`)
- Both can coexist in the same file, but `React.cache` is isolated inside `'use cache'` scope (separate dedup contexts)
- Invalidation: `updateTag('tag')` for targeted public cache, `revalidatePath()` for dashboard routes
- Cache tags: `{resource}-{normalizeHandle(handle)}` pattern (e.g., `faq-${handle}`, `profile-${handle}`)
```

**削除**: 既存の L83 のキャッシング戦略行は新しいセクションに統合するため削除:
```
- `React.cache()` = request-level deduplication (same render tree), `'use cache'` = cross-request caching (persists across users/requests)
```

### Step 5: Activity-based Navigation 検証

#### 5.1 UserNewsForm の state 保持テスト [HIGH]

**問題**: `UserNewsForm` は react-hook-form + useState（thumbnail, bodyImage）を使用。記事送信後に `router.push('/dashboard/news')` で遷移するが、Activity により古い draft データが保持される可能性。

**テスト手順**:
1. `/dashboard/news/new` で記事を新規作成して送信
2. `/dashboard/news` にリダイレクト → 確認
3. ブラウザの戻るボタンで `/dashboard/news/new` に戻る
4. **期待**: フォームがリセットされている（空の状態）
5. **問題発覚時**: 送信済みの古いデータが残っている

**対策（問題発覚時のみ実装）**:

`useLayoutEffect` cleanup パターンを `UserNewsForm` に追加:

```tsx
const shouldReset = useRef(false)

// onSubmit 成功後に:
shouldReset.current = true

useLayoutEffect(() => {
  return () => {
    if (shouldReset.current) {
      shouldReset.current = false
      form.reset()
      setThumbnail([])
      setBodyImage([])
    }
  }
}, [form])
```

**editData がある場合**: 編集モードでは Activity での state 保持は望ましい動作。リセットは新規作成成功時のみ適用。`editData` がなく `shouldReset` が true の場合のみリセット。

#### 5.2 SWR + Activity re-show テスト [MEDIUM]

**分析結果**: SWR の `revalidateOnFocus` は `visibilitychange` + `focus` イベントをリッスンするが、Activity の `display: none` → `display: ''` 切り替えはこれらのイベントを発火しない。

**影響評価**:

| コンポーネント | `revalidateOnFocus` | Activity re-show 時 | リスク |
|--------------|---------------------|---------------------|--------|
| `FaqManagementSection` | `false` | 再 revalidate なし | **低**（本人のデータ、同時編集なし） |
| `UserNewsListClient` | `false` | 再 revalidate なし | **低** |
| `LinkTypeTable` | `false` | 再 revalidate なし | **低**（管理画面） |
| `YouTubeLatestSection` | `false` | 再 revalidate なし | **低**（RSS、長期キャッシュ） |
| `use-custom-icons.ts` | デフォルト(`true`) | focus イベントなしで revalidate されない | **低** |

**結論**: 全 SWR コンポーネントが `revalidateOnFocus: false` または「revalidate されなくても問題ない」パターン。ダッシュボードのデータは本人が編集するもので、別タブ/デバイスでの同時編集は想定外。**追加対策は不要**。

**テスト手順**:
1. `/dashboard/faqs` でカテゴリを追加
2. `/dashboard/news` に遷移
3. 戻るボタンで `/dashboard/faqs` に戻る
4. **確認**: 追加したカテゴリが表示されている（SWR の fallbackData or キャッシュ）
5. **確認**: ページリロードなしでも最新データが反映されるか（SWR の `revalidateIfStale` デフォルト動作）

#### 5.3 公開ページの Activity テスト [LOW]

1. `/@handle/faqs` → `/@handle/news` → 戻る
2. **確認**: FAQ 表示が即座に復元される（Activity キャッシュ）
3. **確認**: ページ遷移がスムーズ（PPR static shell + Activity）

### Step 6: Nginx ストリーミング検証（本番環境）

#### 6.1 X-Accel-Buffering ヘッダー確認

```bash
curl -sI https://altee.me/ | grep -i x-accel-buffering
# 期待値: X-Accel-Buffering: no
```

#### 6.2 ストリーミングチャンク到着確認

```js
// stream-observer.mjs
const res = await fetch('https://altee.me/@someuser', {
  headers: { 'Accept-Encoding': 'identity' }  // gzip 無効化
})
const reader = res.body.getReader()
const decoder = new TextDecoder()
let i = 0
const start = Date.now()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  console.log(`chunk ${i++} (+${Date.now() - start}ms): ${value.length} bytes`)
}
```

**期待値**: 複数チャンクが異なるタイミングで到着（static shell が先に到着）

#### 6.3 Chrome DevTools 確認

- Network タブの document リクエスト → Timing タブ
- **TTFB が短く、Content Download が長い** = ストリーミング動作中
- **一括到着** = Nginx がバッファリングしている → 対策必要

#### 6.4 gzip とストリーミングの相互作用テスト

```bash
# gzip 有効（デフォルト）
curl -sN -H 'Accept-Encoding: gzip' https://altee.me/@someuser -o /dev/null -w "TTFB: %{time_starttransfer}s, Total: %{time_total}s\n"

# gzip 無効
curl -sN -H 'Accept-Encoding: identity' https://altee.me/@someuser -o /dev/null -w "TTFB: %{time_starttransfer}s, Total: %{time_total}s\n"
```

gzip 有効時に TTFB が大幅に長い場合、Nginx の gzip がチャンクをバッファリングしている。

#### 6.5 問題発覚時の対策

Nginx 設定に以下を追加（必要な場合のみ）:
```nginx
location / {
    proxy_buffering off;  # X-Accel-Buffering が効かない場合の明示設定
    # または gzip がストリーミングを妨げる場合:
    # gzip off;
}
```

### Step 7: 最終ビルド検証

```bash
npx tsc --noEmit && npm run lint && npm run build
```

## スコープ

### ファイル操作テーブル

| 操作 | ファイル | 内容 |
|------|---------|------|
| 変更 | `lib/handle-utils.ts` | `cache` ラッパー + import 削除、`normalizeHandle()` 統一 |
| 変更 | `lib/queries/faq-queries.ts` | `getPublicFaqByHandle` の `cache()` ラッパー外し（import は残す） |
| 変更 | `lib/queries/news-queries.ts` | `cache` import 削除、公開3関数の `cache()` ラッパー外し |
| 変更 | `lib/queries/item-queries.ts` | `getUserPublicItemsByHandle` の `cache()` ラッパー外し（import は残す） |
| 変更 | `lib/queries/video-queries.ts` | `cache` import + ラッパー削除 |
| 変更 | `lib/sections/preset-queries.ts` | `cache` import + ラッパー削除 |
| 変更 | `CLAUDE.md` | Data fetching + Caching strategy セクション更新 |
| 条件付き | `app/[handle]/faqs/page.tsx` | Phase 2 Step 2 未完了時のみ: `getCachedFaq` 削除 |
| 条件付き | `app/[handle]/news/page.tsx` | Phase 2 Step 2 未完了時のみ: `getCachedNews` 削除 |
| 条件付き | `app/[handle]/news/[slug]/page.tsx` | Phase 2 Step 2 未完了時のみ: `getCachedArticle` 削除 |
| 条件付き | `app/[handle]/items/page.tsx` | Phase 2 Step 2 未完了時のみ: `getPageData` 削除 |
| 条件付き | `app/dashboard/news/components/UserNewsForm.tsx` | Activity テスト後、問題発覚時のみ: `useLayoutEffect` cleanup 追加 |
| 検証 | — | Activity-based navigation テスト |
| 検証 | — | SWR + Activity re-show テスト |
| 検証 | — | Nginx ストリーミング本番検証 |
| 検証 | — | `npx tsc --noEmit && npm run lint && npm run build` |

**ファイル数**: 確定変更 7 + 条件付き変更 最大5 = 最大12

### 実装順序

```
Step 1: cache import 整理（6ファイル）
  ↓ ビルド確認
Step 2: normalizeHandle 統一（1ファイル）
  ↓ ビルド確認
Step 3: ページレベルラッパー確認/削除（条件付き 4ファイル）
  ↓ ビルド確認
Step 4: CLAUDE.md 更新（1ファイル）
Step 5: Activity テスト（ブラウザ手動検証）
  ↓ 問題発覚時: UserNewsForm 修正
Step 6: Nginx ストリーミング検証（本番環境）
Step 7: 最終ビルド検証
```

## リスクと軽減策

| リスク | 重要度 | 軽減策 |
|--------|--------|--------|
| `faq-queries.ts`/`item-queries.ts` で `import { cache }` を誤削除 | **HIGH** | dashboard 関数が `React.cache()` を使用中。ファイルごとに全 `cache` 使用箇所を確認してから判断 |
| Phase 2 が未完了の状態で Phase 3 を開始 | **HIGH** | 前提条件チェックリスト（5項目）を実装開始前に全確認 |
| Activity で UserNewsForm に送信済み draft が残る | **MEDIUM** | Step 5 の手動テストで検証。問題時は `useLayoutEffect` cleanup で対策 |
| SWR が Activity re-show で revalidate しない | **MEDIUM** | 全 SWR コンポーネントが `revalidateOnFocus: false` → 実質影響なし。問題時は `hasMountedRef` パターンで対応 |
| Nginx gzip がストリーミングをバッファリング | **MEDIUM** | stream-observer で検証。問題時は `proxy_buffering off` または `gzip off` で対応 |
| `items/page.tsx` で `getPublicPcBuildByHandle` が2回呼ばれる | **LOW** | Server Action（`'use cache'` 対象外）だが軽量クエリ。将来 `lib/queries/` に分離して `'use cache'` 化を検討 |
| `React.cache` 削除でリクエスト内 dedup がなくなる | **LOW** | `'use cache'` のキャッシュヒット（同一引数）で実質 0ms 返却。パフォーマンス影響なし |

## 要確認事項

| 項目 | 状況 | 備考 |
|------|------|------|
| Phase 2 完了状態 | [要確認] | Phase 3 開始前に前提条件チェックを実行 |
| Nginx 本番設定のアクセス可否 | [要確認] | Step 6 の検証には本番環境へのアクセスが必要。デプロイ後に実施 |
| UserNewsForm の Activity 挙動 | [Phase 1 後に判明] | Phase 1 で `cacheComponents: true` 有効化後に Activity が動き始めるため、Phase 1 完了後に先行検証可能 |

## 検証計画

### 各 Step 後のビルド検証

```bash
npx tsc --noEmit && npm run lint && npm run build
```

### Step 5: ブラウザ検証（Activity）

| テストケース | 手順 | 期待動作 |
|-------------|------|---------|
| 新規記事送信後の戻る | `/dashboard/news/new` → 送信 → `/dashboard/news` → 戻る | フォームが空（または古い draft なし） |
| 編集中の記事の保持 | `/dashboard/news/edit/[id]` → 入力変更 → `/dashboard/news` → 戻る | 編集中のデータが保持（望ましい） |
| FAQ ダッシュボードの SWR | `/dashboard/faqs` → カテゴリ追加 → `/dashboard/news` → 戻る | 追加したカテゴリが表示されている |
| 公開ページの Activity | `/@handle/faqs` → `/@handle/news` → 戻る | FAQ が即座に復元 |
| 3ルート超えの eviction | dashboard 内で4ページ以上遷移 → 最初のページに戻る | 最初のページが再レンダリング（Activity eviction） |

### Step 6: 本番環境検証（Nginx ストリーミング）

| テストケース | コマンド/手順 | 期待結果 |
|-------------|-------------|---------|
| X-Accel-Buffering ヘッダー | `curl -sI https://altee.me/` | `X-Accel-Buffering: no` |
| ストリーミングチャンク | stream-observer.mjs | 複数チャンクが段階的に到着 |
| Chrome DevTools Timing | Network → document → Timing | TTFB 短 + Content Download 長 |
| gzip 影響 | curl で TTFB 比較 | gzip 有効時も TTFB が許容範囲内 |

### 全 demo ページ確認

Phase 3 完了後、全 demo ページ（`/demo/*` 19ページ）が正常にアクセスできることを確認。

## 将来改善の候補（スコープ外）

- `getPublicPcBuildByHandle` を `app/actions/` から `lib/queries/` に移動して `'use cache'` 化
- `getUserByHandle` のバリデーションスキーマを `handleSchema` → `queryHandleSchema` に統一
- `getUserByHandle` から FAQ・News データを分離し、より精密なキャッシュ invalidation を実現
- `getUserNavData()` の Suspense 分離による PPR static shell 最大化
