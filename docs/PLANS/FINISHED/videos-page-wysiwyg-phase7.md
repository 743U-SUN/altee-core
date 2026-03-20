# Phase 7: Dashboard Videos ページ - 詳細実装計画

## 概要

ダッシュボードの動画管理ページを新規作成する。`profile-editor` をベースに簡素化し、既存の `EditableSectionRenderer` を再利用する。

---

## profile-editor との差分ポイント

| 観点 | profile-editor | videos (Phase 7) |
|------|---------------|-------------------|
| Server Component | ユーザー情報+テーマ+キャラクター画像+全セクション取得 | セクションは `page: 'videos'` でフィルタ |
| Client Component | `EditableProfileClient` — 画像編集モーダル多数 | `EditableVideosClient` — 画像編集不要、シンプル |
| AddSectionModal | 2ステップUI（カテゴリ→タイプ） | 1ステップUI（直接一覧、4セクションのみ） |
| 画像編集 | バナー/キャラクター/プロフィール画像 | 不要 |

---

## 7.1 Videos ページ (Server Component)

**新規:** `app/dashboard/videos/page.tsx`

```typescript
export default async function DashboardVideosPage() {
  const session = await cachedAuth()
  if (!session?.user?.id) redirect('/auth/signin')

  const [user, presets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        characterInfo: { select: { characterName: true, iconImageKey: true } },
        userSections: {
          where: { page: 'videos' },  // ← videos のみ
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    getActivePresets(),
  ])

  if (!user || !user.profile) redirect('/dashboard/setup')

  return (
    <EditableVideosClient
      sections={user.userSections as UserSection[]}
      presets={presets}
      userId={user.id}
      // + テーマ関連 props
    />
  )
}
```

**profile-editor との差分:**
- `characterImage` include 不要
- `userSections` に `where: { page: 'videos' }` フィルタ追加
- Metadata: `title: '動画管理'`

---

## 7.2 EditableVideosClient

**新規:** `app/dashboard/videos/EditableVideosClient.tsx`

```typescript
'use client'

export function EditableVideosClient({ sections, presets, userId, ...themeProps }) {
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)

  return (
    <>
      <UserProfileLayout isEditable={false} inDashboard={true} {...themeProps}>
        <EditableSectionRenderer sections={sections} presets={presets} />
        <div className="flex justify-center py-4">
          <Button onClick={() => setIsAddSectionModalOpen(true)}>
            <Plus /> セクションを追加
          </Button>
        </div>
      </UserProfileLayout>

      <AddVideoSectionModal
        open={isAddSectionModalOpen}
        onOpenChange={setIsAddSectionModalOpen}
        userId={userId}
        existingSections={sections}
      />
    </>
  )
}
```

**profile-editor (`EditableProfileClient`) からの削除:**
- 画像編集関連 state (`imageEditType`) を全て削除
- 通知編集関連 state を全て削除
- `BannerImageModal`, `CharacterImageModal`, `HeaderEditModal` 等のインポートと描画を全て削除
- `isEditable={false}` でヘッダー画像編集ボタン非表示

---

## 7.3 AddVideoSectionModal

**新規:** `app/dashboard/videos/components/AddVideoSectionModal.tsx`

### UI設計

```
┌──────────────────────────────┐
│ セクションを追加                │
├──────────────────────────────┤
│ ┌──────────┐ ┌──────────┐   │
│ │ Film     │ │ Rss      │   │
│ │ 動画ページ │ │ YouTube  │   │
│ │ プロフィール │ │ 最新動画   │   │
│ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐   │
│ │ ThumbsUp │ │ Tv2      │   │
│ │ YouTube  │ │ ニコニコ   │   │
│ │ おすすめ   │ │ おすすめ   │   │
│ └──────────┘ └──────────┘   │
└──────────────────────────────┘
```

カテゴリ選択ステップ不要（4セクションのみなので直接一覧表示）。

### 機能

- `getVideoPageSections()` で videos 用セクション定義を取得
- `existingSections` から各タイプの個数をカウント
- `maxInstances` に達しているものは「追加済み」バッジ付きで非活性
- `createSection(userId, sectionType, defaultData, 'videos')` で作成（page='videos'指定）
- 作成成功 → モーダル閉じ → `router.refresh()`

---

## セクション追加→表示の完全フロー

```
1. 「セクションを追加」ボタン → AddVideoSectionModal 開く
2. セクション一覧からカードクリック
3. createSection(userId, type, defaultData, 'videos') Server Action
4. Server Action: 認証 → ホワイトリスト検証 → sortOrder算出(videos内) → create
5. 成功 → モーダル閉じ → router.refresh()
6. Server Component 再実行 → videos セクション再取得
7. EditableSectionRenderer → 各セクションの表示・編集ツールバー描画
```

---

## 実装順序

実装は 7.3 → 7.2 → 7.1 の順序（ボトムアップ）が効率的。

1. **7.3** `AddVideoSectionModal` — セクション追加UI
2. **7.2** `EditableVideosClient` — クライアントコンポーネント
3. **7.1** `app/dashboard/videos/page.tsx` — Server Component

---

## 検証方法

### 静的チェック
```bash
npm run lint && npx tsc --noEmit
```

### 機能テスト

| テスト項目 | 期待結果 |
|-----------|---------|
| `/dashboard/videos` アクセス | 正常レンダリング |
| 未認証状態でアクセス | `/auth/signin` にリダイレクト |
| 「セクションを追加」 | 4セクションが表示される |
| maxInstances:1 のセクション追加済み | 「追加済み」バッジ、クリック不可 |
| セクション追加 | 新セクションが表示される |
| 編集ボタン | 対応エディタモーダルが開く |
| 上下移動 | videos ページ内でのみ移動 |
| 削除 | DeleteConfirmModal → 確認後削除 |
| `/dashboard/profile-editor` | 影響なし（profile セクションのみ） |
| `/@{handle}` 公開ページ | 影響なし |

---

## 変更ファイル一覧

| ファイル | 操作 |
|---------|------|
| `app/dashboard/videos/page.tsx` | 新規作成 |
| `app/dashboard/videos/EditableVideosClient.tsx` | 新規作成 |
| `app/dashboard/videos/components/AddVideoSectionModal.tsx` | 新規作成 |
