# Phase 2: ダッシュボード編集UI + テーマ設定

## 概要

Phase 1 で構築したテーマシステムとセクション基盤を活用し、ダッシュボードでの編集UIとテーマ設定UIを実装する。

---

## Phase 1 の成果（前提）

| 項目 | 状態 |
|------|------|
| **UserSection テーブル** | ✅ 実装済み（profile-card, faq, links） |
| **テーマシステム** | ✅ claymorphic プリセット実装済み |
| **公開ページレイアウト** | ✅ PC 2カラム、モバイル固定背景 |
| **セクション登録システム** | ✅ SECTION_REGISTRY パターン実装済み |
| **UI要素（機能なし）** | ✅ Gift/Mail/Bell/Game/Share ボタン配置済み |
| **ダッシュボードレイアウト** | ✅ BaseLayout + MobileSidebarSheet（スライド対応済み） |

---

## Phase 2 の目的

1. **ダッシュボード編集UI** - セクション追加/編集/削除/並び替え
2. **カスタムコンテンツエリア** - フォント/テーマ/表示設定
3. **テーマ設定UI** - プリセット選択、表示/非表示設定
4. **旧UI隔離** - `/dashboard/faq`, `/dashboard/links` をLEGACY保存
5. **拡張性テスト** - 新セクションタイプ 4種追加
6. **SECTION_REGISTRY拡張** - カテゴリ情報追加

---

## UIイメージ詳細

### ダッシュボードレイアウト構造

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard Layout                          │
├──────┬──────────────────────┬───────────────────────────────────┤
│      │                      │                                   │
│ ナビ │  カスタムコンテンツ   │        メインコンテンツ           │
│ メニ │      エリア           │          エリア                   │
│ ュー │                      │                                   │
│      │  - フォント選択      │   ┌─────────────────────────┐    │
│      │  - テーマ選択        │   │   /[handle] と同じ      │    │
│      │  - 表示/非表示       │   │   プロフィール表示      │    │
│      │                      │   │                         │    │
│      │                      │   │   [+] セクション追加    │    │
│      │                      │   │                         │    │
│      │                      │   │   各セクションに:       │    │
│      │                      │   │   - 編集ボタン          │    │
│      │                      │   │   - ▲▼ 並び替え        │    │
│      │                      │   │   - 🗑 削除             │    │
│      │                      │   └─────────────────────────┘    │
│      │                      │                                   │
└──────┴──────────────────────┴───────────────────────────────────┘
```

### モバイルレイアウト

```
┌─────────────────────────┐
│  [編集] [プレビュー]   │  ← タブ切り替え
├─────────────────────────┤
│                         │
│   編集タブ:             │
│   セクション一覧        │
│   + 追加/編集/削除UI    │
│                         │
│   プレビュータブ:       │
│   /[handle] と同じ表示  │
│                         │
├─────────────────────────┤
│   カスタム設定          │  ← スライドで出現
│   (MobileSidebarSheet)  │     SidebarTrigger で開閉
└─────────────────────────┘
```

### セクション追加フロー（2段階選択）

```
[+] ボタンクリック
    ↓
┌─────────────────────────────────────┐
│  セクション追加                     │
├─────────────────────────────────────┤
│  1. 画像リンク                      │
│  2. アイコンリンク                  │
│  3. データ・グラフ                  │
│  4. 文章                            │
│  5. 見出し・区切り・余白            │
│  6. 動画・音楽・その他              │
│  7. スケジュール・イベント          │
└─────────────────────────────────────┘
    ↓ カテゴリ選択
┌─────────────────────────────────────┐
│  文章                               │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │     │ │     │ │     │ │     │   │
│  │長文 │ │Q&A  │ │メッセ│ │引用 │   │
│  │     │ │     │ │ージ │ │     │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│  long-   faq-    message- quote    │
│  text    list    box               │
└─────────────────────────────────────┘
    ↓ タイプ選択
セクションがプレビューに追加 → 編集モーダル表示
```

### セクション編集UI

各セクションには以下のUIを配置:

```
┌────────────────────────────────────────────────┐
│  セクション名                    [編集] ▲▼ 🗑 │
├────────────────────────────────────────────────┤
│                                                │
│  セクションコンテンツのプレビュー              │
│                                                │
└────────────────────────────────────────────────┘

- [編集]: モーダルを開く（全セクション共通）
- ▲▼: 1つずつ上下移動（最上位/最下位で無効化）
- 🗑: 削除確認モーダル表示
```

### 編集モーダル

```
┌─────────────────────────────────────────────┐
│  Q&A を編集                           [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  [カテゴリ追加] [質問追加]                 │
│                                             │
│  ┌─ カテゴリ: 依頼について ─────────────┐  │
│  │  Q: 依頼の流れは？                    │  │
│  │  A: まず...                           │  │
│  │  Q: 納期はどれくらい？                │  │
│  │  A: 通常...                           │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ※ 自動保存（1秒debounce）                 │
│                                             │
├─────────────────────────────────────────────┤
│                              [保存] [閉じる]│
└─────────────────────────────────────────────┘

- 自動保存（1秒debounce）+ 明示的な保存ボタン
- モーダル内のD&D: FAQ内のカテゴリ/質問並び替えは NestedSortableList 使用
```

---

## 実装タスク

### Step 0: SECTION_REGISTRY 拡張（カテゴリ情報追加）

#### 0-1. カテゴリ定義の追加
- [ ] `lib/section-registry.ts` に `SECTION_CATEGORIES` 追加
- [ ] 7カテゴリ定義（label, icon, description）

```typescript
export const SECTION_CATEGORIES = {
  'image-links': { label: '画像リンク', icon: Image, description: '画像主体のリンク集' },
  'icon-links': { label: 'アイコンリンク', icon: Link, description: 'SNS・連絡先リンク' },
  'data-visualization': { label: 'データ・グラフ', icon: BarChart2, description: '数値の視覚化' },
  'text-content': { label: '文章', icon: FileText, description: 'テキスト情報' },
  'structural': { label: '見出し・区切り・余白', icon: Heading, description: 'レイアウト整理' },
  'embedded': { label: '動画・音楽・その他', icon: Video, description: '外部サービス連携' },
  'schedule': { label: 'スケジュール・イベント', icon: Clock, description: '予定表' },
} as const
```

#### 0-2. SectionDefinition の拡張
- [ ] `types/profile-sections.ts` に `category` フィールド追加

```typescript
export interface SectionDefinition {
  type: string
  label: string
  icon: string
  description: string
  category: keyof typeof SECTION_CATEGORIES  // 追加
  component: ComponentType<BaseSectionProps>
  defaultData: unknown
}
```

#### 0-3. 既存セクションへのカテゴリ付与
- [ ] `profile-card` → `text-content`
- [ ] `faq` → `text-content`
- [ ] `links` → `icon-links`

---

### Step 1: ダッシュボード - カスタムコンテンツエリア

#### 1-1. DashboardSidebarContent コンポーネント
- [ ] `components/sidebar-content/DashboardSidebarContent.tsx` 作成
- [ ] AdminSidebarContent を参考に実装

#### 1-2. フォント選択
- [ ] フォントファミリー選択UI
- [ ] プリセットフォント: Inter, Noto Sans JP, M PLUS 1p, Zen Kaku Gothic など
- [ ] User テーブルに `fontFamily` カラム追加（または themeSettings JSON内）

#### 1-3. テーマプリセット選択
- [ ] プリセット一覧表示（claymorphic のみ、将来拡張用）
- [ ] プリセットプレビューサムネイル
- [ ] 選択時に即時反映

#### 1-4. 表示/非表示設定
- [ ] visibility トグルスイッチ
  - バナー画像
  - キャラクター画像
  - ゲームボタン
  - SNSシェアボタン
  - 通知アイコン
- [ ] 即時プレビュー反映

#### 1-5. layout-config.ts の更新
- [ ] `dashboard` variant の `secondSidebar.content` に DashboardSidebarContent を設定

---

### Step 2: ダッシュボード - セクション編集UI

#### 2-1. 統合ダッシュボードページ
- [ ] `app/dashboard/profile-sections/page.tsx` 作成
- [ ] メインエリアに `/[handle]` と同じプロフィール表示
- [ ] 編集用オーバーレイ（各セクションに編集/移動/削除ボタン）

#### 2-2. モバイル対応
- [ ] 編集/プレビュー タブ切り替えUI
- [ ] 編集タブ: セクション一覧 + 操作ボタン
- [ ] プレビュータブ: 公開ページと同じ表示

#### 2-3. セクション追加UI
- [ ] プレビューエリア内に「＋」アイコンを薄く表示
- [ ] クリックで `AddSectionModal` を開く
- [ ] 2段階選択: カテゴリ → タイプ
- [ ] デフォルトデータで新規セクション作成

#### 2-4. 並び替えUI
- [ ] 各セクション右端中央に ▲▼ ボタン配置
- [ ] ▲クリック: 1つ上に移動
- [ ] ▼クリック: 1つ下に移動
- [ ] 最上位では▲無効、最下位では▼無効
- [ ] 楽観的更新（useSWR mutate）

#### 2-5. 削除UI
- [ ] 各セクション右上に🗑アイコン配置
- [ ] クリックで確認モーダル表示
- [ ] 確認後に削除実行

#### 2-6. セクション編集モーダル
- [ ] 各セクションタイプ専用のエディタコンポーネント
  - `ProfileCardEditor.tsx` - 名前、bio 編集
  - `FAQEditor.tsx` - カテゴリ、質問追加/編集（NestedSortableList使用）
  - `LinksEditor.tsx` - リンク追加/編集
  - `HeaderEditor.tsx` - タイトル、配置、下線有無
  - `LongTextEditor.tsx` - Markdownエディタ
  - `BarGraphEditor.tsx` - 項目追加/編集
  - `SocialLinksEditor.tsx` - SNSリンク追加/編集
- [ ] 自動保存（1秒debounce）+ 保存ボタン

---

### Step 3: 新セクションタイプ追加（拡張性テスト）

4種類実装して、SECTION_REGISTRY + カテゴリパターンが正しく機能するかテスト

#### 3-1. header セクション（structural カテゴリ）
- [ ] `HeaderSection.tsx` - セクション見出し表示
- [ ] `HeaderEditor.tsx` - タイトル、配置（left/center/right）、下線有無
- [ ] データ構造:
```typescript
interface HeaderData {
  text: string
  alignment: 'left' | 'center' | 'right'
  showUnderline: boolean
}
```

#### 3-2. long-text セクション（text-content カテゴリ）
- [ ] `LongTextSection.tsx` - マークダウン対応長文表示
- [ ] `LongTextEditor.tsx` - Markdownエディタ（既存の components/editor/ を活用）
- [ ] データ構造:
```typescript
interface LongTextData {
  content: string  // Markdown
}
```

#### 3-3. bar-graph セクション（data-visualization カテゴリ）
- [ ] `BarGraphSection.tsx` - 横棒グラフ表示
- [ ] `BarGraphEditor.tsx` - 項目追加/編集/削除、色選択
- [ ] データ構造:
```typescript
interface BarGraphData {
  title?: string
  items: {
    id: string
    label: string
    value: number  // 0-100
    color: string
  }[]
}
```

#### 3-4. social-links セクション（icon-links カテゴリ）
- [ ] `SocialLinksSection.tsx` - 横並びの小アイコン列
- [ ] `SocialLinksEditor.tsx` - SNSリンク追加/編集
- [ ] データ構造:
```typescript
interface SocialLinksData {
  items: {
    id: string
    platform: string  // twitter, instagram, github, etc.
    url: string
  }[]
}
```

---

### Step 4: 旧UIの隔離

#### 4-1. LEGACYディレクトリへ移動
- [ ] `app/dashboard/faq/*` → `backups/legacy-dashboard/faq/*`
- [ ] `app/dashboard/links/*` → `backups/legacy-dashboard/links/*`
- [ ] 関連する Server Actions も同様に隔離

#### 4-2. ナビゲーション更新
- [ ] ダッシュボードメニューから旧ページへのリンク削除
- [ ] 新しい `/dashboard/profile-sections` へのリンク追加

#### 4-3. 旧テーブルの扱い
- [ ] FaqCategory/FaqQuestion/UserLink は**削除しない**
- [ ] 新UIから UserSection のみを使用
- [ ] LinkType は残置（プリセットアイコンマスター）

**注意**: 旧テーブルの削除は Phase 3 以降で検討

---

### Step 5: 検証

- [ ] ダッシュボードでセクション追加/編集/削除
- [ ] ▲▼ボタンで並び替え → `/[handle]` で順序確認
- [ ] カテゴリ選択 → タイプ選択の2段階フロー
- [ ] 編集モーダルでの自動保存 + 保存ボタン
- [ ] カスタムエリアでフォント/テーマ/visibility変更
- [ ] モバイルで編集/プレビュータブ切り替え
- [ ] モバイルでカスタムエリアがスライド表示
- [ ] 新セクションタイプ（header, long-text, bar-graph, social-links）の表示確認
- [ ] 型チェック・Lint通過

---

## ファイル構造

```
lib/
├── section-registry.ts              # SECTION_REGISTRY + SECTION_CATEGORIES

types/
├── profile-sections.ts              # SectionDefinition に category 追加

app/
├── dashboard/
│   ├── profile-sections/
│   │   ├── page.tsx                 # セクション一覧・編集（メイン）
│   │   ├── components/
│   │   │   ├── SectionListEditor.tsx    # セクション編集UI（▲▼、編集、削除）
│   │   │   ├── AddSectionModal.tsx      # セクション追加モーダル（2段階選択）
│   │   │   ├── DeleteConfirmModal.tsx   # 削除確認モーダル
│   │   │   ├── MobileTabView.tsx        # モバイル用タブ切り替え
│   │   │   ├── editors/
│   │   │   │   ├── ProfileCardEditor.tsx
│   │   │   │   ├── FAQEditor.tsx
│   │   │   │   ├── LinksEditor.tsx
│   │   │   │   ├── HeaderEditor.tsx
│   │   │   │   ├── LongTextEditor.tsx
│   │   │   │   ├── BarGraphEditor.tsx
│   │   │   │   └── SocialLinksEditor.tsx

components/
├── sidebar-content/
│   ├── DashboardSidebarContent.tsx  # カスタムコンテンツエリア
│   ├── components/
│   │   ├── FontSelector.tsx         # フォント選択
│   │   ├── ThemePresetSelector.tsx  # テーマプリセット選択
│   │   └── VisibilityToggles.tsx    # 表示/非表示設定
├── user-profile/
│   └── sections/
│       ├── HeaderSection.tsx        # 新規
│       ├── LongTextSection.tsx      # 新規
│       ├── BarGraphSection.tsx      # 新規
│       └── SocialLinksSection.tsx   # 新規

backups/
└── legacy-dashboard/                # 旧UI隔離
    ├── faq/
    └── links/
```

---

## Server Actions

### 新規作成

```typescript
// app/actions/user/section-actions.ts に追加

// セクション並び替え（1つずつ移動）
export async function moveSectionOrder(
  sectionId: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; error?: string }>

// テーマ設定更新
export async function updateUserThemeSettings(
  settings: {
    themePreset?: string
    fontFamily?: string
    visibility?: {
      banner?: boolean
      character?: boolean
      gameButton?: boolean
      shareButton?: boolean
      notificationIcon?: boolean
    }
  }
): Promise<{ success: boolean; error?: string }>
```

---

## バリデーション仕様

| セクション | フィールド | 制限 |
|-----------|-----------|------|
| ProfileCard | characterName | 50文字 |
| ProfileCard | bio | 500文字 |
| FAQ | カテゴリ名 | 30文字 |
| FAQ | 質問 | 30文字 |
| FAQ | 回答 | 1000文字 |
| Links | URL | 形式チェック |
| Links | ラベル | 10文字 |
| Header | text | 50文字 |
| LongText | content | 5000文字 |
| BarGraph | label | 20文字 |
| BarGraph | value | 0-100 |
| SocialLinks | URL | 形式チェック |

---

## 既存コンポーネントの再利用

| コンポーネント | 用途 |
|---------------|------|
| `components/sortable-list/NestedSortableList.tsx` | FAQ編集（カテゴリ-質問）のD&D |
| `components/user-profile/sections/*` | 表示コンポーネント |
| `components/dashboard/links/PresetIconSelector.tsx` | リンクアイコン選択 |
| `components/editor/*` | Markdownエディタ（LongText用） |
| `components/layout/MobileSidebarSheet.tsx` | モバイルスライド表示（実装済み） |

**注意**: セクション間の並び替えには `SortableList` を使用せず、▲▼ボタンで実装

---

## 優先順位

### 高優先度（Phase 2 必須）
1. SECTION_REGISTRY にカテゴリ情報追加
2. カスタムコンテンツエリア（DashboardSidebarContent）
3. セクション編集UI（追加/編集/削除/並び替え）
4. 旧UIの隔離

### 中優先度（Phase 2 推奨）
5. 新セクションタイプ 4種（header, long-text, bar-graph, social-links）
6. モバイル対応（編集/プレビュータブ）

### Phase 3 以降に延期
- Gift/Mail/Bell 機能（通知・メッセージングシステム構築が必要）
- Favorite（ハート）機能（ユーザー間関係のDB設計が必要）
- Share（SNS共有）機能
- Game ボタン機能（用途未定）
- 追加テーマプリセット（midnight, retro）
- image-grid-2 セクション（画像アップロード連携が複雑）
- フォントのカスタムアップロード

---

## 検証方法

### 1. セクション編集UI
- `/dashboard/profile-sections` でセクション追加/編集/削除
- ▲▼ボタンで並び替え → `/[handle]` で順序確認
- 2段階選択（カテゴリ → タイプ）が正しく動作するか

### 2. カスタムコンテンツエリア
- フォント変更 → プレビューで反映確認
- テーマプリセット選択 → プレビューで反映確認
- visibility 変更 → `/[handle]` で要素の表示/非表示確認

### 3. モバイル対応
- 編集/プレビュータブの切り替え
- カスタムエリアがスライドで出現するか
- 編集モーダルがモバイルで正しく表示されるか

### 4. 新セクションタイプ
- header/long-text/bar-graph/social-links を追加 → 公開ページで表示確認
- SECTION_REGISTRY + カテゴリへの登録パターンが正しく動作するか確認

### コマンド
```bash
# 開発サーバー起動
docker compose -f compose.dev.yaml up -d && npm run dev

# 型チェック
npx tsc --noEmit

# Lint
npm run lint
```

---

## Phase 3 以降の展望

- より多様なセクションタイプ（video-embed, radar-chart, timeline, image-grid-2 など）
- カスタムCSS変数の直接編集
- テーマのエクスポート/インポート
- コミュニティテーマギャラリー
- Gift/Mail/Bell/Favorite 機能の実装
- 旧テーブル（FaqCategory/FaqQuestion/UserLink）の完全削除
- 追加テーマプリセット（midnight, retro）
