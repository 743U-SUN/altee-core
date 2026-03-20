# Phase 2: セクションシステム基盤 - 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-24
> **見積もり**: 4.5日
> **依存関係**: Phase 1（テーマシステム基盤）完了後に開始

---

## 概要

Phase 2はセクションシステムの基盤を構築するフェーズです。Phase 1で完成したテーマシステムと統合し、セクションの幅制御、エラーハンドリング、遅延読み込みを実現します。

**主な成果物**:
- セクション型定義の整理・拡張（`lib/sections/`）
- 幅制御コンポーネント（SectionWrapper）
- 拡張ThemedCard（装飾コンポーネント統合）
- ErrorBoundary + SectionErrorFallback
- SectionSkeleton（ローディング状態）
- 遅延読み込み基盤（React.lazy + Suspense）

---

## 現状分析

### 既存のセクションシステム

```
lib/
├── section-registry.ts      # 18セクション登録済み
└── section-type-guards.ts   # 型ガード関数

components/user-profile/
├── SectionRenderer.tsx      # 読み取り用レンダラー
├── EditableSectionRenderer.tsx  # 編集用レンダラー
└── sections/
    ├── ThemedCard.tsx       # CSS変数ベースのカード
    ├── *Section.tsx         # 各セクションコンポーネント
    └── editors/             # 編集モーダル
```

### Phase 1で完成したもの

- テーマシステム: 9テーマ（Claymorphic/Minimal/Pastel Dream × 3カラー）
- ThemeProvider: `components/theme-provider/UserThemeProvider.tsx`
- 装飾コンポーネント: `components/decorations/`（Badge, Divider, IconContainer, CornerDecor）
- Tailwind v4統合: `app/globals.css`の`@theme inline`

### Phase 2で追加すること

1. **幅制御**: Large (1200px) / Medium (720px)
2. **遅延読み込み**: React.lazy() + Suspense
3. **エラーハンドリング**: セクションごとのErrorBoundary
4. **ディレクトリ整理**: `lib/sections/`, `components/profile/`, `components/sections/`

---

## タスク詳細

### 2.1 セクション型定義（2h）- CRITICAL

**依存**: Phase 1完了
**成果物**: `lib/sections/types.ts`, `types/section.ts`

#### 新規ディレクトリ作成

```
lib/sections/
├── types.ts      # 型定義
├── registry.ts   # レジストリ（2.2で作成）
├── type-guards.ts # 型ガード（2.2で作成）
└── index.ts      # エクスポート
```

#### 新規型定義

```typescript
// lib/sections/types.ts

/**
 * セクションの幅タイプ
 */
export type SectionWidth = 'large' | 'medium'

/**
 * セクションの読み込み優先度
 */
export type SectionPriority = 'high' | 'medium' | 'low'

/**
 * セクションカテゴリ
 */
export type SectionCategory =
  | 'main'
  | 'image'
  | 'links'
  | 'content'
  | 'data'
  | 'video'
  | 'structure'

/**
 * セクション定義（拡張版）
 */
export interface SectionDefinition {
  type: string
  label: string
  description: string
  icon: string
  category: SectionCategory
  width: SectionWidth           // 新規: 幅制御
  maxInstances?: number
  priority: SectionPriority     // 新規: 読み込み優先度
  component: ComponentType<BaseSectionProps> | ReturnType<typeof lazy>
  editorComponent?: ComponentType<SectionEditorProps>
  defaultData: unknown
  validate?: (data: unknown) => boolean
}
```

#### 公開型定義

```typescript
// types/section.ts
export type {
  SectionWidth,
  SectionPriority,
  SectionCategory,
  SectionDefinition,
} from '@/lib/sections/types'
```

#### 検証

- [ ] `lib/sections/types.ts`が作成されている
- [ ] `types/section.ts`が作成されている
- [ ] TypeScriptエラーがない

---

### 2.2 セクションレジストリ移行（3h）- CRITICAL

**依存**: 2.1
**成果物**: `lib/sections/registry.ts`, `lib/sections/type-guards.ts`

#### 幅の割り当て

| 幅 | セクションタイプ | 用途 |
|----|-----------------|------|
| **Large (1200px)** | `character-profile`, `image-hero`, `image-grid-2`, `image-grid-3`, `video-gallery`, `icon-links` | ビジュアル重視 |
| **Medium (720px)** | その他すべて | テキスト・リスト重視 |

#### 優先度の割り当て

| 優先度 | セクションタイプ | 読み込みタイミング |
|--------|-----------------|-------------------|
| **high** | `profile-card`, `character-profile`, `image-hero` | 即座に読み込み |
| **medium** | `faq`, `links`, `icon-links`, `bar-graph`, `circular-stat`, `header` | Intersection Observer |
| **low** | `youtube`, `video-gallery`, `timeline`, `weekly-schedule`, `long-text` | ビューポート外 |

#### レジストリ構造

```typescript
// lib/sections/registry.ts
import { lazy, type ComponentType } from 'react'
import type { SectionDefinition, SectionCategory } from './types'

export const SECTION_REGISTRY: Record<string, SectionDefinition> = {
  'profile-card': {
    type: 'profile-card',
    label: 'プロフィールカード',
    description: '名前・Bio・バッジを表示',
    icon: 'User',
    category: 'main',
    width: 'medium',
    priority: 'high',
    component: lazy(() => import('@/components/sections/ProfileCardSection')),
    defaultData: { /* ... */ },
  },

  'image-hero': {
    type: 'image-hero',
    label: 'ヒーロー画像',
    description: '大きな画像を表示（21:9）',
    icon: 'Image',
    category: 'image',
    width: 'large',
    maxInstances: 1,
    priority: 'high',
    component: lazy(() => import('@/components/sections/ImageHeroSection')),
    defaultData: { /* ... */ },
  },

  // ... 他のセクション
}

/**
 * セクション定義を取得
 */
export function getSectionDefinition(type: string): SectionDefinition | undefined {
  return SECTION_REGISTRY[type]
}

/**
 * 全セクション定義を取得
 */
export function getAllSectionDefinitions(): SectionDefinition[] {
  return Object.values(SECTION_REGISTRY)
}

/**
 * カテゴリでフィルタリング
 */
export function getSectionsByCategory(category: SectionCategory): SectionDefinition[] {
  return getAllSectionDefinitions().filter(def => def.category === category)
}

/**
 * 高優先度セクションをpreload
 */
export function preloadHighPrioritySections(): void {
  getAllSectionDefinitions()
    .filter(def => def.priority === 'high')
    .forEach(def => {
      // Trigger lazy load
      const component = def.component as ReturnType<typeof lazy>
      if (component._payload) {
        component._init(component._payload)
      }
    })
}
```

#### 削除対象

| ファイル | 理由 |
|----------|------|
| `lib/section-registry.ts` | `lib/sections/registry.ts`へ移行 |
| `lib/section-type-guards.ts` | `lib/sections/type-guards.ts`へ移行 |

#### 検証

- [ ] `lib/sections/registry.ts`が作成されている
- [ ] `getSectionDefinition()`がwidth/priorityを返す
- [ ] `getAllSectionDefinitions()`が18セクションを返す
- [ ] 旧ファイルが削除されている
- [ ] インポートパスが更新されている

---

### 2.3 SectionWrapper実装（3h）- HIGH

**依存**: 2.2
**成果物**: `components/profile/SectionWrapper.tsx`

#### コンポーネント実装

```typescript
// components/profile/SectionWrapper.tsx
import type { ReactNode } from 'react'
import type { SectionWidth } from '@/lib/sections/types'
import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  width: SectionWidth
  children: ReactNode
  className?: string
}

/**
 * セクションの幅を制御するラッパーコンポーネント
 * - Large: 1200px（ビジュアル重視）
 * - Medium: 720px（テキスト重視）
 * - モバイルでは両方ともフル幅
 */
export function SectionWrapper({
  width,
  children,
  className,
}: SectionWrapperProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6',
        width === 'large' ? 'max-w-[1200px]' : 'max-w-[720px]',
        className
      )}
    >
      {children}
    </div>
  )
}
```

#### 検証

- [ ] Large幅で`max-w-[1200px]`が適用される
- [ ] Medium幅で`max-w-[720px]`が適用される
- [ ] モバイルではフル幅（padding付き）

---

### 2.4 ThemedCard拡張（4h）- HIGH

**依存**: Phase 1.3（装飾コンポーネント）
**成果物**: `components/sections/_shared/ThemedCard.tsx`

#### 移動元

`components/user-profile/sections/ThemedCard.tsx`

#### 拡張後の実装

```typescript
// components/sections/_shared/ThemedCard.tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider'
import { CornerDecor } from '@/components/decorations'

interface ThemedCardProps {
  children: ReactNode
  className?: string
  showCornerDecor?: boolean
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: 'sm' | 'md' | 'lg'
  hover?: boolean
}

/**
 * テーマ対応カードコンポーネント
 * - CSS変数によるテーマスタイリング
 * - オプションの装飾（CornerDecor）
 * - テーマ連動のhoverエフェクト
 */
export function ThemedCard({
  children,
  className = '',
  showCornerDecor = false,
  cornerPosition = 'top-right',
  size = 'md',
  hover = false,
}: ThemedCardProps) {
  const { getDecoration } = useUserTheme()
  const hoverEffect = getDecoration('cardHover')

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverClasses: Record<string, string> = {
    lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
    glow: 'hover:shadow-[0_0_20px_var(--theme-accent-bg)] transition-shadow duration-200',
    press: 'hover:scale-[0.98] active:scale-95 transition-transform duration-200',
    shake: 'hover:animate-shake',
    none: '',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-theme-card-bg rounded-theme shadow-theme',
        sizeClasses[size],
        hover && hoverClasses[hoverEffect],
        className
      )}
      style={{
        // Tailwind v4でサポートされないプロパティはstyleで
        borderWidth: 'var(--theme-card-border-width, 0)',
        borderColor: 'var(--theme-card-border)',
      }}
    >
      {showCornerDecor && <CornerDecor position={cornerPosition} />}
      {children}
    </div>
  )
}
```

#### 検証

- [ ] Tailwindクラス（`bg-theme-card-bg`等）が適用される
- [ ] `showCornerDecor`でCornerDecorが表示される
- [ ] `hover`でテーマ連動のhoverエフェクトが適用される
- [ ] 3つのsizeバリエーションが正しく動作する

---

### 2.5 SectionRenderer基本実装（4h）- HIGH

**依存**: 2.3, 2.4
**成果物**: `components/profile/SectionRenderer.tsx`

#### コンポーネント実装

```typescript
// components/profile/SectionRenderer.tsx
import { useMemo } from 'react'
import type { UserSection } from '@/types/profile-sections'
import { getSectionDefinition } from '@/lib/sections/registry'
import { SectionWrapper } from './SectionWrapper'

interface SectionRendererProps {
  sections: UserSection[]
  isEditable?: boolean
}

/**
 * セクション一覧をレンダリング
 * - 幅制御（SectionWrapper）
 * - ソート（sortOrder）
 * - 表示制御（isVisible）
 */
export function SectionRenderer({
  sections,
  isEditable = false,
}: SectionRendererProps) {
  const sortedSections = useMemo(
    () =>
      sections
        .filter((section) => section.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  )

  return (
    <div className="space-y-6 w-full">
      {sortedSections.map((section) => {
        const definition = getSectionDefinition(section.sectionType)
        if (!definition) {
          console.warn(`Unknown section type: ${section.sectionType}`)
          return null
        }

        const Component = definition.component

        return (
          <SectionWrapper key={section.id} width={definition.width}>
            <Component section={section} isEditable={isEditable} />
          </SectionWrapper>
        )
      })}
    </div>
  )
}
```

#### 検証

- [ ] 各セクションが正しい幅で表示される
- [ ] sortOrderでソートされる
- [ ] isVisible=falseのセクションは非表示

---

### 2.6 ErrorBoundary実装（3h）- HIGH

**依存**: なし（独立タスク）
**成果物**: `components/error-boundary.tsx`

#### コンポーネント実装

```typescript
// components/error-boundary.tsx
'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React 19対応のErrorBoundary
 * - セクションごとの独立したエラーハンドリング
 * - リトライ機能（reset）
 * - エラーログ送信（onError）
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset)
      }
      return fallback
    }
    return this.props.children
  }
}
```

#### 検証

- [ ] エラー発生時にfallbackが表示される
- [ ] reset()でコンポーネントが再レンダリングされる
- [ ] onErrorでエラーがログされる

---

### 2.7 SectionSkeleton実装（2h）- MEDIUM

**依存**: 2.3
**成果物**: `components/profile/SectionSkeleton.tsx`

#### コンポーネント実装

```typescript
// components/profile/SectionSkeleton.tsx
import type { SectionWidth } from '@/lib/sections/types'
import { cn } from '@/lib/utils'

interface SectionSkeletonProps {
  width?: SectionWidth
  className?: string
}

/**
 * セクションローディング状態のスケルトン
 * - 幅制御対応
 * - テーマ対応スタイリング
 * - animate-pulseアニメーション
 */
export function SectionSkeleton({
  width = 'medium',
  className,
}: SectionSkeletonProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6',
        width === 'large' ? 'max-w-[1200px]' : 'max-w-[720px]',
        className
      )}
    >
      <div className="bg-theme-card-bg rounded-theme p-6 shadow-theme animate-pulse">
        {/* ヘッダー部分 */}
        <div className="h-4 w-1/4 bg-theme-bar-bg rounded mb-4" />

        {/* コンテンツ部分 */}
        <div className="space-y-3">
          <div className="h-3 bg-theme-bar-bg rounded w-full" />
          <div className="h-3 bg-theme-bar-bg rounded w-5/6" />
          <div className="h-3 bg-theme-bar-bg rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}
```

#### 検証

- [ ] 幅に応じたmax-widthが適用される
- [ ] テーマカラーが反映される
- [ ] アニメーションが動作する

---

### 2.8 SectionErrorFallback実装（2h）- MEDIUM

**依存**: 2.6, 2.7
**成果物**: `components/profile/SectionErrorFallback.tsx`

#### コンポーネント実装

```typescript
// components/profile/SectionErrorFallback.tsx
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { SectionWidth } from '@/lib/sections/types'
import { getSectionDefinition } from '@/lib/sections/registry'
import { cn } from '@/lib/utils'

interface SectionErrorFallbackProps {
  sectionType: string
  error: Error
  onRetry: () => void
  width?: SectionWidth
}

/**
 * セクションエラー時のフォールバック表示
 * - セクション名の日本語表示
 * - リトライボタン
 * - 開発環境ではエラー詳細表示
 */
export function SectionErrorFallback({
  sectionType,
  error,
  onRetry,
  width = 'medium',
}: SectionErrorFallbackProps) {
  const definition = getSectionDefinition(sectionType)
  const sectionLabel = definition?.label || sectionType

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6',
        width === 'large' ? 'max-w-[1200px]' : 'max-w-[720px]'
      )}
    >
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <h3 className="text-sm font-medium text-destructive mb-1">
          {sectionLabel}の読み込みに失敗しました
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          しばらく経ってからもう一度お試しください
        </p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          再読み込み
        </Button>

        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 text-xs text-left bg-muted p-2 rounded overflow-auto max-h-32">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
      </div>
    </div>
  )
}
```

#### 検証

- [ ] セクション名が日本語で表示される
- [ ] リトライボタンが動作する
- [ ] 開発環境でエラー詳細が表示される
- [ ] 本番環境ではエラー詳細が非表示

---

### 2.9 レジストリに遅延読み込み追加（4h）- HIGH

**依存**: 2.2
**成果物**: `lib/sections/registry.ts`の更新

#### 実装内容

```typescript
// lib/sections/registry.ts
import { lazy } from 'react'

// 全セクションをReact.lazy()でラップ
export const SECTION_REGISTRY: Record<string, SectionDefinition> = {
  'profile-card': {
    // ...
    component: lazy(() => import('@/components/sections/ProfileCardSection')),
  },
  'faq': {
    // ...
    component: lazy(() => import('@/components/sections/FAQSection')),
  },
  // ... 他のセクション
}
```

#### preload関数

```typescript
/**
 * 高優先度セクションをpreload
 */
export async function preloadHighPrioritySections(): Promise<void> {
  const highPriority = getAllSectionDefinitions()
    .filter(def => def.priority === 'high')

  await Promise.all(
    highPriority.map(async (def) => {
      try {
        // Dynamic importをトリガー
        await (def.component as { _payload?: unknown })._payload
      } catch {
        // preload失敗は無視
      }
    })
  )
}
```

#### 検証

- [ ] 全セクションがlazy()でラップされている
- [ ] ビルドが成功する
- [ ] 遅延読み込みが動作する

---

### 2.10 SectionRenderer統合（4h）- HIGH

**依存**: 2.5, 2.6, 2.7, 2.8, 2.9
**成果物**: `components/profile/SectionRenderer.tsx`の完成版

#### 最終実装

```typescript
// components/profile/SectionRenderer.tsx
import { Suspense, useMemo } from 'react'
import type { UserSection } from '@/types/profile-sections'
import { getSectionDefinition } from '@/lib/sections/registry'
import { SectionWrapper } from './SectionWrapper'
import { SectionSkeleton } from './SectionSkeleton'
import { SectionErrorFallback } from './SectionErrorFallback'
import { ErrorBoundary } from '@/components/error-boundary'

interface SectionRendererProps {
  sections: UserSection[]
  isEditable?: boolean
}

/**
 * セクション一覧をレンダリング（完成版）
 * - 幅制御（SectionWrapper）
 * - 遅延読み込み（Suspense + SectionSkeleton）
 * - エラーハンドリング（ErrorBoundary + SectionErrorFallback）
 */
export function SectionRenderer({
  sections,
  isEditable = false,
}: SectionRendererProps) {
  const sortedSections = useMemo(
    () =>
      sections
        .filter((section) => section.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  )

  return (
    <div className="space-y-6 w-full">
      {sortedSections.map((section) => {
        const definition = getSectionDefinition(section.sectionType)
        if (!definition) {
          console.warn(`Unknown section type: ${section.sectionType}`)
          return null
        }

        const Component = definition.component

        return (
          <ErrorBoundary
            key={section.id}
            fallback={(error, reset) => (
              <SectionErrorFallback
                sectionType={section.sectionType}
                error={error}
                onRetry={reset}
                width={definition.width}
              />
            )}
            onError={(error, errorInfo) => {
              // 本番環境ではエラーログサービスに送信
              if (process.env.NODE_ENV === 'production') {
                // TODO: Sentry等への送信
              }
            }}
          >
            <Suspense fallback={<SectionSkeleton width={definition.width} />}>
              <SectionWrapper width={definition.width}>
                <Component section={section} isEditable={isEditable} />
              </SectionWrapper>
            </Suspense>
          </ErrorBoundary>
        )
      })}
    </div>
  )
}
```

#### 検証

- [ ] 遅延読み込み時にSectionSkeletonが表示される
- [ ] エラー時にSectionErrorFallbackが表示される
- [ ] 1つのセクションエラーが他に影響しない
- [ ] リトライボタンで再読み込みされる

---

### 2.11 ディレクトリ構造の移行（3h）

**依存**: 2.1-2.10
**成果物**: 新しいディレクトリ構造

#### 移行内容

```
# 削除
lib/section-registry.ts
lib/section-type-guards.ts

# 新規作成
lib/sections/
├── types.ts
├── registry.ts
├── type-guards.ts
└── index.ts

types/
└── section.ts  # 新規

# 移動・リネーム
components/user-profile/SectionRenderer.tsx
  → components/profile/SectionRenderer.tsx

components/user-profile/sections/ThemedCard.tsx
  → components/sections/_shared/ThemedCard.tsx

# 新規作成
components/profile/
├── SectionWrapper.tsx
├── SectionSkeleton.tsx
└── SectionErrorFallback.tsx

components/error-boundary.tsx
```

#### インポート更新が必要なファイル

| ファイル | 変更内容 |
|----------|----------|
| `app/[handle]/page.tsx` | SectionRenderer import更新 |
| `app/[handle]/_components/*.tsx` | 該当あれば更新 |
| 各セクションコンポーネント | ThemedCard import更新 |
| `lib/sections/registry.ts` | セクションコンポーネントのimport更新 |

#### 検証

- [ ] 全ファイルが正しい場所にある
- [ ] インポートパスが更新されている
- [ ] ビルドが成功する

---

### 2.12 統合テスト・バグ修正（4h）

**依存**: 2.11
**成果物**: 動作確認済みのシステム

#### テスト項目

**ファイル作成確認**:
- [ ] `lib/sections/types.ts`
- [ ] `lib/sections/registry.ts`
- [ ] `lib/sections/type-guards.ts`
- [ ] `lib/sections/index.ts`
- [ ] `types/section.ts`
- [ ] `components/profile/SectionWrapper.tsx`
- [ ] `components/profile/SectionRenderer.tsx`
- [ ] `components/profile/SectionSkeleton.tsx`
- [ ] `components/profile/SectionErrorFallback.tsx`
- [ ] `components/sections/_shared/ThemedCard.tsx`
- [ ] `components/error-boundary.tsx`

**動作確認**:
- [ ] `getSectionDefinition()`がwidth/priorityを返す
- [ ] SectionWrapperがLarge/Mediumで正しいmax-widthを適用
- [ ] ThemedCardでCornerDecorが表示される
- [ ] 遅延読み込みでSectionSkeletonが表示される
- [ ] セクションエラー時にErrorFallbackが表示される
- [ ] 1つのセクションエラーが他に影響しない
- [ ] `/[handle]`ページが正常に表示される

**ビルド確認**:
- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

**パフォーマンス確認**:
- [ ] Chrome DevTools Networkで遅延読み込みを確認
- [ ] Lighthouse Performance測定

---

## 依存関係マップ

```
Phase 1完了
    │
    ├──► 2.1 セクション型定義
    │       │
    │       └──► 2.2 セクションレジストリ移行
    │               │
    │               ├──► 2.3 SectionWrapper
    │               │       │
    │               │       └──► 2.5 SectionRenderer基本
    │               │
    │               └──► 2.9 遅延読み込み追加
    │
    ├──► 2.4 ThemedCard拡張 ◄── Phase 1 装飾コンポーネント
    │
    ├──► 2.6 ErrorBoundary（独立）
    │       │
    │       └──► 2.8 SectionErrorFallback
    │
    └──► 2.7 SectionSkeleton
            │
            └──► 2.10 SectionRenderer統合
                    │
                    └──► 2.11 ディレクトリ移行
                            │
                            └──► 2.12 統合テスト
```

---

## リスク管理

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| **インポートパス変更による破壊** | 高 | 高 | 1ファイルずつ移行、各ステップでビルド確認 |
| **React.lazy()のSSR問題** | 中 | 高 | `next/dynamic`との比較検討、必要なら切り替え |
| **ErrorBoundaryのReact 19互換性** | 低 | 中 | React公式ドキュメント確認、テスト |
| **幅制御のモバイル表示崩れ** | 中 | 低 | モバイルファーストでテスト |
| **ThemedCard装飾統合での競合** | 中 | 中 | 段階的に機能追加、既存コードに影響なし |

---

## 見積もりサマリー

| Day | タスク | 工数 |
|-----|--------|------|
| Day 1 午前 | 2.1 型定義 + 2.2 レジストリ移行 | 5h |
| Day 1 午後 | 2.3 SectionWrapper + 2.5 SectionRenderer基本 | 4h |
| Day 2 午前 | 2.4 ThemedCard拡張 | 4h |
| Day 2 午後 | 2.6 ErrorBoundary + 2.7 Skeleton + 2.8 ErrorFallback | 4h |
| Day 3 午前 | 2.9 遅延読み込み追加 | 4h |
| Day 3 午後 | 2.10 SectionRenderer統合 | 4h |
| Day 4 午前 | 2.11 ディレクトリ移行 | 3h |
| Day 4 午後 | 2.12 統合テスト・バグ修正 | 4h |
| **合計** | | **38h（約4.5日）** |

---

## 次のPhaseへの引き継ぎ

Phase 2が完了したら、以下の状態になっている必要があります：

1. **セクションシステム基盤**: 型定義、レジストリ、幅制御
2. **テーマ統合**: ThemedCardが装飾コンポーネントを統合
3. **エラーハンドリング**: セクションごとの独立したエラー処理
4. **遅延読み込み**: Suspense + React.lazyで初期ロード改善

これにより、**Phase 3「1カラムレイアウト」**でProfileLayoutを実装し、新しいCharacterProfileSectionを作成できます。

---

**最終更新**: 2026-02-24
