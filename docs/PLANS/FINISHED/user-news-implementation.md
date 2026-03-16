# ユーザーNEWS機能 実装計画

## Context

ユーザーが最大3つの個別ニュース記事を作成・公開できる機能を追加する。プロフィールページに NEWS セクション（カード形式）を表示し、`/@handle/news` で一覧、`/@handle/news/[slug]` で個別記事を閲覧できる。本文は Markdown + カスタム記法（`[youtube=ID]`, `[image]`）に対応する。

### 決定事項
- スラッグ: タイトルから自動生成、ユーザー編集可（admin/articles パターン準拠）
- 下書き機能: あり（published フラグ）。3記事制限は下書き含む合計
- `[image]` タグ: 複数記述 → すべて同じ登録画像を表示
- ナビゲーション: 5タブ化（News 追加）

---

## Phase 1: データベース & 基盤

### 1-1. Prisma スキーマ (`prisma/schema.prisma`)

```prisma
model UserNews {
  id          String     @id @default(cuid())
  userId      String
  title       String     // 最大100文字
  slug        String     // ユーザー単位でユニーク
  content     String     // Markdown本文（最大10000文字）
  thumbnailId String?    // サムネイル画像 → MediaFile
  bodyImageId String?    // 本文内画像（1枚） → MediaFile
  published   Boolean    @default(false)
  sortOrder   Int        @default(0)
  adminHidden Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  thumbnail MediaFile? @relation("UserNewsThumbnail", fields: [thumbnailId], references: [id])
  bodyImage MediaFile? @relation("UserNewsBodyImage", fields: [bodyImageId], references: [id])

  @@unique([userId, slug])
  @@index([userId, sortOrder])
  @@map("user_news")
}
```

- `User` モデルに `userNews UserNews[]` リレーション追加
- `MediaFile` モデルに `userNewsThumbnails UserNews[] @relation("UserNewsThumbnail")` / `userNewsBodyImages UserNews[] @relation("UserNewsBodyImage")` 追加
- `MediaType` enum に `USER_NEWS` 追加

### 1-2. upload-type-map.ts (`lib/image-uploader/upload-type-map.ts`)
- `FOLDER_TO_TYPE` に `'user-news-thumbnails': 'USER_NEWS'`, `'user-news-images': 'USER_NEWS'` 追加
- `TYPE_TO_FOLDER` に `USER_NEWS: 'user-news-thumbnails'` 追加

### 1-3. 型定義 (`types/user-news.ts`) - 新規作成
- `UserNewsWithImages` 型（thumbnail/bodyImage の storageKey 含む）
- `NewsSectionData` 型（セクション用、空オブジェクト）
- `USER_NEWS_LIMITS` 定数（MAX_ARTICLES: 3, TITLE: 100, SLUG: 100, CONTENT: 10000）

### 1-4. ThemeSettings 更新 (`types/profile-sections.ts`)
- `visibility` に `newsPage: boolean` 追加
- `DEFAULT_THEME_SETTINGS.visibility` に `newsPage: true` 追加

---

## Phase 2: Server Actions

### 2-1. ユーザー向け (`app/actions/content/user-news-actions.ts`) - 新規作成

参照パターン: `app/actions/content/article-actions.ts`（Zod検証、トランザクション）

| 関数 | 認証 | 備考 |
|------|------|------|
| `getUserNews()` | auth() | 自分の全記事取得（下書き含む） |
| `getUserNewsById(id)` | auth() + 所有者チェック | 編集画面用 |
| `createUserNews(formData)` | auth() | **3記事制限チェック**、スラッグ自動生成 |
| `updateUserNews(id, formData)` | auth() + 所有者チェック | スラッグ重複チェック（同一ユーザー内） |
| `deleteUserNews(id)` | auth() + 所有者チェック | |
| `reorderUserNews(ids)` | auth() | sortOrder 一括更新 |
| `toggleUserNewsPublished(id)` | auth() + 所有者チェック | |
| `getPublicNewsByHandle(handle)` | 不要 | published: true AND adminHidden: false |
| `getPublicNewsArticle(handle, slug)` | 不要 | 同上 |

スラッグ生成: タイトルからの自動生成 + 同一ユーザー内の重複時は `-2`, `-3` 付与

### 2-2. Admin 向け (`app/actions/admin/user-news-admin-actions.ts`) - 新規作成
- `adminToggleNewsHidden(newsId)` - requireAdmin()
- `adminGetUserNewsList(userId)` - requireAdmin()

---

## Phase 3: ダッシュボード管理ページ

### 3-1. 記事一覧 (`app/dashboard/news/page.tsx`) - 新規

参照パターン: `app/dashboard/faqs/page.tsx`（Server Component + useSWR Client）

```
page.tsx (Server) → UserNewsListClient (Client, useSWR)
  ├── 新規作成ボタン（3記事以上で disabled）
  ├── ドラッグ&ドロップリスト（SortableItem 使用）
  │   └── カード: サムネイル + タイトル + 公開バッジ + 編集/削除
  └── reorderUserNews で並べ替え保存
```

### 3-2. 作成・編集 (`app/dashboard/news/new/page.tsx`, `[id]/page.tsx`) - 新規

参照パターン: `app/admin/articles/components/ArticleForm.tsx`（react-hook-form + zodResolver）

```
page.tsx (Server) → UserNewsForm (Client, FormProvider)
  ├── 公開/下書き Switch
  ├── タイトル + スラッグ入力（自動生成 + 手動編集可）
  ├── サムネイル ImageUploader (folder="user-news-thumbnails", maxFiles=1)
  ├── 本文画像 ImageUploader (folder="user-news-images", maxFiles=1)
  └── UserNewsContentEditor
       ├── Tabs (編集 / プレビュー)
       ├── MarkdownToolbar + [image] 挿入ボタン
       ├── Textarea (font-mono)
       └── UserNewsMarkdownPreview (プレビュー)
```

**ツールバーの `[image]` ボタン**: 既存 `MarkdownToolbar` の `onImageInsert` ではなく `onInsert('[image]', 'insert')` で直接タグ挿入。MarkdownToolbar の `onImageInsert` prop を使わず、フォーム側で独自ボタンを追加する。

### 新規ファイル一覧
```
app/dashboard/news/
├── page.tsx
├── new/page.tsx
├── [id]/page.tsx
└── components/
    ├── UserNewsForm.tsx
    ├── UserNewsListClient.tsx
    └── types.ts
```

---

## Phase 4: 公開ページ

### 4-1. NEWS 一覧 (`app/[handle]/news/page.tsx`) - 新規

参照パターン: `app/[handle]/faqs/page.tsx`（cache() + generateMetadata）

- `getPublicNewsByHandle(handle)` で published + !adminHidden の記事取得
- 縦に3つカードを並べるシンプルな構造
- 各カード: サムネイル + タイトル → `/@handle/news/[slug]` へリンク

### 4-2. 個別記事 (`app/[handle]/news/[slug]/page.tsx`) - 新規

- `getPublicNewsArticle(handle, slug)` でデータ取得
- `!published || adminHidden` → `notFound()`
- サムネイル画像をトップに表示
- `UserNewsMarkdownPreview` で本文レンダリング
- `generateMetadata` で OGP（タイトル + サムネイル）

### 4-3. カスタム Markdown レンダラー (`components/editor/user-news-markdown-preview.tsx`) - 新規

既存 `components/editor/markdown-preview.tsx` をベースに拡張。

**方針: コンテンツ前処理 + react-markdown の components prop**

1. `[youtube=VIDEO_ID_OR_URL]` → YouTube ID を抽出、`<youtube-embed>` カスタムタグに変換
2. `[image]` → bodyImageUrl があれば `![](url)` に変換、なければ空文字
3. `react-markdown` の `components` で `youtube-embed` タグをインターセプト
4. YouTube 遅延読み込み: `@next/third-parties/google` の `YouTubeEmbed` 使用（`YoutubeSection.tsx` と同パターン）

YouTube ID 抽出: URL形式（youtube.com/watch, youtu.be, youtube.com/shorts）と直接 ID（11文字）の両方に対応

### 新規ファイル一覧
```
app/[handle]/news/
├── page.tsx
├── [slug]/page.tsx
└── components/
    ├── NewsListContent.tsx
    └── NewsArticleContent.tsx
components/editor/user-news-markdown-preview.tsx
```

---

## Phase 5: NEWS セクション（プロフィール埋め込み）

### 5-1. セクション登録 (`lib/sections/registry.ts`)

```typescript
news: {
  type: 'news', label: 'NEWS', icon: 'Newspaper',
  description: 'ニュース記事カード', category: 'content',
  priority: 'medium', maxInstances: 1,
  component: lazy(() => import(...NewsSection)),
  defaultData: {},
}
```

### 5-2. NewsSection コンポーネント (`components/user-profile/sections/NewsSection.tsx`) - 新規

**データ取得**: セクションの `data` JSON にニュースデータは保存しない（二重管理を避ける）。
`getUserByHandle` のクエリに `userNews` を include し、レイアウト経由で渡す。

**レスポンシブレイアウト**:
- PC (≥993px): `grid grid-cols-3` — 画像上・タイトル下のカード型（YouTube風）
- モバイル: `flex flex-col` — 画像左・タイトル右のカード型
- 2記事: `grid-cols-2`, 1記事: 中央配置

### 5-3. データの受け渡し

`lib/handle-utils.ts` の `getUserByHandle` に `userNews` include を追加:
```typescript
userNews: {
  where: { published: true, adminHidden: false },
  orderBy: { sortOrder: 'asc' },
  include: { thumbnail: { select: { storageKey: true } } },
  take: 3,
}
```

`BaseSectionProps` は変更せず、セクションレンダラー（`EditableSectionRenderer` 等）経由で `userNews` データを別 prop として渡す。

---

## Phase 6: ナビゲーション更新

### 6-1. ProfileHeader (`components/user-profile/ProfileHeader.tsx`)

- `navItems` に News タブ追加（icon: `Newspaper`）
  - 公開ページ: `/@${handle}/news`
  - ダッシュボード: `/dashboard/news`
- `visibility.newsPage === false` の場合、公開ページ側のみ News を除外（ダッシュボードは常に表示）

### 6-2. MobileBottomNav (`components/user-profile/MobileBottomNav.tsx`)

- Props に `visibility?: ThemeSettings['visibility']` 追加
- News タブ追加（5タブ化）
- `min-w-[60px]` → `min-w-[50px]` に調整（5タブ対応）
- visibility 制御（ProfileHeader と同じロジック）

### 6-3. layout.tsx からの visibility 受け渡し

- `app/[handle]/layout.tsx`: `getUserByHandle` で取得した themeSettings.visibility を MobileBottomNav に渡す
- `app/dashboard/layout.tsx`: ダッシュボード側も同様に対応

### 6-4. Visibility 設定 UI

`app/dashboard/profile-editor/EditableProfileClient.tsx` 内の Visibility 設定セクションに `newsPage` トグル追加。

---

## Phase 7: Admin 機能

### 7-1. ユーザー詳細ページ (`app/admin/users/[id]/page.tsx`)

既存のユーザー詳細ページに「ニュース記事」カードを追加:
- `adminGetUserNewsList(userId)` で記事一覧取得
- 各記事: タイトル + 公開状態 + 強制非表示トグルボタン
- `adminToggleNewsHidden(newsId)` で adminHidden 切り替え

---

## 修正対象ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `prisma/schema.prisma` | UserNews モデル追加、User/MediaFile リレーション、MediaType enum |
| `lib/image-uploader/upload-type-map.ts` | 新フォルダマッピング追加 |
| `types/profile-sections.ts` | visibility.newsPage 追加、DEFAULT_THEME_SETTINGS 更新 |
| `lib/handle-utils.ts` | getUserByHandle に userNews include 追加 |
| `lib/sections/registry.ts` | news セクション定義追加 |
| `components/user-profile/ProfileHeader.tsx` | News タブ追加 + visibility 制御 |
| `components/user-profile/MobileBottomNav.tsx` | 5タブ化 + visibility props 追加 |
| `app/[handle]/layout.tsx` | MobileBottomNav に visibility 渡す |
| `app/admin/users/[id]/page.tsx` | ニュース記事管理カード追加 |
| `app/dashboard/profile-editor/EditableProfileClient.tsx` | newsPage visibility トグル追加 |

## 新規ファイル一覧

| ファイル | 内容 |
|---------|------|
| `types/user-news.ts` | UserNews 型定義 + 定数 |
| `app/actions/content/user-news-actions.ts` | ユーザー向け CRUD Server Actions |
| `app/actions/admin/user-news-admin-actions.ts` | Admin 向け Server Actions |
| `app/dashboard/news/page.tsx` | 記事一覧（ダッシュボード） |
| `app/dashboard/news/new/page.tsx` | 新規作成 |
| `app/dashboard/news/[id]/page.tsx` | 編集 |
| `app/dashboard/news/components/UserNewsForm.tsx` | フォーム |
| `app/dashboard/news/components/UserNewsListClient.tsx` | 一覧 Client |
| `app/dashboard/news/components/types.ts` | ダッシュボード用型定義 |
| `app/[handle]/news/page.tsx` | NEWS 一覧（公開） |
| `app/[handle]/news/[slug]/page.tsx` | 個別記事（公開） |
| `app/[handle]/news/components/NewsListContent.tsx` | 一覧コンテンツ |
| `app/[handle]/news/components/NewsArticleContent.tsx` | 記事コンテンツ |
| `components/editor/user-news-markdown-preview.tsx` | カスタム Markdown レンダラー |
| `components/user-profile/sections/NewsSection.tsx` | NEWS セクション |

---

## 検証方法

1. **DB マイグレーション**: `npm run db:migrate` が成功すること
2. **型チェック**: `npx tsc --noEmit` エラーゼロ
3. **ダッシュボード**: `/dashboard/news` で記事作成・編集・削除・並べ替えが動作
4. **3記事制限**: 4つ目の作成が拒否されること
5. **公開ページ**: `/@handle/news` で一覧表示、`/@handle/news/[slug]` で個別表示
6. **カスタム Markdown**: `[youtube=ID]`, `[image]` が正しくレンダリングされること
7. **NEWS セクション**: プロフィールページで PC/モバイル両方のレイアウト確認
8. **Visibility**: newsPage=false 時にナビゲーションから News が消えること
9. **Admin**: 強制非表示トグルが動作し、公開ページに反映されること
