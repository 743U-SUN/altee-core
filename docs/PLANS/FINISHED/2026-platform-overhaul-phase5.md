# Phase 5: ダッシュボード - 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-26
> **見積もり**: 2.5-3日
> **依存関係**: Phase 4（セクションコンポーネント）完了後に開始

---

## 概要

Phase 5はダッシュボードの完成フェーズです。テーマセレクターの9テーマ対応、リアルタイムプレビュー機能の実装、ダッシュボードナビゲーションの整理を行います。

**重要な発見**: 調査の結果、計画していた機能の多くが**既に実装済み**であることが判明しました。

**主な成果物**:
- ThemePresetSelectorの9テーマ対応（拡張）
- テーマプレビューユーティリティ（新規）
- ダッシュボードナビゲーション整理

---

## 現状分析

### 既に実装済みの機能

| 機能 | 実装場所 | 状態 |
|------|----------|------|
| ThemePresetSelector | `components/sidebar-content/components/ThemePresetSelector.tsx` | ⚠️ 旧テーマのみ（2種類） |
| ColorPresetSelector | `components/sidebar-content/components/ColorPresetSelector.tsx` | ✅ 完了 |
| VisibilityToggles | `components/sidebar-content/components/VisibilityToggles.tsx` | ✅ 完了 |
| FontSelector | `components/sidebar-content/components/FontSelector.tsx` | ✅ 完了 |
| BackgroundSelector | `components/sidebar-content/components/BackgroundSelector.tsx` | ✅ 完了 |
| theme-actions.ts | `app/actions/user/theme-actions.ts` | ⚠️ 旧テーマのみ |
| DashboardSidebarContent | `components/sidebar-content/DashboardSidebarContent.tsx` | ✅ 完了 |
| セクションエディター | 17種類のモーダル | ✅ 完了 |

### 未実装・要更新機能

| 機能 | 状態 | 必要な作業 |
|------|------|------------|
| **9テーマ対応** | ❌ 未対応 | ThemePresetSelector改修 |
| **動的テーマ検証** | ❌ 未対応 | theme-actions.ts更新 |
| **テーマプレビュー** | ❌ 未実装 | preview.ts新規作成 |
| **ダッシュボードリンク** | ⚠️ 要修正 | 削除済みページへのリンク残存 |

### 利用可能なテーマ（9種類）

| ファミリー | バリエーション | テーマID |
|------------|----------------|----------|
| **Claymorphic** | Warm（デフォルト） | `claymorphic-warm` |
| | Cool | `claymorphic-cool` |
| | Dark | `claymorphic-dark` |
| **Minimal** | White | `minimal-white` |
| | Gray | `minimal-gray` |
| | Black | `minimal-black` |
| **Pastel Dream** | Pink | `pastel-dream-pink` |
| | Mint | `pastel-dream-mint` |
| | Blue | `pastel-dream-blue` |

### 既存基盤（Phase 1-4完了）

- `lib/themes/registry.ts` - `getThemesGroupedByName()`, `hasTheme()`, `getAllThemes()`
- `lib/themes/presets/*.ts` - 9テーマの定義
- `lib/themes/compat.ts` - 旧テーマID互換性レイヤー
- `components/theme-provider/UserThemeProvider.tsx` - テーマ適用プロバイダー
- `lib/sections/editor-registry.ts` - 17エディタ登録済み

---

## タスク詳細

### 5.1 既存コンポーネントの拡張 (HIGH) - 1.5日

#### 5.1.1 ThemePresetSelector改修 (4h)

**ファイル**: `components/sidebar-content/components/ThemePresetSelector.tsx`

**現状の問題**:
```typescript
const THEME_PRESETS = [
  { value: 'claymorphic', label: 'Claymorphic', ... },
  { value: 'minimal', label: 'Minimal', ... },
] as const  // ← 2種類のみ、ハードコード
```

**変更内容**:
1. `getThemesGroupedByName()`を使用してテーマ一覧を動的取得
2. テーマファミリーごとにグループ表示
3. 各テーマカードに`palette.background`でプレビュー色表示
4. hover時のプレビュー機能追加

**UI設計**:

```
┌────────────────────────────────────────┐
│  テーマ                                 │
├────────────────────────────────────────┤
│                                        │
│  Claymorphic                           │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │  Warm  │ │  Cool  │ │  Dark  │     │
│  │   ✓    │ │        │ │        │     │
│  │ [色]   │ │ [色]   │ │ [色]   │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│  Minimal                               │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ White  │ │  Gray  │ │ Black  │     │
│  │ [色]   │ │ [色]   │ │ [色]   │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
│  Pastel Dream                          │
│  ┌────────┐ ┌────────┐ ┌────────┐     │
│  │  Pink  │ │  Mint  │ │  Blue  │     │
│  │ [色]   │ │ [色]   │ │ [色]   │     │
│  └────────┘ └────────┘ └────────┘     │
│                                        │
└────────────────────────────────────────┘
```

**実装コード例**:

```typescript
'use client'

import { useMemo, useState, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { updateUserThemeSettings } from '@/app/actions/user/theme-actions'
import { useRouter } from 'next/navigation'
import { getThemesGroupedByName } from '@/lib/themes/registry'
import { applyThemePreview } from '@/lib/themes/preview'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface ThemePresetSelectorProps {
  currentPreset: string
}

export function ThemePresetSelector({ currentPreset }: ThemePresetSelectorProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [cleanupPreview, setCleanupPreview] = useState<(() => void) | null>(null)

  // テーマファミリーをグループ化
  const themeGroups = useMemo(() => getThemesGroupedByName(), [])

  const handlePreviewStart = useCallback((themeId: string) => {
    // 前のプレビューをクリーンアップ
    cleanupPreview?.()
    const cleanup = applyThemePreview(themeId)
    setCleanupPreview(() => cleanup)
  }, [cleanupPreview])

  const handlePreviewEnd = useCallback(() => {
    cleanupPreview?.()
    setCleanupPreview(null)
  }, [cleanupPreview])

  const handleSelect = async (themeId: string) => {
    handlePreviewEnd()
    setIsUpdating(true)
    const result = await updateUserThemeSettings({ themePreset: themeId })
    setIsUpdating(false)

    if (result.success) {
      router.refresh()
    } else {
      console.error('Failed to update theme preset:', result.error)
    }
  }

  return (
    <div className="space-y-4">
      <Label>テーマプリセット</Label>

      {Object.entries(themeGroups).map(([familyName, themes]) => (
        <div key={familyName} className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {familyName}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                onMouseEnter={() => handlePreviewStart(theme.id)}
                onMouseLeave={handlePreviewEnd}
                disabled={isUpdating}
                className={cn(
                  'relative flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                  'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
                  currentPreset === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
              >
                {/* カラープレビュー */}
                <div
                  className="w-full h-8 rounded mb-2"
                  style={{ backgroundColor: theme.palette.background }}
                />
                {/* テーマ名 */}
                <span className="text-xs font-medium">
                  {theme.palette.displayName}
                </span>
                {/* 選択マーク */}
                {currentPreset === theme.id && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

#### 5.1.2 theme-actions.ts更新 (2h)

**ファイル**: `app/actions/user/theme-actions.ts`

**現状の問題**:
```typescript
const ALLOWED_PRESETS = ['claymorphic', 'minimal'] as const

if (settings.themePreset && !ALLOWED_PRESETS.includes(settings.themePreset as any)) {
  return { success: false, error: '無効なテーマプリセットです' }
}
```

**変更内容**:
1. ハードコードされた`ALLOWED_PRESETS`を削除
2. `hasTheme()`による動的検証に変更
3. 互換性レイヤー（`lib/themes/compat.ts`）との統合

**変更後**:
```typescript
import { hasTheme, DEFAULT_THEME_ID } from '@/lib/themes/registry'
import { migrateThemeId } from '@/lib/themes/compat'

// 検証部分
if (settings.themePreset) {
  // 旧IDを新IDに変換
  const normalizedId = migrateThemeId(settings.themePreset)

  if (!hasTheme(normalizedId)) {
    return { success: false, error: '無効なテーマです' }
  }

  // 正規化されたIDを使用
  settings.themePreset = normalizedId
}
```

#### 5.1.3 ThemeSettings型のデフォルト値確認 (1h)

**ファイル**: `types/profile-sections.ts`

**確認項目**:
- `themePreset`のデフォルト値が`'claymorphic-warm'`であること
- 互換性は`lib/themes/compat.ts`で処理済みであること

**確認コード**:
```typescript
// lib/themes/compat.ts
const LEGACY_THEME_MAP: Record<string, string> = {
  'claymorphic': 'claymorphic-warm',
  'minimal': 'minimal-white',
}

export function migrateThemeId(id: string): string {
  return LEGACY_THEME_MAP[id] ?? id
}
```

---

### 5.2 プレビュー機能の実装 (MEDIUM) - 1日

#### 5.2.1 プレビュー用ユーティリティ作成 (2h)

**ファイル**: `lib/themes/preview.ts`（新規）

**機能**:
- CSS変数の一時的な上書き
- クリーンアップ関数の返却
- `UserThemeProvider`を変更せずに実装

```typescript
/**
 * テーマプレビュー機能
 * CSS変数を一時的に上書きしてテーマをプレビュー
 */

import { getTheme } from './registry'

/**
 * テーマプレビューを適用
 * @param themeId - プレビューするテーマのID
 * @returns クリーンアップ関数（プレビュー解除時に呼び出す）
 */
export function applyThemePreview(themeId: string): () => void {
  const theme = getTheme(themeId)
  if (!theme) {
    console.warn(`Theme not found: ${themeId}`)
    return () => {}
  }

  const root = document.documentElement
  const originalStyles: Record<string, string> = {}

  // CSS変数を一時的に上書き
  Object.entries(theme.variables).forEach(([key, value]) => {
    // 元の値を保存
    originalStyles[key] = root.style.getPropertyValue(key)
    // 新しい値を適用
    root.style.setProperty(key, value)
  })

  // クリーンアップ関数を返す
  return () => {
    Object.entries(originalStyles).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value)
      } else {
        root.style.removeProperty(key)
      }
    })
  }
}

/**
 * 複数のCSS変数を一括でプレビュー
 * @param variables - CSS変数のオブジェクト
 * @returns クリーンアップ関数
 */
export function applyVariablesPreview(
  variables: Record<string, string>
): () => void {
  const root = document.documentElement
  const originalStyles: Record<string, string> = {}

  Object.entries(variables).forEach(([key, value]) => {
    originalStyles[key] = root.style.getPropertyValue(key)
    root.style.setProperty(key, value)
  })

  return () => {
    Object.entries(originalStyles).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value)
      } else {
        root.style.removeProperty(key)
      }
    })
  }
}
```

#### 5.2.2 lib/themes/index.tsへのエクスポート追加 (0.5h)

**ファイル**: `lib/themes/index.ts`

**変更内容**:
```typescript
// 既存のエクスポートに追加
export { applyThemePreview, applyVariablesPreview } from './preview'
```

#### 5.2.3 ThemePresetSelectorプレビュー統合 (2.5h)

**ファイル**: `components/sidebar-content/components/ThemePresetSelector.tsx`

**実装ポイント**:
- `onMouseEnter`でプレビュー適用
- `onMouseLeave`でプレビュー解除
- `onClick`で実際に保存
- タッチデバイス対応（タップで即時適用、プレビューなし）

```typescript
// プレビュー状態管理
const [cleanupPreview, setCleanupPreview] = useState<(() => void) | null>(null)

// プレビュー開始
const handlePreviewStart = useCallback((themeId: string) => {
  // 前のプレビューをクリーンアップ
  cleanupPreview?.()
  const cleanup = applyThemePreview(themeId)
  setCleanupPreview(() => cleanup)
}, [cleanupPreview])

// プレビュー終了
const handlePreviewEnd = useCallback(() => {
  cleanupPreview?.()
  setCleanupPreview(null)
}, [cleanupPreview])

// テーマ選択
const handleSelect = async (themeId: string) => {
  handlePreviewEnd()  // プレビューを解除
  setIsUpdating(true)
  const result = await updateUserThemeSettings({ themePreset: themeId })
  setIsUpdating(false)

  if (result.success) {
    router.refresh()
  }
}

// コンポーネントのアンマウント時にプレビューをクリーンアップ
useEffect(() => {
  return () => {
    cleanupPreview?.()
  }
}, [cleanupPreview])
```

---

### 5.3 ダッシュボード整理 (LOW) - 0.5日

#### 5.3.1 ダッシュボードホーム更新 (2h)

**ファイル**: `app/dashboard/page.tsx`

**現状の問題**:
```typescript
const settingsItems = [
  // ...
  {
    title: "ユーザーデータ設定",
    description: "ユーザーデータの編集",
    href: "/dashboard/userdata",  // ← Phase 0で削除済み
    icon: Logs,
  },
  // ...
]
```

**変更内容**:
1. 「ユーザーデータ設定」リンクを削除
2. 「基本情報設定」を確認（存在しないページへのリンクなら削除）
3. カード説明文を更新

**変更後**:
```typescript
const settingsItems = [
  {
    title: "プロフィールエディター",
    description: "プロフィール・テーマ・セクションの編集",
    href: "/dashboard/profile-editor",
    icon: UserCircle,
  },
  {
    title: "プラットフォーム連携",
    description: "Twitch・YouTubeとの連携設定",
    href: "/dashboard/platforms",
    icon: Tv,
  },
  {
    title: "通知・連絡方法設定",
    description: "お知らせと連絡方法の設定",
    href: "/dashboard/notifications",
    icon: Bell,
  },
]
```

#### 5.3.2 サイドバー確認 (1h)

**ファイル**: `components/sidebar-content/DashboardSidebarContent.tsx`

**確認項目**:
- 削除済みページへのリンクがないか確認
- ナビゲーション構造の整合性確認
- FAQ管理リンクの存在確認

---

### 5.4 テスト・検証 (0.5日)

#### 5.4.1 テーマ選択テスト (2h)

**確認項目**:
- 9テーマ全て選択可能
- テーマファミリーごとにグループ表示
- hover時にプレビューが即時反映
- click時にサーバー保存
- mouseLeaveでプレビュー解除
- 旧テーマID（`claymorphic`, `minimal`）が正しく変換される

#### 5.4.2 ダッシュボードナビテスト (1h)

**確認項目**:
- ダッシュボードホームのリンクが全て有効
- サイドバーのリンクが全て有効
- 404ページへの遷移がないこと

#### 5.4.3 ビルド検証 (1h)

- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

---

## 依存関係マップ

```
Phase 4完了
    │
    ├──► 5.1.1 ThemePresetSelector改修
    │       │
    │       └──► 5.1.2 theme-actions.ts更新
    │               │
    │               └──► 5.1.3 デフォルト値確認
    │
    └──► 5.2.1 プレビューユーティリティ作成
            │
            └──► 5.2.2 index.tsエクスポート
                    │
                    └──► 5.2.3 プレビュー統合
                            │
                            └──► 5.3.1 ダッシュボード更新
                                    │
                                    └──► 5.3.2 サイドバー確認
                                            │
                                            └──► 5.4 テスト・検証
```

### クリティカルパス

```
5.2.1 → 5.2.2 → 5.1.1 → 5.2.3 → 5.4
```

---

## 潜在リスク

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| **CSS変数プレビューの競合** | 低 | 中 | クリーンアップ関数で安全に復元 |
| **モバイルでの9テーマ表示** | 中 | 低 | `grid-cols-3`で3列表示、カードサイズ調整 |
| **旧テーマIDの互換性** | 低 | 中 | `compat.ts`で既に対応済み |
| **プレビュー中のメモリリーク** | 低 | 中 | useEffectでアンマウント時クリーンアップ |
| **タッチデバイスでのhover** | 中 | 低 | タップで即時適用、プレビューなし |

---

## 見積もりサマリー

| Day | タスク | 工数 |
|-----|--------|------|
| Day 1 | 5.2.1 プレビューユーティリティ + 5.1.1 ThemePresetSelector改修 | 6h |
| Day 2 | 5.1.2 theme-actions.ts + 5.2.3 プレビュー統合 | 4.5h |
| Day 3 | 5.3.1-5.3.2 ダッシュボード整理 + 5.4 テスト・検証 | 5h |
| **合計** | | **15.5h（約2.5日）** |

親計画の見積もり（4-5日）から大幅に短縮。既存実装の活用により効率化。

---

## 重要ファイル一覧

### 新規作成

| ファイル | タスク | 説明 |
|----------|--------|------|
| `lib/themes/preview.ts` | 5.2.1 | テーマプレビューユーティリティ |

### 更新

| ファイル | タスク | 変更内容 |
|----------|--------|----------|
| `components/sidebar-content/components/ThemePresetSelector.tsx` | 5.1.1, 5.2.3 | 9テーマ対応、プレビュー機能 |
| `app/actions/user/theme-actions.ts` | 5.1.2 | 動的テーマ検証 |
| `lib/themes/index.ts` | 5.2.2 | previewエクスポート追加 |
| `app/dashboard/page.tsx` | 5.3.1 | ナビゲーション更新 |

### 参照（変更なし）

| ファイル | 用途 |
|----------|------|
| `lib/themes/registry.ts` | テーマ一覧取得、検証 |
| `lib/themes/presets/*.ts` | テーマ定義（9種類） |
| `lib/themes/compat.ts` | 互換性レイヤー |
| `lib/themes/types.ts` | テーマ型定義 |
| `components/theme-provider/UserThemeProvider.tsx` | テーマ適用 |

---

## 検証チェックリスト

### Phase 5完了時

**ファイル確認**:
- [ ] `lib/themes/preview.ts` が作成されている
- [ ] `ThemePresetSelector.tsx` が9テーマに対応
- [ ] `theme-actions.ts` が`hasTheme()`を使用
- [ ] `dashboard/page.tsx` から`/dashboard/userdata`リンクが削除

**動作確認**:
- [ ] 9テーマ全て選択可能
- [ ] テーマファミリーごとにグループ表示（Claymorphic, Minimal, Pastel Dream）
- [ ] hover時にプレビューが即時反映
- [ ] click時にサーバー保存、ページリフレッシュ
- [ ] mouseLeaveでプレビュー解除（元のテーマに戻る）
- [ ] 旧テーマID（`claymorphic`）が`claymorphic-warm`に正しく変換
- [ ] ダッシュボードホームのリンクが全て有効

**ビルド確認**:
- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

---

## 次のPhaseへの引き継ぎ

Phase 5が完了したら、以下の状態になっている必要があります：

1. **テーマ選択**: 9テーマから視覚的に選択可能
2. **プレビュー機能**: hover時に即時プレビュー、保存前に確認可能
3. **ダッシュボード整理**: 不要リンクが削除、ナビゲーション整合性確保
4. **セクションエディター**: 完全に機能（Phase 4で完了済み）

これにより、**Phase 6「残りテーマ作成」**で：
- 追加テーマ（Cyberpunk, Gaming, Nature等）の作成
- `lib/themes/presets/`に追加するだけで自動的にUIに反映
- ThemePresetSelectorは変更不要（動的取得のため）

が可能になります。

---

## 実装順序のまとめ

```
1. lib/themes/preview.ts を作成（プレビュー基盤）
2. lib/themes/index.ts にエクスポート追加
3. theme-actions.ts を動的検証に更新
4. ThemePresetSelector.tsx を9テーマ対応に改修
5. ThemePresetSelector.tsx にプレビュー機能を統合
6. app/dashboard/page.tsx のリンクを修正
7. サイドバーの整合性確認
8. テスト・検証
```

## 実装完了

✅ Phase 5 実装完了
Phase 5の実装が完了しました！以下の作業を完了しました：

📝 実装内容
1. プレビュー機能の実装
✅ lib/themes/preview.ts - テーマプレビューユーティリティを作成
✅ lib/themes/index.ts - プレビュー関数をエクスポート
2. 動的テーマ検証
✅ app/actions/user/theme-actions.ts - hasTheme()とmigrateLegacyThemeId()を使用した動的検証に更新
✅ ハードコードされたALLOWED_PRESETSを削除
✅ 旧テーマID（claymorphic, minimal）の互換性対応
3. ThemePresetSelectorの9テーマ対応
✅ components/sidebar-content/components/ThemePresetSelector.tsx - 完全リニューアル
9テーマ全てを動的に取得・表示
テーマファミリーごとにグループ化（Claymorphic, Minimal, Pastel Dream）
カラープレビュー表示
hover時の即時プレビュー機能
クリーンアップ処理の実装
4. ダッシュボード整理
✅ app/dashboard/page.tsx - 削除済みページへのリンクを削除
/dashboard/account - 削除
/dashboard/userdata - 削除
✅ サイドバーの整合性確認完了
🎨 UI設計

テーマプリセット

Claymorphic
┌────────┐ ┌────────┐ ┌────────┐
│  Warm  │ │  Cool  │ │  Dark  │
│   ✓    │ │        │ │        │
│ [色]   │ │ [色]   │ │ [色]   │
└────────┘ └────────┘ └────────┘

Minimal
┌────────┐ ┌────────┐ ┌────────┐
│ White  │ │  Gray  │ │ Black  │
│ [色]   │ │ [色]   │ │ [色]   │
└────────┘ └────────┘ └────────┘

Pastel Dream
┌────────┐ ┌────────┐ ┌────────┐
│  Pink  │ │  Mint  │ │  Blue  │
│ [色]   │ │ [色]   │ │ [色]   │
└────────┘ └────────┘ └────────┘
✅ 検証結果
✅ TypeScript型チェック: 成功（エラー0件）
✅ ESLint: 成功（ソースコードのエラー0件）
---

**最終更新**: 2026-02-26
