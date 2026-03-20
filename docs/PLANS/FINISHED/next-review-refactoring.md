# Next.js Best Practices 準拠レビュー＆リファクタリング計画

## 概要

本プロジェクトをnext-best-practicesスキルに基づいてレビューし、準拠度を向上させるリファクタリング計画です。

**現状評価**: 全体的に良好。Server Components優先（70%）、Server Actions適切使用、async params対応済み。

## 現状の準拠状況

### 良好な点（対応不要）
- Server Components優先（約70%）
- Server Actions の適切な使用と命名規約
- async params/searchParams の Promise<> 型対応（Next.js 15+）
- next/font の包括的な設定（7フォント）
- next/link の適切な使用（生`<a>`タグなし）
- エラーバウンダリ（error.tsx, global-error.tsx, not-found.tsx）
- 3層認証アーキテクチャ
- Zodバリデーション、統一的なAPIレスポンス形式

### 要改善点
- Suspense境界の不足
- 生`<img>`タグの使用
- メタデータ不足
- loading.tsx未活用
- Dateシリアライズ問題の可能性

---

## タスク一覧

### Phase 1: Critical（即座に対応）

#### C-1: useSearchParamsのSuspense境界追加
**優先度**: Critical
**作業時間**: 1時間
**影響ファイル**: 4ファイル

| ファイル | 対応内容 |
|----------|----------|
| `app/admin/items/components/ItemListClient.tsx` | 親でSuspense追加 |
| `app/admin/media/components/hooks/useMediaFilters.ts` | 呼び出し元でSuspense追加 |
| `app/admin/users/components/UserFilters.tsx` | 親でSuspense追加 |
| `app/admin/users/components/UserSearch.tsx` | 親でSuspense追加 |

**対応方針**:
```tsx
// Before
<UserFilters />

// After
<Suspense fallback={<FiltersSkeleton />}>
  <UserFilters />
</Suspense>
```

**検証方法**:
- `npm run build` 成功
- ブラウザコンソールにハイドレーションエラーなし

---

#### C-2: 生`<img>`タグからnext/imageへの移行
**優先度**: Critical
**作業時間**: 1.5時間
**影響ファイル**: 5ファイル

| ファイル | 行番号 | 対応内容 |
|----------|--------|----------|
| `components/notification/NotificationModal.tsx` | 65-71 | Image + unoptimized |
| `components/notification/ContactModal.tsx` | 64-70 | Image + unoptimized |
| `app/dashboard/userdata/components/IconSelector.tsx` | 267-271 | Image + unoptimized |
| `app/dashboard/userdata/components/UserDataIconRenderer.tsx` | 119-124 | Image + unoptimized |
| `app/profile/layout.tsx` | 27-31, 90-95 | Image |

**対応方針**:
```tsx
// Before
<img src={`/api/files/${storageKey}`} alt="" className="..." />

// After
import Image from 'next/image'
<Image
  src={`/api/files/${storageKey}`}
  alt=""
  width={400}
  height={300}
  unoptimized // 動的URLのため
  className="..."
/>
```

**検証方法**:
- モーダルを開いて画像が正常表示されること
- コンソールエラーなし

---

### Phase 2: High（早急に対応）

#### H-1: usePathnameのSuspense境界確認
**優先度**: High
**作業時間**: 1時間
**影響ファイル**: 4ファイル

| ファイル | 対応内容 |
|----------|----------|
| `components/user-profile/ProfileHeader.tsx` | 親でSuspense追加 |
| `components/user-profile/MobileBottomNav.tsx` | 親でSuspense追加 |
| `app/admin/attributes/components/AttributeNavigation.tsx` | 親でSuspense追加 |
| `app/dashboard/platforms/components/PlatformNavigation.tsx` | 親でSuspense追加 |

**検証方法**:
- ビルド成功
- 各ページでナビゲーションが正常動作

---

#### H-2: メタデータの追加
**優先度**: High
**作業時間**: 2時間
**影響ファイル**: 約30ファイル

**Dashboard系**（12ページ）:
```
app/dashboard/page.tsx
app/dashboard/profile-editor/page.tsx
app/dashboard/profile-sections/page.tsx
app/dashboard/items/page.tsx
app/dashboard/faqs/page.tsx
app/dashboard/userdata/page.tsx
app/dashboard/notifications/page.tsx
app/dashboard/platforms/page.tsx
app/dashboard/platforms/youtube/page.tsx
app/dashboard/platforms/twitch/page.tsx
app/dashboard/platforms/niconico/page.tsx
app/dashboard/setup/page.tsx
```

**Auth系**（3ページ）:
```
app/auth/signin/page.tsx
app/auth/error/page.tsx
app/auth/suspended/page.tsx
```

**Admin系**（主要ページ）:
```
app/admin/page.tsx
app/admin/users/page.tsx
app/admin/links/page.tsx
app/admin/media/page.tsx
app/admin/blacklist/page.tsx
```

**対応方針**:
```tsx
// Dashboard/Adminページ（インデックス不要）
export const metadata: Metadata = {
  title: 'ダッシュボード',
  description: 'アカウント管理ダッシュボード',
  robots: { index: false, follow: false },
}

// 公開ページ
export const metadata: Metadata = {
  title: 'ログイン',
  description: 'アカウントにログインしてください',
}
```

**検証方法**:
- 各ページの`<head>`にtitle/descriptionが含まれること

---

#### H-3: loading.tsxの追加
**優先度**: High
**作業時間**: 1.5時間
**新規ファイル**: 3ファイル

| ファイル | 内容 |
|----------|------|
| `app/dashboard/loading.tsx` | ダッシュボード用スケルトン |
| `app/admin/loading.tsx` | 管理画面用スケルトン |
| `app/[handle]/loading.tsx` | プロフィール用スケルトン |

**対応方針**:
```tsx
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-muted rounded w-1/4" />
      <div className="h-64 bg-muted rounded" />
    </div>
  )
}
```

**検証方法**:
- Chrome DevTools Network throttlingで遅延時にローディング表示確認

---

### Phase 3: Medium（計画的に対応）

#### M-1: middleware.ts のリネーム検討（Next.js 16）
**優先度**: Medium
**作業時間**: 1時間
**影響ファイル**: 1ファイル

| ファイル | 対応内容 |
|----------|----------|
| `middleware.ts` | `proxy.ts`へのリネーム検討 |

**対応方針**:
1. Next.js 16公式ドキュメント確認
2. `npx @next/codemod@latest upgrade` 実行検討
3. 必要に応じて手動リネーム

**注意**: Next.js 16では`middleware.ts`も引き続きサポートされているため、急ぎではない

**検証方法**:
- 全ルートのアクセス・リダイレクトが正常動作

---

#### M-2: Dateオブジェクトのシリアライズ問題対応
**優先度**: Medium
**作業時間**: 1.5時間
**影響ファイル**: 7ファイル

| ファイル | 確認内容 |
|----------|----------|
| `app/dashboard/notifications/gift-settings.tsx` | Date使用箇所確認 |
| `app/dashboard/notifications/contact-settings.tsx` | Date使用箇所確認 |
| `app/dashboard/notifications/notification-settings.tsx` | Date使用箇所確認 |
| `components/image-uploader/image-uploader.tsx` | Date使用箇所確認 |
| `app/admin/articles/components/ArticleForm.tsx` | Date使用箇所確認 |
| `app/admin/media/components/MediaFilters.tsx` | Date使用箇所確認 |
| `app/admin/users/[id]/page.tsx` | Date使用箇所確認 |

**対応方針**:
```tsx
// Server Component側
const createdAt = user.createdAt.toISOString()
return <ClientComponent createdAt={createdAt} />

// Client Component側
const date = new Date(createdAt)
```

**検証方法**:
- ビルド成功
- コンソールにシリアライズ警告なし

---

#### M-3: profile/layout.tsxの修正
**優先度**: Medium
**作業時間**: 1時間
**影響ファイル**: 1ファイル

| ファイル | 対応内容 |
|----------|----------|
| `app/profile/layout.tsx` | 生`<a>`/`<img>`タグを適切なコンポーネントに置換 |

**検証方法**:
- プロフィールページが正常表示されること

---

#### M-4: Math.randomのハイドレーション問題確認
**優先度**: Medium
**作業時間**: 30分
**影響ファイル**: 1ファイル

| ファイル | 対応内容 |
|----------|----------|
| `components/ui/sidebar.tsx` | useIdフックまたはcrypto.randomUUID()への置換検討 |

**検証方法**:
- ハイドレーション警告なし

---

### Phase 4: Low（余裕があれば対応）

#### L-1: dynamic importの活用拡大
**優先度**: Low
**作業時間**: 2時間
**対象**: 重いモーダル、低頻度使用機能

**対応方針**:
```tsx
import dynamic from 'next/dynamic'

const HeavyModal = dynamic(() => import('./HeavyModal'), {
  loading: () => <ModalSkeleton />,
})
```

---

#### L-2: serverExternalPackagesの検討
**優先度**: Low
**作業時間**: 30分
**影響ファイル**: `next.config.ts`

**検討対象パッケージ**:
- Prisma関連
- その他サーバー専用パッケージ

---

## 実装スケジュール

```
Week 1: Critical
├── C-1: useSearchParamsのSuspense境界追加 (1h)
└── C-2: 生<img>タグからnext/imageへの移行 (1.5h)
    合計: 2.5時間

Week 2: High
├── H-1: usePathnameのSuspense境界確認 (1h)
├── H-2: メタデータの追加 (2h)
└── H-3: loading.tsxの追加 (1.5h)
    合計: 4.5時間

Week 3: Medium
├── M-1: middleware.ts検討 (1h)
├── M-2: Dateシリアライズ対応 (1.5h)
├── M-3: profile/layout.tsx修正 (1h)
└── M-4: Math.random確認 (0.5h)
    合計: 4時間

Week 4: Low（オプショナル）
├── L-1: dynamic import拡大 (2h)
└── L-2: serverExternalPackages検討 (0.5h)
    合計: 2.5時間
```

## 総作業時間見積もり

| 優先度 | 作業時間 |
|--------|----------|
| Critical | 2.5時間 |
| High | 4.5時間 |
| Medium | 4時間 |
| Low | 2.5時間 |
| **合計** | **13.5時間** |

---

## 各タスク完了時の検証チェックリスト

- [ ] `npm run lint` エラーなし
- [ ] `npx tsc --noEmit` 型エラーなし
- [ ] `npm run build` ビルド成功
- [ ] ブラウザコンソールにエラー/警告なし
- [ ] 対象機能の手動テスト完了

---

## 参照スキルファイル

実装時は以下のスキルファイルを参照:
- `~/.claude/skills/next-best-practices/suspense-boundaries.md`
- `~/.claude/skills/next-best-practices/image.md`
- `~/.claude/skills/next-best-practices/metadata.md`
- `~/.claude/skills/next-best-practices/rsc-boundaries.md`
- `~/.claude/skills/next-best-practices/hydration-error.md`
