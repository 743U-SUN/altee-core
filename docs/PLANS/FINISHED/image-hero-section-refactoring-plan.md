# ImageHeroSection リファクタリング計画

## 1. 概要

### 1.1 背景と目的

現在の `ImageHeroSection` は 21:9 アスペクト比の固定バナー画像として実装されている。
以下の課題を解決し、フルスクリーンヒーロー画像セクションに刷新する。

| 課題 | 詳細 |
|------|------|
| アスペクト比 | 21:9 は横長すぎてインパクトが弱い → 16:9 に変更 |
| ホバーアニメーション | `scale-105` で画像が拡大され左右が切れる → 削除 |
| レスポンシブ | モバイル/タブレットで横長画像が小さく表示される → 別画像（3:4）を設定可能に |
| 表示サイズ | 固定アスペクト比で小さい → ビューポート全画面表示に |

### 1.2 決定事項

- **パディング**: image-hero セクション作成時にデフォルト `none` を自動適用
- **クロップ位置**: `object-position: center` 固定（将来必要になれば調整機能を追加）
- **ブレークポイント**: 992px（既存のヘッダー/ナビと同じ分岐点。iPad 横向き 1024px は PC 表示）
- **ImageUploader の processOptions**: スコープ外。モバイル画像は現在の 1920x1080 上限で処理（3:4 画像 → 810x1080）

---

## 2. 現在の実装

### 2.1 ファイル構成

| ファイル | 役割 |
|---------|------|
| `components/user-profile/sections/ImageHeroSection.tsx` | 表示コンポーネント |
| `components/user-profile/sections/editors/ImageHeroEditModal.tsx` | 編集モーダル |
| `types/profile-sections.ts` | `ImageHeroData` / `ImageGridItem` 型定義 |
| `lib/sections/type-guards.ts` | `isImageHeroData` 型ガード |
| `lib/sections/registry.ts` | セクション登録（`fullBleed: true`, `maxInstances: 1`） |
| `lib/sections/types.ts` | `SectionDefinition` インターフェース |
| `lib/image-sizes.ts` | next/image の `sizes` 属性定数 |
| `app/actions/user/section-actions.ts` | `createSection` Server Action |

### 2.2 現在のデータ構造

```typescript
// types/profile-sections.ts

// image-hero / image-grid-2 / image-grid-3 で共有
interface ImageGridItem {
  id: string                 // nanoid()
  imageKey?: string          // MediaFile.storageKey (Cloudflare R2)
  title?: string             // 左下タイトル (最大30文字)
  subtitle?: string          // 左下サブタイトル/badge (最大20文字)
  overlayText?: string       // 右上バッジ (最大15文字)
  linkUrl?: string           // リンク先URL
  sortOrder: number
}

// 現在の ImageHeroData（単一アイテム）
interface ImageHeroData {
  item: ImageGridItem
}
```

### 2.3 現在の表示コンポーネント（主要部分）

```tsx
// ImageHeroSection.tsx
export function ImageHeroSection({ section }: BaseSectionProps) {
  const { getDecoration } = useUserTheme()
  const hoverEffect = getDecoration('cardHover')
  // ...

  return (
    <div className={cn(
      "relative w-full aspect-[21/9] overflow-hidden group shadow-lg",
      HOVER_CLASSES[hoverEffect] ?? ''        // テーマ連動ホバー（lift/glow/press/shake）
    )}>
      <Image
        src={imageUrl}
        fill
        sizes={IMAGE_SIZES.large}
        priority
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        //                                                        ^^^^^^^^^^^^^^^^^^^^^^^^
        //                                                        この拡大で左右が切れる
      />
      {/* overlay, content layer ... */}
    </div>
  )
}
```

### 2.4 レイアウトコンテキスト

```
ProfileLayout (1カラム、全デバイス共通)
├── ProfileHeader   ... PC専用 (max-[992px]:hidden), sticky top-0, h-16 (64px)
├── <main>          ... フルブリードコンテンツ
│   └── SectionBand ... fullBleed=true の場合 max-width コンテナなし
│       └── ImageHeroSection
├── MobileBottomNav ... モバイル専用 (min-[993px]:hidden), fixed bottom-0, h-16 (64px)
└── FloatingElements
```

**SectionBand の注意点:**
- `contentVisibility: 'auto'` + `containIntrinsicSize: 'auto 200px'` が設定されている
- CSS Custom Properties でデフォルト 8px のパディングが付与される（`[data-section-band]` in globals.css）
- `fullBleed=true` の場合、`max-w-[1200px]` コンテナをスキップして幅いっぱいにレンダリング

---

## 3. 変更ファイル一覧

| # | ファイル | 変更種別 | 変更内容 |
|---|---------|---------|---------|
| 1 | `types/profile-sections.ts` | 型追加 | `ImageHeroData` に `mobileImageKey` フィールド追加 |
| 2 | `lib/sections/type-guards.ts` | ロジック修正 | `isImageHeroData` に `mobileImageKey` バリデーション追加 |
| 3 | `lib/sections/types.ts` | 型追加 | `SectionDefinition` に `defaultSettings` フィールド追加 |
| 4 | `lib/image-sizes.ts` | 定数追加 | `heroFull` / `heroMobile` サイズ定数追加 |
| 5 | `lib/sections/registry.ts` | 設定変更 | image-hero の description / defaultData / defaultSettings 更新 |
| 6 | `app/actions/user/section-actions.ts` | ロジック修正 | `createSection` で `defaultSettings` を DB に適用 |
| 7 | `components/user-profile/sections/ImageHeroSection.tsx` | 大幅改修 | 全画面化・2画像切替・ホバー削除 |
| 8 | `components/user-profile/sections/editors/ImageHeroEditModal.tsx` | 機能追加 | モバイル画像アップロード UI 追加 |

---

## 4. 実装詳細

### Step 1: 型定義の更新

**ファイル:** `types/profile-sections.ts` (L198-200)

```typescript
// 変更前
export interface ImageHeroData {
  item: ImageGridItem
}

// 変更後
export interface ImageHeroData {
  item: ImageGridItem
  mobileImageKey?: string  // モバイル/タブレット用画像（3:4推奨）
}
```

**設計判断:**
- `mobileImageKey` は `ImageHeroData` に直接追加する（`ImageGridItem` は image-grid-2/3 と共有のため変更しない）
- `optional` にすることで既存データとの後方互換性を維持

---

### Step 2: 型ガードの更新

**ファイル:** `lib/sections/type-guards.ts` (L69-72)

```typescript
// 変更前
export function isImageHeroData(data: unknown): data is ImageHeroData {
  if (!isRecord(data)) return false
  return data.item === undefined || isImageGridItem(data.item)
}

// 変更後
export function isImageHeroData(data: unknown): data is ImageHeroData {
  if (!isRecord(data)) return false
  const itemValid = data.item === undefined || isImageGridItem(data.item)
  const mobileKeyValid = data.mobileImageKey === undefined || typeof data.mobileImageKey === 'string'
  return itemValid && mobileKeyValid
}
```

**後方互換性:** `mobileImageKey` が存在しない既存データは `undefined` として扱われ、型ガードを通過する。

---

### Step 3: SectionDefinition に defaultSettings 追加

**ファイル:** `lib/sections/types.ts` (L30-42)

```typescript
import type { SectionSettings } from '@/types/profile-sections'

export interface SectionDefinition {
  type: string
  label: string
  description: string
  icon: string
  category: SectionCategory
  fullBleed?: boolean
  maxInstances?: number
  priority: SectionPriority
  component: ComponentType<BaseSectionProps> | LazyExoticComponent<ComponentType<BaseSectionProps>>
  defaultData: unknown
  defaultSettings?: SectionSettings  // 追加: セクション作成時のデフォルト設定
  validate?: (data: unknown) => boolean
}
```

**目的:** image-hero セクション作成時にパディングを自動で `none` にするための汎用的な仕組み。他のセクションにも再利用可能。

---

### Step 4: IMAGE_SIZES 定数追加

**ファイル:** `lib/image-sizes.ts`

```typescript
export const IMAGE_SIZES = {
  // 既存エントリ（変更なし）
  large: '(max-width: 640px) calc(100vw - 32px), (max-width: 1200px) calc(100vw - 48px), 1152px',
  medium: '...',
  grid2: '...',
  grid3: '...',
  character: '...',
  characterBg: '...',
  avatar: '48px',

  // 追加: ヒーロー画像用
  heroFull: '100vw',                              // PC: フルスクリーン幅
  heroMobile: '(min-width: 993px) 0px, 100vw',   // モバイル: ≤992px で 100vw、>992px で 0px（非表示）
} as const
```

**`heroMobile` の `0px` について:** `min-width: 993px` で `0px` を指定することで、PC 表示時にブラウザがモバイル画像の大きなバリアントをダウンロードしないようにする（next/image の srcSet 最適化に寄与）。

---

### Step 5: レジストリ更新

**ファイル:** `lib/sections/registry.ts` — image-hero 定義

```typescript
'image-hero': {
  type: 'image-hero',
  label: 'ヒーロー画像',
  icon: 'PanelTop',
  description: '全画面ヒーロー画像（PC: 16:9 / モバイル: 3:4）',  // 変更
  category: 'image',
  fullBleed: true,
  priority: 'high',
  maxInstances: 1,
  component: lazy(() =>
    import('@/components/user-profile/sections/ImageHeroSection')
      .then(m => ({ default: m.ImageHeroSection }))
  ),
  defaultData: {
    item: {
      id: '',
      imageKey: undefined,
      title: '',
      subtitle: '',
      overlayText: '',
      linkUrl: '',
      sortOrder: 0,
    },
    mobileImageKey: undefined,  // 追加
  },
  defaultSettings: {            // 追加: パディングなし
    paddingTop: { mobile: 'none' },
    paddingBottom: { mobile: 'none' },
  },
},
```

---

### Step 6: createSection で defaultSettings 適用

**ファイル:** `app/actions/user/section-actions.ts` (L209-219)

```typescript
// 変更前
const section = await prisma.userSection.create({
  data: {
    userId,
    sectionType,
    sortOrder,
    data: sectionData as never,
  },
})

// 変更後
const definition = SECTION_REGISTRY[sectionType]
const section = await prisma.userSection.create({
  data: {
    userId,
    sectionType,
    sortOrder,
    data: sectionData as never,
    settings: definition?.defaultSettings
      ? (definition.defaultSettings as never)
      : undefined,
  },
})
```

**注意:** `SECTION_REGISTRY` は既に同ファイル内でインポート済み（L194 の `if (!SECTION_REGISTRY[sectionType])` で使用）。

---

### Step 7: ImageHeroSection 表示コンポーネント（大幅改修）

**ファイル:** `components/user-profile/sections/ImageHeroSection.tsx`

#### 7.1 削除する要素

| 削除対象 | 理由 |
|---------|------|
| `import { useUserTheme }` | ホバー効果を全削除するため不要 |
| `import { HOVER_CLASSES }` | 同上 |
| `const { getDecoration } = useUserTheme()` | 同上 |
| `const hoverEffect = getDecoration('cardHover')` | 同上 |
| `HOVER_CLASSES[hoverEffect] ?? ''` (コンテナ) | 全画面にスケール/リフト効果は不適切 |
| `group` クラス (コンテナ) | group-hover を使わないため不要 |
| `shadow-lg` (コンテナ) | 全画面表示にシャドウは不要 |
| `transition-transform duration-700 group-hover:scale-105` (Image) | ホバーアニメーション削除 |
| `opacity-0 group-hover:opacity-100 transition-opacity` (リンクアイコン) | 常時表示に変更 |

#### 7.2 変更後の完全なコンポーネント

```tsx
'use client'

import Image from 'next/image'
import { ExternalLink, ImageIcon } from 'lucide-react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import type { BaseSectionProps } from '@/types/profile-sections'
import { isImageHeroData } from '@/lib/sections'
import { cn } from '@/lib/utils'
import { IMAGE_SIZES } from '@/lib/image-sizes'

/**
 * ヒーロー画像セクション
 * PC（>992px）: 16:9 画像をビューポート全画面表示（ヘッダー分を除く）
 * モバイル/タブレット（≤992px）: 3:4 画像をビューポート全画面表示（ボトムナビ分を除く）
 */
export function ImageHeroSection({ section, isEditable }: BaseSectionProps) {
  const data = isImageHeroData(section.data) ? section.data : { item: undefined }
  const item = data.item

  // 公開モード: フルスクリーン（ヘッダー/ボトムナビ分 64px を除く）
  // 編集モード: 16:9 アスペクト比（ダッシュボードのレイアウトと干渉しない）
  const containerHeight = isEditable
    ? 'aspect-video'
    : 'h-[calc(100dvh-4rem)]'

  // 画像が未設定の場合
  if (!item?.imageKey) {
    return (
      <div className={cn('relative w-full overflow-hidden bg-muted/50', containerHeight)}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">画像が設定されていません</p>
        </div>
      </div>
    )
  }

  const pcImageUrl = getPublicUrl(item.imageKey)
  // mobileImageKey が未設定の場合は PC 画像をフォールバック
  const mobileImageUrl = data.mobileImageKey
    ? getPublicUrl(data.mobileImageKey)
    : pcImageUrl

  const Content = (
    <div className={cn('relative w-full overflow-hidden', containerHeight)}>
      {/* PC 画像（>992px で表示） */}
      <div className="absolute inset-0 hidden min-[993px]:block">
        <Image
          src={pcImageUrl}
          alt={item.title || 'ヒーロー画像'}
          fill
          sizes={IMAGE_SIZES.heroFull}
          priority
          className="object-cover"
        />
      </div>

      {/* モバイル/タブレット画像（≤992px で表示） */}
      <div className="absolute inset-0 block min-[993px]:hidden">
        <Image
          src={mobileImageUrl}
          alt={item.title || 'ヒーロー画像'}
          fill
          sizes={IMAGE_SIZES.heroMobile}
          priority
          className="object-cover"
        />
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Content Layer */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
        {(item.title || item.subtitle) && (
          <div className="space-y-1">
            {item.subtitle && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase mb-1">
                {item.subtitle}
              </span>
            )}
            {item.title && (
              <h3 className="text-2xl font-bold tracking-tight drop-shadow-md">
                {item.title}
              </h3>
            )}
          </div>
        )}

        {/* 右上エリア: overlayText と linkUrl アイコンを並列配置 */}
        {(item.overlayText || item.linkUrl) && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {item.overlayText && (
              <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                {item.overlayText}
              </div>
            )}
            {item.linkUrl && (
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (item.linkUrl) {
    return (
      <a
        href={item.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.title ? `${item.title}へのリンク` : '外部リンク'}
        className="block w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {Content}
      </a>
    )
  }

  return Content
}
```

#### 7.3 コンテナ高さの詳細

```
PC（公開ページ、>992px）:
  ┌──────────────────────────┐
  │ ProfileHeader (64px)     │ ← sticky top-0
  ├──────────────────────────┤
  │                          │
  │   ImageHeroSection       │ ← h-[calc(100dvh - 4rem)]
  │   (100dvh - 64px)        │    = ビューポート全体 - ヘッダー
  │                          │
  └──────────────────────────┘

モバイル/タブレット（公開ページ、≤992px）:
  ┌──────────────────────────┐
  │                          │
  │   ImageHeroSection       │ ← h-[calc(100dvh - 4rem)]
  │   (100dvh - 64px)        │    = ビューポート全体 - ボトムナビ
  │                          │
  ├──────────────────────────┤
  │ MobileBottomNav (64px)   │ ← fixed bottom-0
  └──────────────────────────┘

ダッシュボード（isEditable=true）:
  ┌──────────────────────────┐
  │ Dashboard Header (68px)  │
  ├──────────────────────────┤
  │ ProfileHeader (64px)     │
  ├──────────────────────────┤
  │   ImageHeroSection       │ ← aspect-video (16:9)
  │   (16:9プレビュー)        │    ダッシュボードでは全画面にしない
  ├──────────────────────────┤
  │   他のセクション...       │
  └──────────────────────────┘
```

**`100dvh` を使う理由:** `100vh` はモバイルブラウザでアドレスバーの高さを含むため、実際の表示領域より大きい。`100dvh`（Dynamic Viewport Height）は表示領域に正確にフィットする。

---

### Step 8: ImageHeroEditModal 編集モーダル

**ファイル:** `components/user-profile/sections/editors/ImageHeroEditModal.tsx`

#### 8.1 状態追加

```typescript
// 既存
const [item, setItem] = useState<ImageGridItem>(...)

// 追加: モバイル画像
const [mobileImageKey, setMobileImageKey] = useState<string | undefined>(
  () => currentData.mobileImageKey
)
```

#### 8.2 モバイル画像用の uploadValue / ハンドラ

```typescript
// モバイル画像用の UploadedFile 変換
const mobileUploadValue = useMemo<UploadedFile[]>(() => {
  if (!mobileImageKey) return []
  return [{
    id: `mobile-${item.id}`,
    name: mobileImageKey,
    originalName: mobileImageKey,
    url: getPublicUrl(mobileImageKey),
    key: mobileImageKey,
    size: 0,
    type: 'image/webp',
    uploadedAt: new Date().toISOString(),
  }]
}, [mobileImageKey, item.id])

// モバイル画像アップロード完了
const handleMobileUpload = (files: UploadedFile[]) => {
  if (files.length > 0) {
    setMobileImageKey(files[0].key)
  }
}

// モバイル画像削除
const handleMobileDelete = async (fileId: string) => {
  const file = mobileUploadValue.find(f => f.id === fileId)
  if (file && file.key) {
    await deleteImageAction(file.key)
  }
  setMobileImageKey(undefined)
}
```

#### 8.3 保存ロジック変更

```typescript
const handleSave = () => {
  startTransition(async () => {
    try {
      const newData: ImageHeroData = { item, mobileImageKey }  // mobileImageKey を追加
      const result = await updateSection(sectionId, { data: newData })
      // ...
    }
  })
}
```

#### 8.4 UI 変更

**PC 画像セクション:**
```tsx
<div className="space-y-2">
  <Label>PC用画像</Label>
  <ImageUploader
    mode="immediate"
    previewSize={{ width: 400, height: 225 }}  // 変更: 400x171 → 400x225 (16:9)
    maxFiles={1}
    folder="section-images"
    value={uploadValue}
    onUpload={handleUpload}
    onDelete={handleDelete}
  />
  <p className="text-xs text-muted-foreground">
    推奨サイズ: 16:9（例: 1920x1080px）
  </p>
</div>
```

**モバイル画像セクション（新規追加、PC画像の下に配置）:**
```tsx
<div className="space-y-2">
  <Label>モバイル/タブレット用画像</Label>
  <ImageUploader
    mode="immediate"
    previewSize={{ width: 200, height: 267 }}  // 3:4 比率
    maxFiles={1}
    folder="section-images"
    value={mobileUploadValue}
    onUpload={handleMobileUpload}
    onDelete={handleMobileDelete}
  />
  <p className="text-xs text-muted-foreground">
    推奨サイズ: 3:4（例: 810x1080px）。未設定の場合はPC画像を使用します。
  </p>
</div>
```

---

## 5. 特殊ディスプレイでの表示分析

すべて `object-cover` + `object-position: center`（デフォルト）でクロップは常に中央基準。

### 5.1 PC 表示（>992px）

| ディスプレイ | 解像度例 | コンテナ比率 | 16:9 画像のクロップ |
|------------|---------|------------|------------------|
| ウルトラワイド (21:9) | 3440x1440 | ~2.5:1 | 上下がクロップ。被写体が中央なら問題なし |
| 通常モニタ (16:9) | 1920x1080 | ~1.7:1 | ほぼ完全にフィット |
| WUXGA (16:10) | 1920x1200 | ~1.7:1 | ほぼ完全にフィット |
| iPad 横向き | 1024x768 | ~1.5:1 | 左右がわずかにクロップ |

### 5.2 モバイル/タブレット表示（≤992px）

| ディスプレイ | 解像度例 | コンテナ比率 | 3:4 画像のクロップ |
|------------|---------|------------|------------------|
| iPad 縦向き | 768x1024 | ~0.8:1 | 3:4 (0.75:1) に近く、わずかなクロップ |
| iPhone 15 Pro | 393x852 | ~0.5:1 | 左右がクロップ。3:4 は最も影響が小さい選択 |
| iPhone SE | 375x667 | ~0.6:1 | 同上 |
| Android (小) | 360x800 | ~0.5:1 | 同上 |

### 5.3 なぜ 3:4 が最適か

モバイル端末のアスペクト比は約 9:19.5（≈0.46:1）〜 9:16（≈0.56:1）。
3:4（0.75:1）は端末より横長だが、以下の理由で最適：

- 4:5（0.8:1）や 9:16（0.56:1）より、タブレット（iPad 縦 ≈ 0.75:1）との互換性が高い
- 一般的な写真・イラストの構図に適合する標準的な比率
- 被写体が中央に配置される一般的な構図では、左右のクロップが均等で自然

---

## 6. 実装順序と依存関係

```
Step 1: types/profile-sections.ts       ← 起点（他ファイルが参照）
   │
   ├── Step 2: lib/sections/type-guards.ts   （Step 1 に依存）
   ├── Step 3: lib/sections/types.ts         （独立）
   └── Step 4: lib/image-sizes.ts            （独立）
       │
       ├── Step 5: lib/sections/registry.ts          （Step 1, 3 に依存）
       └── Step 6: app/actions/user/section-actions.ts（Step 3, 5 に依存）
           │
           ├── Step 7: ImageHeroSection.tsx           （Step 1, 4 に依存）
           └── Step 8: ImageHeroEditModal.tsx         （Step 1 に依存）
```

**推奨実装順:** Step 1 → Step 2, 3, 4（並行可能） → Step 5, 6 → Step 7, 8（並行可能）

---

## 7. 注意事項

### 7.1 既存データの後方互換性

- `mobileImageKey` は `optional` なので、DB 内の既存 `ImageHeroData` はそのまま動作する
- 型ガード `isImageHeroData` も `mobileImageKey === undefined` を許容する
- マイグレーション不要

### 7.2 SectionBand のパディング

`SectionBand` は CSS Custom Properties でデフォルト 8px のパディングを付与（`globals.css` の `[data-section-band]` ルール）。
Step 5-6 で `defaultSettings` にパディング `none` を設定することで、新規作成時は自動的にパディングなしになる。

**既存ユーザーへの影響:** 既に image-hero セクションを作成済みのユーザーは `settings: null` のまま。
パディングを手動で `none` に変更する必要がある（SectionStylePanel から設定可能）。

### 7.3 contentVisibility: auto

`SectionBand` は `contentVisibility: 'auto'` を設定しており、ビューポート外のセクションの描画を遅延する。
ヒーロー画像は通常ページ最上部に配置されるため問題ないが、下部に配置された場合は `containIntrinsicSize: 'auto 200px'` とのギャップ（実際は 100dvh-4rem ≈ 700-900px）がスクロール位置に影響する可能性がある。
→ 現時点では対応不要。問題が発生した場合、registry に `disableContentVisibility` フラグを追加して対応。

### 7.4 画像処理の上限

現在の `image-processor.ts` のデフォルト: `maxWidth: 1920, maxHeight: 1080`

| 画像種別 | アップロード画像例 | 処理後サイズ | 対象デバイス | 十分か |
|---------|-----------------|------------|------------|-------|
| PC (16:9) | 3840x2160 | 1920x1080 | FHDモニタ | OK |
| PC (16:9) | 3840x2160 | 1920x1080 | 4Kモニタ | やや不足（2x DPR で 3840 必要） |
| モバイル (3:4) | 1200x1600 | 810x1080 | iPhone (390px × 2) | OK（780px < 810px） |
| モバイル (3:4) | 1200x1600 | 810x1080 | iPad (768px × 2) | やや不足（1536px > 810px） |

→ 4K モニタと iPad の 2x DPR では理論上の最適解ではないが、実用上は許容範囲。
将来的に `ImageUploader` の `processOptions` prop を追加して対応可能（今回はスコープ外）。

---

## 8. 検証方法

### 8.1 ビルド検証

```bash
npm run lint && npx tsc --noEmit
```
TypeScript/ESLint エラーがゼロであることを確認。

### 8.2 表示検証（Chrome DevTools デバイスエミュレーション）

| 確認項目 | 手順 |
|---------|------|
| PC 全画面表示 | `/@handle` を 1920x1080 で開き、ヒーローがヘッダー除くフル画面であること |
| モバイル全画面表示 | iPhone 14 Pro (393x852) で開き、ボトムナビ除くフル画面であること |
| PC/モバイル画像切替 | DevTools でリサイズし 992px 前後で画像が切り替わること |
| モバイル画像フォールバック | mobileImageKey 未設定時、モバイルでも PC 画像が表示されること |
| ダッシュボードプレビュー | `/dashboard/profile-editor` で 16:9 アスペクト比であること |
| ホバーなし | PC でヒーロー画像にホバーしてアニメーションが発生しないこと |

### 8.3 機能検証（ダッシュボード）

| 確認項目 | 手順 |
|---------|------|
| PC 画像アップロード | 編集モーダルで PC 用画像をアップロード → プレビュー表示 |
| モバイル画像アップロード | 編集モーダルでモバイル用画像をアップロード → プレビュー表示 |
| 画像削除 | 各画像の削除が動作し、R2 からも削除されること |
| 保存・永続化 | 保存後にページリロードしても両方の imageKey が維持されること |
| リンク動作 | linkUrl 設定時にクリックで外部リンクが開くこと |
| 新規セクション作成 | image-hero を追加した際にパディングが `none` で作成されること |
