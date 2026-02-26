# プロフィールページ リデザイン計画（改訂版）

> **レビュー反映日**: 2026-02-24
> **バージョン**: 3.0
> **変更内容**: 最終レビュー（Claude Opus 4.5）の結果を反映、FAQ機能の共存設計を確定

## 概要

VTuber・配信者向けプロフィールページ作成サービスの大幅リデザイン。
2カラム → 1カラムへのレイアウト変更、テーマシステムの拡張、ディレクトリ構造の最適化を行う。

**重要な前提**: 既存ユーザーは0人のため、後方互換性は考慮しない。Phase 0で旧システムをゼロから作り直す。

---

## 開発環境

### Docker構成

| サービス | イメージ | ポート | 用途 |
|---------|---------|-------|------|
| `app` | altee-core:dev (node:22-alpine) | 3000 | Next.js開発サーバー |
| `db` | postgres:17.4 | 5433→5432 | PostgreSQLデータベース |
| `prisma-studio` | altee-core:dev | 5555 | Prisma Studio（DB管理UI） |

### 起動コマンド

```bash
# 開発環境起動
docker compose -f compose.dev.yaml up -d

# ログ確認
docker compose -f compose.dev.yaml logs -f app

# DBマイグレーション（コンテナ内で実行）
docker compose -f compose.dev.yaml exec app npx prisma migrate dev

# DBバックアップ
docker compose -f compose.dev.yaml exec db pg_dump -U postgres altee_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# DBリストア
docker compose -f compose.dev.yaml exec -T db psql -U postgres altee_dev < backup_YYYYMMDD_HHMMSS.sql
```

### Phase 0実装時の注意

1. **DBバックアップ必須**: テーブル削除前に必ずバックアップを取得
2. **マイグレーション**: `UserData`, `UserLink`テーブル削除のマイグレーションを作成
3. **Prisma Studio**: テーブル削除後、Prisma Studioで確認

---

## 目次

1. [要件サマリー](#1-要件サマリー)
2. [アーキテクチャ設計](#2-アーキテクチャ設計)
3. [テーマシステム設計](#3-テーマシステム設計)
4. [セクションシステム設計](#4-セクションシステム設計)
5. [ディレクトリ構造の最適化](#5-ディレクトリ構造の最適化)
6. [データベース設計](#6-データベース設計)
7. [実装計画](#7-実装計画)
8. [依存関係マップ](#8-依存関係マップ)
9. [検証計画](#9-検証計画)

---

## 1. 要件サマリー

| 項目 | 内容 |
|------|------|
| **レイアウト** | 1カラム（セクション縦積み） |
| **セクション幅** | Large (1200px) / Medium (720px) の2種類 |
| **テーマ数** | 30種類以上（ベース10種 × カラーバリエーション3種） |
| **テーマの違い** | 装飾要素・アイコンスタイル・カラーパレット |
| **カスタマイズ** | テーマ選択 + アクセント色程度 |
| **キャラクター** | 新セクション（左キャラ＋右プロフィール形式） |
| **パフォーマンス** | 初期ロード < 2.5s、セクション遅延読み込み |

---

## 2. アーキテクチャ設計

### 2.1 レイアウト構造

```
┌──────────────────────────────────────────┐
│              ProfileHeader                │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐    │
│  │  CharacterProfileSection (Large) │    │  ← 新セクション
│  │  [キャラ画像] [プロフィール情報] │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │     ImageHeroSection (Large)      │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────┐              │
│  │   FAQSection (Medium)   │  ← 中央揃え │
│  └────────────────────────┘              │
│                                          │
│  ┌────────────────────────┐              │
│  │  LinksSection (Medium)  │              │
│  └────────────────────────┘              │
│                                          │
└──────────────────────────────────────────┘
```

### 2.2 セクション幅の割り当て

| 幅 | セクションタイプ | 用途 |
|-----|-----------------|------|
| **Large (1200px)** | `character-profile`, `image-hero`, `image-grid-2`, `image-grid-3`, `video-gallery`, `icon-links` | 画像・ビジュアル重視 |
| **Medium (720px)** | その他すべて | テキスト・リスト重視 |

---

## 3. テーマシステム設計

### 3.1 テーマ構造（3層アーキテクチャ）

```
┌─────────────────────────────────────────┐
│  Layer 1: Theme Base (ベーススタイル)   │
│  - neumorphic / flat / glass / card     │
├─────────────────────────────────────────┤
│  Layer 2: Theme Variant (テーマ名)      │
│  - Pastel Dream / Cyberpunk / Gaming... │
├─────────────────────────────────────────┤
│  Layer 3: Color Palette (カラー展開)    │
│  - Pink / Yellow / Blue / ...           │
└─────────────────────────────────────────┘
```

### 3.2 テーマプリセット構造

```typescript
// lib/themes/types.ts

export type ThemeBase = 'neumorphic' | 'flat' | 'glass' | 'card'

export interface ThemeColorPalette {
  name: string              // "pink", "yellow", "blue"
  displayName: string       // "ピンク", "イエロー", "ブルー"
  primary: string           // メインカラー
  secondary: string         // サブカラー
  accent: string            // アクセントカラー
  background: string        // 背景色
  text: string              // テキスト色
}

export interface ThemeDecorations {
  badge: 'pill' | 'ribbon' | 'tag' | 'star' | 'none'
  divider: 'line' | 'dots' | 'gradient' | 'wave' | 'none'
  iconContainer: 'circle' | 'rounded' | 'square' | 'hexagon' | 'none'
  cardHover: 'lift' | 'glow' | 'press' | 'shake' | 'none'
  cornerDecor: 'ribbon' | 'star' | 'heart' | 'none'
}

export interface ThemePreset {
  id: string                    // "pastel-dream-pink"
  name: string                  // "Pastel Dream"
  colorVariant: string          // "pink"
  displayName: string           // "Pastel Dream - ピンク"
  base: ThemeBase               // "flat"
  palette: ThemeColorPalette    // カラーパレット
  decorations: ThemeDecorations // 装飾設定
  variables: Record<string, string>  // CSS変数
}
```

### 3.3 テーマ一覧（30種類以上）

| No | ベーステーマ | カテゴリ | カラー展開 | 合計 |
|----|-------------|---------|-----------|------|
| 1 | Claymorphic | neumorphic | Warm, Cool, Dark | 3 |
| 2 | Minimal | flat | White, Gray, Black | 3 |
| 3 | Pastel Dream | flat | Pink, Yellow, Blue, Mint | 4 |
| 4 | Cyberpunk | glass | Neon, Matrix, Synthwave | 3 |
| 5 | Gaming | neumorphic | RGB, Fire, Ice | 3 |
| 6 | Nature | card | Forest, Ocean, Sunset | 3 |
| 7 | Retro | card | 80s, 90s, Pixel | 3 |
| 8 | Elegant | neumorphic | Gold, Silver, Rose | 3 |
| 9 | Pop Art | flat | Primary, Neon, Mono | 3 |
| 10 | Kawaii | flat | Candy, Fairy, Dream | 3 |
| **合計** | | | | **31** |

### 3.4 セクション × テーマの分離

**組み合わせ爆発を防ぐキー設計:**

```
セクション = 構造 + データ表示（テーマ非依存）
     ↓
ThemedCard = CSS変数でスタイル適用
     ↓
装飾コンポーネント = テーマに応じた装飾を注入
```

```typescript
// セクションコンポーネント（テーマ非依存）
function FAQSection({ section }: SectionProps) {
  return (
    <ThemedCard>
      <FAQContent data={section.data} />
    </ThemedCard>
  )
}

// ThemedCard（テーマ依存の装飾を注入）
function ThemedCard({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const Decoration = getCornerDecoration(theme.decorations.cornerDecor)

  return (
    <div
      className="relative bg-theme-card-bg rounded-theme shadow-theme"
      // Tailwindユーティリティクラスで適用（Phase 1.3で実装）
    >
      {Decoration && <Decoration />}
      {children}
    </div>
  )
}
```

### 3.5 Tailwind CSS v4統合（新規）

**Phase 1.3で実装**: テーマCSS変数をTailwind v4の`@theme inline`にマッピング

```css
/* app/globals.css */
@theme inline {
  /* 既存の設定... */

  /* テーマシステム用カスタムカラー */
  --color-theme-bg: var(--theme-bg);
  --color-theme-card-bg: var(--theme-card-bg);
  --color-theme-primary: var(--theme-text-primary);
  --color-theme-secondary: var(--theme-text-secondary);
  --color-theme-accent: var(--theme-text-accent);
  --color-theme-accent-bg: var(--theme-accent-bg);

  /* 角丸・シャドウ */
  --radius-theme: var(--theme-card-radius);
  --shadow-theme: var(--theme-card-shadow);
}
```

**メリット**:
- shadcn/uiコンポーネントとの統合が容易
- Tailwind v4ネイティブ設定で将来性確保
- IntelliSense対応で開発体験向上
- `style`属性削減でパフォーマンス向上

---

## 4. セクションシステム設計

### 4.1 セクション一覧（20種類）

| カテゴリ | セクションタイプ | 幅 | maxInstances |
|---------|-----------------|-----|-------------|
| **メイン** | `character-profile` | Large | 1 |
| **画像** | `image-hero` | Large | 1 |
| | `image-grid-2` | Large | 1 |
| | `image-grid-3` | Large | 1 |
| | `image` | Medium | ∞ |
| **リンク** | `links` | Medium | ∞ |
| | `icon-links` | Large | 1 |
| | `link-list` | Medium | ∞ |
| **コンテンツ** | `faq` | Medium | ∞ |
| | `long-text` | Medium | ∞ |
| | `timeline` | Medium | 1 |
| **データ** | `bar-graph` | Medium | ∞ |
| | `circular-stat` | Medium | ∞ |
| | `weekly-schedule` | Medium | 1 |
| **動画** | `youtube` | Medium | ∞ |
| | `video-gallery` | Large | 1 |
| **構造** | `header` | Medium | ∞ |
| | `divider` | Medium | ∞ |
| | `spacer` | Medium | ∞ |

### 4.2 新セクション: CharacterProfile

```typescript
// types/sections/character-profile.ts

export interface CharacterProfileData {
  // キャラクター部分
  characterImageKey?: string
  characterBackgroundKey?: string

  // プロフィール部分
  name: string
  tagline?: string
  bio?: string
  badgeLeft?: string
  badgeRight?: string

  // レイアウト
  characterPosition: 'left' | 'right'

  // SNSリンク（オプション）
  showSocialLinks: boolean
}
```

### 4.3 セクションレジストリ構造（遅延読み込み対応）

```typescript
// lib/sections/registry.ts
import { lazy, ComponentType } from 'react'

export interface SectionDefinition {
  type: string
  label: string
  description: string
  icon: string              // Lucide icon name
  category: SectionCategory
  width: 'large' | 'medium'
  maxInstances?: number     // undefined = unlimited

  // 遅延読み込み対応（Phase 2.5で実装）
  component: ComponentType<SectionProps> | ReturnType<typeof lazy>
  priority?: 'high' | 'medium' | 'low'  // 読み込み優先度

  editorComponent: ComponentType<SectionEditorProps>
  defaultData: unknown
  validate: (data: unknown) => boolean
}

export const SECTION_REGISTRY: Record<string, SectionDefinition> = {
  // 優先度: high（即座に読み込み）
  'character-profile': {
    component: lazy(() => import('@/components/sections/CharacterProfileSection')),
    priority: 'high',
    // ...
  },

  // 優先度: medium（Intersection Observer）
  'faq': {
    component: lazy(() => import('@/components/sections/FAQSection')),
    priority: 'medium',
    // ...
  },

  // 優先度: low（ビューポート外）
  'video-gallery': {
    component: lazy(() => import('@/components/sections/VideoGallerySection')),
    priority: 'low',
    // ...
  }
}
```

### 4.4 SectionRendererの実装（エラーバウンダリ対応）

**Phase 2.5で実装**: セクションごとの独立したエラーハンドリング

```typescript
// components/profile/SectionRenderer.tsx
import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import { SectionSkeleton } from '@/components/profile/SectionSkeleton'
import { SectionErrorFallback } from '@/components/profile/SectionErrorFallback'

export function SectionRenderer({ sections }: { sections: UserSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const definition = SECTION_REGISTRY[section.sectionType]
        const Component = definition.component

        return (
          <ErrorBoundary
            key={section.id}
            fallback={<SectionErrorFallback sectionType={section.sectionType} />}
          >
            <Suspense fallback={<SectionSkeleton width={definition.width} />}>
              <Component section={section} />
            </Suspense>
          </ErrorBoundary>
        )
      })}
    </div>
  )
}
```

**必要な追加コンポーネント**:
1. `components/error-boundary.tsx` - React 19 ErrorBoundary
2. `components/profile/SectionSkeleton.tsx` - セクションローディング
3. `components/profile/SectionErrorFallback.tsx` - セクションエラー表示

**効果**:
- 初期ロード時間 200-300ms 改善
- 1つのセクションエラーがページ全体に影響しない
- 段階的なコンテンツ表示でUX向上

---

## 5. ディレクトリ構造の最適化

### 5.1 現状の問題点

1. **Private Foldersの未使用** - 機能固有コンポーネントがcomponents/に集約
2. **不要なルート** - `/u/`, `/g/` が残存
3. **components/user-profile の肥大化** - 20以上のセクションコンポーネント

> **Note**: Route Groupsは検討の結果、現状のディレクトリ構造（`auth/`, `dashboard/`, `admin/`）を維持。
> 各フォルダに`layout.tsx`を配置することでレイアウト共有は実現済み。

### 5.2 新しいディレクトリ構造

```
altee-core/
├── app/
│   ├── auth/                        # 認証ページ
│   │   ├── signin/page.tsx
│   │   ├── error/page.tsx
│   │   └── suspended/page.tsx
│   │
│   ├── dashboard/                   # ダッシュボード（/dashboard/*）
│   │   ├── layout.tsx               # 共通レイアウト（認証チェック含む）
│   │   ├── page.tsx
│   │   ├── profile-editor/          # プロフィール編集
│   │   │   ├── page.tsx
│   │   │   └── _components/         # Private: 機能固有
│   │   │       ├── SectionEditor.tsx
│   │   │       └── ThemeSelector.tsx
│   │   ├── items/page.tsx
│   │   ├── platforms/page.tsx
│   │   └── faqs/page.tsx
│   │
│   ├── admin/                       # 管理画面（/admin/*）
│   │   ├── layout.tsx               # 共通レイアウト（権限チェック含む）
│   │   ├── page.tsx
│   │   ├── users/page.tsx
│   │   ├── themes/page.tsx          # テーマ管理（新規）
│   │   └── links/page.tsx           # リンクタイプ管理
│   │
│   ├── [handle]/                    # 公開プロフィール
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── _components/
│   │       └── ProfileRenderer.tsx
│   │
│   ├── actions/                     # Server Actions
│   │   ├── auth/
│   │   ├── user/                    # ユーザー関連
│   │   │   └── profile-actions.ts
│   │   ├── content/                 # コンテンツ関連
│   │   │   └── faq-actions.ts
│   │   ├── admin/
│   │   │   └── link-type-actions.ts
│   │   └── media/
│   │
│   ├── api/                         # API Routes（最小限）
│   │   ├── auth/
│   │   ├── files/
│   │   └── webhooks/
│   │
│   └── demo/                        # テストページ
│       └── ...
│
├── components/
│   ├── ui/                          # shadcn/ui（変更なし）
│   │
│   ├── layout/                      # レイアウト
│   │   ├── BaseLayout.tsx
│   │   └── ...
│   │
│   ├── profile/                     # プロフィール表示（リネーム）
│   │   ├── ProfileLayout.tsx        # 1カラムレイアウト
│   │   ├── ProfileHeader.tsx
│   │   ├── SectionRenderer.tsx
│   │   ├── SectionWrapper.tsx       # 幅制御
│   │   ├── SectionSkeleton.tsx      # 新規: ローディング
│   │   └── SectionErrorFallback.tsx # 新規: エラー表示
│   │
│   ├── sections/                    # セクションコンポーネント
│   │   ├── _shared/                 # 共通コンポーネント
│   │   │   ├── ThemedCard.tsx
│   │   │   └── SectionHeader.tsx
│   │   ├── CharacterProfileSection.tsx
│   │   ├── FAQSection.tsx
│   │   ├── LinksSection.tsx
│   │   └── ...
│   │
│   ├── decorations/                 # テーマ装飾（新規）
│   │   ├── Badge.tsx
│   │   ├── Divider.tsx
│   │   ├── CornerRibbon.tsx
│   │   ├── IconContainer.tsx
│   │   └── index.ts
│   │
│   ├── error-boundary.tsx           # 新規: ErrorBoundary
│   │
│   └── theme-provider/              # テーマ管理
│       ├── ThemeProvider.tsx
│       └── useTheme.ts
│
├── lib/
│   ├── themes/                      # テーマシステム（新規）
│   │   ├── presets/                 # プリセット定義
│   │   │   ├── claymorphic.ts
│   │   │   ├── pastel-dream.ts
│   │   │   ├── cyberpunk.ts
│   │   │   └── index.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── index.ts
│   │
│   ├── sections/                    # セクションシステム（新規）
│   │   ├── registry.ts
│   │   ├── type-guards.ts
│   │   ├── validators.ts
│   │   └── index.ts
│   │
│   ├── validations/                 # Zodスキーマ
│   │   └── ...
│   │
│   ├── prisma.ts
│   ├── storage.ts
│   └── utils.ts
│
├── types/
│   ├── theme.ts                     # テーマ型
│   ├── section.ts                   # セクション型
│   ├── profile.ts                   # プロフィール型
│   └── ...
│
├── hooks/
│   ├── use-theme.ts
│   ├── use-section.ts
│   └── use-mobile.ts
│
└── prisma/
    └── schema.prisma
```

### 5.3 主な変更点

| 変更 | 理由 |
|------|------|
| `_components/` Private Folders | 機能固有コンポーネントをルート近くに配置 |
| `components/user-profile/` → `components/profile/` | 名前の簡素化 |
| `components/user-profile/sections/` → `components/sections/` | トップレベルに昇格 |
| `lib/theme-presets.ts` → `lib/themes/` | テーマシステムの拡張に対応 |
| `lib/section-registry.ts` → `lib/sections/` | セクションシステムの整理 |
| `/u/`, `/g/` 削除 | 不要なルートを削除 |

> **Note**: Route Groupsは不採用。各フォルダ（`auth/`, `dashboard/`, `admin/`）に`layout.tsx`を配置することで
> レイアウト共有を実現。URL構造は `/dashboard/*`, `/admin/*`, `/auth/*` を維持。

---

## 6. データベース設計

### 6.1 スキーマ変更

**変更点:**
1. `UserProfile.themePreset` → テーマIDに変更
2. `UserSection` のスキーマは維持
3. **重要**: 旧テーブル（`FaqCategory`, `FaqQuestion`, `UserLink`, `UserData`）は**Phase 0で即座に削除**

```prisma
// 変更後のUserProfile
model UserProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(...)

  // テーマ設定（シンプル化）
  themeId            String   @default("claymorphic-warm")
  accentColor        String?  // カスタムアクセント色（オプション）

  // 画像（維持）
  characterImageId   String?
  avatarImageId      String?
  bannerImageKey     String?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@map("user_profiles")
}

// UserSectionは維持（変更なし）
model UserSection {
  id          String   @id @default(cuid())
  userId      String
  sectionType String
  title       String?
  sortOrder   Int
  isVisible   Boolean  @default(true)
  data        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(...)

  @@index([userId, sortOrder])
  @@map("user_sections")
}
```

### 6.2 削除するテーブル（Phase 0で実施）

**重要な設計決定**: UserSection FAQと専用FAQページは**別々の機能として共存**させる

| 機能 | 用途 | データソース | 設定場所 |
|-----|------|------------|---------|
| **UserSection FAQ** | プロフィール内の一問一答 | `UserSection` (type: 'faq') | ダッシュボード > プロフィールセクション |
| **専用FAQページ** | 詳細なカテゴリ別FAQ | `FaqCategory` / `FaqQuestion` | ダッシュボード > FAQ |

**削除対象**（既存ユーザー0人のため移行不要）:

| テーブル/ファイル | 判定 | 理由 |
|-----------------|------|------|
| `UserData` | 削除 | UserSectionに統合済み |
| `UserLink` | 削除 | UserSectionに統合済み |
| `FaqCategory` / `FaqQuestion` | **残す** | 専用FAQページで使用 |
| `app/actions/user/userdata-actions.ts` | 削除 | - |
| `app/actions/link/link-actions.ts` | 分割 | リンクタイプ管理機能は`admin/link-type-actions.ts`に移行 |
| `app/actions/content/faq-actions.ts` | **残す** | 専用FAQページで使用 |
| `lib/faq-compat.ts` | **残す** | FAQSection表示で使用 |

**効果**:
- コードベース20-25%削減（FAQ関連は残すため軽減）
- UserData/UserLink関連の二重システム削除
- 専用FAQページ機能は維持

---

## 7. 実装計画

### Phase 0: 準備・クリーンアップ（3-4日）

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 0.1 | 不要ファイル削除 | HIGH | - | `/u/`, `/g/`, 旧コンポーネント |
| 0.2 | ~~Route Groups作成~~ | - | - | **スキップ**（現状の構造を維持） |
| 0.3 | ディレクトリ構造変更 | HIGH | 0.1 | Server Actions構造の確認 |
| 0.4a | リンクタイプ機能の移行 | HIGH | 0.3 | link-actions.tsからadmin/link-type-actions.tsに移行 |
| 0.4b | 依存コンポーネントの削除/更新 | HIGH | 0.4a | UserData/UserLink関連のみ |
| 0.4c | データベーステーブル削除 | HIGH | 0.4b | **UserData, UserLinkのみ**（FAQ関連は残す） |
| 0.5 | 旧Server Actions削除 | HIGH | 0.4c | userdata-actions.ts, link-actions.ts（faq-actions.tsは残す） |
| 0.6 | FAQルート整理 | MEDIUM | 0.5 | /faq削除のみ（/faqsは残す） |

### Phase 1: テーマシステム基盤（4-5日）

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 1.1 | テーマ型定義 | HIGH | Phase 0 | `types/theme.ts`, `lib/themes/types.ts` |
| 1.2 | 最初のテーマ作成 | HIGH | 1.1 | Claymorphic (Warm/Cool/Dark) |
| 1.3 | ThemeProvider実装 + **Tailwind統合** | HIGH | 1.2 | **CSS変数注入、tailwind.config.ts更新** |
| 1.4 | 装飾コンポーネント | MEDIUM | 1.3 | `components/decorations/` |
| 1.5 | 残りのテーマ作成 | MEDIUM | 1.3 | 残り9ベーステーマ |

**1.3の詳細（Tailwind v4統合）**:
```css
/* app/globals.css の @theme inline に追加 */
@theme inline {
  --color-theme-bg: var(--theme-bg);
  --color-theme-card-bg: var(--theme-card-bg);
  --color-theme-primary: var(--theme-text-primary);
  /* ... 全テーマ変数をマッピング */
}
```

### Phase 1.5: PWA対応（1-2日）✅

> **詳細計画**: [2026-platform-overhaul-phase-pwa.md](./2026-platform-overhaul-phase-pwa.md)

| ID | タスク | 優先度 | 依存 | 詳細 | 状態 |
|----|--------|--------|------|------|------|
| 1.5.1 | @serwist/turbopack設定 | HIGH | Phase 1 | next.config.ts更新 | ✅ |
| 1.5.2 | Route Handler作成 | HIGH | 1.5.1 | app/serwist/[path]/route.ts | ✅ |
| 1.5.3 | Service Worker作成 | HIGH | 1.5.2 | app/sw.ts | ✅ |
| 1.5.4 | SerwistRegister作成 | HIGH | 1.5.3 | components/pwa/SerwistRegister.tsx | ✅ |
| 1.5.5 | マニフェスト設定 | HIGH | 1.5.4 | app/manifest.ts, public/pwa/ | ✅ |
| 1.5.6 | PWA検証 | MEDIUM | 1.5.5 | Lighthouse PWA検証 | ⏳本番で確認 |

**効果**:
- ホーム画面追加によるネイティブアプリ化
- キャッシュによるパフォーマンス向上
- 将来のプッシュ通知基盤

### Phase 2: セクションシステム基盤（5-6日）

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 2.1 | セクション型定義 | HIGH | Phase 0 | `types/section.ts`, `lib/sections/types.ts` |
| 2.2 | セクションレジストリ | HIGH | 2.1 | `lib/sections/registry.ts` |
| 2.3 | SectionWrapper実装 | HIGH | 2.2 | 幅制御（Large/Medium） |
| 2.4 | ThemedCard実装 | HIGH | Phase 1.3 | テーマ対応カード |
| 2.5 | SectionRenderer実装（基本） | HIGH | 2.3, 2.4 | セクション描画（遅延読み込みなし） |
| 2.6 | **ErrorBoundary実装** | HIGH | 2.5 | **React 19 ErrorBoundary** |
| 2.7 | **SectionSkeleton実装** | HIGH | 2.5 | **ローディング状態表示** |

### Phase 2.5: セクション遅延読み込み基盤（2日）

**新規Phase**: パフォーマンス最適化を前倒し

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 2.5.1 | レジストリに遅延読み込み追加 | HIGH | Phase 2.6, 2.7 | `React.lazy()` + priority設定 |
| 2.5.2 | SectionRenderer更新 | HIGH | 2.5.1 | `Suspense` + `ErrorBoundary` 統合 |
| 2.5.3 | SectionErrorFallback実装 | MEDIUM | 2.5.2 | エラー時のフォールバック表示 |

### Phase 3: 1カラムレイアウト（2-3日）

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 3.1 | ProfileLayout作成 | HIGH | Phase 2.5 | 1カラムレイアウト |
| 3.2 | ProfileHeader更新 | HIGH | 3.1 | 新レイアウト対応 |
| 3.3 | CharacterColumn削除 | MEDIUM | 3.1 | 旧2カラム削除 |
| 3.4 | [handle]/page.tsx更新 | HIGH | 3.1, 3.2 | 新レイアウト適用 |

### Phase 4: セクションコンポーネント（6-8日）

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 4.1 | CharacterProfileSection | HIGH | Phase 3 | 新規作成 |
| 4.2 | 既存セクション移行 | HIGH | Phase 2.4 | ThemedCard対応 |
| 4.3 | ImageHeroSection更新 | MEDIUM | 4.2 | 幅Large対応 |
| 4.4 | FAQSection更新 | MEDIUM | 4.2 | テーマ装飾対応 |
| 4.5 | LinksSection更新 | MEDIUM | 4.2 | アイコンスタイル対応 |
| 4.6 | 残りセクション更新 | LOW | 4.2 | 順次対応 |

### Phase 5: ダッシュボード（4-5日）

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 5.1 | テーマセレクター | HIGH | Phase 1 | カラーバリエーション対応 |
| 5.2 | セクションエディター | HIGH | Phase 4 | 新構造対応 |
| 5.3 | プレビュー機能 | MEDIUM | 5.1, 5.2 | リアルタイムプレビュー |
| 5.4 | ダッシュボードレイアウト更新 | MEDIUM | Phase 3 | 新デザイン適用 |

### Phase 6: 残りテーマ作成（2-3日） 

// テーマの作り込みを行うため、この工程はスキップ。適宜追加していくこととする。

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 6.1 | Pastel Dreamテーマ | MEDIUM | Phase 5.1 | Pink/Yellow/Blue/Mint |
| 6.2 | Cyberpunkテーマ | MEDIUM | 6.1 | Neon/Matrix/Synthwave |
| 6.3 | Gamingテーマ | MEDIUM | 6.1 | RGB/Fire/Ice |
| 6.4 | 残りテーマ | LOW | 6.1 | Nature, Retro, Elegant, Pop Art, Kawaii |

### Phase 7: 最終調整（1-2日）

**パフォーマンス最適化をPhase 2.5に前倒し済み**

| ID | タスク | 優先度 | 依存 | 詳細 |
|----|--------|--------|------|------|
| 7.1 | レスポンシブ調整 | HIGH | Phase 4 | モバイル対応 |
| 7.2a | **next/image sizes最適化** | HIGH | 7.1 | **1カラム用にsizes再計算** |
| 7.2b | **セクション遅延読み込み検証** | HIGH | Phase 2.5 | **パフォーマンス測定** |
| 7.2c | **テーマ計算の最適化** | MEDIUM | 7.2a | **サーバー側生成への移行** |
| 7.3 | デモページ作成 | LOW | 7.1 | `/demo/themes`, `/demo/sections` |
| 7.4 | ドキュメント | LOW | 7.3 | 新セクション・テーマ追加ガイド |

**見積もりサマリー**:

| Phase | 日数 | 累計 |
|-------|------|------|
| Phase 0 | 3-4日 | 3-4日 |
| Phase 1 | 4-5日 | 7-9日 |
| **Phase 1.5 (PWA)** | 1-2日 | 8-11日 |
| Phase 2 | 5-6日 | 13-17日 |
| Phase 2.5 | 2日 | 15-19日 |
| Phase 3 | 2-3日 | 17-22日 |
| Phase 4 | 6-8日 | 23-30日 |
| Phase 5 | 4-5日 | 27-35日 |
| Phase 6 | 2-3日 | 29-38日 |
| Phase 7 | 1-2日 | 30-40日 |
| **合計** | **30-40日** | **4-6週間** |

---

## 8. 依存関係マップ

```
Phase 0 ────────────────────────────────────────────┐
    │                                               │
    ├──► Phase 1: テーマ基盤                         │
    │       │                                       │
    │       ├──► 1.1 型定義                         │
    │       │       │                               │
    │       │       ├──► 1.2 最初のテーマ            │
    │       │       │       │                       │
    │       │       │       └──► 1.3 ThemeProvider  │
    │       │       │            + Tailwind v4統合   │
    │       │       │               │               │
    │       │       │               ├──► 1.4 装飾    │
    │       │       │               │               │
    │       │       │               └──► 1.5 残りテーマ
    │       │       │                               │
    │       │       └───────────────────────────────┼──► Phase 2.4
    │       │                                       │
    │       └──► Phase 1.5: PWA対応（Serwist）       │
    │               │                               │
    │               └──► next.config.ts + sw.ts     │
    │                                               │
    ├──► Phase 2: セクション基盤                     │
    │       │                                       │
    │       ├──► 2.1 型定義                         │
    │       │       │                               │
    │       │       └──► 2.2 レジストリ              │
    │       │               │                       │
    │       │               └──► 2.3 SectionWrapper │
    │       │                       │               │
    │       │                       └──► 2.5 Renderer
    │       │                               │       │
    │       │                               ├──► 2.6 ErrorBoundary
    │       │                               │       │
    │       │                               └──► 2.7 Skeleton
    │       │                                       │
    │       └───────────────────────────────────────┘
    │
    └──► Phase 2.5: 遅延読み込み基盤 ◄── Phase 2.6, 2.7
            │
            └──► Phase 3: 1カラムレイアウト
                    │
                    └──► Phase 4: セクションコンポーネント
                            │
                            └──► Phase 5: ダッシュボード
                                    │
                                    └──► Phase 6: 残りテーマ
                                            │
                                            └──► Phase 7: 最終調整
```

### クリティカルパス

```
Phase 0 → 1.1-1.5 → 1.5(PWA) → 2.1-2.7 → 2.5 → 3 → 4 → 5 → 7
```

**最短完了予定**: 約4-6週間（フルタイム作業の場合）

---

## 9. 検証計画

### Phase 0完了時

- [ ] `UserData`, `UserLink`テーブルが削除されている
- [ ] `FaqCategory`, `FaqQuestion`テーブルが**残っている**
- [ ] `app/actions/admin/link-type-actions.ts`が作成されている
- [ ] 管理画面のリンクタイプ管理が正常に動作する
- [ ] `userdata-actions.ts`, `link-actions.ts`が削除されている
- [ ] `faq-actions.ts`, `faq-compat.ts`が**残っている**
- [ ] `/[handle]/faqs`が正常に動作する
- [ ] `/[handle]/faq`が削除されている
- [ ] `app/dashboard/faqs/`が正常に動作する
- [ ] `app/dashboard/userdata/`が削除されている
- [ ] `npx prisma migrate dev`でエラーなし
- [ ] ディレクトリ構造（`auth/`, `dashboard/`, `admin/`各フォルダに`layout.tsx`でレイアウト共有）
- [ ] ビルドエラーがゼロ

### Phase 1完了時

- [ ] 3つのテーマ（Claymorphic Warm/Cool/Dark）が切り替え可能
- [ ] CSS変数が正しく適用される
- [ ] `app/globals.css`の`@theme inline`にテーマ変数がマッピングされている（Tailwind v4）
- [ ] `bg-theme-card-bg`などのユーティリティクラスが使用可能
- [ ] IntelliSenseでテーマクラスが補完される
- [ ] 装飾コンポーネントがテーマに応じて変化

### Phase 1.5（PWA）完了時 ✅

- [x] `@serwist/turbopack`がnext.config.tsに統合されている
- [x] `app/sw.ts`にService Workerが定義されている
- [x] `app/serwist/[path]/route.ts`でService Workerルーティングが設定されている
- [x] `components/pwa/SerwistRegister.tsx`でService Worker登録
- [x] `app/manifest.ts`がPWA要件を満たしている
- [x] `public/pwa/`にアイコン画像が配置されている
- [x] ビルドが成功し`/serwist/sw.js`が生成される
- [ ] Chrome DevToolsのApplication > Manifestでエラーがない（本番環境で確認）
- [ ] Lighthouse PWA検証をパスする（本番環境で確認）

### Phase 2完了時

- [ ] セクションレジストリが機能する
- [ ] Large/Mediumの幅が正しく適用される
- [ ] ThemedCardがテーマに対応
- [ ] ErrorBoundaryがセクションごとに実装されている
- [ ] SectionSkeletonが表示される

### Phase 2.5完了時

- [ ] `React.lazy()`でセクションが遅延読み込みされる
- [ ] Suspense fallbackが正しく表示される
- [ ] セクションエラーが個別にハンドリングされる
- [ ] 初期ロード時間が測定可能

### Phase 3完了時

- [ ] `/[handle]` で1カラムレイアウトが表示される
- [ ] モバイルでも正しく表示される
- [ ] CharacterColumnが削除されている

### Phase 4完了時

- [ ] CharacterProfileSectionが動作する
- [ ] 全セクションがThemedCardを使用
- [ ] テーマ切り替えで全セクションのスタイルが変わる

### Phase 5完了時

- [ ] ダッシュボードでテーマ選択可能
- [ ] カラーバリエーションが選択可能
- [ ] セクション追加・編集・削除が可能
- [ ] リアルタイムプレビューが動作

### 最終検証（Phase 7完了時）

- [ ] 全30種類以上のテーマが利用可能
- [ ] レスポンシブが正常に動作
- [ ] **Lighthouse Performance Score > 90**
- [ ] **LCP（Largest Contentful Paint） < 2.5s**
- [ ] **CLS（Cumulative Layout Shift） < 0.1**
- [ ] **初期ロード時間 < 2.5s**
- [ ] セクション遅延読み込みが動作
- [ ] エラーハンドリングが適切に機能

---

## 10. ファイル変更一覧

### 新規作成

| ファイル | Phase | 説明 |
|---------|-------|------|
| `app/actions/admin/link-type-actions.ts` | 0.4a | リンクタイプ管理機能（link-actions.tsから移行） |
| `lib/themes/types.ts` | 1.1 | テーマ型定義 |
| `lib/themes/presets/*.ts` | 1.2, 6.x | 各テーマプリセット |
| `lib/themes/utils.ts` | 1.3 | テーマユーティリティ |
| `lib/sections/registry.ts` | 2.2 | セクションレジストリ |
| `lib/sections/type-guards.ts` | 2.2 | 型ガード |
| `components/decorations/*.tsx` | 1.4 | 装飾コンポーネント |
| `components/profile/ProfileLayout.tsx` | 3.1 | 1カラムレイアウト |
| `components/profile/SectionWrapper.tsx` | 2.3 | 幅制御 |
| `components/profile/SectionSkeleton.tsx` | 2.7 | ローディング表示 |
| `components/profile/SectionErrorFallback.tsx` | 2.5.3 | エラー表示 |
| `components/error-boundary.tsx` | 2.6 | ErrorBoundary |
| `components/sections/CharacterProfileSection.tsx` | 4.1 | 新セクション |
| `types/theme.ts` | 1.1 | テーマ型 |
| `types/section.ts` | 2.1 | セクション型 |
| `app/sw.ts` | 1.5 | Service Worker |
| `public/pwa/icon-192x192.png` | 1.5 | PWAアイコン |
| `public/pwa/icon-512x512.png` | 1.5 | PWAアイコン |

### 大幅変更

| ファイル | Phase | 変更内容 |
|---------|-------|----------|
| `app/globals.css` | 1.3 | Tailwind v4の`@theme inline`にテーマ変数追加 |
| `components/theme-provider/ThemeProvider.tsx` | 1.3 | 新テーマ構造対応 |
| `next.config.ts` | 1.5 | Serwist PWAプラグイン追加 |
| `components/sections/*.tsx` | 4.2-4.6 | ThemedCard適用 |
| `app/[handle]/page.tsx` | 3.4 | 新レイアウト適用 |
| `app/(dashboard)/profile/page.tsx` | 5.2 | 新エディター |
| `prisma/schema.prisma` | 0.4 | UserProfile変更、旧テーブル削除 |

### 削除

| ファイル/ディレクトリ | Phase | 理由 |
|---------------------|-------|------|
| `app/u/` | 0.1 | 不要 |
| `app/g/` | 0.1 | 不要 |
| `app/actions/user/userdata-actions.ts` | 0.5 | 旧システム削除 |
| `app/actions/link/link-actions.ts` | 0.5 | リンクタイプ機能移行後に削除 |
| `app/dashboard/userdata/` | 0.4b | UserSection統合済み |
| `app/[handle]/faq/` | 0.6 | /faqsに統合 |
| `components/user-profile/CharacterColumn.tsx` | 3.3 | 1カラム化 |
| `components/user-profile/ContentColumn.tsx` | 3.3 | 1カラム化 |
| `lib/theme-presets.ts` | 1.2 | `lib/themes/`に移行 |
| `lib/section-registry.ts` | 2.2 | `lib/sections/`に移行 |

### 残す（削除しない）

| ファイル/ディレクトリ | 理由 |
|---------------------|------|
| `app/actions/content/faq-actions.ts` | 専用FAQページで使用 |
| `lib/faq-compat.ts` | FAQSection表示で使用 |
| `app/dashboard/faqs/` | 専用FAQページのダッシュボード |
| `app/[handle]/faqs/` | 専用FAQページ |
| `FaqCategory` / `FaqQuestion` テーブル | 専用FAQページで使用 |

---

## 11. リスク管理

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| セクション遅延読み込みの実装遅延 | 中 | 中 | Phase 2.5を独立タスクとして優先 |
| テーマ数（30種類）の作成負荷 | 高 | 低 | Phase 6を段階的に実施、最小10種で開始 |
| 1カラムレイアウトのモバイル調整 | 低 | 低 | 既存の1カラムモバイル実装が実績 |
| Phase 0でのデータ損失 | 低 | 高 | 事前にDBバックアップ、既存ユーザー0人を再確認 |
| Tailwind v4統合の互換性問題 | 低 | 中 | `@theme inline`でネイティブ対応、既存style属性と並行運用 |
| PWA Service Worker競合 | 低 | 低 | 開発環境ではdisable設定、本番のみ有効化 |

---

## 12. 改善提案の反映状況

| 提案 | 反映箇所 | 効果 |
|------|---------|------|
| **Phase 0での旧テーブル削除（一部）** | Phase 0.4-0.6 | コードベース20-25%削減、保守コスト削減 |
| **Tailwind CSS v4統合** | Phase 1.3, セクション 3.5 | 開発体験向上、パフォーマンス改善 |
| **セクション遅延読み込み** | Phase 2.5, セクション 4.3-4.4 | 初期ロード 200-300ms改善、堅牢性向上 |
| **PWA対応（Phase 1.5追加）** | Phase 1.5 | ネイティブアプリ化、キャッシュ基盤構築 |

---

## 13. 最終レビュー（2026-02-24）による変更

| 変更箇所 | 変更内容 | 理由 |
|---------|---------|------|
| **FAQ機能の設計** | UserSection FAQと専用FAQページを共存 | 2つの異なるユースケースをサポート |
| **削除対象の見直し** | FAQ関連テーブル/ファイルは残す | 専用FAQページ機能を維持 |
| **リンクタイプ管理** | admin/link-type-actions.tsに移行 | 管理者機能を維持 |
| **Phase 0の工数** | 2-3日 → 3-4日 | 依存関係解消のため |
| **Tailwind統合** | tailwind.config.ts → app/globals.css | Tailwind v4の`@theme inline`に準拠 |
| **Phase 1.5追加** | PWA対応（Serwist）をPhase 1後に追加 | インフラ基盤の早期構築、キャッシュ効果検証 |

---

**最終更新**: 2026-02-24
**レビュアー**: Claude Opus 4.5
**承認状態**: 最終レビュー完了、実装準備完了
