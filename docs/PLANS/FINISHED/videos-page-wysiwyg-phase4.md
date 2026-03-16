# Phase 4: ニコニコサービス層 - 詳細実装計画

## 概要

ニコニコ動画のメタデータ取得サービス、Facade コンポーネント、Server Action を新規実装する。既存の YouTube 関連コードと同じパターンを踏襲する。

---

## 重要な調査結果: API選定

全体計画では `embed.nicovideo.jp/oembed` を記載していたが、調査の結果:

1. ニコニコ動画は oembed.com の公式プロバイダリストに**未登録**
2. `embed.nicovideo.jp/oembed?url=...&format=json` は **404** を返す
3. 代替: `https://ext.nicovideo.jp/api/getthumbinfo/{videoId}` が認証不要で利用可能（XML形式）
4. `fast-xml-parser` はプロジェクトに導入済み（YouTube RSS Feed で使用中）

**決定: getthumbinfo API を採用する。**

---

## 4.0 前提: next.config.ts の remotePatterns 追加

**ファイル:** `next.config.ts`

```typescript
// images.remotePatterns に追加
{
  protocol: 'https',
  hostname: 'nicovideo.cdn.nimg.jp',
  pathname: '/thumbnails/**',
},
{
  protocol: 'https',
  hostname: 'tn.smilevideo.jp',
},
```

サムネイルURLは時期により異なるドメインを使用するため、両方登録が必要。

---

## 4.1 定数定義

**新規ファイル:** `services/niconico/constants.ts`

```typescript
export const MAX_NICONICO_RECOMMENDED_VIDEOS = 6
export const NICONICO_VIDEO_ID_PATTERN = /^(sm|nm|so)\d+$/
export const NICONICO_URL_PATTERNS = [
  /nicovideo\.jp\/watch\/((sm|nm|so)\d+)/,
  /nico\.ms\/((sm|nm|so)\d+)/,
] as const
export const NICONICO_THUMBINFO_API_URL = 'https://ext.nicovideo.jp/api/getthumbinfo'
export const NICONICO_EMBED_URL = 'https://embed.nicovideo.jp/watch'
export const NICONICO_API_TIMEOUT_MS = 5000
```

---

## 4.2 Niconico API サービス

**新規ファイル:** `services/niconico/niconico-api.ts`

### `extractNiconicoVideoId(input: string): string | null`

URL または動画ID文字列からニコニコ動画IDを抽出。

| 入力 | 期待値 |
|---|---|
| `sm12345` | `sm12345` |
| `nm67890` | `nm67890` |
| `https://www.nicovideo.jp/watch/sm12345` | `sm12345` |
| `https://nico.ms/sm12345` | `sm12345` |
| `abc123` | `null` |

### `fetchNiconicoVideoMetadata(videoId: string)`

getthumbinfo API でタイトル・サムネイル取得。

**レスポンス構造（成功時）:**
```xml
<nicovideo_thumb_response status="ok">
  <thumb>
    <title>動画タイトル</title>
    <thumbnail_url>https://nicovideo.cdn.nimg.jp/thumbnails/...</thumbnail_url>
  </thumb>
</nicovideo_thumb_response>
```

**レスポンス構造（失敗時）:**
```xml
<nicovideo_thumb_response status="fail">
  <error><code>DELETED</code></error>
</nicovideo_thumb_response>
```

**エラーハンドリング:**
- HTTPエラー: `response.ok` チェック
- API固有エラー: XML内の `@_status !== 'ok'` チェック
- タイムアウト: `AbortSignal.timeout(5000)` で明示的に制限
- パースエラー: try-catch

---

## 4.3 NiconicoFacade コンポーネント

**新規ファイル:** `components/NiconicoFacade.tsx`

既存の `components/YouTubeFacade.tsx` と同じ Facade パターン。

### YouTubeFacade との差分

| 項目 | YouTubeFacade | NiconicoFacade |
|---|---|---|
| サムネイルURL | `img.youtube.com/vi/{id}/maxresdefault.jpg` (決め打ち) | **props で受け取り**（API取得必須） |
| 再生ボタン色 | `bg-red-600` (YouTube赤) | `bg-zinc-800/80` (ニコニコダーク) |
| iframe src | `youtube.com/embed/{id}` | `embed.nicovideo.jp/watch/{id}` |
| iframe allow | accelerometer, autoplay, etc. | `autoplay; fullscreen` |

### Props

```typescript
interface NiconicoFacadeProps {
  videoId: string
  title?: string
  thumbnailUrl?: string  // YouTubeと異なりAPIから取得済みURLを渡す
}
```

### 動作フロー

1. サムネイル画像を表示（`next/image` の `<Image fill>`）
2. クリックで `useState(false)` → `true` に切り替え
3. `https://embed.nicovideo.jp/watch/{videoId}` の iframe を読み込み
4. アスペクト比 16:9 固定

---

## 4.4 Niconico Server Action

**新規ファイル:** `app/actions/social/niconico-actions.ts`

### `getNiconicoMetadata(url: string)`

```typescript
export async function getNiconicoMetadata(url: string): Promise<{
  success: boolean
  data?: { videoId: string; title?: string; thumbnail?: string }
  error?: string
}>
```

**フロー:**
1. `requireAuth()` で認証確認
2. `extractNiconicoVideoId(url)` でID抽出
3. `NICONICO_VIDEO_ID_PATTERN` で最終検証
4. `fetchNiconicoVideoMetadata(videoId)` でメタデータ取得
5. 結果を返却

---

## 実装順序

```
4.0  next.config.ts の remotePatterns 追加
 ↓
4.1  services/niconico/constants.ts (依存なし)
 ↓
4.2  services/niconico/niconico-api.ts (4.1に依存)
 ↓ ↘
4.3  NiconicoFacade.tsx        4.4  niconico-actions.ts
     (4.1に依存)                     (4.1+4.2に依存)
```

4.3 と 4.4 は並行実装可能。

---

## 検証方法

### 静的チェック
```bash
npm run lint && npx tsc --noEmit
```

### getthumbinfo API の手動検証

ブラウザで以下にアクセス:
- 成功ケース: `https://ext.nicovideo.jp/api/getthumbinfo/sm9`
- 失敗ケース: `https://ext.nicovideo.jp/api/getthumbinfo/sm99999999999`

### NiconicoFacade の動作検証

demo ページで NiconicoFacade を直接レンダリング:
- `thumbnailUrl` あり/なし両パターン
- クリック後 iframe が正しく読み込まれること
- ニコニコ動画の埋め込みプレイヤーが操作可能であること

---

## リスク

| リスク | 影響 | 軽減策 |
|---|---|---|
| getthumbinfo API の廃止 | 高 | 非公式APIのため予告なく停止の可能性。手動入力フォールバックUIを Phase 6 で用意 |
| サムネイルURLドメインの変更 | 中 | next.config.ts の remotePatterns 更新で対応 |
| 一部動画の外部埋め込み不可 | 中 | iframe 読み込み失敗時のフォールバック表示を検討 |
| XMLパースエラー | 低 | fast-xml-parser は YouTube RSS で実績あり。try-catch でハンドリング |
