# Phase 3: 1カラムレイアウト - 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-25
> **見積もり**: 2.5日
> **依存関係**: Phase 2（セクションシステム基盤）完了後に開始

---

## 概要

Phase 3は2カラムレイアウトを1カラムレイアウトに移行するフェーズです。CharacterColumn（左固定カラム）を廃止し、全セクションを中央揃えの1カラムで表示します。

**重要な決定事項**:
- キャラクター画像はPhase 4のCharacterProfileSectionで対応（Phase 3では非表示）
- MobileBottomNav / FloatingElementsはそのまま維持

**主な成果物**:
- ProfileLayout.tsx（1カラムレイアウト）
- ProfileHeader更新（1カラム対応）
- CharacterColumn / ContentColumn の削除
- [handle]/page.tsx の更新

---

## 現状分析

### 現在のレイアウト構造

```
PC（≥992px）:
┌─────────────────────────────────────────┐
│ ProfileHeader（タブ・アクションボタン）  │
├────────────┬────────────────────────────┤
│ Character  │ ContentColumn              │
│ Column     │ ├─ Section 1               │
│ (w-400px)  │ ├─ Section 2               │
│ (sticky)   │ └─ Section N               │
└────────────┴────────────────────────────┘

Mobile（<992px）:
┌────────────────────────────────────────┐
│ CharacterColumn（背景・h-[80vh]）       │
├────────────────────────────────────────┤
│ ContentColumn（スライドアップ）          │
│ rounded-t-[32px]                        │
└────────────────────────────────────────┘
```

### 移行後のレイアウト構造

```
全デバイス共通:
┌────────────────────────────────────────┐
│        ProfileHeader（中央揃え）         │
├────────────────────────────────────────┤
│     ┌────────────────────────┐         │
│     │ ImageHeroSection       │         │  ← Large (1200px)
│     └────────────────────────┘         │
│     ┌─────────────────┐                │
│     │ ProfileCardSection│  ← 中央揃え   │  ← Medium (720px)
│     └─────────────────┘                │
│     ┌─────────────────┐                │
│     │ FAQSection      │                │  ← Medium (720px)
│     └─────────────────┘                │
│     ┌─────────────────┐                │
│     │ LinksSection    │                │  ← Medium (720px)
│     └─────────────────┘                │
├────────────────────────────────────────┤
│ MobileBottomNav（<992pxのみ）           │
├────────────────────────────────────────┤
│ FloatingElements（Share/Notifications） │
└────────────────────────────────────────┘

※ キャラクター画像はPhase 4でCharacterProfileSectionとして実装
```

---

## 主要ファイル一覧

### 変更対象

| ファイル | 変更内容 |
|----------|----------|
| `components/user-profile/UserProfileLayout.tsx` | 2カラム→1カラムに書き換え |
| `components/user-profile/ProfileHeader.tsx` | 1カラム幅対応、スタイル調整 |
| `app/[handle]/page.tsx` | 新レイアウト適用 |
| `app/[handle]/layout.tsx` | 必要に応じて調整 |

### 削除対象

| ファイル | 理由 |
|----------|------|
| `components/user-profile/CharacterColumn.tsx` | 1カラム化で不要 |
| `components/user-profile/ContentColumn.tsx` | 1カラム化で不要 |

### 新規作成

| ファイル | 説明 |
|----------|------|
| `components/profile/ProfileLayout.tsx` | 1カラムレイアウト（新規） |

### 維持（変更なし）

| ファイル | 理由 |
|----------|------|
| `components/user-profile/MobileBottomNav.tsx` | そのまま維持 |
| `components/user-profile/FloatingElements.tsx` | そのまま維持 |

---

## タスク詳細

### 3.1 ProfileLayout作成（4h）- CRITICAL

**依存**: Phase 2完了
**成果物**: `components/profile/ProfileLayout.tsx`

#### 要件
- 1カラム中央揃えレイアウト
- 最大幅: 1200px（コンテンツエリア）
- レスポンシブ: padding調整のみ（構造変更なし）
- MobileBottomNav / FloatingElements との連携維持

#### 実装方針

```typescript
// components/profile/ProfileLayout.tsx
'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ProfileLayoutProps {
  children: ReactNode
  header?: ReactNode
  bottomNav?: ReactNode
  floatingElements?: ReactNode
  className?: string
}

/**
 * 1カラムレイアウト
 * - 全デバイスで中央揃え
 * - max-w-[1200px]
 * - MobileBottomNav / FloatingElements対応
 */
export function ProfileLayout({
  children,
  header,
  bottomNav,
  floatingElements,
  className,
}: ProfileLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* ヘッダー */}
      {header}

      {/* メインコンテンツ（1カラム中央揃え） */}
      <main className="flex-1 w-full">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      {/* ボトムナビ（モバイル） */}
      {bottomNav}

      {/* フローティング要素 */}
      {floatingElements}
    </div>
  )
}
```

#### 検証
- [ ] 全デバイスで1カラム中央揃え
- [ ] max-w-[1200px]が適用される
- [ ] モバイルでpadding調整が正しく動作
- [ ] MobileBottomNav / FloatingElementsが正しく配置

---

### 3.2 ProfileHeader更新（3h）- HIGH

**依存**: 3.1
**成果物**: `components/user-profile/ProfileHeader.tsx`の更新

#### 変更内容
- 2カラム前提のスタイリングを削除
- 1カラム幅（max-w-[1200px]）に対応
- モバイル/PC共通のレイアウト

#### 実装方針

```typescript
// 現在: 2カラム幅前提
// 変更後: 1カラム中央揃え

<header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
    <div className="flex items-center justify-between h-16">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <h1>{name}</h1>
          <p>{handle}</p>
        </div>
      </div>

      {/* Navigation Tabs (PC) */}
      <nav className="hidden md:flex items-center gap-1">
        {/* tabs */}
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* buttons */}
      </div>
    </div>

    {/* Navigation Tabs (Mobile) */}
    <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
      {/* tabs */}
    </nav>
  </div>
</header>
```

#### 検証
- [ ] PC/Mobile両方でヘッダーが正しく表示
- [ ] タブナビゲーションが動作
- [ ] アクションボタンが正しい位置
- [ ] sticky動作が維持

---

### 3.3 CharacterColumn / ContentColumn削除（2h）- MEDIUM

**依存**: 3.4（page.tsx更新後に削除）
**成果物**: 2ファイル削除、インポート更新

#### 削除対象
1. `components/user-profile/CharacterColumn.tsx`
2. `components/user-profile/ContentColumn.tsx`

#### 削除手順
1. `app/[handle]/page.tsx`の更新完了を確認
2. 他のファイルでのインポートがないか確認
3. ファイルを削除
4. ビルド確認

#### 検証
- [ ] ファイルが削除されている
- [ ] ビルドエラーがない
- [ ] TypeScriptエラーがない

---

### 3.4 [handle]/page.tsx更新（3h）- HIGH

**依存**: 3.1, 3.2
**成果物**: `app/[handle]/page.tsx`の更新

#### 変更内容
- UserProfileLayout → ProfileLayout に切り替え
- CharacterColumn / ContentColumn の使用を削除
- SectionRenderer で全セクションを表示

#### 実装方針

```typescript
// app/[handle]/page.tsx
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { SectionRenderer } from '@/components/profile/SectionRenderer'
import { ProfileHeader } from '@/components/user-profile/ProfileHeader'
import { MobileBottomNav } from '@/components/user-profile/MobileBottomNav'
import { FloatingElements } from '@/components/user-profile/FloatingElements'

export default async function UserProfilePage({ params }: Props) {
  const { handle } = await params

  // データ取得
  const user = await getUserByHandle(handle)
  if (!user) notFound()

  const sections = await getUserSections(user.id)

  return (
    <ProfileLayout
      header={<ProfileHeader user={user} />}
      bottomNav={<MobileBottomNav />}
      floatingElements={<FloatingElements />}
    >
      <SectionRenderer sections={sections} />
    </ProfileLayout>
  )
}
```

#### 検証
- [ ] プロフィールページが正しく表示される
- [ ] 全セクションが1カラムで表示される
- [ ] モバイル/PC両方で動作
- [ ] MobileBottomNav / FloatingElementsが動作

---

### 3.5 UserProfileLayout.tsx移行（2h）- MEDIUM

**依存**: 3.4
**成果物**: `components/user-profile/UserProfileLayout.tsx`の更新

#### 方針: 後方互換性維持
- 既存のpropsを維持
- 内部でProfileLayoutを使用
- 段階的に使用箇所を移行

#### 実装

```typescript
// components/user-profile/UserProfileLayout.tsx
'use client'

import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { ProfileHeader } from './ProfileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { FloatingElements } from './FloatingElements'
import type { UserWithProfile } from '@/types'

interface UserProfileLayoutProps {
  user: UserWithProfile
  children: ReactNode
}

/**
 * 後方互換性のためのラッパー
 * 新規実装ではProfileLayoutを直接使用推奨
 * @deprecated ProfileLayoutを直接使用してください
 */
export function UserProfileLayout({ user, children }: UserProfileLayoutProps) {
  return (
    <ProfileLayout
      header={<ProfileHeader user={user} />}
      bottomNav={<MobileBottomNav />}
      floatingElements={<FloatingElements />}
    >
      {children}
    </ProfileLayout>
  )
}
```

#### 検証
- [ ] 既存の使用箇所が動作する
- [ ] @deprecated警告が表示される

---

### 3.6 レスポンシブ調整・テスト（2h）- MEDIUM

**依存**: 3.1-3.5
**成果物**: 全デバイスでの動作確認

#### テスト対象

| デバイス | 幅 | 確認項目 |
|----------|-----|----------|
| Desktop Large | ≥1400px | max-w-[1200px]中央揃え、左右余白 |
| Desktop | 1200-1399px | max-w-[1200px]中央揃え |
| Tablet | 768-991px | padding調整、1カラム |
| Mobile | <768px | padding調整、1カラム、MobileBottomNav表示 |

#### 検証
- [ ] 各ブレークポイントでレイアウト崩れなし
- [ ] SectionWrapper幅制御（Large/Medium）が正常動作
- [ ] FloatingElements位置が正しい
- [ ] MobileBottomNav表示/非表示が正しい

---

## 依存関係マップ

```
Phase 2完了
    │
    └──► 3.1 ProfileLayout作成
            │
            ├──► 3.2 ProfileHeader更新
            │       │
            │       └──► 3.4 [handle]/page.tsx更新
            │               │
            │               ├──► 3.3 CharacterColumn/ContentColumn削除
            │               │
            │               └──► 3.5 UserProfileLayout移行
            │                       │
            └───────────────────────┴──► 3.6 レスポンシブ調整・テスト
```

### クリティカルパス

```
3.1 → 3.2 → 3.4 → 3.3 → 3.6
```

---

## 潜在リスクと対策

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| **キャラクター画像が一時的に非表示** | 確定 | 低 | Phase 4でCharacterProfileSection作成時に対応。ユーザーに事前説明 |
| **MobileBottomNav連携問題** | 低 | 中 | ProfileLayoutでpropsとして受け取り、位置調整を明確化 |
| **既存ページへの影響** | 中 | 高 | UserProfileLayoutを残して段階的移行、@deprecated付与 |
| **スクロール挙動の変化** | 中 | 低 | sticky要素（ProfileHeader）の動作確認を重点的に |
| **セクション幅の表示崩れ** | 低 | 中 | Phase 2のSectionWrapperテストを再実施 |

---

## テスト戦略

### 単体テスト対象

| コンポーネント | テスト内容 |
|---------------|-----------|
| ProfileLayout | props渡し、children表示、className適用 |
| ProfileHeader | ナビゲーション、アクションボタン |

### 統合テスト（手動）

1. **PC表示テスト**
   - `/[handle]`ページにアクセス
   - 1カラム中央揃えを確認
   - セクションがLarge/Mediumで正しい幅

2. **モバイル表示テスト**
   - Chrome DevToolsでモバイルビュー
   - MobileBottomNav表示確認
   - FloatingElements位置確認
   - スクロール動作確認

3. **ナビゲーションテスト**
   - タブ切り替え（Profile/Items/Videos/FAQs）
   - 各ページへの遷移

### デモページ確認

`/demo/profile-sections/`で各セクションの表示確認

---

## 見積もりサマリー

| Day | タスク | 工数 |
|-----|--------|------|
| Day 1 午前 | 3.1 ProfileLayout作成 | 4h |
| Day 1 午後 | 3.2 ProfileHeader更新 | 3h |
| Day 2 午前 | 3.4 [handle]/page.tsx更新 | 3h |
| Day 2 午後 | 3.5 UserProfileLayout移行 + 3.3 削除 | 4h |
| Day 3 午前 | 3.6 レスポンシブ調整・テスト | 2h |
| **合計** | | **16h（約2.5日）** |

---

## 検証チェックリスト

### Phase 3完了時

**ファイル確認**:
- [-] `components/profile/ProfileLayout.tsx` が作成されている
- [-] `components/user-profile/ProfileHeader.tsx` が更新されている
- [-] `components/user-profile/CharacterColumn.tsx` が削除されている
- [-] `components/user-profile/ContentColumn.tsx` が削除されている
- [-] `app/[handle]/page.tsx` が更新されている
- [-] `components/user-profile/UserProfileLayout.tsx` が後方互換ラッパーに更新

**動作確認**:
- [ ] `/[handle]` で1カラムレイアウトが表示される
- [ ] PC（≥992px）で中央揃え
- [ ] Tablet/Mobile（<992px）で適切なpadding
- [ ] MobileBottomNav が正常動作
- [ ] FloatingElements が正しい位置
- [ ] タブナビゲーションが動作

**ビルド確認**:
- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

---

## 次のPhaseへの引き継ぎ

Phase 3が完了したら、以下の状態になっている必要があります：

1. **1カラムレイアウト**: ProfileLayout.tsx による中央揃え
2. **ヘッダー更新**: ProfileHeader.tsx が1カラム幅対応
3. **旧コンポーネント削除**: CharacterColumn / ContentColumn
4. **後方互換**: UserProfileLayout.tsx がラッパーとして機能

これにより、**Phase 4「セクションコンポーネント」**で：
- CharacterProfileSection を新規作成（キャラクター画像復活）
- 既存セクションをThemedCard対応に更新
- 1カラムレイアウトでの各セクション調整

が可能になります。

---

**最終更新**: 2026-02-25

Phase 3: 1カラムレイアウト - 完了 ✅
Phase 3のすべてのタスクが完了しました！

完了したタスク
タスク	状態
✅ 3.1 ProfileLayout作成	完了
✅ 3.2 ProfileHeader更新	完了（すでに対応済み）
✅ 3.3 CharacterColumn/ContentColumn削除	完了
✅ 3.4 [handle]/layout.tsx更新	完了
✅ 3.5 UserProfileLayout移行	完了
✅ 3.6 レスポンシブ調整・テスト	完了
主な成果物
components/profile/ProfileLayout.tsx - 新規作成

1カラム中央揃えレイアウト
max-w-[1200px]
MobileBottomNav / FloatingElements対応
app/[handle]/layout.tsx - 更新

ProfileLayoutを使用
UserThemeProviderで全体をラップ
背景スタイル計算をServer Componentで実行
components/user-profile/UserProfileLayout.tsx - 後方互換ラッパーに変更

@deprecatedタグ付与
内部でProfileLayoutを使用
既存のpropsをサポート
削除したファイル

components/user-profile/CharacterColumn.tsx
components/user-profile/ContentColumn.tsx
app/globals.css - 更新

サイドバー背景透過スタイル追加
ビルド結果
✅ npm run lint パス（ソースコードにエラーなし）
✅ npx tsc --noEmit パス
✅ npm run build パス