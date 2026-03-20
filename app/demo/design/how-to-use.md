# UI Catalog (Design System test) 使い方ガイド

このディレクトリ (`app/demo/design/`) は、**Phase 4 以降で実装する各セクションコンポーネントのデザイン（見た目）を、実際のテーマシステム上で事前に検証・作成しておくためのプレビュー環境**です。

## 目的

1. **テーマ変数の検証**: Phase 1で実装されたCSS変数（`var(--theme-bg)` など）が正しく適用され、色が動的に変わるかを確認する。
2. **レイアウトの検証**: `Large (1200px)` と `Medium (720px)` のコンテナ幅で、意図したようにレスポンシブ配置されるかを確認する。
3. **本番実装のスムーズ化**: ここで作ったHTML/Tailwindのモックアップを、Phase 4で実際のReactコンポーネント（連携データ流し込み）にコピー＆ペーストするだけで完結するようにする。

---

## 使い方（コンポーネントの作り方）

`app/demo/design/page.tsx` を編集して、新しいコンポーネントのデザイン案を追加していきます。

### 1. プレビューの確認方法
ブラウザで以下のURLを開いてください。
`http://localhost:3000/demo/design`

### 2. スタイリングのルール（重要！）

ここでは、本番でテーマを即座に切り替えられるように、**具体的な色名（例: `bg-white`, `text-gray-900`）を直接指定してはいけません**。

必ず、`globals.css` で定義されている **テーマ用のCSS変数（Tailwindクラス）** を使用してください。

#### ❌ 悪い例（絶対に使わない）
```tsx
<div className="bg-white rounded-xl shadow-md border-gray-200">
  <h2 className="text-gray-900 text-xl font-bold">タイトル</h2>
  <p className="text-gray-500">説明文です</p>
  <button className="bg-blue-500 text-white">ボタン</button>
</div>
```

#### ⭕ 良い例（変数を適用する）
※ Tailwind v4の機能（`@theme inline`）が `globals.css` に定義されているため、ユーティリティクラスとして呼び出せます。
（現在、動作検証中のため一部 `style={{}}` のインラインスタイルで指定している箇所もありますが、ユーティリティがマッピングされていれば `bg-theme-card-bg` のように書けます）

```tsx
<div className="bg-theme-card-bg rounded-theme shadow-theme">
  <h2 className="text-theme-primary text-xl font-bold">タイトル</h2>
  <p className="text-theme-secondary">説明文です</p>
  <button className="bg-theme-accent-bg text-theme-accent">ボタン</button>
</div>
```

---

## 主なCSS変数一覧（`globals.css` 参照）

| 用途 | CSS変数 | Tailwindクラス例 | 備考 |
|---|---|---|---|
| **ページ背景** | `--theme-bg` | `bg-theme-bg` | ページ全体の一番下の背景 |
| **カード背景** | `--theme-card-bg` | `bg-theme-card-bg` | 各セクションのメインコンテナ |
| **サブカード背景** | `--theme-stat-bg` | `bg-theme-stat-bg` | カード内のさらに小さな要素の背景 |
| **アクセント背景** | `--theme-accent-bg` | `bg-theme-accent-bg` | 選択中の項目や、ハイライト（半透明） |
| **メインテキスト** | `--theme-text-primary` | `text-theme-primary` | 見出し、重要な文字 |
| **サブテキスト** | `--theme-text-secondary`| `text-theme-secondary`| 説明文、日付など |
| **アクセント付テキスト**| `--theme-text-accent` | `text-theme-accent` | リンク、強調したい値 |
| **ボーダー（アクセント）**| `--theme-accent-border`| `border-theme-accent-border` | 区切り線、枠線 |
| **角丸（Radius）** | `--theme-card-radius` | `rounded-theme` | カードの角丸具合 |
| **シャドウ（影）** | `--theme-card-shadow` | `shadow-theme` | カードの影 |

---

## ThemedCard コンポーネントについて

基本的なコンテナ（カード）を作る場合は、`components/sections/_shared/ThemedCard.tsx` をラップするだけで、テーマに応じた「背景色・枠・角丸・影」が自動で適用されます。

```tsx
import { ThemedCard } from "@/components/sections/_shared/ThemedCard"

export default function MyDesign() {
  return (
    <ThemedCard className="flex flex-col gap-4">
      {/* 中身だけを書けばOK */}
      <h3 className="text-theme-primary">カードのタイトル</h3>
    </ThemedCard>
  )
}
```

---

## 開発フロー

1. 新しいセクション（例：画像グリッド、動画リスト）のデザインが必要になったら、まずこのカタログ（`page.tsx`）の新しい `<section>` としてモックアップを作る。
2. 画面上部のトグルで「Claymorphic」と「Minimal」、そして幅「Large」と「Medium」を切り替えて、崩れないか確認する。
3. プレビューでOKが出たら、そのHTMLとTailwindクラスをそのまま `components/sections/` の本番用コンポーネントにコピー＆ペーストする。
