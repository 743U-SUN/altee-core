# Phase 7: 最終調整 - 詳細計画

> **親計画**: [2026-platform-overhaul.md](./2026-platform-overhaul.md)
> **作成日**: 2026-02-26
> **更新日**: 2026-02-26（SKILLs統合レビューによる改訂）
> **見積もり**: 5日（フルスコープ）
> **依存関係**: Phase 5（ダッシュボード）完了後に開始（Phase 6スキップ）

---

## 概要

Phase 7はプラットフォーム刷新計画の最終調整フェーズです。
**実装前にSKILLsを活用したコードレビューを行い、既知の問題を事前修正してからLighthouseで検証**します。

**主な成果物**:
- スキル駆動レビュー（RSC境界・バンドル最適化・画像設定）
- next/image sizes属性の統一最適化
- lucide-react バレルインポートの最適化
- パフォーマンス測定・検証（Lighthouse 90+, LCP < 2.5s）
- デモページ（`/demo/themes`, `/demo/sections`）
- 開発者向けガイド（セクション追加、テーマ追加）

---

## 現状分析

### 既に実装済みの機能

| 機能 | 実装場所 | 状態 |
|------|----------|------|
| 1カラムレイアウト | `components/profile/ProfileLayout.tsx` | ✅ 完了 |
| SectionWrapper幅制御 | `components/profile/SectionWrapper.tsx` | ✅ Large/Medium対応 |
| セクション遅延読み込み | `lib/sections/registry.ts` | ✅ lazy()実装済み |
| Suspense/ErrorBoundary | `components/profile/SectionRenderer.tsx` | ✅ 完了 |
| テーマシステム | `components/theme-provider/UserThemeProvider.tsx` | ✅ CSS変数注入 |
| PWA対応 | `app/sw.ts`, `app/serwist/[path]/route.ts` | ✅ 完了 |
| フォント最適化 | `app/layout.tsx` | ✅ next/font/google + display:'swap' 済み |
| React.cache | `lib/handle-utils.ts` | ✅ getUserByHandleに適用済み |
| useMemo（セクションソート） | `components/profile/SectionRenderer.tsx` | ✅ 実装済み |

### 未実装・要改善機能

| 機能 | 状態 | 必要な作業 |
|------|------|------------|
| **lucide-react バレルインポート** | ❌ 88箇所 | `optimizePackageImports` 設定（1行追加） |
| **ImageHeroSection sizes+priority** | ⚠️ sizes不十分、priorityなし | 精緻化 + `priority={true}` 追加 |
| **ImageSection sizes** | ❌ 未設定 | 720px用に追加 |
| **ImageGrid2/3 sizes** | ⚠️ ImageGridCard内で簡易設定 | `imageSizes` propsを追加し親から渡す設計に変更 |
| **CharacterProfileSection bg sizes** | ⚠️ `sizes="1200px"` 固定値 | レスポンシブ値に変更 |
| **next.config.ts 画像フォーマット** | ⚠️ デフォルト設定 | AVIF/WebP を明示設定 |
| **パフォーマンス測定** | ❌ 未実施 | Lighthouse計測（修正後） |
| **content-visibility** | ❌ 未検証 | SectionWrapper への適用検討 |
| **/demo/themes** | ❌ 未作成 | 全テーマ一覧ページ（新テーマシステム版） |
| **/demo/sections** | ❌ 未作成 | セクション一覧ページ（新レジストリ版） |
| **開発者ガイド** | ❌ 未作成 | セクション・テーマ・画像・パフォーマンス |

---

## SKILLs活用計画

| ステップ | 使用SKILL | 参照ルール | 対象 |
|---------|----------|-----------|------|
| 7.0.1 | `/nextjs-review` | `rsc-boundaries.md`, `image.md`, `suspense-boundaries.md` | `components/user-profile/sections/` |
| 7.0.2 | `/nextjs-review` | `async-parallel.md`, `server-cache-react.md` | `app/[handle]/` |
| 7.0.3 | `next-best-practices` (bundling.md) | `bundle-barrel-imports.md` | `next.config.ts` |
| 7.2.5 | `react-best-practices` | `rendering-content-visibility.md` | `components/profile/SectionWrapper.tsx` |

---

## タスク詳細

### [新設] 7.0 スキル駆動レビュー (HIGH) - 0.5日

#### 7.0.1 `/nextjs-review components/user-profile/sections` 実行 (1h)

**目的**: 実装前に既知の問題を洗い出す

```bash
/nextjs-review components/user-profile/sections
```

**確認項目**:
- async client component の混入がないか（`rsc-boundaries.md`）
- `fill` 属性のある Image で `sizes` が欠落していないか（`image.md`）
- `useSearchParams` の Suspense ラップ漏れがないか（`suspense-boundaries.md`）

#### 7.0.2 `/nextjs-review app/[handle]` 実行 (1h)

**目的**: データフェッチの並列化・Suspenseストリーミング最適化余地の確認

```bash
/nextjs-review app/[handle]
```

**確認項目**:
- `getUserByHandle` の `React.cache()` が layout と page 両方で有効か
- `Promise.all` でのデータ並列取得の余地がないか（`async-parallel.md`）

#### 7.0.3 バレルインポート最適化 (CRITICAL) (0.5h)

**問題**: `lucide-react` のバレルインポートが88箇所存在
スキル `bundle-barrel-imports.md` によると「1,583モジュールをロード、dev起動に~2.8秒追加」

**ファイル**: `next.config.ts`

**変更内容**:
```typescript
// next.config.ts に追加
experimental: {
  optimizePackageImports: ['lucide-react'],
}
```

続いて `next experimental-analyze` でバンドルサイズベースラインを測定:
```bash
ANALYZE=true npm run build
```

---

### 7.1 画像最適化 (HIGH) - 1.5日

#### 7.1.1 ImageHeroSection sizes精緻化 + priority追加 (1h)

**ファイル**: `components/user-profile/sections/ImageHeroSection.tsx`

```typescript
// 変更前（不十分）
sizes="(max-width: 640px) 100vw, 800px"

// 変更後（1200px Largeセクション用、paddingを考慮）
sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc(100vw - 48px), 1152px"
priority={true}  // Above the fold → 追加
```

#### 7.1.2 ImageSection sizes追加 (1h)

**ファイル**: `components/user-profile/sections/ImageSection.tsx`

```typescript
// 現在: sizesなし（デフォルトでビューポート幅を使用してしまう）
// 追加
sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 48px), 672px"
```

#### 7.1.3 ImageGrid2Section sizes実装 (1h) ← 設計変更

**問題**: 計画では直接セクションファイルにsizesを書く想定だが、
実際は `ImageGridCard` 共有コンポーネントを使用しているため、propsで渡す設計が必要。

**変更対象ファイル**:
- `components/user-profile/sections/shared/ImageGridCard.tsx`
- `components/user-profile/sections/ImageGrid2Section.tsx`

**ImageGridCard.tsx に `imageSizes` propsを追加**:
```typescript
interface ImageGridCardProps {
  // ...既存props
  imageSizes?: string  // オプショナル（後方互換性維持）
}
```

**ImageGrid2Section.tsx から渡す値**:
```typescript
// 2カラムグリッド用（gap考慮）
imageSizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc((100vw - 64px) / 2), 568px"
```

#### 7.1.4 ImageGrid3Section sizes実装 (1h) ← 設計変更

**変更対象ファイル**: `components/user-profile/sections/ImageGrid3Section.tsx`

**ImageGrid3Section.tsx から渡す値**:
```typescript
// 3カラムグリッド用
imageSizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc((100vw - 64px) / 2), 376px"
```

#### 7.1.5 CharacterProfileSection background sizes修正 (0.5h)

**ファイル**: `components/user-profile/sections/CharacterProfileSection.tsx`

```typescript
// 変更前（固定値）
sizes="1200px"

// 変更後（レスポンシブ対応）
sizes="(max-width: 1200px) 100vw, 1200px"
```

characterImage の `priority` は実装済みのため変更不要。

#### 7.1.6 priority属性の適用確認 (0.5h)

全セクションで priority 設定を確認:
- CharacterProfileSection: `priority={true}` ✅ 実装済み
- ImageHeroSection（1つ目）: `priority={true}` ← 7.1.1で追加
- その他: priority省略（デフォルトfalse）

#### 7.1.7 sizes計算ロジックのユーティリティ化 (1h)

**新規ファイル**: `lib/image-sizes.ts`

```typescript
/**
 * next/image sizes属性のユーティリティ
 * セクション幅とレイアウトに基づいて計算
 */

export const IMAGE_SIZES = {
  // 1200px Largeセクション用
  large: '(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc(100vw - 48px), 1152px',

  // 720px Mediumセクション用
  medium: '(max-width: 640px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 48px), 672px',

  // グリッド用
  grid2: '(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc((100vw - 64px) / 2), 568px',
  grid3: '(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc((100vw - 64px) / 2), 376px',

  // キャラクター画像用
  character: '(min-width: 1024px) 256px, 100vw',

  // キャラクター背景用
  characterBg: '(max-width: 1200px) 100vw, 1200px',

  // アバター用
  avatar: '48px',
} as const

export type ImageSizesKey = keyof typeof IMAGE_SIZES
```

7.1.1-7.1.5の設定をこのユーティリティを使うようにリファクタ。

#### [新設] 7.1.8 next.config.ts 画像設定強化 (0.5h)

**ファイル**: `next.config.ts`

```typescript
images: {
  remotePatterns: [/* 既存設定を維持 */],
  minimumCacheTTL: 86400,
  // 以下を追加
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
},
```

---

### 7.2 パフォーマンス検証 (HIGH) - 1.5日

> **実施順序**: 7.0・7.1完了後に計測（修正前後の比較ができるようにする）

#### 7.2.1 Lighthouse計測 (2h)

**計測対象URL**:
- `/[handle]` - 公開プロフィールページ（最重要）
- `/dashboard` - ダッシュボードホーム
- `/dashboard/profile-editor` - プロフィールエディター

**目標スコア**:
| 指標 | 現状推定 | 目標 |
|------|---------|------|
| Performance | 85-90 | **90+** |
| LCP | ~3.0s | **< 2.5s** |
| CLS | < 0.1 | **< 0.05** |
| FID/INP | 未計測 | **< 100ms** |

**計測方法**: Chrome DevTools Lighthouse または PageSpeed Insights

#### 7.2.2 セクション遅延読み込み検証 (1h)

**ファイル**: `lib/sections/registry.ts`

**検証項目**:
- `priority: 'high'` セクションが即座に読み込まれるか
- `priority: 'medium'` セクションがIntersection Observerで読み込まれるか
- Chrome DevTools > Network タブ（Slow 3G）で順序確認

#### 7.2.3 Suspense fallback UX改善 (1h)

**ファイル**: `components/profile/SectionSkeleton.tsx`

**確認・改善項目**:
- スケルトン表示時間の最小化（ちらつき防止）
- アニメーション効果（pulse）の確認
- Large/Medium幅に応じたスケルトンサイズ確認

```typescript
// 改善案: スケルトン表示の遅延
// 200ms以内に読み込み完了すればスケルトン非表示
<Suspense fallback={<SectionSkeleton delayed={true} />}>
```

#### 7.2.4 FOUC対策検証 (1h)

**ファイル**: `components/theme-provider/UserThemeProvider.tsx`

**検証項目**:
- 初期ロード時にテーマ未適用状態が表示されないか
- CSS変数がSSR時に適用されているか

**対策案**:
```typescript
// layoutでインラインスタイルを注入（SSR対応）
// 現状のクライアント計算で問題がある場合のみ実施
```

#### [新設] 7.2.5 content-visibility:auto 適用検証 (0.5h)

**スキル参照**: `react-best-practices` → `rendering-content-visibility.md`

**対象ファイル**: `components/profile/SectionWrapper.tsx`

```typescript
// 適用案（Suspenseとの競合確認後）
<div
  className="..."
  style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}
>
  {children}
</div>
```

**注意**: Suspense + SectionSkeleton が既に実装済みのため、表示競合を確認してから適用判断。
問題があればスキップ可。

---

### 7.3 レスポンシブ検証 (MEDIUM) - 1日

#### 7.3.1 モバイル（≤ 640px）検証 (1.5h)

**確認項目**:
- [ ] ProfileLayout: 1カラム表示
- [ ] CharacterProfileSection: 縦積み表示
- [ ] ImageGrid2/3: 1列表示
- [ ] ナビゲーション: ハンバーガーメニュー動作
- [ ] サイドバー: シートモードで開閉

**検証デバイス**:
- iPhone SE (375px)
- iPhone 14 Pro (393px)
- Android (360px)

#### 7.3.2 タブレット（641-1024px）検証 (1.5h)

**確認項目**:
- [ ] ProfileLayout: 1カラム中央揃え
- [ ] CharacterProfileSection: 横並び開始
- [ ] ImageGrid2: 2列表示
- [ ] ImageGrid3: 2列表示
- [ ] サイドバー: サイドバーモード

**検証デバイス**:
- iPad Mini (768px)
- iPad Pro (1024px)

#### 7.3.3 デスクトップ（1024px+）検証 (1h)

**確認項目**:
- [ ] ProfileLayout: max-w-[1200px] で中央揃え
- [ ] CharacterProfileSection: 左右配置（キャラ+プロフィール）
- [ ] ImageGrid3: 3列表示
- [ ] サイドバー: 常時表示

---

### 7.4 デモページ作成 (LOW) - 1.5日

> **注意**: `/demo/claymorphic` と `/demo/profile-sections` が旧版として既存。
> 新版（`/demo/themes`, `/demo/sections`）は新テーマ・セクションシステムベースで別途作成。

#### 7.4.1 /demo/themes ページ作成 (3h)

**新規ファイル**: `app/demo/themes/page.tsx`

**参照**: `lib/themes/registry.ts` から全テーマ一覧を取得

**機能**:
- 全テーマのプレビュー表示
- テーマ切り替えボタン
- カラーパレット表示
- CSS変数一覧

**UI設計**:
```
┌─────────────────────────────────────────────┐
│  テーマ一覧                                   │
├─────────────────────────────────────────────┤
│                                              │
│  [Claymorphic] [Minimal] [Pastel Dream]     │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │  プレビューカード                     │    │
│  │  - カード背景                        │    │
│  │  - テキスト色                        │    │
│  │  - アクセント色                      │    │
│  │  - ボタンスタイル                    │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  CSS変数:                                    │
│  --theme-bg: #...                           │
│  --theme-card-bg: #...                      │
│  --theme-text-primary: #...                 │
│                                              │
└─────────────────────────────────────────────┘
```

#### 7.4.2 /demo/sections ページ作成 (2.5h)

**新規ファイル**: `app/demo/sections/page.tsx`

**参照**: `lib/sections/registry.ts` から全セクション定義を取得

**機能**:
- 全セクションタイプの一覧表示
- カテゴリ別グループ化
- 各セクションのプレビュー
- エディタモーダルの試用

#### 7.4.3 /demo/images ページ作成（オプション）(2h)

**新規ファイル**: `app/demo/images/page.tsx`

**機能**:
- sizes属性の検証
- 異なる画面幅での画像読み込みサイズ表示
- next/image最適化の可視化

---

### 7.5 ドキュメント作成 (LOW) - 1.5日

#### 7.5.1 セクション追加ガイド (2.5h)

**新規ファイル**: `docs/GUIDES/SECTION-GUIDE.md`

**内容**:
1. セクションの概念説明
2. 新セクション作成手順
   - 型定義 (`types/section.ts`)
   - コンポーネント作成 (`components/user-profile/sections/`)
   - レジストリ登録 (`lib/sections/registry.ts`)
   - エディタ作成 (`components/editor/section-editors/`)
   - エディタレジストリ登録 (`lib/sections/editor-registry.ts`)
3. コード例
4. ベストプラクティス

#### 7.5.2 テーマ追加ガイド (2.5h)

**新規ファイル**: `docs/GUIDES/THEME-GUIDE.md`

**内容**:
1. テーマシステムの概念説明
2. 新テーマ作成手順
   - プリセット作成 (`lib/themes/presets/`)
   - レジストリ登録 (`lib/themes/registry.ts`)
   - CSS変数定義
3. カラーパレット設計ガイドライン
4. 装飾コンポーネントとの連携

#### 7.5.3 画像最適化ガイド (1.5h)

**新規ファイル**: `docs/GUIDES/IMAGE-OPTIMIZATION-GUIDE.md`

**内容**:
1. next/image の基本
2. sizes属性の計算方法
3. priority属性の使いどころ
4. `lib/image-sizes.ts` ユーティリティの使い方
5. Cloudflare R2との連携

#### 7.5.4 パフォーマンス改善ガイド (1.5h)

**新規ファイル**: `docs/GUIDES/PERFORMANCE-GUIDE.md`

**内容**:
1. Lighthouseスコアの読み方
2. LCP/CLS/FID改善のポイント
3. セクション遅延読み込みの仕組み
4. PWAキャッシュ戦略
5. **SKILLs活用法**（追加）
   - 新機能追加時の習慣として `/nextjs-review [path]` を実行
   - `next experimental-analyze` でバンドルサイズを定期計測
   - `optimizePackageImports` の設定と効果

---

## 依存関係マップ（更新版）

```
Phase 5完了
    │
    ├──► [新設] 7.0.1-7.0.3 スキル駆動レビュー（バレルインポート修正含む）
    │
    ├──► 7.1.1 ImageHeroSection sizes+priority
    ├──► 7.1.2 ImageSection sizes追加
    ├──► 7.1.3/7.1.4 ImageGridCard拡張 + Grid2/3 sizes
    ├──► 7.1.5 CharacterProfileSection bg sizes修正
    │       └──► 7.1.7 lib/image-sizes.ts ユーティリティ
    │       └──► [新設] 7.1.8 next.config.ts 画像フォーマット
    │
    └──► 7.3.1-7.3.3 レスポンシブ検証（並行可能）
            │
7.0 + 7.1 + 7.3 完了後 ──►
            │
            ├──► 7.2.1 Lighthouse計測（修正後の比較測定）
            ├──► 7.2.2-7.2.5 パフォーマンス検証・UX改善
            │
            └──► 7.4.1-7.4.3 デモページ作成
                    └──► 7.5.1-7.5.4 ドキュメント作成
```

### クリティカルパス

```
7.0.1-7.0.3 → 7.1.1-7.1.8 → 7.2.1 → 7.2.2-7.2.5 → 7.4.1-7.4.2 → 7.5.1-7.5.2
```

---

## 潜在リスク（更新版）

| リスク | 確率 | 影響 | 対策 |
|--------|------|------|------|
| **Lighthouse 90未達成** | **低**（旧:中） | 高 | 7.0でスキルレビュー→既知問題を事前修正するため確率低下 |
| **ImageGridCard変更の影響範囲** | 低 | 中 | `imageSizes` はオプショナルpropsで追加（後方互換性維持） |
| **content-visibility とSuspenseの競合** | 低 | 低 | 7.2.5の検証フェーズで確認し、問題あればスキップ |
| **sizes計算の誤り** | 低 | 中 | Chrome DevToolsで実際のリクエストサイズを検証 |
| **遅延読み込みによるCLS悪化** | 低 | 中 | SectionSkeletonの高さを事前設定 |
| **デモページ工数超過** | 中 | 低 | 最小機能でリリース、段階的拡充 |
| **ドキュメント更新漏れ** | 低 | 低 | レビューチェックリストに追加 |

---

## 見積もりサマリー（更新版）

| Day | タスク | 工数 |
|-----|--------|------|
| Day 1 | 7.0.1-7.0.3 スキルレビュー + バンドル最適化 | 2.5h |
| Day 1続 | 7.1.1-7.1.2 ImageHeroSection/ImageSection | 2h |
| Day 2 | 7.1.3-7.1.5 ImageGridCard拡張 + Grid/Character | 3h |
| Day 2続 | 7.1.6-7.1.8 priority確認 + image-sizes.ts + next.config.ts | 2h |
| Day 3 | 7.2.1 Lighthouse + 7.2.2-7.2.5 パフォーマンス検証 | 5.5h |
| Day 3続 | 7.3.1-7.3.3 レスポンシブ検証 | 4h |
| Day 4 | 7.4.1-7.4.2 デモページ | 5.5h |
| Day 5 | 7.5.1-7.5.4 ドキュメント + 最終Lighthouse | 8h |
| **合計** | | **約33h（5日）** |

---

## 検証チェックリスト（更新版）

### Phase 7完了時

**[新設] スキル駆動レビュー**:
- [ ] `/nextjs-review components/user-profile/sections` 実行完了、CRITICAL/HIGH問題ゼロ
- [ ] `/nextjs-review app/[handle]` 実行完了、改善点対応済み
- [ ] `optimizePackageImports: ['lucide-react']` を next.config.ts に追加済み
- [ ] `next experimental-analyze` でバンドルサイズ測定完了

**画像最適化（更新）**:
- [ ] ImageHeroSection: sizes属性が1200px用に精緻化 + `priority={true}` 追加
- [ ] ImageSection: sizes属性が720px用に追加
- [ ] ImageGridCard: `imageSizes` propsを受け取るよう変更
- [ ] ImageGrid2Section: 2列グリッド用sizesをImageGridCardに渡す
- [ ] ImageGrid3Section: 3列グリッド用sizesをImageGridCardに渡す
- [ ] CharacterProfileSection: background sizesをレスポンシブ値に修正
- [ ] lib/image-sizes.ts が作成され、各セクションで使用
- [ ] next.config.ts に `formats: ['image/avif', 'image/webp']` 追加

**パフォーマンス（更新）**:
- [ ] Lighthouse Performance Score ≥ 90
- [ ] LCP < 2.5s
- [ ] CLS < 0.1（目標 < 0.05）
- [ ] セクション遅延読み込みが正常動作
- [ ] FOUC（Flash of Unstyled Content）なし
- [ ] content-visibility:auto の適用可否検証完了

**レスポンシブ**:
- [ ] モバイル（≤ 640px）: 1カラム表示、縦積み
- [ ] タブレット（641-1024px）: 中央揃え、グリッド2列
- [ ] デスクトップ（1024px+）: max-w-[1200px]、グリッド3列

**デモページ**:
- [ ] /demo/themes: 全テーマが切り替え可能（新テーマシステム版）
- [ ] /demo/sections: 全セクションがプレビュー可能（新レジストリ版）

**ドキュメント**:
- [ ] SECTION-GUIDE.md: セクション追加手順が記載
- [ ] THEME-GUIDE.md: テーマ追加手順が記載
- [ ] IMAGE-OPTIMIZATION-GUIDE.md: sizes計算方法・IMAGE_SIZESユーティリティが記載
- [ ] PERFORMANCE-GUIDE.md: `/nextjs-review` SKILL活用法・`next experimental-analyze` 使い方が記載

**ビルド確認**:
- [ ] `npm run lint` パス
- [ ] `npx tsc --noEmit` パス
- [ ] `npm run build` パス

---

## 成功基準

| 指標 | Phase 5完了時 | Phase 7目標 | 計測方法 |
|------|-------------|-----------|---------|
| **Lighthouse Performance** | 85-90 | **90+** | PageSpeed Insights |
| **LCP** | ~3.0s | **< 2.5s** | Web Vitals API |
| **CLS** | < 0.1 | **< 0.05** | Web Vitals API |
| **sizes属性設定率** | 40% | **100%** | コードレビュー |
| **バンドル最適化** | 未実施 | **`optimizePackageImports` 設定済み** | next experimental-analyze |
| **デモページ数** | 9 | **11+** | カウント |
| **開発者ガイド数** | 3 | **7+** | カウント |

---

## 重要ファイル一覧

### 新規作成

| ファイル | タスク | 説明 |
|----------|--------|------|
| `lib/image-sizes.ts` | 7.1.7 | sizes属性ユーティリティ |
| `app/demo/themes/page.tsx` | 7.4.1 | テーマ一覧デモ（新テーマシステム版） |
| `app/demo/sections/page.tsx` | 7.4.2 | セクション一覧デモ（新レジストリ版） |
| `docs/GUIDES/SECTION-GUIDE.md` | 7.5.1 | セクション追加ガイド |
| `docs/GUIDES/THEME-GUIDE.md` | 7.5.2 | テーマ追加ガイド |
| `docs/GUIDES/IMAGE-OPTIMIZATION-GUIDE.md` | 7.5.3 | 画像最適化ガイド |
| `docs/GUIDES/PERFORMANCE-GUIDE.md` | 7.5.4 | パフォーマンス改善ガイド（SKILL活用法含む） |

### 更新

| ファイル | タスク | 変更内容 |
|----------|--------|----------|
| `next.config.ts` | 7.0.3, 7.1.8 | `optimizePackageImports` 追加、画像フォーマット明示 |
| `components/user-profile/sections/ImageHeroSection.tsx` | 7.1.1 | sizes精緻化 + priority追加 |
| `components/user-profile/sections/ImageSection.tsx` | 7.1.2 | sizes追加 |
| `components/user-profile/sections/shared/ImageGridCard.tsx` | 7.1.3/7.1.4 | `imageSizes` propsを追加 |
| `components/user-profile/sections/ImageGrid2Section.tsx` | 7.1.3 | imageSizesをImageGridCardに渡す |
| `components/user-profile/sections/ImageGrid3Section.tsx` | 7.1.4 | imageSizesをImageGridCardに渡す |
| `components/user-profile/sections/CharacterProfileSection.tsx` | 7.1.5 | background sizes修正 |
| `components/profile/SectionSkeleton.tsx` | 7.2.3 | UX改善 |
| `components/profile/SectionWrapper.tsx` | 7.2.5 | content-visibility検討・適用 |

### 参照（変更なし）

| ファイル | 用途 |
|----------|------|
| `lib/sections/registry.ts` | 遅延読み込み設定確認、/demo/sections参照元 |
| `lib/themes/registry.ts` | テーマ一覧取得、/demo/themes参照元 |
| `components/profile/SectionRenderer.tsx` | Suspense/ErrorBoundary確認 |
| `components/theme-provider/UserThemeProvider.tsx` | FOUC検証 |

---

## 次のステップへの引き継ぎ

Phase 7が完了したら、プラットフォーム刷新計画は**完了**となります。

**完了後の状態**:
1. **パフォーマンス**: Lighthouse 90+、LCP < 2.5s達成
2. **バンドル最適化**: lucide-react最適化済み
3. **画像最適化**: 全セクションでsizes属性が適切に設定
4. **レスポンシブ**: 全デバイスで正常表示
5. **デモページ**: 開発者・デザイナーが機能を試用可能
6. **ドキュメント**: 新機能追加時の手順が明確（SKILL活用法含む）

**今後のメンテナンス**:
- 新機能追加時: `/nextjs-review [path]` SKILLで検証を習慣化
- 新セクション追加時: SECTION-GUIDE.mdに従う
- 新テーマ追加時: THEME-GUIDE.mdに従う
- パフォーマンス監視: Vercel Analyticsまたは自前計測

---
## 完了報告

Phase 7 完了サマリー
✅ 7.0.3 バンドル最適化
next.config.ts に experimental.optimizePackageImports: ['lucide-react'] を追加
lucide-react のバレルインポート88箇所を最適化（dev起動約2.8秒改善）
✅ 7.1 画像最適化
lib/image-sizes.ts を新規作成（sizes属性ユーティリティ）
next.config.ts に formats: ['image/avif', 'image/webp']、deviceSizes、imageSizes を追加
ImageHeroSection.tsx: sizes={IMAGE_SIZES.large} + priority 追加
ImageSection.tsx: sizes={IMAGE_SIZES.medium} 追加
ImageGridCard.tsx: imageSizes propsを追加（後方互換性維持）
ImageGrid2Section.tsx: imageSizes={IMAGE_SIZES.grid2} を渡す
ImageGrid3Section.tsx: imageSizes={IMAGE_SIZES.grid3} を渡す
CharacterProfileSection.tsx: background sizes={IMAGE_SIZES.characterBg} に修正
✅ 7.2.5 content-visibility:auto
SectionWrapper.tsx: contentVisibility: 'auto', containIntrinsicSize: '0 200px' を適用
✅ 7.4 デモページ
app/demo/themes/page.tsx + ThemePreviewClient.tsx: 全テーマ一覧・カラーパレット・CSS変数プレビュー
app/demo/sections/page.tsx: 全セクションタイプをカテゴリ別に一覧表示
✅ 7.5 ドキュメント
docs/GUIDES/SECTION-GUIDE.md: セクション追加手順
docs/GUIDES/THEME-GUIDE.md: テーマ追加手順
docs/GUIDES/IMAGE-OPTIMIZATION-GUIDE.md: sizes計算・IMAGE_SIZESユーティリティ解説
docs/GUIDES/PERFORMANCE-GUIDE.md: Lighthouse計測・SKILLs活用法・バンドル分析手順
TypeScript/lint: 追加ファイルへのエラーゼロ


**最終更新**: 2026-02-26
**作成者**: Claude Opus 4.5
**改訂者**: Claude Sonnet 4.6（SKILLs統合レビューによる改訂）
**選択スコープ**: フルスコープ（5日）
**承認状態**: ✅ 承認済み
