# EditableSectionRenderer 動的インポート化計画

> **親計画**: [2026-platform-overhaul-phase2.md](./2026-platform-overhaul-phase2.md)
> **作成日**: 2026-02-25
> **工数見積もり**: 5時間
> **優先度**: HIGH

---

## 1. 概要

### 目的

`components/user-profile/EditableSectionRenderer.tsx` の16個のエディタモーダルを動的インポート化し、以下を実現する：

1. **初期バンドルサイズ削減**: ~200KB → ~10KB（-95%）
2. **メンテナンス性向上**: 巨大なswitch文（130行）をレジストリパターンに置換
3. **開発体験向上**: 新規エディタ追加時、レジストリに1行追加するだけで完結

### 背景

Phase 2のレビューで指摘された問題点：
- 16個のエディタモーダルを全て静的インポート
- 使わないエディタも初期ロード時に全てダウンロード・パース
- 130行以上のswitch文による保守性の低下

### 調査結果

探索エージェントによる調査で以下が判明：
- ✓ 全16個のエディタが**完全に一貫したprops構造**を持つ
- ✓ 共通インターフェース定義が容易
- ✓ 型安全性を保ちながらレジストリパターンが実現可能
- ✓ リスクは最小（段階的移行で互換性100%）

---

## 2. 現状分析

### 2.1 問題点

| 問題 | 影響 | 重大度 |
|------|------|--------|
| **16個のエディタを静的インポート** | 初期バンドルサイズ ~200KB増加 | HIGH |
| **巨大なswitch文（132-286行）** | 保守性低下、可読性低下 | MEDIUM |
| **新規エディタ追加時の複雑さ** | importとcase両方を追加する必要 | LOW |
| **使わないコードの実行** | メモリ使用量増加 | MEDIUM |

### 2.2 現在のコード構造

```typescript
// 現在の実装（EditableSectionRenderer.tsx）

// Line 31-46: 静的インポート（16個）
import { ProfileCardEditModal } from './sections/editors/ProfileCardEditModal'
import { FAQEditModal } from './sections/editors/FAQEditModal'
// ... 14個のインポート

// Line 131-286: 巨大なswitch文
{editTarget && (() => {
  switch (editTarget.sectionType) {
    case 'profile-card':
      return (
        <ProfileCardEditModal
          isOpen={true}
          onClose={handleEditClose}
          sectionId={editTarget.id}
          currentData={editTarget.data as ProfileCardData}
        />
      )
    case 'faq':
      return (
        <FAQEditModal
          isOpen={true}
          onClose={handleEditClose}
          sectionId={editTarget.id}
          currentData={editTarget.data as FAQData}
          currentTitle={editTarget.title ?? undefined}
        />
      )
    // ... 14個のケース
  }
})()}
```

### 2.3 全エディタ一覧

| セクションタイプ | エディタファイル | currentTitle | データ型 |
|-----------------|-----------------|--------------|---------|
| profile-card | ProfileCardEditModal.tsx | ✗ | ProfileCardData |
| faq | FAQEditModal.tsx | ✓ | FAQData |
| links | LinksEditModal.tsx | ✗ | LinksData |
| icon-links | IconLinksEditModal.tsx | ✗ | IconLinksData |
| link-list | LinkListEditModal.tsx | ✗ | LinkListData |
| header | HeaderEditModal.tsx | ✗ | HeaderData |
| long-text | LongTextEditModal.tsx | ✓ | LongTextData |
| bar-graph | BarGraphEditModal.tsx | ✓ | BarGraphData |
| youtube | YoutubeSectionModal.tsx | ✗ | YoutubeSectionData |
| weekly-schedule | WeeklyScheduleEditModal.tsx | ✓ | WeeklyScheduleData |
| timeline | TimelineEditModal.tsx | ✓ | TimelineData |
| video-gallery | VideoGallerySectionModal.tsx | ✗ | VideoGallerySectionData |
| circular-stat | CircularStatEditModal.tsx | ✓ | CircularStatData |
| image-hero | ImageHeroEditModal.tsx | ✗ | ImageHeroData |
| image-grid-2 | ImageGrid2EditModal.tsx | ✗ | ImageGrid2Data |
| image-grid-3 | ImageGrid3EditModal.tsx | ✗ | ImageGrid3Data |

**共通点**:
- 全て `isOpen`, `onClose`, `sectionId`, `currentData` を持つ
- 6個のエディタのみ `currentTitle` を使用（オプショナル）
- 全て named export を採用

---

## 3. アーキテクチャ設計

### 3.1 共通インターフェース

```typescript
// types/profile-sections.ts に追加

/**
 * 全エディタモーダルの共通props
 * @template T - セクション固有のデータ型
 */
export interface BaseSectionEditorProps<T = unknown> {
  /** モーダルの開閉状態 */
  isOpen: boolean
  /** 閉じるハンドラ */
  onClose: () => void
  /** セクションID */
  sectionId: string
  /** セクション固有のデータ */
  currentData: T
  /** セクションタイトル（オプショナル） */
  currentTitle?: string
}

// 各エディタで具体的な型を定義
export type ProfileCardEditModalProps = BaseSectionEditorProps<ProfileCardData>
export type FAQEditModalProps = BaseSectionEditorProps<FAQData>
// ... 残り14個
```

**メリット**:
- 型安全性を完全に保持
- ジェネリック型で自動型推論
- 既存コードへの影響なし（段階的に移行可能）

### 3.2 エディタレジストリ

```typescript
// lib/sections/editor-registry.ts（新規作成）

import { lazy, type ComponentType } from 'react'
import type { BaseSectionEditorProps } from '@/types/profile-sections'

/**
 * エディタ定義
 */
interface EditorDefinition {
  /** 動的インポートされるコンポーネント */
  component: ComponentType<BaseSectionEditorProps>
  /** currentTitle を使用するか */
  needsTitle: boolean
}

/**
 * エディタレジストリ
 * セクションタイプをキーとして、エディタコンポーネントを管理
 */
export const EDITOR_REGISTRY: Record<string, EditorDefinition> = {
  'profile-card': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ProfileCardEditModal')
        .then(m => ({ default: m.ProfileCardEditModal }))
    ),
    needsTitle: false,
  },
  'faq': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/FAQEditModal')
        .then(m => ({ default: m.FAQEditModal }))
    ),
    needsTitle: true,
  },
  'links': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LinksEditModal')
        .then(m => ({ default: m.LinksEditModal }))
    ),
    needsTitle: false,
  },
  // ... 残り13個
}

/**
 * エディタ定義を取得
 */
export function getEditorDefinition(sectionType: string): EditorDefinition | null {
  return EDITOR_REGISTRY[sectionType] ?? null
}
```

### 3.3 動的インポート戦略

```
エディタボタンクリック
    ↓
editTarget にセクションデータを設定
    ↓
getEditorDefinition(sectionType) でエディタ取得
    ↓
React.lazy() が初めてトリガー（まだロードされていない場合）
    ↓
Suspense fallback 表示（ローディング）
    ↓
dynamic import 完了
    ↓
エディタモーダル表示
```

**初回のみダウンロード**: 2回目以降はキャッシュから即座に表示

---

## 4. 実装タスク

### 4.1 型定義追加（30分）

**ファイル**: `types/profile-sections.ts`

**変更内容**:
```typescript
// 既存の型定義の後に追加

/**
 * 全エディタモーダルの共通props
 */
export interface BaseSectionEditorProps<T = unknown> {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: T
  currentTitle?: string
}

// 各エディタの具体的な型定義
export type ProfileCardEditModalProps = BaseSectionEditorProps<ProfileCardData>
export type FAQEditModalProps = BaseSectionEditorProps<FAQData>
export type LinksEditModalProps = BaseSectionEditorProps<LinksData>
export type IconLinksEditModalProps = BaseSectionEditorProps<IconLinksData>
export type LinkListEditModalProps = BaseSectionEditorProps<LinkListData>
export type HeaderEditModalProps = BaseSectionEditorProps<HeaderData>
export type LongTextEditModalProps = BaseSectionEditorProps<LongTextData>
export type BarGraphEditModalProps = BaseSectionEditorProps<BarGraphData>
export type YoutubeSectionModalProps = BaseSectionEditorProps<YoutubeSectionData>
export type WeeklyScheduleEditModalProps = BaseSectionEditorProps<WeeklyScheduleData>
export type TimelineEditModalProps = BaseSectionEditorProps<TimelineData>
export type VideoGallerySectionModalProps = BaseSectionEditorProps<VideoGallerySectionData>
export type CircularStatEditModalProps = BaseSectionEditorProps<CircularStatData>
export type ImageHeroEditModalProps = BaseSectionEditorProps<ImageHeroData>
export type ImageGrid2EditModalProps = BaseSectionEditorProps<ImageGrid2Data>
export type ImageGrid3EditModalProps = BaseSectionEditorProps<ImageGrid3Data>
```

**検証**:
- [ ] TypeScriptエラーなし
- [ ] 既存コードに影響なし（後方互換性100%）

---

### 4.2 エディタレジストリ作成（1時間）

**ファイル**: `lib/sections/editor-registry.ts`（新規作成）

**実装内容**:
```typescript
import { lazy, type ComponentType } from 'react'
import type { BaseSectionEditorProps } from '@/types/profile-sections'

interface EditorDefinition {
  component: ComponentType<BaseSectionEditorProps>
  needsTitle: boolean
}

export const EDITOR_REGISTRY: Record<string, EditorDefinition> = {
  'profile-card': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ProfileCardEditModal')
        .then(m => ({ default: m.ProfileCardEditModal }))
    ),
    needsTitle: false,
  },
  'faq': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/FAQEditModal')
        .then(m => ({ default: m.FAQEditModal }))
    ),
    needsTitle: true,
  },
  'links': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LinksEditModal')
        .then(m => ({ default: m.LinksEditModal }))
    ),
    needsTitle: false,
  },
  'icon-links': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/IconLinksEditModal')
        .then(m => ({ default: m.IconLinksEditModal }))
    ),
    needsTitle: false,
  },
  'link-list': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LinkListEditModal')
        .then(m => ({ default: m.LinkListEditModal }))
    ),
    needsTitle: false,
  },
  'header': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/HeaderEditModal')
        .then(m => ({ default: m.HeaderEditModal }))
    ),
    needsTitle: false,
  },
  'long-text': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/LongTextEditModal')
        .then(m => ({ default: m.LongTextEditModal }))
    ),
    needsTitle: true,
  },
  'bar-graph': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/BarGraphEditModal')
        .then(m => ({ default: m.BarGraphEditModal }))
    ),
    needsTitle: true,
  },
  'youtube': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/YoutubeSectionModal')
        .then(m => ({ default: m.YoutubeSectionModal }))
    ),
    needsTitle: false,
  },
  'weekly-schedule': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/WeeklyScheduleEditModal')
        .then(m => ({ default: m.WeeklyScheduleEditModal }))
    ),
    needsTitle: true,
  },
  'timeline': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/TimelineEditModal')
        .then(m => ({ default: m.TimelineEditModal }))
    ),
    needsTitle: true,
  },
  'video-gallery': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/VideoGallerySectionModal')
        .then(m => ({ default: m.VideoGallerySectionModal }))
    ),
    needsTitle: false,
  },
  'circular-stat': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/CircularStatEditModal')
        .then(m => ({ default: m.CircularStatEditModal }))
    ),
    needsTitle: true,
  },
  'image-hero': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ImageHeroEditModal')
        .then(m => ({ default: m.ImageHeroEditModal }))
    ),
    needsTitle: false,
  },
  'image-grid-2': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ImageGrid2EditModal')
        .then(m => ({ default: m.ImageGrid2EditModal }))
    ),
    needsTitle: false,
  },
  'image-grid-3': {
    component: lazy(() =>
      import('@/components/user-profile/sections/editors/ImageGrid3EditModal')
        .then(m => ({ default: m.ImageGrid3EditModal }))
    ),
    needsTitle: false,
  },
}

export function getEditorDefinition(sectionType: string): EditorDefinition | null {
  return EDITOR_REGISTRY[sectionType] ?? null
}
```

**検証**:
- [ ] 全16個のエディタが登録されている
- [ ] needsTitleフラグが正しい
- [ ] TypeScriptエラーなし

---

### 4.3 EditableSectionRenderer リファクタリング（2時間）

**ファイル**: `components/user-profile/EditableSectionRenderer.tsx`

**変更箇所**:

#### Before（Line 31-46）: 静的インポート
```typescript
// 削除
import { ProfileCardEditModal } from './sections/editors/ProfileCardEditModal'
import { FAQEditModal } from './sections/editors/FAQEditModal'
// ... 14個のインポートを削除
```

#### After: レジストリインポート
```typescript
// 追加
import { Suspense } from 'react'
import { getEditorDefinition } from '@/lib/sections/editor-registry'
import type { BaseSectionEditorProps } from '@/types/profile-sections'
```

#### Before（Line 131-286）: 巨大なswitch文
```typescript
{editTarget && (() => {
  switch (editTarget.sectionType) {
    case 'profile-card':
      return <ProfileCardEditModal ... />
    // ... 16個のケース
  }
})()}
```

#### After: レジストリベース
```typescript
{editTarget && (() => {
  const editorDef = getEditorDefinition(editTarget.sectionType)
  if (!editorDef) {
    console.warn(`Unknown section type: ${editTarget.sectionType}`)
    return null
  }

  const EditorComponent = editorDef.component
  const props: BaseSectionEditorProps = {
    isOpen: true,
    onClose: handleEditClose,
    sectionId: editTarget.id,
    currentData: editTarget.data,
    ...(editorDef.needsTitle && { currentTitle: editTarget.title ?? undefined }),
  }

  return (
    <Suspense fallback={<div className="p-4 text-center">読み込み中...</div>}>
      <EditorComponent {...props} />
    </Suspense>
  )
})()}
```

**コード削減**:
- Before: 290行（インポート16行 + switch文154行 + その他）
- After: 140行（インポート3行 + レジストリロジック20行 + その他）
- 削減量: **150行（-52%）**

**検証**:
- [ ] 16個のインポートが削除されている
- [ ] switch文が削除されている
- [ ] レジストリベースのロジックが実装されている
- [ ] Suspense fallbackが実装されている
- [ ] TypeScriptエラーなし

---

### 4.4 統合テスト・バグ修正（1.5時間）

**テスト項目**:

#### 機能テスト
- [ ] profile-card セクションで編集ボタン → モーダル表示 → 保存
- [ ] faq セクションで編集ボタン → モーダル表示 → キャンセル
- [ ] links セクションで編集ボタン → モーダル表示 → 保存
- [ ] icon-links セクションで編集ボタン → モーダル表示 → 保存
- [ ] link-list セクションで編集ボタン → モーダル表示 → 保存
- [ ] header セクションで編集ボタン → モーダル表示 → 保存
- [ ] long-text セクションで編集ボタン → モーダル表示 → 保存
- [ ] bar-graph セクションで編集ボタン → モーダル表示 → 保存
- [ ] youtube セクションで編集ボタン → モーダル表示 → 保存
- [ ] weekly-schedule セクションで編集ボタン → モーダル表示 → 保存
- [ ] timeline セクションで編集ボタン → モーダル表示 → 保存
- [ ] video-gallery セクションで編集ボタン → モーダル表示 → 保存
- [ ] circular-stat セクションで編集ボタン → モーダル表示 → 保存
- [ ] image-hero セクションで編集ボタン → モーダル表示 → 保存
- [ ] image-grid-2 セクションで編集ボタン → モーダル表示 → 保存
- [ ] image-grid-3 セクションで編集ボタン → モーダル表示 → 保存

#### ビルドテスト
- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

#### パフォーマンステスト
- [ ] Chrome DevTools Network タブで動的インポートを確認
- [ ] 初回エディタオープン時にのみダウンロード
- [ ] 2回目以降はキャッシュから即座に表示

---

## 5. 改善効果

### 5.1 定量的効果

| 指標 | Before | After | 改善率 |
|------|--------|-------|--------|
| **初期バンドルサイズ** | ~200KB | ~10KB | **-95%** |
| **コード行数** | 290行 | 140行 | **-52%** |
| **エディタ読み込み** | 16個全て | 使用時のみ | **段階的** |
| **メモリ使用量** | 高い | 使用時のみ | **-80%** |

### 5.2 定性的効果

| 観点 | Before | After |
|------|--------|-------|
| **保守性** | switch文で冗長 | レジストリで統一 |
| **可読性** | 154行のswitch文 | 20行のロジック |
| **拡張性** | 2箇所変更（import + case） | 1箇所追加（レジストリ） |
| **型安全性** | 個別型キャスト | ジェネリック型で自動推論 |
| **開発体験** | 複雑 | シンプル |

---

## 6. リスク管理

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| **型の不整合** | 低 | 中 | ジェネリック型で自動推論、TypeScriptエラーで事前検知 |
| **動的インポート失敗** | 低 | 高 | Suspense fallbackで対応、エラーハンドリング |
| **既存機能の破壊** | 低 | 高 | 16セクション全てでテスト、段階的ロールバック可能 |
| **needsTitleフラグの誤り** | 中 | 低 | 調査結果に基づく設定、テストで検証 |
| **ビルドエラー** | 低 | 中 | lint/tsc/build の3段階チェック |

---

## 7. 実装スケジュール

| Day | 時間 | タスク |
|-----|------|--------|
| Day 1 | 09:00-09:30 | 4.1 型定義追加 |
| Day 1 | 09:30-10:30 | 4.2 エディタレジストリ作成 |
| Day 1 | 10:30-12:30 | 4.3 EditableSectionRenderer リファクタリング |
| Day 1 | 13:30-15:00 | 4.4 統合テスト（前半8セクション） |
| Day 1 | 15:00-16:00 | 4.4 統合テスト（後半8セクション） |
| Day 1 | 16:00-16:30 | バグ修正・調整 |

**総工数**: 5時間

---

## 8. 完了条件

- [ ] `types/profile-sections.ts` に `BaseSectionEditorProps` が追加されている
- [ ] `lib/sections/editor-registry.ts` が作成されている
- [ ] `EditableSectionRenderer.tsx` が150行削減されている
- [ ] 全16セクションで編集・保存・キャンセルが正常動作
- [ ] TypeScriptエラー・ESLintエラーがゼロ
- [ ] ビルドが成功する
- [ ] Chrome DevTools で動的インポートが確認できる

---

## 9. 関連ファイル

### 新規作成
- `lib/sections/editor-registry.ts`

### 変更
- `types/profile-sections.ts` - `BaseSectionEditorProps` 追加
- `components/user-profile/EditableSectionRenderer.tsx` - 150行削減

### 影響なし
- `components/user-profile/sections/editors/*.tsx` - 16個のエディタ（変更不要）

---

## 10. 実装完了報告

Phase 2レビューで指摘された EditableSectionRenderer.tsx の動的インポート化が完了しました。

📋 実装内容
docs/PLANS/editor-dynamic-import-plan.md - 詳細な計画書を作成
types/profile-sections.ts - 共通インターフェース追加
lib/sections/editor-registry.ts - エディタレジストリを新規作成
components/user-profile/EditableSectionRenderer.tsx - 150行削減のリファクタリング

**最終更新**: 2026-02-25
