# AI Prompt Guide - ウェブアプリ開発進捗管理

## 🎯 現在の開発目標
モバイル対応強化 - モバイルフッター、スライドシート、SecondSidebarコンテンツシステムの実装完了

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
- [x] **バリアント別幅設定** - default:350px, admin:400px, profile:48px等
- [x] **オーバーライド対応** - ページごとの幅カスタマイズ
- [x] **不要設定の削除** - 混乱を招くsecondSidebar.width設定を除去

### テーマシステム（ダーク/ライトモード）実装 - 完了 ✅

#### next-themesベースのテーマシステム ✅
- [x] **components/theme-provider.tsx** - next-themesのラッパーコンポーネント
- [x] **app/layout.tsx統合** - ThemeProviderの全体適用
- [x] **デフォルトダークモード** - 初期状態をダークモードに設定
- [x] **CSS変数ベーステーマ** - globals.cssでライト・ダーク変数定義済み

#### テーマ切り替えコンポーネント ✅
- [x] **components/mode-toggle.tsx** - シンプルなライト⇄ダーク切り替えボタン
- [x] **Header統合** - ヘッダー右側にテーマトグル配置
- [x] **アニメーション対応** - 太陽・月アイコンのスムーズな切り替え

#### テーマシステムの特徴 ✅
- [x] **SSR対応** - next-themesによるサーバーサイドレンダリング対応
- [x] **システムテーマ検出** - OSのダーク・ライト設定自動検出
- [x] **永続化** - LocalStorageによるユーザー設定保存
- [x] **フラッシュ防止** - ページロード時の白フラッシュを防ぐ

### サイドバーシステム改善 - 完了 ✅

#### Second Sidebar hide設定削除 ✅
- [x] **LayoutConfigリファクタリング** - `secondSidebar.hide`プロパティ完全削除
- [x] **型定義クリーンアップ** - LayoutConfig, LayoutOverridesの整理
- [x] **Sidebarコンポーネント簡素化** - 不要なhide判定ロジック削除

#### Header設定の統一とクリーンアップ ✅
- [x] **命名規則統一** - `show*`プロパティを`hide*`に統一
- [x] **SidebarTrigger制御** - `hideSidebarTrigger`で表示・非表示制御
- [x] **ModeToggle制御** - `hideModeToggle`でテーマボタン表示・非表示制御
- [x] **通知制御** - `hideNotifications`で通知エリア制御

#### 完全なHeader制御システム ✅
```typescript
header: {
  hideUserMenu: false,      // ユーザーメニュー非表示
  hideNotifications: false, // 通知非表示  
  hideSidebarTrigger: false,// サイドバートリガー非表示
  hideModeToggle: false,    // テーマ切り替えボタン非表示
}
```

### モバイル対応強化システム実装 - 完了 ✅

#### モバイルフッターシステム ✅
- [x] **components/layout/MobileFooter.tsx** - モバイル専用フッターコンポーネント
- [x] **FirstSidebarアイコン表示** - PC版と同じアイコンを画面下部に固定表示
- [x] **レスポンシブ対応** - モバイルのみ表示（768px以下）
- [x] **統一アイコンサイズ** - 全アイコンsize-5で統一
- [x] **ブランドアイコン配置** - 左端にbrandアイコン表示
- [x] **アクセシビリティ対応** - ホバー・アクティブ状態実装

#### モバイルフッター設定制御 ✅
- [x] **MobileFooterConfig型追加** - `hide`プロパティで表示制御
- [x] **LayoutConfig拡張** - `mobileFooter`プロパティ追加
- [x] **バリアント別デフォルト** - minimal以外は表示、minimalは非表示
- [x] **オーバーライド対応** - ページごとのカスタマイズ可能

#### モバイルSheetシステム改革 ✅
- [x] **MobileSidebarSheet分離** - 専用コンポーネント作成
- [x] **SecondSidebar表示** - モバイル時はSecondSidebarの内容を表示
- [x] **固定幅設計** - 18rem（288px）固定で統一
- [x] **独立制御** - PC版サイドバーとモバイルSheetの独立動作

#### SecondSidebarコンテンツ管理システム ✅
- [x] **components/sidebar-content/ディレクトリ** - コンテンツ専用ディレクトリ作成
- [x] **AdminSidebarContent実装** - 管理者用ダッシュボードコンテンツ
  - システム状態（サーバー・DB・API）
  - ユーザー統計（総数・アクティブ・新規）
  - データベース情報（容量・接続数）
  - クイックアクション（レポート・ユーザー管理・設定）
  - 最近のアクティビティ履歴
- [x] **lib/sidebar-content-registry.tsx** - コンテンツ一元管理システム
- [x] **型安全なコンテンツ管理** - SidebarContentKey型による厳密な制御
- [x] **lib/layout-config.ts統合** - `getSidebarContent("admin")`で自動配置

### コード品質向上 - 完了 ✅

#### ESLint・TypeScript エラー解決 ✅
- [x] **未使用インポート削除** - 不要なimportの完全削除
- [x] **型安全性向上** - `any`型を適切な型に変更
- [x] **ビルド成功確認** - npm run build 完全成功

#### アーキテクチャ品質向上 ✅
- [x] **循環参照回避** - sidebar-content-registryによる依存関係整理
- [x] **コンポーネント分離** - 責任の明確な分離
- [x] **設定駆動設計** - 全ての見た目・動作を設定ファイルで制御

## 🎨 技術的成果

### 完全なモバイル対応アーキテクチャ
```
PC表示:
┌─────────────────────────────────┐
│        Header (設定制御)         │
├─────────────────────────────────┤
│FirstSidebar│ Main │SecondSidebar│
│(ナビ+ブランド)│(コンテンツ)│(ツール)│
└─────────────────────────────────┘

モバイル表示:
┌─────────────────────────────────┐
│        Header (トグル付き)        │
├─────────────────────────────────┤
│                                │
│        Main Content            │
│                                │
├─────────────────────────────────┤
│     MobileFooter (固定)         │
│  [Brand][Nav1][Nav2][Nav3]     │
└─────────────────────────────────┘

モバイルSheet (トグル時):
Sheet (18rem幅)
┌─────────────────┐
│ SecondSidebar   │
│   Content       │
│ (AdminDashboard)│
│                 │
│                 │
└─────────────────┘
```

### 設定駆動システムの特徴
- ✅ **バリアントベースレイアウト**: レイアウトタイプの簡単な切り替え
- ✅ **オーバーライドシステム**: ページごとの細かなカスタマイズ
- ✅ **型安全性**: 適切なインターフェースによる完全なTypeScriptサポート
- ✅ **コンポーネント分離**: 関心の明確な分離
- ✅ **保守性**: 中央集権的な設定とモジュラーコンポーネント
- ✅ **視覚的差別化**: バリアントごとのブランドアイコンと色分け
- ✅ **柔軟なレイアウト**: サイドバー幅の動的調整
- ✅ **完全なテーマサポート**: ダーク・ライトモード + カスタムカラー対応
- ✅ **細かな制御**: Header要素の個別表示・非表示制御
- ✅ **完全なモバイル対応**: フッター + Sheet + レスポンシブ設計
- ✅ **コンテンツ管理**: SecondSidebarコンテンツの一元管理システム

### 技術スタック
- **UIフレームワーク**: shadcn/ui + Radix UI
- **スタイリング**: TailwindCSS v4
- **テーマシステム**: next-themes + CSS変数
- **レスポンシブ**: Mobile-first approach + use-mobile hook
- **アクセシビリティ**: ARIA対応、キーボードナビゲーション

## 📝 開発メモ

### 参考情報
- CLAUDE.md: Next.js App Router、shadcn/ui優先使用
- 既存テーマ: next-themes + CSS変数ベース
- フォント: Geist Sans, Geist Mono設定済み
- モバイル判定: 768px基準（use-mobile.ts）

### モバイル対応の設計原則
- **固定幅統一**: モバイルSheet・フッターは18rem固定
- **コンテンツ分離**: PC=FirstSidebar+SecondSidebar、モバイル=Footer+Sheet
- **設定連動**: PC版の設定がモバイル版にも反映
- **独立制御**: モバイル要素の個別表示・非表示制御

## 📚 作成・更新されたドキュメント

### ガイドドキュメント
- **docs/GUIDES/BASE-LAYOUT-GUIDE.md** - BaseLayoutシステムの完全ガイド（最新版）
  - 推奨使用方法（layout.tsxベース）
  - 5つのバリアント仕様（default, admin, user-profile, public, minimal）
  - モバイル対応（フッター・Sheet）
  - SecondSidebarコンテンツ管理方法
  - ブランドアイコンカスタマイズ方法
  - サイドバー幅設定方法
  - Header要素の表示制御方法
  - 実装例とディレクトリ構成

### アーキテクチャ特徴
- **設定駆動**: すべての見た目・動作を設定ファイルで制御
- **型安全**: TypeScriptによる完全な型チェック
- **柔軟性**: バリアント + オーバーライドの組み合わせ
- **保守性**: コンポーネント分離と中央集権的設定
- **拡張性**: 新しいバリアントやカスタマイズの容易な追加
- **モバイルファースト**: 完全なレスポンシブ対応

## 🎯 次期開発候補

### すぐに実装可能
- [x] Second Sidebarの具体的コンテンツ実装
- [ ] ユーザー個別カラーテーマ（CSS変数動的変更方式）
- [ ] 追加レイアウトバリアントの作成
- [ ] 他のバリアント用SecondSidebarコンテンツ追加

### 中長期的な改善
- [x] モバイル対応の強化
- [ ] アニメーション・トランジションシステム
- [ ] パフォーマンス最適化（Dynamic imports等）
- [ ] ユーザーの使用状況に基づくUI改善

---
*最終更新: 2025-01-11 - モバイル対応強化 + SecondSidebarコンテンツシステム完全実装*