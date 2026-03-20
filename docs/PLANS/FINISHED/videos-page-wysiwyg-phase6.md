# Phase 6: エディタモーダル - 詳細実装計画

## 概要

4つのエディタモーダルを新規作成する。既存エディタの共通パターンを踏襲しつつ、ドラッグ&ドロップやメタデータ自動取得を組み合わせる。

---

## 既存エディタの共通パターン

### パターンA: シンプル入力型
- `useState` でフィールド管理
- `useTransition` + `startTransition` で保存処理
- `updateSection(sectionId, { data })` で一括保存
- `EditModal` (hideActions) + 自前の保存/キャンセルボタン

### パターンB: リスト管理型
- ローカル `useState` でリスト管理、「完了」ボタンで一括DB保存
- `nanoid()` で新規アイテムID生成
- バックアップ機構 + Escapeキャンセル

### パターンC: メタデータ自動取得型
- URL入力 → 取得ボタン/Enterキー → メタデータAPI呼び出し
- `isLoadingMetadata` 状態 → Loader2 スピナー
- 重複チェック + サムネイル・タイトル自動設定

### パターンD: ドラッグ&ドロップ型
- `@dnd-kit/core` + `@dnd-kit/sortable` (インストール済み)
- `PointerSensor` + `TouchSensor`（モバイル: delay:250ms, tolerance:5）
- `GripVertical` ハンドル

---

## 6.1 VideosProfileEditModal

**ファイル:** `components/user-profile/sections/editors/VideosProfileEditModal.tsx`

**適用パターン:** パターンA（シンプル入力型）

### フォーム構成

```
[タイトル]  Input (maxLength=50, 必須)
  └ 文字数カウント: {title.length}/50

[説明文]  Textarea (maxLength=200, rows=3, 任意)
  └ 文字数カウント: {description.length}/200

[キャンセル] [保存]
```

### Zodバリデーション

```typescript
const videosProfileSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(50, 'タイトルは50文字以内'),
  description: z.string().max(200, '説明文は200文字以内').optional(),
})
```

### 保存処理

`updateSection(sectionId, { data: { title, description } })` → `toast.success` → `onClose` → `router.refresh`

---

## 6.2 YouTubeLatestEditModal

**ファイル:** `components/user-profile/sections/editors/YouTubeLatestEditModal.tsx`

**適用パターン:** パターンA + パターンC（入力 + メタデータ取得）

### フォーム構成

```
[チャンネルID / URL]  Input + [検証] Button
  └ ヘルプ: "Channel IDは「UC」で始まる24文字のIDです"
  └ 検証成功時: チェックマークアイコン

[最新動画表示数]  Select (0:非表示, 1-15本)

[RSS Feedプレビュー]  ← channelId検証成功 & rssFeedLimit > 0 の場合のみ
  └ サムネイルグリッド

[キャンセル] [保存]
```

### UXフロー

1. channelId/URL入力 → 「検証」ボタン（or Enterキー）
2. `extractChannelIdFromUrl()` でバリデーション
3. 成功時: `validatedChannelId` セット + チェックマーク表示
4. `rssFeedLimit > 0` → `fetchPublicYoutubeRss()` でRSSプレビュー表示
5. 保存 → `updateYouTubeLatestSection()` で PubSubHubbub 自動管理

### 保存処理の特殊性

通常の `updateSection()` ではなく `updateYouTubeLatestSection()` を使用。channelId 変更時に PubSubHubbub subscribe/unsubscribe を自動実行するため。

### 流用元

`app/dashboard/platforms/components/YouTubeTabContent.tsx` の:
- channelId入力 + extractChannelIdFromUrl バリデーション
- Select による rssFeedLimit 選択
- RSS Feed プレビュー表示

---

## 6.3 YouTubeRecommendedEditModal

**ファイル:** `components/user-profile/sections/editors/YouTubeRecommendedEditModal.tsx`

**適用パターン:** パターンB + C + D（リスト管理 + メタデータ取得 + ドラッグ&ドロップ）

### フォーム構成

```
[YouTube URL を追加]  Input + [追加(Plus)] Button
  └ ローディング中: Loader2 スピナー
  └ "N/6本 登録済み"

[動画一覧]  ← ドラッグ&ドロップ対応
  ├ [GripVertical] [サムネ 96px] [タイトル] [削除(Trash2)]
  ├ [GripVertical] [サムネ 96px] [タイトル] [削除(Trash2)]
  └ ...

[キャンセル] [完了]
```

### メタデータ自動取得フロー

1. YouTube URL 入力 → 「追加」ボタン（or Enterキー）
2. `getYouTubeMetadata(url)` → videoId, title, thumbnail
3. 重複チェック: `items.some(item => item.videoId === ...)`
4. 最大本数チェック: `items.length >= 6`
5. 成功: `nanoid()` でID生成、ローカル items に追加
6. 失敗: `toast.error()` でエラー表示

### ドラッグ&ドロップ

```typescript
const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
)

// handleDragEnd: arrayMove → sortOrder 振り直し → setItems
// DB保存はしない（完了ボタンで一括保存）
```

### コンポーネント分割

```
YouTubeRecommendedEditModal (メインモーダル)
├ SortableVideoItem (useSortable ラッパー)
└ VideoItemCard (表示: サムネイル + タイトル + 削除)
```

### 保存処理

`updateSection(sectionId, { data: { items } })` で一括保存。

---

## 6.4 NiconicoRecommendedEditModal

**ファイル:** `components/user-profile/sections/editors/NiconicoRecommendedEditModal.tsx`

**適用パターン:** 6.3 とほぼ同一構造

### YouTubeRecommendedEditModal との差分

| 項目 | YouTube | ニコニコ |
|------|---------|---------|
| メタデータ取得 | `getYouTubeMetadata(url)` | `getNiconicoMetadata(url)` |
| URLプレースホルダー | `youtube.com/watch?v=...` | `nicovideo.jp/watch/sm...` |
| Video ID パターン | 11文字英数字 | `sm/nm/so` + 数字 |
| 最大本数 | `MAX_RECOMMENDED_VIDEOS (6)` | `MAX_NICONICO_VIDEOS (6)` |
| ヘルプテキスト | なし | `"ニコニコ動画のURLまたは動画IDを入力"` |

### 共通化しない理由

1. 既存エディタモーダル群は各セクション独立で実装（プロジェクト慣例）
2. 将来的にプラットフォーム固有の機能追加の可能性
3. 共通化で得られるコード削減量（~100行）に対して抽象化の複雑さが見合わない

---

## バリデーションルールまとめ

| モーダル | フィールド | ルール |
|---------|----------|--------|
| VideosProfile | title | 必須, 最大50文字 |
| VideosProfile | description | 任意, 最大200文字 |
| YouTubeLatest | channelId | 必須, `/^UC[\w-]{22}$/` |
| YouTubeLatest | rssFeedLimit | 0-15 の整数 |
| YouTubeRecommended | URL入力 | `getYouTubeMetadata()` で検証 |
| YouTubeRecommended | items | 最大6本, videoId重複不可 |
| NiconicoRecommended | URL入力 | `getNiconicoMetadata()` で検証 |
| NiconicoRecommended | items | 最大6本, videoId重複不可 |

---

## 実装順序

1. **6.1** VideosProfileEditModal（最もシンプル、他の雛形に）
2. **6.3** YouTubeRecommendedEditModal（dnd + メタデータ取得）
3. **6.4** NiconicoRecommendedEditModal（6.3のコピー改変）
4. **6.2** YouTubeLatestEditModal（RSSプレビュー + PubSubHubbub専用Action）
5. **登録作業** editor-registry.ts に4つ追加

---

## 検証方法

### 静的チェック
```bash
npm run lint && npx tsc --noEmit
```

### 手動テスト

| モーダル | テスト項目 |
|---------|----------|
| VideosProfile | 空タイトル保存→エラー / 50文字超→制限 / 正常保存→反映 |
| YouTubeLatest | 無効URL→エラー / UC...形式→検証成功 / RSSプレビュー表示 / PubSubHubbubログ確認 |
| YouTubeRecommended | URL→メタデータ取得 / 7本目→エラー / 重複→エラー / ドラッグ並べ替え / 削除 |
| NiconicoRecommended | ニコニコURL→メタデータ取得 / 動画ID直接入力→取得 / ドラッグ / 削除 |
| 横断 | dashboard/videos/ で4セクション追加→全モーダル編集→公開ページ反映確認 |
| モバイル | TouchSensor でのドラッグ&ドロップ動作確認 |
