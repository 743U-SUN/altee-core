# フルブリードセクションシステム設計

## 背景・動機

大改修（2026-platform-overhaul）で構築したセクションシステムを拡張し、
「画面幅いっぱいに広がる背景付きセクションを縦に積み上げるレイアウト」を実現する。

よく見かける1カラムのランディングページ的なスタイル。スクロールするとセクションごとに背景色が変わり、まとまりで一塊のコンテンツに見えたり、セクション間でガラッと雰囲気を変えたりできる。

---

## 現状 vs 目標の構造

### 変更前

```
ProfileLayout
  └─ main > div.max-w-[1200px].mx-auto.px-4.py-6
       └─ SectionRenderer
            └─ div.space-y-6
                 └─ SectionWrapper (large=1200px / medium=720px)
                      └─ セクションコンポーネント
```

各セクションは1200pxコンテナの「中」に収まっており、背景は全セクション共通（テーマ背景）。

### 変更後

```
ProfileLayout
  └─ main.w-full
       └─ SectionRenderer
            └─ SectionBand (w-full, 背景・パディング管理)
                 └─ div.max-w-[1200px].mx-auto.px-4  ← 全セクション統一
                      └─ セクションコンポーネント
```

各セクションが自身の「帯（バンド）」を持ち、フルブリードの背景を設定できる。

---

## 設計上の決定事項

### 1. 後方互換性なしのクリーンリビルド

既存ユーザーが存在しないため、後方互換性を考慮しない。
スキーマと型定義をシンプルに保つ優先度を高くする。

### 2. SectionWrapper を廃止 → 1200px 統一

**廃止理由**: `large` (1200px) と `medium` (720px) が混在すると、縦スクロール時にコンテンツの
横幅がバラバラで視覚的なリズムが崩れる。フルブリードバンドにするとより顕著。

**決定**: `SectionWrapper` 削除。全セクションのコンテンツは `max-w-[1200px]` で統一。

**テキスト可読性への対応**: FAQ・長文などテキスト主体のセクションコンポーネントが
自身の内部で `max-w-prose` や `max-w-[720px]` を適用して可読幅を制御する。
「バンドは1200px、テキストは読みやすい幅」が両立できる。

```tsx
// FAQSection 内部（コンポーネント側で対応）
<div className="max-w-[720px] mx-auto space-y-4">
  {questions.map(...)}
</div>
```

**`SectionDefinition` の `width` フィールドは削除する。**

### 3. フルブリードコンテンツへの対応

一部のセクション（image-hero等）はコンテンツ自体を1200px制限なしでフルブリードにしたい。

**対応**: `SectionDefinition` に `fullBleed?: boolean` フラグを追加。
`fullBleed: true` のセクションは `SectionBand` 内に直接レンダリング（max-width コンテナをスキップ）。

```
SectionBand (w-full, 背景設定)
  ├─ [通常]    div.max-w-[1200px].mx-auto → セクションコンポーネント
  └─ [fullBleed]                          → セクションコンポーネント（幅制限なし）
```

`image-hero` は `fullBleed: true` でバンド幅いっぱいに画像を表示。
ただし画像内のオーバーレイテキスト等は1200px以内に収めるのは各コンポーネント側の責務。

### 4. 背景はAdmin管理のプリセット選択制

ユーザーが自由に画像をアップロードすると容量を圧迫するため、
**管理者が用意した背景プリセットからのみ選択** する形にする。
自由入力やユーザーアップロードは不可。

### 5. ディバイダーなし

セクション間のSVGディバイダー（波型・ジグザグ等）は**実装しない**。
グラデーション背景との相性問題や実装コストを考慮し、セクション間はシンプルに切り替える。

### 6. ProfileHeader は独立維持

ProfileHeader（アバター + キャラクター名 + ナビタブ）はナビゲーション用の sticky バーであり、
コンテンツセクションではない。SectionBand システムには組み込まない。

### 7. パディングはデフォルトで対応

最初/最後のセクションに特別なパディング処理は不要。
各セクションのデフォルト `paddingTop/Bottom = 'md'` で自然な余白ができる。

### 8. テキストコントラストはユーザー責任

ダーク系の背景プリセットを選んだ場合にテキストが読みにくくなる可能性があるが、
ユーザーが判断して適切な背景を選べばよい。自動調整は行わない。

### 9. UserSection.title は現状維持

DB の `UserSection.title` フィールドは現在 UI に表示されていない。
見出しが必要な場合は `header` セクションタイプ（h2/h3/h4）を追加して対応する。
SectionBand 内にタイトル行を表示する機能は追加しない。

### 10. fullBleed セクションの角丸なし

`fullBleed: true` のセクションはバンド幅いっぱいにレンダリングされるため、
コンポーネント内の `rounded-*` クラスを除去する。
`ImageHeroSection` の `rounded-3xl` は fullBleed 対応時に削除。

---

## Admin 背景プリセットシステム

### DB テーブル設計（新規）

```prisma
model SectionBackgroundPreset {
  id           String   @id @default(cuid())
  name         String   // 管理UI表示名 "Midnight Blue"
  category     String   // "solid" | "gradient" | "pattern" | "animated"
  config       Json     // 背景の詳細設定（型ごとに異なる）
  thumbnailKey String?  // R2上のサムネイル画像キー（プレビュー表示用）
  cssString    String?  // CSSに直接使える文字列（グラデ等）
  isActive     Boolean  @default(true)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**`cssString` の運用ルール**: `cssString` は `config` から生成されるキャッシュフィールド。
Admin UI での保存時に `config` から自動生成する。手動で `cssString` だけを変更してはならない。
Phase 1（Admin UI なし）では `resolveBackgroundStyle()` 関数が `config` からランタイム生成するため、
`cssString` は使用しない。Phase 2 の Admin UI 実装時にキャッシュとして活用開始する。

### config フィールドの型（カテゴリ別）

```typescript
// solid: 単色
interface SolidBgConfig {
  color: string  // "#1a1a2e"
}

// gradient: グラデーション
interface GradientBgConfig {
  type: 'linear' | 'radial' | 'conic'
  stops: { color: string; position: number }[]
  angle?: number  // linear のみ
}
// cssString 例: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"

// pattern: SVGパターン（繰り返し）
interface PatternBgConfig {
  svgDataUrl: string      // data:image/svg+xml;base64,...
  backgroundColor: string // パターンの背景色
  patternColor: string    // パターン要素の色
  scale?: number          // パターンのサイズ調整
}

// animated: CSS アニメーション
interface AnimatedBgConfig {
  cssClass: string        // グローバルCSSで定義したクラス名
  keyframesName: string   // animation-name
  backgroundColor: string // fallback色（prefers-reduced-motion 用）
}
```

### 実装フェーズ（背景プリセット）

| Phase | 対応タイプ | 備考 |
|---|---|---|
| 1（MVP）| solid + gradient | AdminがDBに直接投入。Admin UIは後回し |
| 2 | pattern（SVG） | よく使うパターンをハードコードで提供 |
| 3 | animated CSS | `prefers-reduced-motion` を尊重 |
| 4（将来）| WebGL/Canvas | 実装コスト大、後回し |

### Admin UI（管理ページ）

```
/admin/section-backgrounds
  - プリセット一覧（カテゴリ別表示）
  - プリセット追加・編集・削除
  - サムネイル画像アップロード（R2）
  - isActive トグル（ユーザーへの公開/非公開）
  - sortOrder 変更（表示順）
```

---

## セクション設定（UserSection.settings）

### Prisma スキーマ変更

```prisma
model UserSection {
  // 既存フィールド...
  settings  Json?  // SectionSettings - バンドの見た目設定（NEW）
}
```

### 型定義

```typescript
// types/profile-sections.ts に追加

interface SectionBandBackground {
  type: 'inherit' | 'preset'
  presetId?: string  // SectionBackgroundPreset.id
}

type SectionPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
// none=0 / sm=8px / md=16px / lg=32px / xl=48px（実際のpx値はブレークポイントで変動）

interface ResponsivePadding {
  mobile: SectionPadding     // < 768px（必須）
  tablet?: SectionPadding    // 768px〜1024px（省略時: mobile を継承）
  desktop?: SectionPadding   // > 1024px（省略時: tablet を継承）
}

interface SectionSettings {
  background?: SectionBandBackground  // デフォルト: { type: 'inherit' }
  paddingTop?: ResponsivePadding      // デフォルト: { mobile: 'sm', desktop: 'md' }
  paddingBottom?: ResponsivePadding   // デフォルト: { mobile: 'sm', desktop: 'md' }
}
```

---

## コンポーネント設計

### SectionBand（新規作成）

**ファイル**: `components/profile/SectionBand.tsx`
**責務**: フルブリードの帯として、背景・パディングを管理する。

**パディング定数**: `SectionBand.tsx` 内にローカル定数として定義。
レスポンシブ対応で、モバイル・タブレット・PCそれぞれの値を Tailwind ブレークポイントで出し分ける。

```tsx
// 方向別 × ブレークポイント別のクラスマッピング
const PT: Record<SectionPadding, string> = {
  none: 'pt-0', sm: 'pt-2', md: 'pt-4', lg: 'pt-8', xl: 'pt-12',
}
const PB: Record<SectionPadding, string> = {
  none: 'pb-0', sm: 'pb-2', md: 'pb-4', lg: 'pb-8', xl: 'pb-12',
}
// md: / lg: プレフィックス付きも同様に定義

function resolveResponsivePadding(
  padding: ResponsivePadding | undefined,
  direction: 'top' | 'bottom',
): string {
  const defaults: ResponsivePadding = { mobile: 'sm', desktop: 'md' }
  const p = padding ?? defaults
  const mobile = p.mobile
  const tablet = p.tablet ?? mobile    // 省略時: mobile 継承
  const desktop = p.desktop ?? tablet  // 省略時: tablet 継承
  // → "pt-2 md:pt-4 lg:pt-4" のようなクラス文字列を生成
}
```

**背景ユーティリティ**: `lib/sections/background-utils.ts` に新規作成。

```tsx
// プリセットの config → CSSProperties に変換
export function resolveBackgroundStyle(
  preset: SectionBackgroundPreset | null | undefined
): CSSProperties

// presets 配列から presetId でプリセットを検索（O(1) Map化）
export function resolvePreset(
  background: SectionBandBackground | undefined,
  presets: SectionBackgroundPreset[]
): SectionBackgroundPreset | null
```

`resolvePreset` は内部で `Map` を使い、繰り返し呼び出しでも O(1) で検索する
（react-best-practices `js-index-maps` パターン）。

```tsx
interface SectionBandProps {
  settings: SectionSettings | null
  preset?: SectionBackgroundPreset | null  // propsで渡す（DB fetchは呼び出し元）
  children: ReactNode
  fullBleed?: boolean   // true: max-width コンテナをスキップ
  isEditable?: boolean
}

export function SectionBand({ settings, preset, children, fullBleed, isEditable }) {
  const ptClass = resolveResponsivePadding(settings?.paddingTop, 'top')
  const pbClass = resolveResponsivePadding(settings?.paddingBottom, 'bottom')
  const bgStyle = resolveBackgroundStyle(preset)

  return (
    <div
      className={cn('relative w-full', ptClass, pbClass)}
      style={{
        ...bgStyle,
        contentVisibility: 'auto',
        containIntrinsicSize: '0 200px',
      }}
    >
      {fullBleed ? (
        children
      ) : (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {children}
        </div>
      )}
    </div>
  )
}
```

### ProfileLayout の変更

**ファイル**: `components/profile/ProfileLayout.tsx`

```tsx
// Before
<main className="flex-1 w-full">
  <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
    {children}
  </div>
</main>

// After
<main className="flex-1 w-full">
  {children}
</main>
```

### SectionRenderer の変更

**ファイル**: `components/profile/SectionRenderer.tsx`

`SectionBand` でラップ。`presets` は props で受け取る（Server Componentからfetch）。

**重要**: 既存の外側 `div.space-y-6` を `div.w-full` に変更する。
各 SectionBand が自身のパディングを管理するため、`space-y-6` のギャップは不要。

```tsx
export function SectionRenderer({ sections, presets, isEditable }) {
  const sortedSections = useMemo(
    () => sections.filter(s => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder),
    [sections]
  )

  return (
    <div className="w-full">
      {sortedSections.map((section) => {
        const definition = getSectionDefinition(section.sectionType)
        const preset = resolvePreset(section.settings?.background, presets)
        const Component = definition.component

        return (
          <ErrorBoundary key={section.id} ...>
            <Suspense fallback={<SectionSkeleton />}>
              <SectionBand
                settings={section.settings}
                preset={preset}
                fullBleed={definition.fullBleed}
                isEditable={isEditable}
              >
                <Component section={section} isEditable={isEditable} />
              </SectionBand>
            </Suspense>
          </ErrorBoundary>
        )
      })}
    </div>
  )
}
```

---

## セクションタイプの整理

### 廃止（計画から削除）

| セクションタイプ | 廃止理由 | 代替手段 |
|---|---|---|
| `divider` | SectionBand のパディング設定で代替 | `paddingTop/Bottom` 設定 |
| `spacer` | SectionBand のパディング設定で代替 | `paddingTop/Bottom` 設定 |

どちらも未実装（レジストリ未登録）なので、そのまま計画から削除する。

### image-hero の fullBleed 対応

現在の `image-hero` は SectionWrapper (max-w-[1200px]) 内に収まっている。
新システムでは `fullBleed: true` を追加し、バンド幅いっぱいにレンダリングする。

```typescript
// lib/sections/registry.ts
{
  type: 'image-hero',
  fullBleed: true,  // 追加
  // ...
}
```

### テキスト主体セクションの内部幅ガイドライン

SectionWrapper 廃止により、テキスト可読性の確保は各セクションコンポーネントが責任を持つ。

| セクション | 推奨内部幅 |
|---|---|
| `faq`, `long-text`, `profile-card`, `timeline` | `max-w-[720px] mx-auto` |
| `bar-graph`, `circular-stat`, `links` | `max-w-[900px] mx-auto` |
| `image-grid-2/3`, `video-gallery`, `icon-links` | `max-w-[1200px]`（制限なし） |

---

## テーマシステムとの共存

| 管理主体 | 対象 |
|---|---|
| テーマ（--theme-*変数） | カード・テキスト・影・装飾（ThemedCard, CornerDecor等） |
| SectionBandプリセット | セクション帯の背景色・画像 |
| ProfileLayout最外殻 | 引き続き `--theme-bg`（SectionBandが全面を覆わない場合のfallback） |

---

## データフロー変更

### 変更前
```
Server Component → UserSection[] → SectionRenderer → Components
```

### 変更後
```
Server Component → {
  UserSection[],
  SectionBackgroundPreset[]  // 全ユーザー共通 → React.cache() で per-request dedup
} → SectionRenderer → SectionBand + Components
```

### プリセット取得ユーティリティ

**ファイル**: `lib/sections/preset-queries.ts` に新規作成。

```tsx
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

// React.cache() で同一リクエスト内の重複 fetch を防止
// (react-best-practices: server-cache-react)
export const getActivePresets = cache(async () => {
  return prisma.sectionBackgroundPreset.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
})
```

`app/[handle]/page.tsx` と `app/dashboard/profile-editor/page.tsx` の
両方からこの関数を呼ぶ。`React.cache()` により同一リクエスト内で自動 dedup される。

セクション fetch と `Promise.all` で並列取得する
（react-best-practices: `async-parallel`）。

```tsx
// app/[handle]/page.tsx
const [user, presets] = await Promise.all([
  getUserByHandle(handle),
  getActivePresets(),
])
```

---

## プロフィールエディターUI（Phase 3）

各セクションカードに「スタイル設定」ボタン（Palette アイコン）を追加。
クリックで `SectionStylePanel` が開く。

```
SectionStylePanel
├─ [背景]
│   ├─ ○ なし（テーマ背景）
│   └─ ○ プリセット選択
│        ├─ [タブ: グラデーション | 単色 | パターン]
│        └─ [サムネイルグリッド]
└─ [余白]
     ├─ [タブ: モバイル | タブレット | PC]
     ├─ 上: [なし][小][中▼][大][特大]
     └─ 下: [なし][小][中▼][大][特大]
     ※ タブレット・PC は省略時にモバイル→タブレット→PCの順で継承
```

---

## パフォーマンス

- `SectionBackgroundPreset[]` のfetchはページ全体で1回（サーバーキャッシュ対象）
- `content-visibility: auto` は SectionBand に設定（SectionWrapper から移行）
- CSSアニメーション背景は `prefers-reduced-motion` を尊重する（Phase 3+で対応）

---

## 実装フェーズ

### Phase 1: 基盤（コンポーネント構造の変更）

コードから直接設定を投入できる状態にする。エディターUIは作らない。

- [ ] DB: `UserSection.settings Json?` 追加、マイグレーション
- [ ] DB: `SectionBackgroundPreset` テーブル追加、初期プリセットをシードスクリプトで投入
- [ ] 型定義: `SectionSettings`, `SectionBandBackground` 等を追加
- [ ] `SectionDefinition` の `width` を削除、`fullBleed?: boolean` を追加
- [ ] `SectionWrapper.tsx` 削除
- [ ] `SectionBand.tsx` 新規作成（背景・パディング対応）
- [ ] `SectionRenderer.tsx` 変更（SectionBandでラップ、presets propを受け取る）
- [ ] `ProfileLayout.tsx` 変更（max-wコンテナ削除）
- [ ] 各セクションコンポーネントの内部幅調整（FAQ等）
- [ ] `image-hero` の `fullBleed: true` 対応
- [ ] `ImageHeroSection.tsx` の `rounded-3xl` を除去（fullBleed 対応）
- [ ] `SectionRenderer.tsx` の `space-y-6` を `w-full` に変更
- [ ] `SectionSkeleton.tsx` 変更（`width` prop 削除、SectionBand 内で固定幅不要）
- [ ] `SectionErrorFallback.tsx` 変更（`width` prop 削除）
- [ ] `EditableSectionRenderer.tsx` にも SectionBand を適用（プレビュー時に背景表示）
- [ ] `types/profile-sections.ts` の旧 `SectionDefinition` を削除（`lib/sections/types.ts` に統合済み）
- [ ] `lib/sections/index.ts` の `SectionWidth` re-export を削除
- [ ] `types/section.ts` の `SectionWidth` re-export を削除
- [ ] `app/[handle]/page.tsx` のラッパー `div.space-y-6` を除去
- [ ] `app/[handle]/page.tsx` で `getActivePresets()` + `Promise.all` で並列 fetch
- [ ] `app/dashboard/profile-editor/page.tsx` でも `getActivePresets()` を追加
- [ ] `lib/sections/background-utils.ts` 新規作成（`resolveBackgroundStyle`, `resolvePreset`）
- [ ] `lib/sections/preset-queries.ts` 新規作成（`getActivePresets` + `React.cache()`）
- [ ] `app/demo/sections/page.tsx` の `section.width` 参照を `fullBleed` に書き換え
- [ ] SectionRenderer / ProfileLayout の全使用箇所を洗い出し、漏れなく対応
- [ ] `app/demo/sections/` にフルブリードデモを追加して動作確認
- [ ] 初期プリセットをシードスクリプトで投入（solid 数色 + gradient 数パターン、内容は実装時に決定）

### Phase 2: Admin UI

- [ ] `/admin/section-backgrounds` 管理ページ
- [ ] プリセット一覧・追加・編集・削除
- [ ] サムネイル画像アップロード（R2）
- [ ] isActive / sortOrder 管理

### Phase 3: エディターUI

- [ ] `SectionStylePanel` 実装（背景・パディング設定）
- [ ] useSWR + Server Action での楽観的更新
- [ ] リアルタイムプレビュー対応

---

## 変更ファイル一覧

| ファイル | 変更種別 |
|---|---|
| `prisma/schema.prisma` | 変更（settings フィールド + SectionBackgroundPreset テーブル追加） |
| `types/profile-sections.ts` | 変更（SectionSettings 等の型追加） |
| `lib/sections/types.ts` | 変更（SectionWidth 削除、fullBleed 追加） |
| `lib/sections/registry.ts` | 変更（全定義の width 削除、image-hero に fullBleed 追加） |
| `components/profile/ProfileLayout.tsx` | 変更（main の max-w コンテナ削除） |
| `components/profile/SectionRenderer.tsx` | 変更（SectionBand でラップ、presets prop 追加） |
| `components/profile/SectionWrapper.tsx` | **削除** |
| `components/profile/SectionBand.tsx` | **新規作成** |
| `components/profile/SectionSkeleton.tsx` | 変更（`width` prop 削除） |
| `components/profile/SectionErrorFallback.tsx` | 変更（`width` prop 削除） |
| `components/user-profile/EditableSectionRenderer.tsx` | 変更（SectionBand 適用） |
| `components/user-profile/sections/` 各コンポーネント | 変更（内部幅調整） |
| `components/user-profile/sections/ImageHeroSection.tsx` | 変更（`rounded-3xl` 除去） |
| `lib/sections/index.ts` | 変更（`SectionWidth` re-export 削除） |
| `lib/sections/background-utils.ts` | **新規**（`resolveBackgroundStyle`, `resolvePreset`） |
| `lib/sections/preset-queries.ts` | **新規**（`getActivePresets` + `React.cache()`） |
| `types/section.ts` | 変更（`SectionWidth` re-export 削除） |
| `app/[handle]/page.tsx` | 変更（`space-y-6` 除去、presets 並列 fetch） |
| `app/dashboard/profile-editor/page.tsx` | 変更（presets fetch 追加） |
| `app/demo/sections/page.tsx` | 変更（`width` 参照を `fullBleed` に書き換え） |
| `app/actions/user/section-actions.ts` | 変更（settings 更新アクション追加） |
| `app/admin/section-backgrounds/` | **新規**（Phase 2） |
| `app/dashboard/profile-editor/` | 変更（SectionStylePanel 追加 - Phase 3） |
| `scripts/seed-section-backgrounds.ts` | **新規**（初期プリセット投入用） |


## Phase 1 完了サマリー
DB変更
UserSection に settings Json? フィールド追加
SectionBackgroundPreset テーブル新規作成
マイグレーション 20260226142816_add_section_band_system 適用済み
12件の初期プリセット（solid 6色 + gradient 6パターン）をシード投入済み
型定義
types/profile-sections.ts に SectionSettings, SectionBandBackground, ResponsivePadding, SectionPaddingSize, SectionBackgroundPreset 等の型を追加
旧 SectionDefinition / SectionCategory を types/profile-sections.ts から削除（lib/sections/types.ts に統合済み）
SectionDefinition 変更
lib/sections/types.ts: SectionWidth 削除、fullBleed?: boolean 追加
lib/sections/registry.ts: 全セクションから width 削除、image-hero に fullBleed: true 追加
lib/sections/index.ts, types/section.ts: SectionWidth の re-export 削除
新規ファイル
components/profile/SectionBand.tsx - フルブリード帯コンポーネント（背景・レスポンシブパディング管理）
lib/sections/background-utils.ts - resolveBackgroundStyle(), resolvePreset() ユーティリティ
lib/sections/preset-queries.ts - getActivePresets() + React.cache()
scripts/seed-section-backgrounds.ts - 初期プリセット投入スクリプト
変更ファイル
components/profile/ProfileLayout.tsx - max-w-[1200px] コンテナ削除（フルブリード対応）
components/profile/SectionRenderer.tsx - SectionBand でラップ、presets prop 追加、space-y-6 → w-full
components/profile/SectionSkeleton.tsx - width prop 削除
components/profile/SectionErrorFallback.tsx - width prop 削除
components/user-profile/EditableSectionRenderer.tsx - SectionBand 適用、presets prop 追加
components/user-profile/sections/ImageHeroSection.tsx - rounded-3xl 除去（fullBleed 対応）
app/[handle]/page.tsx - space-y-6 ラッパー除去、getActivePresets() + Promise.all で並列 fetch
app/dashboard/profile-editor/page.tsx - getActivePresets() 並列 fetch
app/dashboard/profile-editor/EditableProfileClient.tsx - presets prop 対応
app/demo/sections/page.tsx - width → fullBleed バッジ表示に変更
削除ファイル
components/profile/SectionWrapper.tsx 削除
ビルド検証
tsc --noEmit エラーゼロ
変更ファイルの ESLint エラーゼロ


## Phase 2 完了サマリー

Phase 2: Admin UI 完了
新規作成ファイル
ファイル	内容
section-background-actions.ts	Server Actions: CRUD + isActive toggle + sortOrder一括更新
page.tsx	一覧ページ（プリセット一覧テーブル）
new/page.tsx	新規作成ページ
[id]/page.tsx	編集ページ
error.tsx	エラーバウンダリ
PresetListClient.tsx	テーブル（DnD並び替え + isActiveトグル + 削除）
PresetForm.tsx	作成/編集フォーム（カテゴリ別UI + ライブプレビュー）
PresetPreview.tsx	背景プレビューコンポーネント
変更ファイル
ファイル	変更内容
background-utils.ts	generateCssString() 関数追加（保存時にcssStringを自動生成）
layout-config.ts	admin ナビに「Backgrounds」リンク追加（Palette アイコン）
admin/page.tsx	ダッシュボードに「背景プリセット」カード追加
主な機能
プリセット一覧: カテゴリ別表示、DnDで並び替え、isActiveトグル
作成/編集フォーム: 単色（カラーピッカー）とグラデーション（タイプ・角度・カラーストップ）
ライブプレビュー: フォーム入力に応じてリアルタイムに背景を表示
cssString自動生成: 保存時にconfigからCSSキャッシュ文字列を自動生成
Zodバリデーション: HEXカラー検証、ストップ数制限（2〜10）
3層認証: 全ページで admin 権限チェック

## Phase 3 完了サマリー

Phase 3: エディターUI 完了サマリー
新規作成ファイル
ファイル	内容
SectionStylePanel.tsx	セクションスタイル設定パネル（Sheet ドロワー）
変更ファイル
ファイル	変更内容
section-actions.ts	updateSectionSettings() Server Action 追加
EditableSectionWrapper.tsx	Palette ボタン追加（onStyleEdit prop）
EditableSectionRenderer.tsx	スタイル編集の状態管理 + リアルタイムプレビュー
主な機能
背景設定: 「なし（テーマ背景）」または「プリセット選択」のラジオボタン切り替え。プリセット選択時はグラデーション/単色のタブ付きサムネイルグリッドから選択

余白設定: モバイル/タブレット/PC のタブで切り替え、上下それぞれ「なし/小/中/大/特大」の ToggleGroup で設定。タブレット・PC は未設定時に継承

リアルタイムプレビュー: スタイルパネルで設定を変更すると localSettings ステートが更新され、背後の SectionBand にリアルタイムで反映。保存前でもプレビュー可能

Server Action: updateSectionSettings() で UserSection.settings JSON フィールドを更新。3層認証（所有者確認）付き

ビルド検証
tsc --noEmit エラーゼロ
ESLint エラーゼロ（既存の sectionId 未使用 warning のみ）