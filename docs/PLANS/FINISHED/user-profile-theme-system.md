# Phase 1: ユーザープロフィール テーマシステム + セクション基盤

## 概要

ユーザープロフィールページのレイアウト変更とテーマ基盤構築。BaseLayoutから独自レイアウトへの移行と、claymorphicテーマの適用。

**追加（2024相談後）**: セクション基盤をPhase 1に含め、ゼロベースでDB設計を見直し。

---

## 設計方針

### 前提条件
- 既存のFAQ/Linksデータは**なし**（ゼロベースで設計）
- `FaqCategory`, `FaqQuestion`, `UserLink` テーブルは**廃止予定**
- 全セクションを `UserSection` テーブルで一元管理

### 拡張可能な設計の原則
- セクションタイプとコンポーネントの**マップ登録パターン**
- 新セクション追加 = コンポーネント作成 + 登録1行追加
- `sectionType` は文字列（enum不要、柔軟性優先）

---

## レビュー後の確定事項（2024-02追加）

| 項目 | 決定 | 理由 |
|------|------|------|
| **データソース** | UserSection.dataに統一 | profile-cardのbio/characterNameも含め、全セクションがdata内で完結 |
| **LinkType** | 残置 | Presetアイコンのマスターテーブルとして維持。JSON埋め込みだとアイコン更新時に全ユーザーdata更新が必要 |
| **Phase 1スコープ** | 公開ページのレイアウト/テーマのみ | ダッシュボード編集UIはPhase 2 |
| **テスト方法** | DB直接操作 | prisma studio / SQLでUserSectionレコード作成 |
| **旧テーブル** | Phase 1では残置 | FaqCategory/FaqQuestion/UserLinkは既存ダッシュボードで使用中のため |

### Phase 1で実装しないもの（明確化）
- ダッシュボードのセクション編集UI（既存FAQ/Links管理は別途稼働継続）
- 旧テーブル（FaqCategory/FaqQuestion/UserLink）の廃止
- テーマ/表示設定のダッシュボードUI
- セクション追加UI（＋ボタン）
- Gift/Mail/Bell等の機能部分（UIのみ実装）

---

## 決定事項

### レイアウト・デザイン
| 項目 | 決定 |
|------|------|
| **デザイン** | ゲーム風ではなく汎用的に（棒グラフ等の再利用可能なUIは保持） |
| **プロフィール内容** | 名前+自己紹介のみ実装 |
| **初期テーマ** | claymorphicのみ |
| **モバイル** | キャラ固定背景＋コンテンツスライド採用 |
| **テーマ/表示設定UI** | Phase 1では含めない（DB直接操作で検証） |

### セクション基盤（追加）
| 項目 | 決定 |
|------|------|
| **データ管理** | UserSectionテーブルで一元管理（JSON形式） |
| **初期セクション** | profile-card, faq, links の3種 |
| **拡張方式** | コンポーネント登録パターン（SECTION_REGISTRY） |
| **追加UI** | Phase 2で実装（＋ボタン） |

### キャラクターカラム
| 項目 | 決定 |
|------|------|
| **左右アイコン群** | 両方とも未実装 |
| **バナー画像** | 実装（新規DBフィールド `bannerImageKey`） |
| **キャラ非表示時** | 左カラムは背景のみ表示（カラム自体は残る） |

### ヘッダー・ナビゲーション
| 項目 | 決定 |
|------|------|
| **ナビタブ** | Profile, Items, Videos, FAQsへのサブページ遷移 |
| **アクションアイコン** | Gift/Mail/Bell を配置（UIのみ、機能は後回し） |
| **モバイルボトムナビ** | ヘッダーと同じ項目 |

### フローティング要素
| 項目 | 決定 |
|------|------|
| **デスクトップシェアボタン** | 実装（右下に配置） |
| **モバイルフローティング** | 全て実装（ゲーム、SNSシェア、通知アイコン） |

### 表示/非表示設定
| 項目 | 決定 |
|------|------|
| **保存方法** | themeSettings JSON内のvisibilityオブジェクト |
| **デフォルト** | 最小限のみ表示（キャラクターのみON、他はOFF） |
| **PC/モバイル連動** | Notification、ゲーム、SNSは連動 |

---

## データベース設計

### 新規: UserSection テーブル

```prisma
model UserSection {
  id          String   @id @default(cuid())
  userId      String
  sectionType String   // 'profile-card' | 'faq' | 'links' | 'bar-graph' | ...
  title       String?
  sortOrder   Int
  isVisible   Boolean  @default(true)
  data        Json     // セクション固有データ（全てここに格納）
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, sortOrder])
}
```

### UserProfileモデルへの追加フィールド

```prisma
model UserProfile {
  // 既存フィールド...

  // 新規追加
  themePreset        String?    @default("claymorphic")
  themeSettings      Json?      // 下記構造
  bannerImageKey     String?    // バナー画像キー
}
```

### 廃止予定テーブル
- `FaqCategory`
- `FaqQuestion`
- `UserLink`
- `LinkType`（要検討）

### themeSettings JSON構造

```typescript
interface ThemeSettings {
  // 表示/非表示設定
  visibility: {
    banner: boolean       // バナー画像（デフォルト: false）
    character: boolean    // キャラクター画像（デフォルト: true）
    gameButton: boolean   // ゲームボタン（デフォルト: false）
    snsButton: boolean    // SNSシェアボタン（デフォルト: false）
    notification: boolean // 通知アイコン（デフォルト: false）
  }

  // カスタマイズ（将来拡張用）
  accentColor?: string
  customOverrides?: Record<string, string>
}
```

### マイグレーションコマンド

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate
```

---

## セクション基盤

### TypeScript型定義

```typescript
// types/profile-sections.ts

// セクションの共通インターフェース
export interface UserSection {
  id: string
  userId: string
  sectionType: string
  title: string | null
  sortOrder: number
  isVisible: boolean
  data: unknown  // セクション固有データ
}

// セクションコンポーネントの共通Props
export interface BaseSectionProps {
  section: UserSection
  isEditable: boolean  // ダッシュボード表示時: true
}

// セクション定義（登録用）
export interface SectionDefinition {
  type: string
  label: string
  icon: string  // Lucide icon name
  description: string
  component: React.ComponentType<BaseSectionProps>
  defaultData: unknown
}
```

### 初期セクションタイプ

```typescript
// Phase 1: 既存機能の移植
export const INITIAL_SECTION_TYPES = [
  'profile-card',  // 名前、bio（固定、削除不可）
  'faq',           // Q&A（旧FaqCategory/Question相当）
  'links',         // リンク一覧（旧UserLink相当）
] as const
```

### セクション登録システム

```typescript
// lib/section-registry.ts

export const SECTION_REGISTRY: Record<string, SectionDefinition> = {
  'profile-card': {
    type: 'profile-card',
    label: 'プロフィール',
    icon: 'User',
    description: '名前と自己紹介',
    component: ProfileCardSection,
    defaultData: { characterName: '', bio: '' },
  },
  'faq': {
    type: 'faq',
    label: 'Q&A',
    icon: 'HelpCircle',
    description: 'よくある質問',
    component: FAQSection,
    defaultData: { categories: [] },
  },
  'links': {
    type: 'links',
    label: 'リンク',
    icon: 'Link',
    description: 'SNS・Webサイトリンク',
    component: LinksSection,
    defaultData: { items: [] },
  },
}

// セクションレンダラー
export function renderSection(section: UserSection, isEditable: boolean) {
  const definition = SECTION_REGISTRY[section.sectionType]
  if (!definition) return null

  const Component = definition.component
  return <Component section={section} isEditable={isEditable} />
}
```

### 各セクションのdata構造

#### profile-card

```typescript
interface ProfileCardData {
  characterName: string
  bio: string
}
```

#### faq（旧FaqCategory/Question統合）

```typescript
interface FAQData {
  categories: {
    id: string
    name: string
    sortOrder: number
    questions: {
      id: string
      question: string
      answer: string
      sortOrder: number
    }[]
  }[]
}
```

#### links（旧UserLink統合）

```typescript
interface LinksData {
  items: {
    id: string
    url: string
    title: string
    iconType: 'preset' | 'custom'
    iconKey?: string      // preset icon key
    customIconUrl?: string // custom uploaded icon
    sortOrder: number
  }[]
}
```

---

## 実装タスク

### Step 1: データベースマイグレーション
- [x] `UserSection` モデル追加
- [x] `UserProfile` に `themePreset`, `themeSettings`, `bannerImageKey` 追加
- [x] マイグレーション実行
- [x] `FaqCategory`, `FaqQuestion`, `UserLink` は残置（Phase 2で削除）

### Step 2: 型定義・セクション基盤
- [x] `types/profile-sections.ts` 作成
- [x] `lib/section-registry.ts` 作成
- [x] セクション用Server Actions作成
  - `getUserSections(userId)`
  - `createSection(userId, sectionType)`
  - `updateSection(sectionId, data)`
  - `deleteSection(sectionId)`
  - `reorderSections(sectionIds)`

### Step 3: テーマプリセット基盤
- [x] `lib/theme-presets.ts` 作成
  - ThemePreset インターフェース定義
  - claymorphic プリセット（app/demo/claymorphic/page.tsxのclayThemeから抽出）
  - getThemePreset, applyThemeVariables ヘルパー関数

### Step 4: テーマProvider
- [x] `components/theme-provider/UserThemeProvider.tsx` 作成（Client Component）
- [x] `components/theme-provider/useUserTheme.ts` 作成
- [x] CSS変数のインラインスタイル適用ロジック

### Step 5: レイアウトコンポーネント
- [x] `components/user-profile/UserProfileLayout.tsx` - メインレイアウト
- [x] `components/user-profile/CharacterColumn.tsx` - 左カラム/モバイル背景（バナー画像含む）
- [x] `components/user-profile/ContentColumn.tsx` - 右カラム
- [x] `components/user-profile/ProfileHeader.tsx` - ナビタブ + アクションアイコン
- [x] `components/user-profile/MobileBottomNav.tsx` - モバイルボトムナビ
- [x] `components/user-profile/FloatingElements.tsx` - フローティングボタン群

### Step 6: セクションコンポーネント
- [x] `components/user-profile/sections/SectionRenderer.tsx` - 汎用レンダラー
- [x] `components/user-profile/sections/ProfileCardSection.tsx` - 名前、bio
- [x] `components/user-profile/sections/FAQSection.tsx` - Q&A（NestedSortableList使用）
- [x] `components/user-profile/sections/LinksSection.tsx` - リンク一覧
- [x] `components/user-profile/sections/ThemedCard.tsx` - テーマ対応ラッパー

### Step 7: ページ統合
- [x] `app/[handle]/layout.tsx` - BaseLayout → UserProfileLayout
- [x] `app/[handle]/page.tsx` - SectionRenderer使用、実データ表示
- [x] visibility設定に基づく表示/非表示ロジック

### Step 8: 検証
- [x] PC表示確認（2カラムレイアウト）
- [x] モバイル表示確認（固定背景+スライドコンテンツ）
- [x] セクションの表示確認（DB直接操作）
- [x] 型チェック・Lint通過
- [x] UI要素の実装確認（Gift/Mail/Bell, Game, Share, Heart）

---

## ファイル構造

```
types/
├── profile-sections.ts          # セクション型定義

lib/
├── theme-presets.ts             # テーマ定義
├── section-registry.ts          # セクション登録マップ

app/actions/user/
├── section-actions.ts           # セクションCRUD

components/
├── user-profile/
│   ├── index.ts
│   ├── UserProfileLayout.tsx    # メインレイアウト
│   ├── CharacterColumn.tsx      # 左カラム（PC）/ 背景（モバイル）
│   ├── ContentColumn.tsx        # 右カラム
│   ├── ProfileHeader.tsx        # ナビゲーションヘッダー
│   ├── MobileBottomNav.tsx      # モバイルボトムナビゲーション
│   ├── FloatingElements.tsx     # フローティングボタン
│   └── sections/
│       ├── index.ts
│       ├── SectionRenderer.tsx  # 汎用レンダラー
│       ├── ProfileCardSection.tsx
│       ├── FAQSection.tsx
│       ├── LinksSection.tsx
│       └── ThemedCard.tsx
├── theme-provider/
│   ├── index.ts
│   ├── UserThemeProvider.tsx
│   └── useUserTheme.ts
```

---

## 主要ファイル

### 新規作成
| ファイル | 内容 |
|---------|------|
| `types/profile-sections.ts` | セクション型定義 |
| `lib/section-registry.ts` | セクション登録マップ |
| `app/actions/user/section-actions.ts` | セクションCRUD |
| `lib/theme-presets.ts` | claymorphicプリセット定義 |
| `components/theme-provider/*` | テーマContext/Hook |
| `components/user-profile/*` | レイアウトコンポーネント |
| `components/user-profile/sections/*` | 各セクションコンポーネント |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `prisma/schema.prisma` | UserSection追加、UserProfile拡張 |
| `app/[handle]/layout.tsx` | BaseLayout → UserProfileLayout |
| `app/[handle]/page.tsx` | SectionRenderer使用 |
| `lib/handle-utils.ts` | テーマ・バナー設定をクエリに追加 |

### 参照（移植元）
| ファイル | 参照内容 |
|---------|---------|
| `app/demo/claymorphic/page.tsx` | clayTheme変数、ClayCard、QAItem、FloatingElements、MobileMenuなどのパターン |

---

## UIのみ実装（機能は後回し）

| 要素 | 配置 | 備考 |
|------|------|------|
| **Gift/Mail/Bell** | ヘッダー右側 + モバイルフローティング | 訪問者→プロフィール主への送信機能（連動） |
| **ハートボタン** | プロフィールカード | お気に入り/フォロー機能 |
| **シェアボタン** | PC右下 + モバイルフローティング | SNSシェア機能（連動） |
| **ゲームボタン** | ヘッダー + モバイルフローティング左下 | 用途未定（連動） |

---

## 表示/非表示のデフォルト値

| 要素 | デフォルト | 備考 |
|------|-----------|------|
| **バナー** | OFF | ユーザーが画像設定後にONにする想定 |
| **キャラクター** | ON | 必須要素 |
| **ゲームボタン** | OFF | 用途未定のため |
| **SNSボタン** | OFF | 必要に応じてON |
| **通知アイコン** | OFF | 必要に応じてON |

---

## 実装しないもの（Phase 2以降）

- ダッシュボードのテーマ設定UI
- ダッシュボードの表示設定UI
- ダッシュボードのセクション追加UI（＋ボタン）
- キャラクターカラムの左右アイコンボタン群
- 新セクションタイプ（棒グラフ、画像グリッド等）
- 複数テーマ対応（defaultテーマ等）
- 旧テーブル（FaqCategory, FaqQuestion, UserLink）の削除
- 上記「UIのみ実装」の機能部分

---

## レスポンシブ設計

| 要素 | PC (>992px) | Mobile (≤992px) |
|------|-------------|-----------------|
| Character | 左カラム, sticky, 400px | fixed full-screen背景 |
| Content | 右カラム, スクロール可能 | 下からスライドアップ (rounded-t-[32px]) |
| Header | sticky top, ナビタブ表示 | コンテンツと共にスライド |
| Navigation | 水平タブ | ボトムナビゲーション |
| Floating | 右下シェアボタン | 左下ゲーム、右下SNS、右上通知 |

**ブレークポイント**: 992px（デモと同一）

---

## 検証方法

### 手動テスト

1. **レイアウト確認**
   - PC: `http://localhost:3000/@testhandle` で2カラムレイアウト確認
   - モバイル: DevToolsで992px以下に縮小、背景固定+スライド動作確認

2. **テーマ適用確認**
   - claymorphicのシャドウ効果が適用されているか
   - next-themesのダーク/ライトモードとの共存確認

3. **セクション表示確認**
   - DB直接操作でUserSectionレコード作成
   - 各セクションが正しくレンダリングされるか

4. **visibility設定確認**
   - DB直接操作でvisibility設定を変更
   - 各要素の表示/非表示が正しく反映されるか

5. **ナビゲーション確認**
   - Profile/Items/Videos/FAQsリンクが機能するか
   - アクティブ状態の表示確認

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

## テーマ適用フロー

```
app/[handle]/layout.tsx (Server Component)
  ↓ getUserByHandle() でユーザーデータ取得
  ↓ themePreset, themeSettings を取得
  ↓
UserProfileLayout (Server Component)
  ↓ UserThemeProvider でラップ
  ↓ CSS変数をインラインスタイルで適用
  ↓
各コンポーネント
  ↓ useUserTheme() でテーマ情報取得
  ↓ visibility設定に基づいて表示/非表示
```

---

## 将来の拡張（Phase 2以降）

### セクション追加UI
- ダッシュボードで＋ボタンからセクション選択
- SECTION_REGISTRYから選択肢を生成
- 新規セクション作成 → UserSectionレコード追加

### 新セクションタイプ(例)
| タイプ | 説明 |
|--------|------|
| `bar-graph` | 横棒グラフ（スキルバー等） |
| `image-grid-3` | 横3列画像 |
| `image-link-2` | 横2列画像リンク |
| `image-link-1` | 単体画像リンク |
| `icon-link` | アイコン付きリンク |

### テーマ拡張
- defaultテーマ、neumorphic, flat 等のプリセット追加
- ユーザーによるカスタムカラー設定
- カスタムCSS入力（上級者向け）

### 表示設定UI
- ダッシュボードでの表示/非表示トグル
- リアルタイムプレビュー
