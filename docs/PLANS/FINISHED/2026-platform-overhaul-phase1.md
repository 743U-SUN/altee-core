
> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-24
> **見積もり**: 4-5日
> **依存関係**: Phase 0完了後に開始

---

## 概要

Phase 1は、新しいテーマシステムの基盤を構築するフェーズです。
既存の`lib/theme-presets.ts`を拡張し、3層アーキテクチャ（Base/Variant/Color）を持つ
スケーラブルなテーマシステムを構築します。

**主な成果物**:
- 新しいテーマ型定義
- Claymorphicテーマ（Warm/Cool/Dark）
- ThemeProvider + Tailwind統合
- 装飾コンポーネント群

---

## 現状分析

### 既存のテーマシステム

```typescript
// lib/theme-presets.ts（現状）
export interface ThemePreset {
  name: string
  displayName: string
  variables: React.CSSProperties
}

// 現在のテーマ: claymorphic, minimal（2種類のみ）
```

### 変更後のテーマシステム

```typescript
// lib/themes/types.ts（新規）
export interface ThemePreset {
  id: string                      // "claymorphic-warm"
  name: string                    // "Claymorphic"
  colorVariant: string            // "warm"
  displayName: string             // "Claymorphic - ウォーム"
  base: ThemeBase                 // "neumorphic"
  palette: ThemeColorPalette      // カラーパレット
  decorations: ThemeDecorations   // 装飾設定
  variables: Record<string, string>
}
```

---

## タスク一覧

### 1.1 テーマ型定義（優先度: HIGH）

**依存**: Phase 0完了
**見積もり**: 0.5日

#### 新規作成ファイル

```
lib/themes/
├── types.ts          # 型定義
├── index.ts          # エクスポート
└── presets/
    └── index.ts      # プリセットエクスポート

types/
└── theme.ts          # 公開型定義
```

#### 型定義の詳細

```typescript
// lib/themes/types.ts

/**
 * テーマベース（スタイルの基本形）
 */
export type ThemeBase = 'neumorphic' | 'flat' | 'glass' | 'card'

/**
 * セクションカテゴリ
 */
export type SectionCategory =
  | 'main'      // メインコンテンツ
  | 'image'     // 画像系
  | 'links'     // リンク系
  | 'content'   // テキストコンテンツ
  | 'data'      // データ表示
  | 'video'     // 動画系
  | 'structure' // 構造要素

/**
 * カラーパレット
 */
export interface ThemeColorPalette {
  name: string              // "warm", "cool", "dark"
  displayName: string       // "ウォーム", "クール", "ダーク"
  primary: string           // メインカラー
  secondary: string         // サブカラー
  accent: string            // アクセントカラー
  background: string        // 背景色
  cardBackground: string    // カード背景色
  text: {
    primary: string         // メインテキスト
    secondary: string       // サブテキスト
    accent: string          // アクセントテキスト
  }
}

/**
 * 装飾設定
 */
export interface ThemeDecorations {
  badge: 'pill' | 'ribbon' | 'tag' | 'star' | 'none'
  divider: 'line' | 'dots' | 'gradient' | 'wave' | 'none'
  iconContainer: 'circle' | 'rounded' | 'square' | 'hexagon' | 'none'
  cardHover: 'lift' | 'glow' | 'press' | 'shake' | 'none'
  cornerDecor: 'ribbon' | 'star' | 'heart' | 'none'
}

/**
 * テーマプリセット
 */
export interface ThemePreset {
  id: string                              // "claymorphic-warm"
  name: string                            // "Claymorphic"
  colorVariant: string                    // "warm"
  displayName: string                     // "Claymorphic - ウォーム"
  description?: string                    // テーマの説明
  base: ThemeBase                         // "neumorphic"
  palette: ThemeColorPalette              // カラーパレット
  decorations: ThemeDecorations           // 装飾設定
  variables: Record<string, string>       // CSS変数
  tailwindExtensions?: Record<string, string> // Tailwind拡張（オプション）
}

/**
 * テーマ設定（ユーザーカスタマイズ用）
 */
export interface ThemeSettings {
  themeId: string                         // 選択されたテーマID
  accentColor?: string                    // カスタムアクセント色
  fontFamily?: string                     // フォント
  customOverrides?: Record<string, string> // カスタムオーバーライド
}

/**
 * テーマコンテキスト値
 */
export interface ThemeContextValue {
  theme: ThemePreset
  settings: ThemeSettings
  variables: Record<string, string>
  getDecoration: (type: keyof ThemeDecorations) => string
}
```

#### types/theme.ts（公開型定義）

```typescript
// types/theme.ts
export type {
  ThemeBase,
  ThemeColorPalette,
  ThemeDecorations,
  ThemePreset,
  ThemeSettings,
  ThemeContextValue,
} from '@/lib/themes/types'
```

#### 検証

- [ ] `lib/themes/types.ts`が作成されている
- [ ] `types/theme.ts`が作成されている
- [ ] TypeScriptエラーがない
- [ ] 既存の`ThemeSettings`型との互換性確認

---

### 1.2 最初のテーマ作成（優先度: HIGH）

**依存**: 1.1
**見積もり**: 1日

#### Claymorphicテーマ（3バリエーション）

既存の`claymorphicPreset`をベースに、3つのカラーバリエーションを作成。

```
lib/themes/presets/
├── claymorphic.ts    # Claymorphic (Warm/Cool/Dark)
└── index.ts
```

#### claymorphic.ts の構造

```typescript
// lib/themes/presets/claymorphic.ts

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'

/**
 * Claymorphic ベース装飾設定
 */
const claymorphicDecorations: ThemeDecorations = {
  badge: 'pill',
  divider: 'none',
  iconContainer: 'circle',
  cardHover: 'press',
  cornerDecor: 'none',
}

/**
 * Warm カラーパレット
 */
const warmPalette: ThemeColorPalette = {
  name: 'warm',
  displayName: 'ウォーム',
  primary: '#b07d4f',
  secondary: '#c9a87c',
  accent: '#b07d4f',
  background: '#e8e4df',
  cardBackground: '#e8e4df',
  text: {
    primary: '#3d3a36',
    secondary: '#7a756e',
    accent: '#b07d4f',
  },
}

/**
 * Cool カラーパレット
 */
const coolPalette: ThemeColorPalette = {
  name: 'cool',
  displayName: 'クール',
  primary: '#5b7a9d',
  secondary: '#8ba3be',
  accent: '#5b7a9d',
  background: '#e4e8ec',
  cardBackground: '#e4e8ec',
  text: {
    primary: '#2d3a47',
    secondary: '#6b7d8f',
    accent: '#5b7a9d',
  },
}

/**
 * Dark カラーパレット
 */
const darkPalette: ThemeColorPalette = {
  name: 'dark',
  displayName: 'ダーク',
  primary: '#a78bfa',
  secondary: '#c4b5fd',
  accent: '#a78bfa',
  background: '#1f1f23',
  cardBackground: '#2d2d33',
  text: {
    primary: '#e4e4e7',
    secondary: '#a1a1aa',
    accent: '#a78bfa',
  },
}

/**
 * CSS変数を生成
 */
function generateClaymorphicVariables(palette: ThemeColorPalette): Record<string, string> {
  const isDark = palette.name === 'dark'

  return {
    '--theme-bg': palette.background,
    '--theme-card-bg': palette.cardBackground,
    '--theme-card-shadow': isDark
      ? '4px 4px 8px #151518, -3px -2px 8px #393942, inset 2px 2px 3px rgba(255,255,255,0.05)'
      : `4px 4px 8px ${adjustColor(palette.background, -15)}, -3px -2px 8px #ffffff, inset 2px 2px 3px rgba(255,255,255,0.6)`,
    '--theme-card-border': 'none',
    '--theme-card-radius': '16px',
    '--theme-text-primary': palette.text.primary,
    '--theme-text-secondary': palette.text.secondary,
    '--theme-text-accent': palette.text.accent,
    '--theme-accent-bg': `${palette.accent}14`,
    '--theme-accent-border': `${palette.accent}33`,
    '--theme-stat-bg': isDark ? '#252529' : adjustColor(palette.background, -5),
    '--theme-stat-border': 'none',
    '--theme-stat-shadow': isDark
      ? '4px 4px 8px #151518, -4px -4px 8px #353540, inset 1px 1px 2px rgba(255,255,255,0.03)'
      : `4px 4px 8px ${adjustColor(palette.background, -15)}, -4px -4px 8px #ffffff, inset 1px 1px 2px rgba(255,255,255,0.5)`,
    '--theme-bar-bg': isDark ? '#3a3a42' : adjustColor(palette.background, -8),
    '--theme-image-bg': `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.background} 100%)`,
    '--theme-header-bg': palette.cardBackground,
    '--theme-header-text': palette.text.primary,
    '--theme-header-shadow': isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  }
}

/**
 * Claymorphic Warm
 */
export const claymorphicWarm: ThemePreset = {
  id: 'claymorphic-warm',
  name: 'Claymorphic',
  colorVariant: 'warm',
  displayName: 'Claymorphic - ウォーム',
  description: '柔らかな粘土質感のニューモーフィズム。暖色系。',
  base: 'neumorphic',
  palette: warmPalette,
  decorations: claymorphicDecorations,
  variables: generateClaymorphicVariables(warmPalette),
}

/**
 * Claymorphic Cool
 */
export const claymorphicCool: ThemePreset = {
  id: 'claymorphic-cool',
  name: 'Claymorphic',
  colorVariant: 'cool',
  displayName: 'Claymorphic - クール',
  description: '柔らかな粘土質感のニューモーフィズム。寒色系。',
  base: 'neumorphic',
  palette: coolPalette,
  decorations: claymorphicDecorations,
  variables: generateClaymorphicVariables(coolPalette),
}

/**
 * Claymorphic Dark
 */
export const claymorphicDark: ThemePreset = {
  id: 'claymorphic-dark',
  name: 'Claymorphic',
  colorVariant: 'dark',
  displayName: 'Claymorphic - ダーク',
  description: '柔らかな粘土質感のニューモーフィズム。ダークモード。',
  base: 'neumorphic',
  palette: darkPalette,
  decorations: claymorphicDecorations,
  variables: generateClaymorphicVariables(darkPalette),
}

// 全Claymorphicテーマをエクスポート
export const claymorphicThemes = [claymorphicWarm, claymorphicCool, claymorphicDark]
```

#### テーマレジストリ

```typescript
// lib/themes/registry.ts

import type { ThemePreset } from './types'
import { claymorphicThemes } from './presets/claymorphic'

/**
 * 全テーマプリセットのレジストリ
 */
export const THEME_REGISTRY: Map<string, ThemePreset> = new Map()

// Claymorphicテーマを登録
claymorphicThemes.forEach(theme => {
  THEME_REGISTRY.set(theme.id, theme)
})

/**
 * テーマを取得
 */
export function getTheme(id: string): ThemePreset | undefined {
  return THEME_REGISTRY.get(id)
}

/**
 * 全テーマを取得
 */
export function getAllThemes(): ThemePreset[] {
  return Array.from(THEME_REGISTRY.values())
}

/**
 * テーマをベースでフィルタ
 */
export function getThemesByBase(base: ThemeBase): ThemePreset[] {
  return getAllThemes().filter(theme => theme.base === base)
}

/**
 * テーマ名でグループ化
 */
export function getThemesGroupedByName(): Record<string, ThemePreset[]> {
  const grouped: Record<string, ThemePreset[]> = {}

  getAllThemes().forEach(theme => {
    if (!grouped[theme.name]) {
      grouped[theme.name] = []
    }
    grouped[theme.name].push(theme)
  })

  return grouped
}

/**
 * デフォルトテーマID
 */
export const DEFAULT_THEME_ID = 'claymorphic-warm'
```

#### 検証

- [ ] `lib/themes/presets/claymorphic.ts`が作成されている
- [ ] `lib/themes/registry.ts`が作成されている
- [ ] 3つのClaymorphicテーマが取得可能
- [ ] `getTheme('claymorphic-warm')`が正しいテーマを返す
- [ ] カラーバリエーションが視覚的に区別可能

---

### 1.3 ThemeProvider実装 + Tailwind v4統合（優先度: HIGH）

**依存**: 1.2
**見積もり**: 1.5日

#### ThemeProvider更新

既存の`components/theme-provider/UserThemeProvider.tsx`を新しいシステムに移行。

```typescript
// components/theme-provider/UserThemeProvider.tsx

'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes/registry'
import type { ThemePreset, ThemeSettings, ThemeContextValue } from '@/lib/themes/types'

export const UserThemeContext = createContext<ThemeContextValue | null>(null)

interface UserThemeProviderProps {
  themeId?: string
  themeSettings?: Partial<ThemeSettings>
  children: ReactNode
}

/**
 * ユーザープロフィールのテーマProvider
 * CSS変数をインラインスタイルで適用 + Tailwindクラスで参照
 */
export function UserThemeProvider({
  themeId = DEFAULT_THEME_ID,
  themeSettings = {},
  children,
}: UserThemeProviderProps) {
  const theme = useMemo(() => {
    return getTheme(themeId) || getTheme(DEFAULT_THEME_ID)!
  }, [themeId])

  const variables = useMemo(() => {
    const baseVariables = { ...theme.variables }

    // アクセントカラーのカスタマイズ
    if (themeSettings.accentColor) {
      baseVariables['--theme-text-accent'] = themeSettings.accentColor
      baseVariables['--theme-accent-bg'] = `${themeSettings.accentColor}14`
      baseVariables['--theme-accent-border'] = `${themeSettings.accentColor}33`
    }

    // カスタムオーバーライド
    if (themeSettings.customOverrides) {
      Object.assign(baseVariables, themeSettings.customOverrides)
    }

    return baseVariables
  }, [theme, themeSettings.accentColor, themeSettings.customOverrides])

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    settings: {
      themeId: theme.id,
      ...themeSettings,
    },
    variables,
    getDecoration: (type) => theme.decorations[type],
  }), [theme, themeSettings, variables])

  // CSS変数をスタイル属性として適用
  const styleVariables = useMemo(() => {
    return Object.fromEntries(
      Object.entries(variables).map(([key, value]) => [key, value])
    ) as React.CSSProperties
  }, [variables])

  return (
    <UserThemeContext.Provider value={contextValue}>
      <div
        style={styleVariables}
        className="min-h-screen bg-theme-bg text-theme-primary"
      >
        {children}
      </div>
    </UserThemeContext.Provider>
  )
}

/**
 * テーマコンテキストを使用するフック
 */
export function useUserTheme(): ThemeContextValue {
  const context = useContext(UserThemeContext)
  if (!context) {
    throw new Error('useUserTheme must be used within UserThemeProvider')
  }
  return context
}
```

#### Tailwind v4統合（`app/globals.css`）

Tailwind v4では`tailwind.config.ts`ではなく、CSS内の`@theme inline`でカスタムプロパティを定義します。

```css
/* app/globals.css に追加 */

@theme inline {
  /* 既存の設定... */

  /* ========================================
   * テーマシステム用カスタムカラー
   * UserThemeProviderがインラインスタイルで--theme-*変数を注入
   * ======================================== */

  /* 背景色 */
  --color-theme-bg: var(--theme-bg);
  --color-theme-card-bg: var(--theme-card-bg);
  --color-theme-stat-bg: var(--theme-stat-bg);
  --color-theme-bar-bg: var(--theme-bar-bg);
  --color-theme-header-bg: var(--theme-header-bg);
  --color-theme-accent-bg: var(--theme-accent-bg);

  /* テキスト色 */
  --color-theme-primary: var(--theme-text-primary);
  --color-theme-secondary: var(--theme-text-secondary);
  --color-theme-accent: var(--theme-text-accent);
  --color-theme-header-text: var(--theme-header-text);

  /* ボーダー色 */
  --color-theme-accent-border: var(--theme-accent-border);

  /* 角丸 */
  --radius-theme: var(--theme-card-radius);

  /* シャドウ（Tailwind v4ではCSS変数で直接定義）*/
  --shadow-theme: var(--theme-card-shadow);
  --shadow-theme-stat: var(--theme-stat-shadow);
  --shadow-theme-header: var(--theme-header-shadow);

  /* 背景グラデーション */
  --background-image-theme: var(--theme-image-bg);
}
```

#### 使用例

```tsx
// Before（style属性）
<div style={{
  backgroundColor: 'var(--theme-card-bg)',
  borderRadius: 'var(--theme-card-radius)',
  boxShadow: 'var(--theme-card-shadow)',
}}>

// After（Tailwindクラス）
<div className="bg-theme-card-bg rounded-theme shadow-theme">
```

**Tailwind v4でのクラス対応:**
| CSS変数 | Tailwindクラス |
|---------|---------------|
| `--theme-bg` | `bg-theme-bg` |
| `--theme-card-bg` | `bg-theme-card-bg` |
| `--theme-text-primary` | `text-theme-primary` |
| `--theme-text-secondary` | `text-theme-secondary` |
| `--theme-text-accent` | `text-theme-accent` |
| `--theme-card-radius` | `rounded-theme` |
| `--theme-card-shadow` | `shadow-theme` |

#### 検証

- [ ] `UserThemeProvider`が新しいテーマシステムで動作する
- [ ] `app/globals.css`の`@theme inline`にテーマ変数が追加されている
- [ ] `bg-theme-card-bg`などのユーティリティクラスが使用可能
- [ ] IntelliSenseでテーマクラスが補完される（VSCode + Tailwind CSS IntelliSense）
- [ ] 既存のプロフィールページが正常に表示される

---

### 1.4 装飾コンポーネント（優先度: MEDIUM）

**依存**: 1.3
**見積もり**: 1日

#### 新規作成ディレクトリ

```
components/decorations/
├── Badge.tsx
├── Divider.tsx
├── IconContainer.tsx
├── CornerDecor.tsx
└── index.ts
```

#### Badge.tsx

```typescript
// components/decorations/Badge.tsx

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/UserThemeProvider'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'accent'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const { theme } = useUserTheme()
  const badgeType = theme.decorations.badge

  if (badgeType === 'none') {
    return <span className={className}>{children}</span>
  }

  const badgeStyles = {
    pill: 'rounded-full px-3 py-1',
    ribbon: 'relative pl-4 pr-2 py-1 before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-theme-accent',
    tag: 'rounded-sm px-2 py-0.5 border border-theme-accent-border',
    star: 'relative px-4 py-1',
  }

  const variantStyles = {
    default: 'bg-theme-stat-bg text-theme-secondary',
    accent: 'bg-theme-accent-bg text-theme-accent',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center text-sm font-medium',
        badgeStyles[badgeType],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
```

#### Divider.tsx

```typescript
// components/decorations/Divider.tsx

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/UserThemeProvider'

interface DividerProps {
  className?: string
}

export function Divider({ className }: DividerProps) {
  const { theme } = useUserTheme()
  const dividerType = theme.decorations.divider

  if (dividerType === 'none') {
    return <div className={cn('h-4', className)} />
  }

  const dividerStyles = {
    line: 'h-px bg-theme-bar-bg',
    dots: 'flex justify-center gap-2',
    gradient: 'h-px bg-gradient-to-r from-transparent via-theme-accent to-transparent',
    wave: 'h-4 bg-wave-pattern',
  }

  if (dividerType === 'dots') {
    return (
      <div className={cn(dividerStyles.dots, className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-theme-bar-bg" />
        ))}
      </div>
    )
  }

  return <div className={cn(dividerStyles[dividerType], className)} />
}
```

#### IconContainer.tsx

```typescript
// components/decorations/IconContainer.tsx

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/UserThemeProvider'

interface IconContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function IconContainer({ children, className, size = 'md' }: IconContainerProps) {
  const { theme } = useUserTheme()
  const containerType = theme.decorations.iconContainer

  if (containerType === 'none') {
    return <span className={className}>{children}</span>
  }

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const containerStyles = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none',
    hexagon: 'clip-path-hexagon',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'bg-theme-stat-bg shadow-theme-stat',
        sizeStyles[size],
        containerStyles[containerType],
        className
      )}
    >
      {children}
    </span>
  )
}
```

#### CornerDecor.tsx

```typescript
// components/decorations/CornerDecor.tsx

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/UserThemeProvider'
import { Star, Heart, Ribbon } from 'lucide-react'

interface CornerDecorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

export function CornerDecor({ position = 'top-right', className }: CornerDecorProps) {
  const { theme } = useUserTheme()
  const decorType = theme.decorations.cornerDecor

  if (decorType === 'none') {
    return null
  }

  const positionStyles = {
    'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
    'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
    'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
  }

  const icons = {
    ribbon: <Ribbon className="w-6 h-6 text-theme-accent" />,
    star: <Star className="w-6 h-6 text-theme-accent fill-theme-accent" />,
    heart: <Heart className="w-6 h-6 text-theme-accent fill-theme-accent" />,
  }

  return (
    <span
      className={cn(
        'absolute z-10',
        positionStyles[position],
        className
      )}
    >
      {icons[decorType]}
    </span>
  )
}
```

#### index.ts

```typescript
// components/decorations/index.ts

export { Badge } from './Badge'
export { Divider } from './Divider'
export { IconContainer } from './IconContainer'
export { CornerDecor } from './CornerDecor'
```

#### 検証

- [ ] 全装飾コンポーネントが作成されている
- [ ] Claymorphicテーマで装飾が適切に表示される
- [ ] `decorations.badge = 'none'`のとき装飾が非表示
- [ ] テーマ切り替えで装飾スタイルが変化する

---

### 1.5 残りのテーマ作成（優先度: MEDIUM）

**依存**: 1.3
**見積もり**: 1日

#### 作成するテーマ（Phase 1では主要な3テーマのみ）

| テーマ名 | カラー展開 | 合計 |
|---------|-----------|------|
| **Claymorphic** | Warm, Cool, Dark | 3（1.2で完了） |
| **Minimal** | White, Gray, Black | 3 |
| **Pastel Dream** | Pink, Mint, Blue | 3 |

**合計**: 9テーマ（Phase 1終了時点）

#### 残りテーマは Phase 6 で作成

- Cyberpunk (3)
- Gaming (3)
- Nature (3)
- Retro (3)
- Elegant (3)
- Pop Art (3)
- Kawaii (3)

#### minimal.ts

```typescript
// lib/themes/presets/minimal.ts

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'

const minimalDecorations: ThemeDecorations = {
  badge: 'tag',
  divider: 'line',
  iconContainer: 'rounded',
  cardHover: 'lift',
  cornerDecor: 'none',
}

const whitePalette: ThemeColorPalette = {
  name: 'white',
  displayName: 'ホワイト',
  primary: '#2563eb',
  secondary: '#3b82f6',
  accent: '#2563eb',
  background: '#ffffff',
  cardBackground: '#ffffff',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    accent: '#2563eb',
  },
}

// ... Gray, Black パレット

export const minimalThemes = [minimalWhite, minimalGray, minimalBlack]
```

#### pastel-dream.ts

```typescript
// lib/themes/presets/pastel-dream.ts

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'

const pastelDecorations: ThemeDecorations = {
  badge: 'pill',
  divider: 'dots',
  iconContainer: 'circle',
  cardHover: 'glow',
  cornerDecor: 'heart',
}

const pinkPalette: ThemeColorPalette = {
  name: 'pink',
  displayName: 'ピンク',
  primary: '#ec4899',
  secondary: '#f472b6',
  accent: '#ec4899',
  background: '#fdf2f8',
  cardBackground: '#ffffff',
  text: {
    primary: '#831843',
    secondary: '#9d174d',
    accent: '#ec4899',
  },
}

// ... Mint, Blue パレット

export const pastelDreamThemes = [pastelPink, pastelMint, pastelBlue]
```

#### registry.ts 更新

```typescript
// lib/themes/registry.ts

import { claymorphicThemes } from './presets/claymorphic'
import { minimalThemes } from './presets/minimal'
import { pastelDreamThemes } from './presets/pastel-dream'

// 全テーマを登録
;[...claymorphicThemes, ...minimalThemes, ...pastelDreamThemes].forEach(theme => {
  THEME_REGISTRY.set(theme.id, theme)
})
```

#### 検証

- [ ] Minimalテーマ（3種）が作成されている
- [ ] Pastel Dreamテーマ（3種）が作成されている
- [ ] `getAllThemes()`で9テーマが取得可能
- [ ] 各テーマが視覚的に区別可能

---

## Phase 1 完了チェックリスト

### ファイル作成確認

- [ ] `lib/themes/types.ts`
- [ ] `lib/themes/registry.ts`
- [ ] `lib/themes/index.ts`
- [ ] `lib/themes/presets/claymorphic.ts`
- [ ] `lib/themes/presets/minimal.ts`
- [ ] `lib/themes/presets/pastel-dream.ts`
- [ ] `lib/themes/presets/index.ts`
- [ ] `types/theme.ts`
- [ ] `components/decorations/Badge.tsx`
- [ ] `components/decorations/Divider.tsx`
- [ ] `components/decorations/IconContainer.tsx`
- [ ] `components/decorations/CornerDecor.tsx`
- [ ] `components/decorations/index.ts`

### 更新ファイル確認

- [ ] `components/theme-provider/UserThemeProvider.tsx`
- [ ] `app/globals.css`（Tailwind v4の`@theme inline`にテーマ変数追加）

### 動作確認

- [ ] 9つのテーマが切り替え可能
- [ ] CSS変数が正しく適用される
- [ ] Tailwindユーティリティクラスが動作する
- [ ] IntelliSenseでテーマクラスが補完される
- [ ] 装飾コンポーネントがテーマに応じて変化
- [ ] `/[handle]`プロフィールページが正常に表示される
- [ ] `npm run lint`がパス
- [ ] `npx tsc --noEmit`がパス
- [ ] `npm run build`がパス

---

## 依存関係グラフ

```
[Phase 0 完了]
    │
    ▼
1.1 テーマ型定義
    │
    ▼
1.2 最初のテーマ作成（Claymorphic）
    │
    ├──────────────────────────┐
    ▼                          ▼
1.3 ThemeProvider + Tailwind統合    1.5 残りテーマ作成
    │                          │
    ▼                          │
1.4 装飾コンポーネント           │
    │                          │
    └──────────────────────────┘
                │
                ▼
        [Phase 1 完了] → Phase 2へ
```

---

## 後方互換性の対応

### 既存コードへの影響

| 既存コード | 対応 |
|-----------|------|
| `lib/theme-presets.ts` | 残す（後で削除予定） |
| `themePreset: 'claymorphic'` | `themeId: 'claymorphic-warm'`にマッピング |
| `applyThemeVariables()` | 新しいシステムで再実装 |

### マイグレーションマッピング

```typescript
// lib/themes/compat.ts（Phase 1.3で作成）

const LEGACY_THEME_MAP: Record<string, string> = {
  'claymorphic': 'claymorphic-warm',
  'minimal': 'minimal-white',
}

export function migrateLegacyThemeId(legacyId: string): string {
  return LEGACY_THEME_MAP[legacyId] || legacyId
}
```

---

## リスク管理

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| 既存テーマとの互換性問題 | 中 | 中 | マイグレーションマッピングを実装 |
| Tailwind設定の競合 | 低 | 中 | 既存のカスタムカラーと名前を分離 |
| 装飾コンポーネントのパフォーマンス | 低 | 低 | メモ化を適用 |

---

## 次のPhaseへの引き継ぎ

Phase 1が完了したら、以下の状態になっている必要があります：

1. **完成したテーマシステム基盤**: 型定義、レジストリ、9テーマ
2. **Tailwind統合**: テーマCSS変数がユーティリティクラスで使用可能
3. **装飾コンポーネント**: テーマに応じた装飾が適用可能
4. **後方互換性**: 既存のテーマ設定が新システムで動作

これにより、Phase 2のセクションシステム基盤構築でThemedCardなどを実装できます。

---

**最終更新**: 2026-02-24
