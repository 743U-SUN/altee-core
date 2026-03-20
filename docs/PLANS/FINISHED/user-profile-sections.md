# ユーザープロフィール拡張セクション案

ユーザーがプロフィールページに追加できるセクションのアイデア一覧です。
`UserSection` テーブルの `sectionType` として識別し、`data` カラムに各セクション固有のJSONデータを保持します。

## 1. 画像リンク (Image Links)

画像主体で、外部サイトやサイト内別ページへ誘導するためのセクション。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `image-hero` | Image | 全幅の大きなバナー画像リンク | キャンペーン告知、最新作品のPR |
| `image-grid-2` | Grid | 2列の画像リンク | 関連サイト、ショップ、支援サイトへの誘導 |
| `image-grid-3` | Grid3x3 | 3列の画像リンク | 作品ギャラリー、Instagram的な利用 |
| `image-card` | LayoutTemplate | 画像＋タイトル＋説明文のカード型リンク | ブログ記事リンク、商品紹介 |

### データ構造例 (`image-grid-2`)
```json
{
  "items": [
    {
      "imageUrl": "https://...",
      "linkUrl": "https://...",
      "title": "BOOTH",
      "overlayText": "Shop" 
    },
    {
      "imageUrl": "https://...",
      "linkUrl": "https://...",
      "title": "FANBOX",
      "overlayText": "Support"
    }
  ]
}
```

## 2. アイコンリンク (Icon Links)

SNSや連絡先など、アイコンをメインとしたリンク集。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `social-links` | Share2 | 横並びの小アイコン列 | X (Twitter), Instagram, GitHub等のSNS一覧 |
| `link-list` | List | アイコン＋テキストの縦積みリスト | 詳細なリンク集、連絡先一覧 |
| `button-stack` | Layers | 強調されたボタンの縦積み | 「依頼する」「支援する」などの重要アクション |

### データ構造例 (`link-list`)
```json
{
  "items": [
    {
      "icon": "twitter", // またはプリセットキー
      "label": "Twitter",
      "url": "https://twitter.com/..."
    },
    {
      "icon": "mail",
      "label": "Contact Me",
      "url": "mailto:..."
    }
  ]
}
```

## 3. データ・グラフ (Data Visualization)

数値やステータスを視覚的に表現するセクション。ゲーミフィケーションやポートフォリオ要素。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `bar-graph` | BarChart2 | 横棒グラフ (0-100%) | スキルセット、進捗状況、パラメータ表示 |
| `radar-chart` | Activity | レーダーチャート（五角形など） | RPG風ステータス、性格分析結果 |
| `pie-chart` | PieChart | 円グラフ | 活動割合、趣味の構成比 |
| `timeline` | Clock | 縦方向の年表・活動履歴 | 経歴、活動履歴、アップデートログ |
| `counter-stat` | Hash | 大きな数字とラベル | 「総作品数」「活動歴X年」などの実績表示 |
| `circular-stat` | Disc | 円形プログレスバー (Circular Gauge) | スキル値、達成率、ステータス表示等 |

### データ構造例 (`bar-graph`)
```json
{
  "title": "Skills",
  "items": [
    { "label": "Illustration", "value": 90, "color": "#ff5555" },
    { "label": "Live2D", "value": 65, "color": "#5555ff" },
    { "label": "3D Modeling", "value": 40, "color": "#55ff55" }
  ]
}
```

## 4. 文章系 (Text Content)

テキスト情報をしっかりと伝えるためのセクション。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `long-text` | FileText | マークダウン対応の長文テキスト | 詳細な自己紹介、規約、依頼ガイドライン |
| `faq-list` | HelpCircle | アコーディオン式のQ&A | よくある質問、マシュマロ回答 |
| `message-box` | AlertCircle | 枠付きのメッセージボックス | お知らせ、注意事項、緊急告知 |
| `2col-text` | 2columnText | 2カラムのテキスト | 目次と文章 |

### データ構造例 (`message-box`)
```json
{
  "style": "info", // info, warning, success, error
  "title": "Commissions Open",
  "content": "現在ご依頼受付中です。詳細はリンクをご確認ください。"
}
```

## 5. 見出し・区切り・余白 (Structural)

ページの構成を整理するための装飾的セクション。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `header` | Heading | セクション見出し | コンテンツの区切り、カテゴリ名 |
| `divider` | Minus | 区切り線・装飾ライン | 視覚的なリズム作り |
| `spacer` | MoveVertical | 余白 | レイアウト調整用の空白 |

### データ構造例 (`header`)
```json
{
  "text": "My Works",
  "alignment": "center", // left, center, right
  "showUnderline": true
}
```

## 6. 動画・音楽・その他 (Embedded / Advanced)

外部サービス連携や特殊な機能。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `video-embed` | Video | YouTube/Twitch埋め込み | 最新動画、配信アーカイブ |
| `music-embed` | Music | SoundCloud/Spotify埋め込み | 楽曲紹介、デモテープ |


### 7. スケジュール・イベント (Schedule & Events)

配信者やクリエイター向けの予定表。

| sectionType | アイコン | 説明 | 想定用途 |
|:---|:---|:---|:---|
| `event-countdown` | Clock | カウントダウンタイマー | 新刊発行日、記念日、イベント開催までの時間 |

---

## 優先実装順位案

1. **Phase 1 (必須)**
   - `profile-card` (既存)
   - `link-list` / `social-links` (Linksの代替)
   - `faq-list` (FAQの代替)

2. **Phase 2 (表現力強化)**
   - `image-grid-2` (ビジュアル重視)
   - `bar-graph` (Alteeらしいキャラ要素)
   - `long-text` (自由記述)
   - `header` (整理整頓)

3. **Phase 3 (リッチコンテンツ)**
   - `video-embed`
   - `radar-chart`
   - `timeline`

---






## テーマ設計アプローチ (相談2への回答)

ユーザーがCSS変数（Custom Properties）だけでデザインを劇的に変更できる仕組み（Theming System）の提案です。

### 基本方針: 「セマティック変数」の使用

各コンポーネントは具体的な色コード（`#ffffff`など）を直接指定せず、必ず **役割に基づいたCSS変数** を参照します。

### 1. 定義すべきCSS変数セット

```css
:root {
  /* --- Colors (Semantic) --- */
  --c-bg-page: #f0f2f5;       /* ページ全体の背景 */
  --c-bg-card: #ffffff;       /* セクションカードの背景 */
  --c-text-main: #333333;     /* 本文色 */
  --c-text-sub: #666666;      /* 補足・日付などの色 */
  --c-accent: #3b82f6;        /* アクセントカラー（リンク、ボタン） */
  --c-accent-fg: #ffffff;     /* アクセント上の文字色 */
  
  /* --- Typography --- */
  --font-heading: "Inter", sans-serif;
  --font-body: "Inter", sans-serif;
  
  /* --- Shapes & Spacing --- */
  --radius-card: 16px;        /* カードの角丸 */
  --radius-button: 8px;       /* ボタンの角丸 */
  --space-section-gap: 24px;  /* セクション間の余白 */
  
  /* --- Effects --- */
  --shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --border-card: 1px solid transparent;
}
```

### 2. テーマプリセットの仕組み

プリセット（Claymorphic, Midnight, Retroなど）は、上記の変数の「値のセット」として定義します。

**例: Claymorphic (現在の想定)**
```css
.theme-claymorphic {
  --c-bg-page: #eef2f6;
  --c-bg-card: #eef2f6; /* 背景と同じ色 */
  --shadow-card: 
    8px 8px 16px #d1d9e6, 
    -8px -8px 16px #ffffff; /* 凸凹の影 */
  --radius-card: 32px;
}
```

**例: Midnight (ダーク系)**
```css
.theme-midnight {
  --c-bg-page: #0f172a;
  --c-bg-card: #1e293b;
  --c-text-main: #f8fafc;
  --border-card: 1px solid #334155;
  --shadow-card: none;
}
```

### 3. Tailwind CSS との連携

Tailwindの設定でこれらの変数を参照するように構成します。

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        page: 'var(--c-bg-page)',
        card: 'var(--c-bg-card)',
        accent: 'var(--c-accent)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      }
    }
  }
}
```

### 実装コンポーネント例

```jsx
// これだけでテーマによって見た目がガラッと変わる
<div className="bg-card text-main rounded-card shadow-card p-6 border border-[var(--border-card)]">
  <h2 className="text-xl font-heading text-accent">Section Title</h2>
  <p className="text-sub">Content...</p>
</div>
```

### 4. ユーザーカスタマイズへの道

この仕組みにしておけば、ユーザー設定画面でカラーピッカーを使って `--c-accent` の値を書き換えるだけで、オリジナルテーマが作れるようになります。
将来的には、「高度な設定」としてCSS変数の値を直接JSONで保存・注入する仕組みを作れば、CSSファイルを書かせなくても自由度の高いカスタマイズが可能になります。

