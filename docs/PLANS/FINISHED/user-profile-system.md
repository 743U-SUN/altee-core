# ユーザー個人ページシステム開発計画

## 概要

ユーザーの個人ページシステムの完成に向けた段階的な開発計画。
以下の機能を実装する：

1. **テーマ切り替え** - 複数のスタイルプリセットから選択
2. **色・フォントカスタマイズ** - ヘッダー色、アクセント色、フォントの変更
3. **FAQページ** - よくある質問まとめページの実装
4. **ナビゲーション整理** - サイドバー・ダッシュボードの整備

---

## 現状

### 実装済み

| 機能 | 状態 | ファイル |
|------|------|---------|
| テーマシステム | Claymorphicのみ | `lib/theme-presets.ts` |
| CSS変数システム | 動作中 | `components/theme-provider/UserThemeProvider.tsx` |
| プロフィールセクション | 8種類実装済み | `components/user-profile/sections/` |
| Items | 3層構造完備 | `app/[handle]/items`, `app/dashboard/items`, `app/admin/items` |
| セクションFAQ | 一問一答として実装 | `UserSection.data` (JSON) |

### 未実装

| 機能 | 説明 |
|------|------|
| 追加テーマプリセット | Claymorphic以外のスタイル |
| テーマ選択UI | サイドバーでのドロップダウン選択 |
| 色変更UI | プリセット色からの選択 |
| フォント選択 | next/fontによる最適化フォント切り替え |
| FAQページ | `app/[handle]/faqs` - よくある質問まとめ |

---

## データ構造

### テーマ設定

**ThemeSettings型** (`types/profile-sections.ts`):

```typescript
interface ThemeSettings {
  themePreset: string           // 'claymorphic' | 'minimal' など
  fontFamily: string            // 'Inter' | 'Noto Sans JP' など
  headerColor?: string          // ヘッダー背景色
  headerTextColor?: string      // ヘッダー文字色
  accentColor?: string          // アクセント色
  visibility: {
    banner: boolean
    character: boolean
    gameButton: boolean
    snsButton: boolean
    notification: boolean
  }
  customOverrides?: Record<string, string>
}
```

### FAQ（2種類のシステム）

| 種類 | データソース | 用途 |
|------|-------------|------|
| セクションFAQ | `UserSection.data` (JSON) | プロフィール内の一問一答 |
| FAQページ | `FaqCategory` / `FaqQuestion` テーブル | よくある質問まとめ |

**既存モデル（そのまま使用）**:

```prisma
model FaqCategory {
  id          String       @id @default(cuid())
  userId      String
  name        String       // カテゴリ名（最大30文字）
  description String?      // 説明（最大200文字）
  sortOrder   Int          @default(0)
  isVisible   Boolean      @default(true)
  questions   FaqQuestion[]
}

model FaqQuestion {
  id           String      @id @default(cuid())
  categoryId   String
  question     String      // 質問文（最大30文字）
  answer       String      // 回答文（最大1000文字）
  sortOrder    Int         @default(0)
  isVisible    Boolean     @default(true)
}
```

---

## 実装フェーズ

### Phase 1: テーマ基盤の拡張（2-3日）

#### 1.1 追加テーマプリセットの定義

**ファイル**: `lib/theme-presets.ts`

新規プリセット（まずは1つ）:
- `minimal` - シンプルで軽やかなデザイン（白基調、影を抑えた清潔感）

```typescript
export const minimalPreset: ThemePreset = {
  name: 'minimal',
  displayName: 'Minimal',
  variables: {
    '--theme-bg': '#ffffff',
    '--theme-card-bg': '#ffffff',
    '--theme-card-shadow': '0 1px 3px rgba(0,0,0,0.08)',
    '--theme-card-border': '1px solid #e5e7eb',
    '--theme-card-radius': '12px',
    '--theme-text-primary': '#1f2937',
    '--theme-text-secondary': '#6b7280',
    '--theme-text-accent': '#3b82f6',
    '--theme-accent-bg': 'rgba(59,130,246,0.08)',
    '--theme-accent-border': 'rgba(59,130,246,0.2)',
    '--theme-header-bg': '#ffffff',
    '--theme-header-text': '#1f2937',
  } as React.CSSProperties,
}
```

#### 1.2 CSS変数の追加

```typescript
// 新規追加する変数
--theme-header-bg      // ヘッダー背景色
--theme-header-text    // ヘッダー文字色
--theme-font-family    // フォントファミリー
```

#### 1.3 フォント設定

**ファイル**: `app/layout.tsx` または専用ファイル

```typescript
import { Inter, Noto_Sans_JP, M_PLUS_Rounded_1c, Zen_Maru_Gothic } from 'next/font/google'

// next/fontでビルド時に最適化（セルフホスト、外部リクエストなし）
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-noto-sans-jp' })
const mPlusRounded = M_PLUS_Rounded_1c({ weight: ['400', '700'], variable: '--font-m-plus' })
const zenMaru = Zen_Maru_Gothic({ weight: ['400', '700'], variable: '--font-zen-maru' })
```

**利用可能なフォント**:
| フォント | 特徴 |
|---------|------|
| Inter | デフォルト、英数字に最適 |
| Noto Sans JP | Google推奨の日本語フォント |
| M PLUS Rounded 1c | 丸ゴシック、柔らかい印象 |
| Zen Maru Gothic | 丸ゴシック、読みやすい |

#### 1.4 ThemeSettings型の拡張

**ファイル**: `types/profile-sections.ts`

```typescript
// 追加フィールド
headerColor?: string      // ヘッダー背景色
headerTextColor?: string  // ヘッダー文字色
```

---

### Phase 2: テーマ選択UI（2-3日）

#### 2.1 サイドバーにテーマパネル追加

**ファイル**: `components/sidebar-content/DashboardSidebarContent.tsx`

**UI構成**:
```
[テーマ設定]
├── スタイル: [ドロップダウン: Claymorphic / Minimal]
├── フォント: [ドロップダウン: Inter / Noto Sans JP / ...]
├── ヘッダー色: [プリセット色パレット]
└── アクセント色: [プリセット色パレット]
```

**プリセット色パレット例**:
```typescript
const HEADER_COLOR_PRESETS = [
  { name: 'デフォルト', value: null },  // テーマのデフォルトを使用
  { name: 'ネイビー', value: '#1e3a5f' },
  { name: 'フォレスト', value: '#2d5a3d' },
  { name: 'ワイン', value: '#5a2d3d' },
  { name: 'スレート', value: '#475569' },
  { name: 'ブラック', value: '#1f2937' },
]

const ACCENT_COLOR_PRESETS = [
  { name: 'デフォルト', value: null },
  { name: 'ブルー', value: '#3b82f6' },
  { name: 'グリーン', value: '#22c55e' },
  { name: 'オレンジ', value: '#f97316' },
  { name: 'ピンク', value: '#ec4899' },
  { name: 'パープル', value: '#8b5cf6' },
]
```

#### 2.2 テーマ設定保存

**ファイル**: `app/actions/user/profile-actions.ts`

```typescript
export async function updateThemeSettings(
  themeSettings: Partial<ThemeSettings>
): Promise<ActionResult<void>>
```

#### 2.3 リアルタイムプレビュー

編集中の変更をUserThemeProviderに即時反映（保存前プレビュー）

---

### Phase 3: FAQページの実装（3-4日）

#### 3.1 公開FAQページ

**ファイル**: `app/[handle]/faqs/page.tsx`

**参考実装**: `app/demo/faqs/page.tsx` をベースに統合

**構成**:
```typescript
// Server Component
export default async function FAQsPage({ params }) {
  const { handle } = await params
  const user = await getUserByHandle(handle)
  const categories = await getFaqCategoriesByUserId(user.id)

  return (
    // UserProfileLayout内に表示
    <FAQContent categories={categories} />
  )
}
```

**コンポーネント**:
- `FAQContent.tsx` - メインコンテンツ
- `FAQAccordion.tsx` - アコーディオンUI（既存デモから流用）
- `FAQCategorySection.tsx` - カテゴリ別セクション

#### 3.2 FAQ管理ダッシュボード

**ファイル**: `app/dashboard/faqs/page.tsx`

**機能**:
- FAQ一覧（カテゴリ別）
- カテゴリ追加・編集・削除
- 質問追加・編集・削除
- ドラッグ&ドロップで並び替え

**既存Server Actions活用**:
- `app/actions/content/faq-actions.ts` に実装済み

---

### Phase 4: ナビゲーション整理（1-2日）

#### 4.1 ディレクトリ構造

```
app/
├── [handle]/
│   ├── page.tsx           # プロフィールページ
│   ├── items/page.tsx     # アイテム一覧
│   ├── faqs/page.tsx      # FAQ一覧（新規）
│   └── videos/page.tsx    # 動画一覧
├── dashboard/
│   ├── profile-editor/    # プロフィール編集（セクション管理）
│   ├── items/             # アイテム管理（既存）
│   └── faqs/              # FAQ管理（新規）
└── admin/
    ├── items/             # アイテムマスター管理
    └── ...
```

#### 4.2 公開ページナビゲーション更新

**ヘッダータブ**（ProfileHeader）:
```
Home / Items / Videos / FAQs（新規追加）
```

**モバイルボトムナビ**（MobileBottomNav）:
```
Home / Items / Videos / FAQs（新規追加）
```

#### 4.3 ダッシュボードサイドバー更新

**ダッシュボードサイドバー**:
```
プロフィール
├── エディター → /dashboard/profile-editor
├── アイテム → /dashboard/items
└── FAQ → /dashboard/faqs（新規）

設定
├── テーマ設定（サイドバー内パネル）
└── ...
```

---

## 重要ファイル一覧

| ファイル | 役割 |
|---------|------|
| `lib/theme-presets.ts` | テーマプリセット定義 |
| `types/profile-sections.ts` | ThemeSettings型定義 |
| `components/theme-provider/UserThemeProvider.tsx` | CSS変数適用 |
| `components/user-profile/UserProfileLayout.tsx` | メインレイアウト |
| `components/sidebar-content/DashboardSidebarContent.tsx` | ダッシュボードサイドバー |
| `app/actions/user/profile-actions.ts` | テーマ保存アクション |
| `app/actions/content/faq-actions.ts` | FAQ操作アクション |
| `app/demo/faqs/page.tsx` | FAQデモ（参考実装） |

---

## 検証方法

1. **テーマ切り替え**
   - ドロップダウンでテーマを変更
   - 全セクションのスタイルが変わることを確認
   - 保存後、ページリロードしても維持されることを確認

2. **色・フォント変更**
   - プリセット色を選択
   - ヘッダー、アクセント部分の色が変わることを確認
   - フォント変更時、テキスト全体に適用されることを確認

3. **FAQページ**
   - `/demo/faqs` でUI確認
   - ダッシュボードでFAQ追加・編集・削除
   - 公開ページでカテゴリ別に表示されることを確認

4. **E2E**
   - Playwrightで主要フローを自動テスト

---

## 実装順序（推奨）

```
Phase 1: テーマ基盤
    │
    ├─ 1.1 minimalプリセット追加
    ├─ 1.2 CSS変数追加（ヘッダー色等）
    ├─ 1.3 フォント設定（next/font）
    └─ 1.4 ThemeSettings型拡張
    ↓
Phase 2: テーマ選択UI
    │
    ├─ 2.1 サイドバーにテーマパネル
    ├─ 2.2 Server Action（保存）
    └─ 2.3 リアルタイムプレビュー
    ↓
Phase 3: FAQページ
    │
    ├─ 3.1 公開FAQページ
    └─ 3.2 FAQ管理ダッシュボード
    ↓
Phase 4: ナビゲーション整理
    │
    ├─ 4.1 ディレクトリ整理
    └─ 4.2 サイドバー更新
```

**理由**:
- テーマ基盤を先に整えることで、Phase 3で作成するFAQコンポーネントが最初からテーマ対応になる
- CSS変数（`var(--theme-*)`）を使えば、新コンポーネントは自動的にスタイル切り替えに対応

---

## 決定事項

- [x] テーマ選択: ドロップダウン形式
- [x] 色変更: プリセット色パレットから選択
- [x] フォント: `next/font` で最適化（Inter, Noto Sans JP, M PLUS Rounded 1c, Zen Maru Gothic）
- [x] FAQモデル: 既存の `FaqCategory` / `FaqQuestion` を活用
- [x] FAQ検索機能: 不要
- [x] カラーピッカーUI: 不要（プリセットのみ）

---

## 将来の拡張（Phase 5以降）

- 追加テーマプリセット（midnight, retro等）
- テーマのエクスポート/インポート
- カスタムCSS入力（上級者向け）
- 背景画像のカスタマイズ強化



