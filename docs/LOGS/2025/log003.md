# AI Prompt Guide - ウェブアプリ開発進捗管理

## 🎯 現在の開発目標
基本レイアウトシステムの構築 - 全ページで統一感のあるレイアウトを作成し、ページごとのバリエーション（幅・背景色など）に対応する。

## ✅ 完了項目
- Prismaスキーマ更新（Product model追加）
- ローカル・本番環境でのマイグレーション実行
- デモページ（database-test）でのCRUD機能実装
- PRISMA-UPDATE-GUIDE.mdの手順検証・更新

## 🎉 完了した作業

### 基本レイアウトシステム構築 - 完了 ✅

#### Phase 1: 設計・計画 ✅
- [x] **基本レイアウトの設計・ワイヤーフレーム作成**
  - レイアウト構造の決定（Header、Main、Footer、Navigation）
  - ページバリエーションの仕様決定
  - 使用するshadcn/uiコンポーネントの選定

#### Phase 2: コンポーネント開発 ✅
- [x] **レイアウトコンポーネント作成**
  - `components/layout/BaseLayout.tsx` - メインレイアウトコンポーネント
  - `components/layout/Header.tsx` - 設定対応ヘッダー
  - `components/layout/Sidebar.tsx` - 設定対応サイドバー
  - `components/navigation/nav-user.tsx` - サイドバー用ユーザーメニュー
  - `components/navigation/nav-user-header.tsx` - ヘッダー用ユーザーメニュー

#### Phase 3: レイアウトシステム ✅
- [x] **レイアウトバリエーション対応システム実装**
  - `lib/layout-config.ts` - バリアント設定ファイル
  - プロパティベースでの幅・背景色切り替え
  - TypeScriptでの型安全なバリエーション管理
  - 5つのレイアウトバリアント: default, admin, user-profile, public, minimal

#### Phase 4: 統合・更新 ✅
- [x] **ルートレイアウト更新**
  - `app/layout.tsx`の更新（タイトル、言語設定）
  - 全体のスタイル・フォント設定の調整

- [x] **ページ実装**
  - `app/page.tsx`をBaseLayoutとモダンデザインで刷新
  - `app/dashboard/page.tsx`をBaseLayout使用に更新
  - デモページへのレイアウト適用

### アーキテクチャリファクタリング - 完了 ✅

#### 理想的な構成の実現 ✅
- [x] **components/layout/BaseLayout.tsx** - メインレイアウトオーケストレーター
- [x] **components/layout/Header.tsx** - 設定駆動ヘッダーコンポーネント
- [x] **components/layout/Sidebar.tsx** - 設定駆動サイドバーコンポーネント
- [x] **components/navigation/** - ナビゲーション関連コンポーネントの整理
- [x] **レガシーコードの削除** - 古い`app-sidebar.tsx`を削除

#### layout.tsxベース構成への移行 ✅
- [x] **app/dashboard/layout.tsx** - defaultバリアント適用
- [x] **app/admin/layout.tsx** - adminバリアント適用（Shield/赤アイコン）
- [x] **app/profile/layout.tsx** - user-profileバリアント適用（UserCircle/青アイコン）
- [x] **BaseLayoutの重複解消** - 各page.tsxからBaseLayout削除、layout.tsxで一元管理

#### ブランドアイコンカスタマイズ機能 ✅
- [x] **アイコン種類** - バリアントごとに異なるlucide-reactアイコン
- [x] **背景色設定** - Tailwindクラスによる色カスタマイズ（赤、青、緑等）
- [x] **タイトル・サブタイトル** - バリアントごとの表示テキスト
- [x] **リンクURL** - ブランドアイコンのクリック先設定

#### サイドバー幅の動的設定 ✅
- [x] **バリアント別幅設定** - default:350px, admin:400px, profile:300px等
- [x] **オーバーライド対応** - ページごとの幅カスタマイズ
- [x] **不要設定の削除** - 混乱を招くsecondSidebar.width設定を除去

#### 現在のアーキテクチャの利点
- ✅ **バリアントベースレイアウト**: レイアウトタイプの簡単な切り替え
- ✅ **オーバーライドシステム**: ページごとの細かなカスタマイズ
- ✅ **型安全性**: 適切なインターフェースによる完全なTypeScriptサポート
- ✅ **コンポーネント分離**: 関心の明確な分離
- ✅ **保守性**: 中央集権的な設定とモジュラーコンポーネント
- ✅ **視覚的差別化**: バリアントごとのブランドアイコンと色分け
- ✅ **柔軟なレイアウト**: サイドバー幅の動的調整

## 🎨 設計方針

### 技術スタック
- **UIフレームワーク**: shadcn/ui + Radix UI
- **スタイリング**: TailwindCSS v4
- **レスポンシブ**: Mobile-first approach
- **アクセシビリティ**: ARIA対応、キーボードナビゲーション

### レイアウト構造（想定）
```
┌─────────────────────────────────┐
│           Header                │
├─────────────────────────────────┤
│ Navigation (optional)           │
├─────────────────────────────────┤
│                                 │
│           Main Content          │
│        (width variants)         │
│                                 │
├─────────────────────────────────┤
│           Footer                │
└─────────────────────────────────┘
```

### バリエーション対応
- **幅**: full-width, container, narrow
- **背景**: default, accent, muted
- **レイアウト**: centered, sidebar, grid

## 📝 開発メモ

### 参考情報
- CLAUDE.md: Next.js App Router、shadcn/ui優先使用
- 既存レイアウト: デフォルトNext.jsレイアウト使用中
- フォント: Geist Sans, Geist Mono設定済み

## 📚 作成されたドキュメント

### ガイドドキュメント
- **docs/GUIDES/BASE-LAYOUT-GUIDE.md** - BaseLayoutシステムの完全ガイド
  - 推奨使用方法（layout.tsxベース）
  - 5つのバリアント仕様（default, admin, user-profile, public, minimal）
  - ブランドアイコンカスタマイズ方法
  - サイドバー幅設定方法
  - 実装例とディレクトリ構成

### 次回セッションでの可能な拡張
- [ ] Second Sidebarコンテンツの具体的実装
- [ ] テーマシステム（ダーク/ライトモード）
- [ ] レスポンシブ対応の強化
- [ ] アニメーション・トランジション追加

---
*最終更新: 2025-01-06*