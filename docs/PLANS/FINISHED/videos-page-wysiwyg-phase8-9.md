# Phase 8-9: ナビゲーション更新 + 公開 Videos ページ移行 - 詳細実装計画

---

## Phase 8: ナビゲーション更新

### 8.1 サイドバーナビ変更

**ファイル:** `lib/layout-config.ts` (L228-231)

```diff
- { title: "プラットフォーム", url: "/dashboard/platforms", icon: Tv },
+ { title: "動画管理", url: "/dashboard/videos", icon: Video },
```

`Video` を `lucide-react` からインポート追加。

### 8.2 PCヘッダーナビ変更

**ファイル:** `components/user-profile/ProfileHeader.tsx`

ダッシュボード内の Videos リンクを `/dashboard/videos` に変更（存在する場合）。

### 8.3 リダイレクト設定

**ファイル:** `next.config.ts`

旧パスからのリダイレクト設定追加:

```typescript
async redirects() {
  return [
    {
      source: '/dashboard/platforms',
      destination: '/dashboard/videos',
      permanent: false,  // 移行期間中は temporary
    },
  ]
}
```

---

## Phase 9: 公開 Videos ページ移行

### 9.1 公開ページをセクションベースに書き換え

**ファイル:** `app/[handle]/videos/page.tsx`

### 現在の実装（174行）

- `User.youtubeChannelId` + `youtubeRssFeedLimit` から RSS Feed 直接取得
- `YouTubeRecommendedVideo` テーブルから直接取得
- 独自レイアウトで YouTube RSS + おすすめ動画を表示

### 変更後（~80行）

```typescript
export default async function VideosPage({ params }: Props) {
  const { handle } = await params
  const user = await getUserByHandleForVideos(handle)

  if (!user) return <NotFoundMessage />

  const videoSections = user.userSections  // page: 'videos' でフィルタ済み

  if (videoSections.length === 0) {
    return <FallbackDisplay />  // フォールバック表示
  }

  return (
    <SectionRenderer
      sections={videoSections}
      themePreset={user.profile.themePreset}
      themeSettings={user.profile.themeSettings}
    />
  )
}
```

### データ取得の変更

```typescript
// 新しいクエリ関数（handle-utils.ts に追加 or ページ内で直接）
const user = await prisma.user.findFirst({
  where: { handle, isActive: true },
  include: {
    profile: true,
    characterInfo: { select: { characterName: true, iconImageKey: true } },
    userSections: {
      where: { page: 'videos', isVisible: true },
      orderBy: { sortOrder: 'asc' },
    },
  },
})
```

### フォールバック表示

セクション0件の場合のフォールバック:

```typescript
function FallbackDisplay() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Video className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg">動画コンテンツはまだありません</p>
    </div>
  )
}
```

### 9.2 既存プロフィール公開ページの page フィルタ

**ファイル:** `lib/handle-utils.ts` の `getUserByHandle`

Phase 3.2 で対応済み（`where: { isVisible: true, page: 'profile' }` フィルタ追加）。

追加で、`app/[handle]/page.tsx` 等が `getUserByHandle` を使っていることを確認し、videos セクションが profile ページに混入しないことを検証。

---

## 検証方法

### Phase 8

| テスト項目 | 期待結果 |
|-----------|---------|
| サイドバーの「動画管理」リンク | `/dashboard/videos` に遷移 |
| `/dashboard/platforms` にアクセス | `/dashboard/videos` にリダイレクト |

### Phase 9

| テスト項目 | 期待結果 |
|-----------|---------|
| `/@{handle}/videos` アクセス | セクションベースで表示 |
| セクション0件のユーザー | フォールバック表示 |
| セクションあり + isVisible=false のセクション | 非表示セクションは表示されない |
| `/@{handle}` プロフィールページ | profile セクションのみ表示、videos セクション混入なし |
| 旧データ（UserSection移行前）のユーザー | フォールバック表示（セクション0件） |

---

## 変更ファイル一覧

| ファイル | 操作 | Phase |
|---------|------|-------|
| `lib/layout-config.ts` | 修正（ナビリンク変更） | 8 |
| `components/user-profile/ProfileHeader.tsx` | 修正（リンク変更） | 8 |
| `next.config.ts` | 修正（リダイレクト追加） | 8 |
| `app/[handle]/videos/page.tsx` | 全面書き換え | 9 |

---

## リスク

| リスク | 影響 | 軽減策 |
|--------|------|--------|
| 旧 platforms ページへのブックマーク | 低 | リダイレクト設定で対応 |
| データマイグレーション前のユーザー | 中 | フォールバック表示。Phase 10 のマイグレーション完了まで旧データは残る |
| 公開ページのSEO影響 | 低 | URLパスは `/@{handle}/videos` で変更なし |
