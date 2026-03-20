# Phase 3: WYSIWYG プロフィールエディター

## 概要

ダッシュボードで公開プロフィールの見た目をほぼそのまま再現し、編集したい部分をクリックするとモーダルで編集できる（WYSIWYG）システムを構築する。

---

## ユーザー要望

1. **公開プロフィールの見た目を再現** - ダッシュボードでプレビューしながら編集
2. **モーダル編集** - 編集ボタンをクリックでモーダルが開き編集
3. **画像セクション編集** - 左側の背景画像・キャラクター画像も編集可能
4. **通知設定のモーダル編集** - 通知アイコンクリックで設定モーダル

---

## 現状分析

| 項目 | 現状 |
|------|------|
| **公開プロフィール** | `UserProfileLayout` で2カラム（CharacterColumn + ContentColumn） |
| **ダッシュボード /profile** | 従来型フォーム（カード形式）で画像・基本情報を編集 |
| **ダッシュボード /profile-sections** | セクション一覧、▲▼並び替え、追加モーダル |
| **インライン編集** | `components/inline-edit.tsx` が既存（テキスト対応） |
| **画像アップロード** | `components/image-uploader/` が既存 |

---

## 設計方針

### 選択肢 C: 統合 WYSIWYG エディターページ

新規 `/dashboard/profile-editor` を作成し、`UserProfileLayout` を編集モード対応。
既存の `/dashboard/profile` と `/dashboard/profile-sections` を統合。

**メリット:**
- 公開ページとダッシュボードの見た目が一致
- ユーザー体験が直感的（WYSIWYG）
- 既存コンポーネントを最大限再利用

---

## Step 構成

### Step 1: 基盤コンポーネント（高優先度）

#### 1-1. 編集オーバーレイコンポーネント
- [x] `components/user-profile/EditOverlay.tsx` 作成
  - ホバー時に半透明オーバーレイ + 編集アイコン
  - クリックでコールバック実行

```typescript
interface EditOverlayProps {
  isEditable: boolean
  onClick: () => void
  children: ReactNode
  label?: string  // "画像を変更" など
}
```

#### 1-2. 編集モーダル基盤
- [x] `components/user-profile/EditModal.tsx` 作成
  - セクション編集用の汎用モーダル
  - 保存/キャンセルボタン

---

### Step 2: UserProfileLayout の編集モード対応

#### 2-1. props拡張
- [x] `UserProfileLayout.tsx` に `isEditable` props 追加
- [x] `onImageEdit` コールバック追加

```typescript
interface UserProfileLayoutProps {
  // ... 既存 props
  isEditable?: boolean
  onImageEdit?: (type: 'banner' | 'character' | 'profile') => void
}
```

#### 2-2. CharacterColumn の編集対応
- [x] `CharacterColumn.tsx` に編集オーバーレイ追加
- [x] バナー画像: クリックでアップロードモーダル
- [x] キャラクター画像: クリックでアップロードモーダル

---

### Step 3: 画像編集モーダル

#### 3-1. バナー画像編集
- [x] `components/user-profile/BannerImageModal.tsx` 作成
  - 背景画像一覧から選択
  - 既存の `BackgroundImageSection` ロジックを流用

#### 3-2. キャラクター画像編集
- [x] `components/user-profile/CharacterImageModal.tsx` 作成
  - 既存の `ImageUploader` を活用
  - アップロード + 削除

---

### Step 4: セクションのモーダル編集対応

**実装方針の変更**: 各セクション内に編集ボタンを配置するのではなく、`EditableSectionWrapper` で全セクションを統一的にラップし、編集ボタンを外側に配置する方式に変更。

#### 4-1. EditableSectionWrapper（新規作成）
- [x] セクション操作用の統一ラッパーコンポーネント作成
- [x] 左側: 上下移動ボタン（縦配置、常時表示）
- [x] 右側: 編集ボタン + 削除ボタン（縦配置、常時表示）
- [x] レスポンシブ対応（PC: 外側配置、スマホ: 重なり許容）

#### 4-2. EditableSectionRenderer（新規作成）
- [x] 編集モーダルの統合管理
- [x] セクションタイプに応じた編集モーダルを switch 文でレンダリング
- [x] 各セクションを EditableSectionWrapper でラップ

#### 4-3. 各セクションの簡素化
- [x] ProfileCardSection - 編集ボタン・モーダル状態を削除
- [x] HeaderSection - 編集ボタン・モーダル状態を削除
- [x] LinksSection - 編集ボタン・モーダル状態を削除
- [x] FAQSection - 編集ボタン・モーダル状態を削除
- [x] LongTextSection - 編集ボタン・モーダル状態を削除
- [x] BarGraphSection - 編集ボタン・モーダル状態を削除

#### 4-4. サンプルデータの自動生成
- [x] `createSection` Server Action にサンプルデータ生成ロジックを追加
- [x] FAQ: カテゴリー1つ + 質問1つのサンプル
- [x] Links: リンク1つのサンプル
- [x] BarGraph: スキル1つのサンプル

---

### Step 5: 通知設定のモーダル編集

#### 5-1. FloatingElements の編集対応
- [ ] `FloatingElements.tsx` に `isEditable`, `onNotificationEdit` props 追加
- [ ] Bell アイコンクリックで `NotificationEditModal` を開く

#### 5-2. NotificationEditModal
- [ ] `components/user-profile/NotificationEditModal.tsx` 作成
- [ ] 既存の `NotificationSettings` コンポーネントをモーダル内に配置

---

### Step 6: 統合ダッシュボードページ

#### 6-1. /dashboard/profile-editor ページ
- [ ] `app/dashboard/profile-editor/page.tsx` 作成（Server Component）
- [ ] ユーザーデータ、セクション、テーマ設定を取得

#### 6-2. EditableProfileClient
- [ ] `app/dashboard/profile-editor/EditableProfileClient.tsx` 作成
- [ ] 各編集モーダルの状態管理
- [ ] `UserProfileLayout` を `isEditable=true` で使用

#### 6-3. セクション操作UI
- [ ] セクション追加ボタン（フローティング or ヘッダー固定）
- [ ] セクション並び替え（既存の ▲▼ ボタン）
- [ ] セクション削除確認モーダル

#### 6-4. サイドパネル
- [ ] テーマプリセット選択
- [ ] 表示/非表示設定（visibility toggles）

---

### Step 7: 既存ページの統合

#### 7-1. ナビゲーション更新
- [ ] `/dashboard/profile` → `/dashboard/profile-editor` にリダイレクト
- [ ] `/dashboard/profile-sections` → 統合（段階的に）
- [ ] サイドバーメニュー: 「プロフィール設定」→「プロフィールエディター」

---

### Step 8: 検証

- [ ] PC: 2カラムレイアウトでの編集操作
- [ ] モバイル: 固定背景+スライドコンテンツでの編集操作
- [ ] 画像アップロード（バナー、キャラクター）
- [ ] インライン編集（名前、bio、見出し）
- [ ] モーダル編集（FAQ、リンク、長文、バーグラフ）
- [ ] 通知設定のモーダル編集
- [ ] セクション追加/削除/並び替え
- [ ] 型チェック・Lint 通過

---

## ファイル構造

```
components/
├── user-profile/
│   ├── UserProfileLayout.tsx        # ✅ 完成: isEditable props 追加
│   ├── CharacterColumn.tsx          # ✅ 完成: 画像編集対応
│   ├── FloatingElements.tsx         # 通知編集対応
│   ├── EditableSectionWrapper.tsx   # ✅ 完成: セクション操作ボタン統合
│   ├── EditableSectionRenderer.tsx  # ✅ 完成: 編集モーダル統合管理
│   ├── EditOverlay.tsx              # ✅ 完成: 汎用編集オーバーレイ
│   ├── EditModal.tsx                # ✅ 完成: 汎用編集モーダル
│   ├── BannerImageModal.tsx         # ✅ 完成: バナー画像編集
│   ├── CharacterImageModal.tsx      # ✅ 完成: キャラクター画像編集
│   ├── NotificationEditModal.tsx    # 新規: 通知設定編集
│   └── sections/
│       ├── ProfileCardSection.tsx   # ✅ 完成: 表示のみ（編集は外部管理）
│       ├── FAQSection.tsx           # ✅ 完成: 表示のみ（編集は外部管理）
│       ├── LinksSection.tsx         # ✅ 完成: 表示のみ（編集は外部管理）
│       ├── HeaderSection.tsx        # ✅ 完成: 表示のみ（編集は外部管理）
│       ├── LongTextSection.tsx      # ✅ 完成: 表示のみ（編集は外部管理）
│       ├── BarGraphSection.tsx      # ✅ 完成: 表示のみ（編集は外部管理）
│       └── editors/                 # ✅ 完成: セクション別エディター
│           ├── ProfileCardEditModal.tsx  # ✅ 完成
│           ├── FAQEditModal.tsx          # ✅ 完成
│           ├── LinksEditModal.tsx        # ✅ 完成
│           ├── HeaderEditModal.tsx       # ✅ 完成
│           ├── LongTextEditModal.tsx     # ✅ 完成
│           └── BarGraphEditModal.tsx     # ✅ 完成

app/
├── dashboard/
│   └── profile-editor/              # ✅ 完成: WYSIWYG エディターページ
│       ├── page.tsx                 # ✅ 完成: Server Component
│       ├── EditableProfileClient.tsx # ✅ 完成: 編集モーダル状態管理
│       └── components/
│           ├── SectionToolbar.tsx   # セクション操作ツールバー
│           ├── AddSectionButton.tsx # セクション追加ボタン
│           └── SettingsPanel.tsx    # テーマ/表示設定パネル
├── actions/
│   └── user/
│       └── section-actions.ts       # ✅ 完成: サンプルデータ自動生成を追加
```

---

## 編集トリガー設計

| 要素 | トリガー | 編集方式 |
|------|---------|---------|
| バナー画像 | ホバー + クリック | モーダル（画像選択） |
| キャラクター画像 | ホバー + クリック | モーダル（画像アップロード） |
| プロフィールカード | 編集ボタン常時表示 + クリック | モーダル（名前・bio編集） |
| 見出し | 編集ボタン常時表示 + クリック | モーダル（テキスト編集） |
| FAQ | 編集ボタン常時表示 + クリック | モーダル（Q&A編集） |
| リンク | 編集ボタン常時表示 + クリック | モーダル（リンク編集） |
| 長文 | 編集ボタン常時表示 + クリック | モーダル（Markdownエディタ） |
| バーグラフ | 編集ボタン常時表示 + クリック | モーダル（データ編集） |
| 通知アイコン | クリック | モーダル（通知設定） |

---

## 編集オーバーレイのデザイン

```
┌────────────────────────────────────────┐
│                                        │
│     [半透明オーバーレイ bg-black/30]    │
│                                        │
│          ┌──────────────┐              │
│          │   ✏️ 編集    │              │
│          └──────────────┘              │
│                                        │
└────────────────────────────────────────┘
```

---

## 優先順位

### 高優先度（Phase 3A）
1. EditOverlay コンポーネント
2. CharacterColumn の画像編集
3. ProfileCardSection のモーダル編集
4. /dashboard/profile-editor ページ基盤

### 中優先度（Phase 3B）
5. FAQSection / LinksSection のモーダル編集
6. 通知設定のモーダル編集
7. セクション追加/削除/並び替え UI 統合

### 低優先度（Phase 3C）
8. HeaderSection のモーダル編集
9. LongTextSection / BarGraphSection のモーダル編集
10. モバイル最適化

---

## 再利用する既存コンポーネント

| コンポーネント | 用途 |
|---------------|------|
| `ImageUploader` | 画像アップロードモーダル内 |
| `BackgroundImageSection` ロジック | バナー画像選択 |
| `NotificationSettings` | 通知設定モーダル内 |
| `AddSectionModal` | セクション追加 |
| `SortableList` | セクション並び替え |
| `Input` / `Textarea` | モーダル内フォーム入力 |

---

## 検証方法

```bash
# 開発サーバー起動
docker compose -f compose.dev.yaml up -d && npm run dev

# 型チェック
npx tsc --noEmit

# Lint
npm run lint
```

### 手動テスト

1. `/dashboard/profile-editor` で各要素の編集操作
2. 保存後に `/[handle]` で反映確認
3. 画像のアップロード/変更/削除
4. モーダル編集（編集ボタンクリック → モーダル表示 → 保存/キャンセル）
5. セクション操作（追加/削除/並び替え）
6. モバイル表示での編集操作

---

## Critical Files

- `components/user-profile/UserProfileLayout.tsx` - isEditable props 追加
- `components/user-profile/CharacterColumn.tsx` - 画像編集オーバーレイ
- `components/user-profile/EditableSectionWrapper.tsx` - ✅ セクション操作ボタン統合
- `components/user-profile/EditableSectionRenderer.tsx` - ✅ 編集モーダル統合管理
- `components/user-profile/sections/editors/` - ✅ 各種編集モーダル
- `app/dashboard/profile-editor/` - ✅ WYSIWYG エディターページ
- `app/actions/user/section-actions.ts` - ✅ サンプルデータ自動生成
- `app/dashboard/profile/background-image-section.tsx` - バナー選択ロジック
- `app/dashboard/notifications/notification-settings.tsx` - 通知設定モーダル化

---

## 実装完了セクション

### ✅ Step 1-3: 基盤コンポーネント（2026-02-15）

#### 完成した機能

1. **EditOverlay（編集オーバーレイ）**
   - ホバー時に半透明オーバーレイ + 編集アイコン表示
   - 画像編集用の汎用コンポーネント

2. **EditModal（汎用モーダル）**
   - セクション編集用の共通モーダル基盤
   - 保存/キャンセルボタン標準搭載

3. **BannerImageModal（バナー画像編集）**
   - 管理者が用意した背景画像一覧から選択
   - RadioGroup で画像選択
   - 「背景なし」オプション対応

4. **CharacterImageModal（キャラクター画像編集）**
   - ユーザー自身が画像をアップロード
   - ImageUploader コンポーネント活用
   - immediate モードで即時アップロード
   - 現在の画像削除機能

5. **UserProfileLayout の編集モード対応**
   - isEditable props 追加
   - onImageEdit コールバック追加
   - 画像編集モーダルとの連携

6. **CharacterColumn の編集対応**
   - バナー画像に EditOverlay 適用
   - キャラクター画像に EditOverlay 適用
   - profileImageUrl props 追加

#### 変更したファイル

- ✅ `components/user-profile/EditOverlay.tsx` - 新規作成
- ✅ `components/user-profile/EditModal.tsx` - 新規作成
- ✅ `components/user-profile/BannerImageModal.tsx` - 新規作成
- ✅ `components/user-profile/CharacterImageModal.tsx` - 新規作成
- ✅ `components/user-profile/UserProfileLayout.tsx` - props 拡張
- ✅ `components/user-profile/CharacterColumn.tsx` - EditOverlay 統合
- ✅ `app/dashboard/profile-editor/EditableProfileClient.tsx` - モーダル統合
- ✅ `app/dashboard/profile-editor/page.tsx` - profileImageId 追加

#### 検証結果

- ✅ 型チェック成功（`npx tsc --noEmit`）
- ⏳ 動作確認待ち

---

### ✅ Step 4: セクションのモーダル編集対応（2026-02-15 初回実装）

#### 完成した機能

1. **EditableSectionWrapper（統一ラッパー）**
   - 左側: 上下移動ボタン（縦配置、常時表示）
   - 右側: 編集ボタン + 削除ボタン（縦配置、常時表示）
   - レスポンシブ対応: PC（外側）、スマホ（重なり許容）

2. **EditableSectionRenderer（編集モーダル統合管理）**
   - セクションタイプに応じた編集モーダルを switch 文でレンダリング
   - 全ての編集機能を一元管理

3. **各セクションの簡素化**
   - 全セクション（ProfileCard, FAQ, Links, Header, LongText, BarGraph）から編集ボタン・モーダル状態を削除
   - 各セクションは表示のみを担当（シンプル化）

4. **サンプルデータの自動生成**
   - セクション作成時に自動的にサンプルデータを1つ追加
   - FAQ: カテゴリー1つ + 質問1つ
   - Links: リンク1つ
   - BarGraph: スキル1つ

#### 設計方針の変更

**当初の計画**: 各セクション内に編集ボタンを配置し、個別にモーダル状態を管理

**実装した設計**:
- EditableSectionWrapper で全セクションを統一的にラップ
- 編集ボタンをセクション外側に配置（左右に分離）
- EditableSectionRenderer で編集モーダルを一元管理
- 各セクションは表示のみを担当（責任の分離）

**メリット**:
- コードの重複を削減（DRY原則）
- 統一されたUI/UX
- 保守性の向上
- スマホでの操作性向上（常時表示）

#### 変更したファイル

- ✅ `components/user-profile/EditableSectionWrapper.tsx` - 新規作成
- ✅ `components/user-profile/EditableSectionRenderer.tsx` - 新規作成
- ✅ `components/user-profile/sections/ProfileCardSection.tsx` - 簡素化
- ✅ `components/user-profile/sections/FAQSection.tsx` - 簡素化
- ✅ `components/user-profile/sections/LinksSection.tsx` - 簡素化
- ✅ `components/user-profile/sections/LongTextSection.tsx` - 簡素化
- ✅ `components/user-profile/sections/BarGraphSection.tsx` - 簡素化
- ✅ `components/user-profile/sections/HeaderSection.tsx` - 簡素化
- ✅ `app/actions/user/section-actions.ts` - サンプルデータ生成機能追加

#### 検証結果

- ✅ 型チェック成功（`npx tsc --noEmit`）
- ⏳ 動作確認待ち

---

## 残タスク

### ✅ Step 1: 基盤コンポーネント（完了）
- [x] `EditOverlay.tsx` - 画像編集用オーバーレイ
- [x] `EditModal.tsx` - 汎用モーダル

### ✅ Step 2: UserProfileLayout の編集モード対応（完了）
- [x] `UserProfileLayout.tsx` - isEditable props 追加
- [x] `CharacterColumn.tsx` - 編集オーバーレイ追加

### ✅ Step 3: 画像編集モーダル（完了）
- [x] `BannerImageModal.tsx` - 完成
- [x] `CharacterImageModal.tsx` - 完成

### Step 5: 通知設定のモーダル編集
- [ ] `FloatingElements.tsx` - 編集対応（未実装）
- [ ] `NotificationEditModal.tsx` - 未実装

### Step 6: 統合ダッシュボードページ
- [x] `/dashboard/profile-editor/page.tsx` - 完成
- [x] `EditableProfileClient.tsx` - 完成
- [x] セクション追加/削除/並び替え UI - 完成
- [ ] サイドパネル（テーマ選択、表示設定）- 未実装

### Step 7: 既存ページの統合
- [ ] ナビゲーション更新 - 未実装
