# app/admin リファクタリング計画 2026

## 背景・目的

`app/admin` ディレクトリを Next.js 16 App Router のベストプラクティス（react-best-practices / next-best-practices スキル準拠）に完全準拠させる。現状は基本的な設計は良好だが、ファイル規約違反・RSC 境界での型安全性問題・パフォーマンス上の問題が複数存在する。本計画では **現状の問題を優先度付きで整理し、段階的に修正する** 方針を示す。

---

## 現状サマリー：何ができていて何ができていないか

### ✅ 継続すべき良いパターン

| 項目 | 評価 |
|------|------|
| Server/Client Component の分離 | `UserList(Server)→UserListClient(Client)` パターンを一貫採用 |
| 認証・認可 3層アーキテクチャ | Middleware → Layout → Page/Actions を実装 |
| 並列データフェッチ | `Promise.all()` で Admin 統計クエリを最適化 |
| Suspense + Skeleton | `users/page.tsx` では適切に Suspense を活用 |
| Server Actions | Zod バリデーション + `revalidatePath` + `prisma.$transaction` を適切に使用 |
| メタデータ | `robots: { index: false, follow: false }` でクローラー除外 |
| Dynamic import | `UserFilters`・`BulkActionsBar` を動的読み込み |

---

## Phase 1: 🔴 Critical — ファイル規約違反

### 1-A: `Date` オブジェクトを Server→Client 境界で渡している（型安全性問題）

**根拠スキル:** `next-best-practices/rsc-boundaries.md` — Props の型が実態と乖離しない設計

> **注:** React 19 + Next.js では Date は RSC 境界でシリアライズされるため runtime error は発生しない。
> しかし TypeScript の型が `Date` のまま残ることで、Client Component 内でメソッド呼び出し（`.getTime()` 等）を試みるとクラッシュする潜在的リスクがある。**型安全性の問題として High 優先度で修正する。**

**対象ファイル:**
- [app/admin/users/page.tsx](app/admin/users/page.tsx) → [app/admin/users/components/CsvExportButton.tsx](app/admin/users/components/CsvExportButton.tsx)
- [app/admin/users/components/UserList.tsx](app/admin/users/components/UserList.tsx) → [app/admin/users/components/UserListClient.tsx](app/admin/users/components/UserListClient.tsx)

**問題のコード:**
```tsx
// ❌ app/admin/users/page.tsx L33-34
const createdFrom = typeof params.createdFrom === "string"
  ? new Date(params.createdFrom)  // Date オブジェクトを作成
  : undefined

<CsvExportButton
  createdFrom={createdFrom}  // ← Date を Client Component へ渡す → シリアライズ後は string
  createdTo={createdTo}
/>
```

```tsx
// ❌ UserListClient.tsx L46-47 — 受け取り側も Date 型で宣言（実態は string）
interface UserListClientProps {
  users: User[]      // User.createdAt が Date 型（実態は string）
  createdFrom?: Date
  createdTo?: Date
}
```

**修正方針:**
- `createdFrom`/`createdTo` の型を `Date` → `string`（ISO 形式）に変更
- Server Component 側で `.toISOString()` 変換してから渡す
- Client Component 内で必要に応じて `new Date(isoString)` に変換
- `User.createdAt` も同様に ISO string で渡す

---

### 1-B: `error.tsx` が全セグメントで欠落

**根拠スキル:** `next-best-practices/file-conventions.md`、`next-best-practices/error-handling.md`

**問題:** `app/admin` 直下・全サブルートに `error.tsx` が一切存在しない。Server Component でのランタイムエラーが上位のグローバルエラーバウンダリまで伝播し、管理画面全体がクラッシュするリスクがある。

**追加問題（error-handling.md より）:** `articles/page.tsx` の try-catch 内で `redirect()` / `notFound()` が呼ばれる可能性がある場合、Next.js の内部エラーを握りつぶしてしまう。`unstable_rethrow` の使用または try-catch の外で呼ぶ必要がある。

**現状の不完全な回避策:**
```tsx
// ❌ app/admin/articles/page.tsx L24-76
try {
  const { articles, pagination } = await getArticles(currentPage, 10)
  return <div>...</div>
} catch (error) {
  console.error('Articles page error:', error)
  return <div>エラーが発生しました</div>  // reset() なし・UX 貧弱
}
```

**追加すべきファイル一覧:**
```
app/admin/error.tsx                     # 新規追加
app/admin/users/error.tsx               # 新規追加
app/admin/users/[id]/error.tsx          # 新規追加
app/admin/articles/error.tsx            # 新規追加（+ page.tsx の try-catch 除去）
app/admin/items/error.tsx               # 新規追加
app/admin/item-categories/error.tsx     # 新規追加
app/admin/media/error.tsx               # 新規追加
app/admin/links/error.tsx               # 新規追加
app/admin/attributes/error.tsx          # 新規追加
app/admin/blacklist/error.tsx           # 新規追加
```

**実装テンプレート（Client Component 必須）:**
```tsx
'use client'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto p-6 text-center space-y-4">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>再試行</Button>
    </div>
  )
}
```

---

### 1-C: `not-found.tsx` の欠落

**対象:** `users/[id]/page.tsx` で `notFound()` を呼んでいるが、管理画面用カスタム 404 ページがない。

**追加対象:** `app/admin/not-found.tsx`（shadcn/ui で整形された管理画面スタイルの 404 UI）

---

## Phase 2: 🟠 High Priority — パフォーマンス・設計改善

### 2-A: `layout.tsx` のシーケンシャルフェッチ

**根拠スキル:** `react-best-practices/async-parallel` — 独立した操作は `Promise.all()` で並列実行

**対象:** [app/admin/layout.tsx](app/admin/layout.tsx)

**問題:**
```tsx
// ❌ 現状: getAdminStats と getUserNavData がシーケンシャル
const stats = await getAdminStats()                       // 待機...
const adminSidebarContent = getSidebarContent("admin", stats)  // 同期
const user = await getUserNavData()                       // さらに待機...
```

**修正方針:**
```tsx
// ✅ 改善: 並列実行（getUserNavData は stats に依存しない）
const [stats, user] = await Promise.all([
  getAdminStats(),
  getUserNavData(),
])
const adminSidebarContent = getSidebarContent("admin", stats)
```

---

### 2-B: `articles/page.tsx` に Suspense がない（`users` と設計が不統一）

**根拠スキル:** `react-best-practices/async-suspense-boundaries`

**対象:** [app/admin/articles/page.tsx](app/admin/articles/page.tsx)

**問題:** `users/page.tsx` は Suspense + Skeleton でストリーミング表示するが、`articles/page.tsx` はブロッキングフェッチのみ。管理画面全体でパターンが不統一。

**修正方針:** `ArticleListServer`（Server Component・データ取得）と `ArticleList`（Client Component・UI/操作）に分割し、`users` と同じ構成に統一。

```
articles/
├── page.tsx                # Server Component: Suspense で ArticleListServer を囲む
└── components/
    ├── ArticleListServer.tsx  # 新規: Server Component（getArticles を呼ぶ）
    └── ArticleList.tsx        # 修正: Client Component（現在の ArticleList のUI部分）
```

---

### 2-C: `articles/page.tsx` の重複権限チェック

**対象:** [app/admin/articles/page.tsx](app/admin/articles/page.tsx) L13-18

```tsx
// ❌ Layout で既に admin チェック済みなのに Page でも実施
const session = await auth()
if (session?.user?.role !== 'ADMIN') {
  redirect('/unauthorized')
}
```

**修正方針:** Page コンポーネントからの重複チェックを削除。Server Actions 内の `requireAdmin()` は **直接呼び出し防衛**として維持。

---

### 2-D: `useTransition` 未使用（手動 `useState` でローディング管理）

**根拠スキル:** `react-best-practices/rendering-usetransition-loading`

**対象ファイル:**
- [app/admin/articles/components/ArticleList.tsx](app/admin/articles/components/ArticleList.tsx) — `isDeleting`・`isToggling` state
- [app/admin/users/[id]/components/UserActions.tsx](app/admin/users/[id]/components/UserActions.tsx)

**修正方針（UserActions.tsx — 単一のローディング管理）:**
```tsx
// ❌ 現状: 単一の isLoading で全ボタンを管理
const [isLoading, setIsLoading] = useState(false)
const handleRoleChange = async () => {
  setIsLoading(true)
  try { await changeRole(...) } finally { setIsLoading(false) }
}

// ✅ 改善: useTransition で非同期遷移を管理
const [isPending, startTransition] = useTransition()
const handleRoleChange = () => {
  startTransition(async () => {
    await changeRole(...)
    toast.success('権限を変更しました')
  })
}
// disabled={isPending} で使用
```

**修正方針（ArticleList.tsx — 個別行の `isToggling` パターン）:**

> **注意:** `isToggling` は個別記事 ID で制御しているため、単純な useTransition への置き換えでは
> リスト内の特定行のみ pending 表示する UX を再現できない。
> `useTransition` と `useState` を**併用**する方針とする。

```tsx
// ❌ 現状: 手動 try-finally
const [isToggling, setIsToggling] = useState<string | null>(null)
const handleToggle = async (id: string) => {
  setIsToggling(id)
  try { await togglePublish(id) } finally { setIsToggling(null) }
}

// ✅ 改善: useTransition（全体ガード）+ useState（個別行表示）の併用
const [isPending, startTransition] = useTransition()
const [togglingId, setTogglingId] = useState<string | null>(null)
const handleToggle = (id: string) => {
  setTogglingId(id)
  startTransition(async () => {
    await togglePublish(id)
    setTogglingId(null)
    toast.success('公開状態を変更しました')
  })
}
// 個別: disabled={togglingId === article.id}、全体: disabled={isPending}
```

---

## Phase 3: 🟡 Medium Priority — コード品質

### 3-A: `useMemo` / `useCallback` の最適化（React Compiler 導入後）

**根拠スキル:** `react-best-practices/rerender-memo`

> **前提:** このプロジェクトは現在 React Compiler（`babel-plugin-react-compiler`）を使用していない。
> React Compiler なしに手動メモ化を削除するとパフォーマンスが悪化する恐れがあるため、
> **STEP 1 で React Compiler を導入してから STEP 2 で削除する** 2段階の方針とする。

**対象:** [app/admin/users/components/UserListClient.tsx](app/admin/users/components/UserListClient.tsx)

```tsx
// ⚠️ users 依存の useCallback は users が変わるたびに再生成（最適化の効果が薄い）
const handleSelectAll = useCallback((checked: boolean) => {
  setSelectedUsers(checked ? new Set(users.map(u => u.id)) : new Set())
}, [users])  // users 依存なら毎回再生成される
```

**修正方針（2ステップ）:**

**STEP 1 — React Compiler 導入（next.config.ts）:**
```ts
// next.config.ts
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
  // ...既存の設定
}
```

**STEP 2 — 手動メモ化を削除（React Compiler が自動最適化）:**
```tsx
// ✅ React Compiler 導入後: useCallback / useMemo を削除してシンプルに
const handleSelectAll = (checked: boolean) => {
  setSelectedUsers(checked ? new Set(users.map(u => u.id)) : new Set())
}
```

あるいは STEP 1 前に部分最適化する場合は `setSelectedUsers` の functional update で `users` 依存を排除:
```tsx
const handleSelectAll = useCallback((checked: boolean) => {
  setSelectedUsers(prev =>
    checked ? new Set(users.map(u => u.id)) : new Set()
  )
}, [users])  // ← users を避けられないため、React Compiler 導入後に削除が望ましい
```

### 3-B: `&&` 演算子による潜在的なゼロレンダリング

**根拠スキル:** `react-best-practices/rendering-conditional-render`

**確認・修正対象:** コードベース中の `{count && <Component />}` パターン → `{count > 0 ? <Component /> : null}` に統一。

### 3-C: `revalidateTag` の未導入

**現状:** 全 Server Actions が `revalidatePath('/admin/...')` のみ。
**改善案:** `revalidateTag('articles')` 等でより細粒度のキャッシュ無効化（現状致命的ではないが、将来的なスケールに向けて）。

---

## Phase 4: 🔵 Future — 将来対応

### 4-A: 監査ログの永続化

**現状:** ユーザー操作（ハンドル変更・削除）が `console.log` のみ（揮発性）。
**改善案:** `AuditLog` テーブルを Prisma スキーマに追加し、管理操作を DB に永続記録。

### 4-B: CSV エクスポートの 5000件上限

**現状:** `getUsersForCsvExport` で5000件超は切り捨て。
**改善案:** カーソルページング or `Response` の `ReadableStream` によるストリーミング出力。

---

## 実装優先順位マトリクス

| Phase | 問題 | 優先度 | 難易度 | 変更ファイル数 |
|-------|------|--------|--------|----------------|
| 1-A | Date RSC 境界 型安全性問題 | 🟠 High | 低 | 3 |
| 1-B | `error.tsx` 追加（全セグメント） | 🔴 Critical | 低 | 10 |
| 1-C | `not-found.tsx` 追加 | 🔴 Critical | 低 | 1 |
| 2-A | layout.tsx 並列フェッチ | 🟠 High | 低 | 1 |
| 2-B | articles Suspense 化 + コンポーネント分割 | 🟠 High | 中 | 3 |
| 2-C | 重複権限チェック除去 | 🟠 High | 低 | 1 |
| 2-D | useTransition 導入 | 🟠 High | 低 | 2 |
| 3-A | React Compiler 導入 + useMemo/useCallback 整理 | 🟡 Medium | 中 | 2（config + 実装） |
| 3-B | 条件レンダリング修正 | 🟡 Medium | 低 | 数か所 |
| 3-C | revalidateTag 導入 | 🟡 Medium | 低 | 全 actions |
| 4-A | 監査ログ永続化 | 🔵 Future | 高 | DB スキーマ変更 |
| 4-B | CSV ストリーミング | 🔵 Future | 高 | 1 |

---

## ディレクトリ構造（改善後のあるべき姿）

```
app/admin/
├── layout.tsx               # 修正: Promise.all で並列フェッチ
├── loading.tsx              # ✅ 既存（修正不要）
├── error.tsx                # ← 新規追加
├── not-found.tsx            # ← 新規追加
├── page.tsx                 # そのまま
│
├── users/
│   ├── page.tsx             # 修正: Date → string 変換
│   ├── error.tsx            # ← 新規追加
│   ├── [id]/
│   │   ├── page.tsx         # そのまま
│   │   └── error.tsx        # ← 新規追加
│   └── components/
│       ├── UserList.tsx        # 修正: Date → ISO string 変換
│       ├── UserListClient.tsx  # 修正: Date 型→string 型、useMemo 整理
│       └── CsvExportButton.tsx # 修正: props 型 Date → string
│
├── articles/
│   ├── page.tsx             # 修正: try-catch除去・権限チェック除去・Suspense追加
│   ├── error.tsx            # ← 新規追加
│   └── components/
│       ├── ArticleListServer.tsx  # ← 新規: Server Component（データ取得）
│       └── ArticleList.tsx        # 修正: useTransition 導入
│
├── items/ item-categories/ media/ links/ attributes/ blacklist/
│   └── error.tsx            # ← 各セグメントに新規追加（計6ファイル）
```

---

## 重要ファイルパス（修正対象まとめ）

| ファイル | 修正内容 |
|---------|---------|
| [app/admin/layout.tsx](app/admin/layout.tsx) | Promise.all で getAdminStats/getUserNavData を並列化 |
| [app/admin/articles/page.tsx](app/admin/articles/page.tsx) | try-catch 除去・権限チェック除去・Suspense 追加 |
| [app/admin/users/page.tsx](app/admin/users/page.tsx) | Date → ISO string 変換（CsvExportButton 渡し） |
| [app/admin/users/components/CsvExportButton.tsx](app/admin/users/components/CsvExportButton.tsx) | props 型 `Date` → `string` |
| [app/admin/users/components/UserList.tsx](app/admin/users/components/UserList.tsx) | `createdAt` を ISO string に変換してから Client へ渡す |
| [app/admin/users/components/UserListClient.tsx](app/admin/users/components/UserListClient.tsx) | Date 型 → string 型・useMemo/useCallback 整理 |
| [app/admin/articles/components/ArticleList.tsx](app/admin/articles/components/ArticleList.tsx) | useTransition 導入 |
| `app/admin/**/error.tsx` × 10 | 新規作成（Client Component） |
| `app/admin/not-found.tsx` | 新規作成 |
| `app/admin/articles/components/ArticleListServer.tsx` | 新規作成（Server Component） |

---

## 参照スキル

- `react-best-practices`: async-parallel, async-suspense-boundaries, rendering-usetransition-loading, rerender-memo, rendering-conditional-render
- `next-best-practices/rsc-boundaries.md`: 非シリアライズ可能 props の検出
- `next-best-practices/error-handling.md`: error.tsx, not-found.tsx, unstable_rethrow
- `next-best-practices/file-conventions.md`: 必須ファイル規約
- `next-best-practices/data-patterns.md`: Server Component / Server Actions / Route Handler の使い分け

---

## 検証方法

```bash
# 型・Lint チェック（ゼロエラー必須）
npm run lint && npx tsc --noEmit
```

**動作確認チェックリスト:**
- [ ] `app/admin/users` で DB エラーを意図的に発生させ、`error.tsx` が表示される（reset ボタンで再試行可能）
- [ ] `app/admin/users/[id]/999` など存在しない ID で `not-found.tsx` が表示される
- [ ] `app/admin/articles` で Suspense による段階的表示が確認できる
- [ ] CSV エクスポートで日付フィルターが正常動作する（Date→string 修正後）
- [ ] 記事削除・公開切替で `useTransition` による pending 状態が正しく表示される
- [ ] `app/admin` へ非ログイン状態でアクセスすると `/auth/signin` へリダイレクト
