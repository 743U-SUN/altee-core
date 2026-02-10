# altee-core 開発フェーズ計画

**作成日**: 2026-01-02  
**ステータス**: ドラフト

---

## 📋 開発アプローチ

**C案: モックアップ先行 + プレースホルダー同時進行**

```
プレースホルダーページ作成（ダミーデータ付きモックアップ）
        ↓
サイドバー・モバイルメニュー改修
        ↓
詳細設計 → スキーマ設計 → 実装
```

### 開発プロセス（Phase 1.5 以降）

> [!IMPORTANT]
> Phase 1.5 以降は以下の **4ステップ** で進行：
> 1. **Gemini実装** - コード作成
> 2. **Claudeレビュー** - コードレビュー・問題点指摘
> 3. **Gemini修正** - 指摘事項の修正
> 4. **Claude承認** - 最終確認・マージ承認

### Git管理ルール

> [!WARNING]
> **作業開始前**
> - 最新の `main` ブランチから作業ブランチを作成
> - ブランチ名: `feature/phase-X-機能名` 形式
>
> **作業終了後**
> - 変更をコミット（意味のある単位で分割）
> - AIレビュー完了後、`main` ブランチにマージ

### コンポーネント配置ガイドライン

| 種類 | 配置場所 | 例 |
|-----|---------|-----|
| **shadcn/ui** | `components/ui/` | `button.tsx`, `card.tsx`, `dialog.tsx` |
| **グローバル共通** | `components/` | `layout/`, `navigation/`, `sortable-list/` |
| **ページ固有** | `app/[ページ]/components/` | `app/admin/articles/components/` |

**既存のページ固有コンポーネント例:**
- `app/[handle]/items/components/`
- `app/admin/articles/components/`
- `app/dashboard/items/components/`
- `app/dashboard/links/components/`

> [!TIP]
> - 2箇所以上で使うコンポーネント → `components/` に配置
> - 1箇所でしか使わないコンポーネント → そのページの `components/` に配置

### レイアウト設定ガイドライン

`lib/layout-config.ts` で定義されている6つのvariant:

| Variant | 用途 | 使用ページ |
|---------|------|-----------|
| `default` | 一般ページ | `/`, `/u`, `/g`, `/posts`, `/articles`, `/items/*`, `/lib/*`, `/pc-builder` |
| `admin` | 管理者ページ | `/admin/*` |
| `user-profile` | VTuberプロフィール | `/@[handle]/*` |
| `public` | 認証ページ等 | `/auth/*` |
| `minimal` | 最小限UI | 特殊ページ |
| `dashboard` | ダッシュボード | `/dashboard/*` |

**新規ページ作成時:**
- グループ個別ページ `/g/[handle]` → `default` または新規variant検討
- グループ管理 `/g/[handle]/manage/*` → `dashboard` を流用?

---

## 🎯 Phase 一覧

| Phase | 名称 | 目的 | 期間目安 |
|-------|------|------|---------|
| **1** | 基盤整備 | プレースホルダーページ作成、サイドバー改修 | 1-2週間 |
| **2** | グループ機能 | グループ作成・管理・メンバー機能 | 2-3週間 |
| **3** | お知らせ機能 | UserPost/GroupPost、統合一覧ページ | 1-2週間 |
| **4** | アイテムカタログ強化 | お気に入り機能、カテゴリ整理 | 1-2週間 |
| **5** | PCビルダー | 構成作成・共有URL機能 | 2-3週間 |
| **6** | ライブラリ | リンク集、フォント、オーディション | 1-2週間 |
| **7** | 仕上げ | セキュリティ、パフォーマンス、利用規約 | 1-2週間 |

---

## Phase 1: 基盤整備

### 目的
- 新規ルートのプレースホルダーページを作成
- ダミーデータでUIの見た目を確認
- サイドバー・モバイルメニューを改修

### TODO

#### 1.1 プレースホルダーページ作成
- [x] `/u` - VTuber一覧（ダミーデータでグリッド表示）
- [x] `/g` - グループ一覧（ダミーデータ）
- [x] `/posts` - お知らせ統合ページ（ダミーデータ）
- [x] `/articles` - 記事一覧（ダミーデータ）
- [x] `/items` - アイテムカタログトップ
- [ ] `/items/pc-parts` - PCパーツカテゴリ
- [ ] `/items/devices` - デバイスカテゴリ
- [ ] `/items/food` - 食品カテゴリ
- [ ] `/pc-builder` - PCビルダー（準備中表示）
- [ ] `/lib` - ライブラリトップ
- [ ] `/lib/links` - リンク集（準備中）
- [ ] `/lib/fonts` - フォント（準備中）
- [ ] `/lib/auditions` - オーディション（準備中）

#### 1.2 ユーザーページ拡張
- [ ] `/@[handle]/posts` - ユーザーお知らせ（準備中）
- [ ] `/@[handle]/items/pc` - PC環境紹介（準備中）

#### 1.3 グループページ（準備中表示）
- [ ] `/g/[handle]` - グループ個別ページ
- [ ] `/g/[handle]/members` - メンバー一覧
- [ ] `/g/[handle]/posts` - グループお知らせ
- [ ] `/g/[handle]/manage/*` - 管理ページ群（アクセス制御付き）

#### 1.4 ダッシュボード拡張
- [ ] `/dashboard/posts` - お知らせ管理（準備中）
- [ ] `/dashboard/account` - アカウント設定（準備中）
- [ ] `/dashboard/profile` にOGP設定タブ追加

#### 1.5 サイドバー・メニュー改修
- [ ] sidebar-mobile-menu-renovation.md に基づいて実装
- [ ] メニュー切り替え機能
- [ ] 新規ルートへのリンク追加

---

## Phase 2: グループ機能

### 目的
- グループ作成・管理機能の実装
- メンバー管理（招待・削除）

### TODO

#### 2.1 データベース
- [ ] Groupモデル追加
- [ ] GroupMemberモデル追加
- [ ] マイグレーション実行

#### 2.2 グループ作成
- [ ] ダッシュボードからグループ作成フロー
- [ ] ハンドル重複チェック
- [ ] 1ユーザー1グループ制限（将来的に複数所有可能にするかも）

#### 2.3 グループ管理
- [ ] `/g/[handle]/manage/profile` - プロフィール編集
- [ ] `/g/[handle]/manage/members` - メンバー管理
- [ ] `/g/[handle]/manage/settings` - 設定
- [ ] `/g/[handle]/manage/transfer` - オーナー移譲

#### 2.4 グループ公開ページ
- [ ] `/g/[handle]` - グループトップ
- [ ] `/g/[handle]/members` - メンバー一覧
- [ ] メンバーの `/@[handle]` へのリンク

#### 2.5 アクセス制御
- [ ] manage/* はオーナーのみアクセス可
- [ ] ミドルウェアまたはレイアウトで制御

---

## Phase 3: お知らせ機能

### 目的
- ユーザー・グループがお知らせを投稿可能に
- 統合一覧ページの実装

### TODO

#### 3.1 データベース
- [ ] UserPostモデル追加
- [ ] GroupPostモデル追加
- [ ] マイグレーション実行

#### 3.2 ユーザーお知らせ
- [ ] `/dashboard/posts` - 作成・編集・削除
- [ ] 3件制限の実装
- [ ] `/@[handle]/posts` - 公開表示

#### 3.3 グループお知らせ
- [ ] `/g/[handle]/manage/posts` - 作成・編集・削除
- [ ] 3件制限の実装
- [ ] `/g/[handle]/posts` - 公開表示

#### 3.4 統合一覧ページ
- [ ] `/posts` - 全お知らせ表示
- [ ] Articles（noticeカテゴリ）も表示
- [ ] フィルタ機能（サイト/ユーザー/グループ）

---

## Phase 4: アイテムカタログ強化

### 目的
- お気に入り機能の実装
- カテゴリ構造の整理

### TODO

#### 4.1 お気に入り機能
- [ ] FavoriteItemモデル追加（ログインユーザー用）
- [ ] LocalStorage保存（ビジター用、180日期限）
- [ ] `/items/favorites` - お気に入り一覧ページ

#### 4.2 カテゴリ整理
- [ ] `/items/pc-parts/*` - 各PCパーツカテゴリ
- [ ] `/items/devices/*` - 各デバイスカテゴリ
- [ ] `/items/food` - 食品カテゴリ

#### 4.3 ユーザー紐づけアイテム
- [ ] `/dashboard/items/pc` - PC環境設定改善
- [ ] `/dashboard/items/devices` - デバイス設定改善
- [ ] `/@[handle]/items/*` - 公開表示

---

## Phase 5: PCビルダー

### 目的
- 自作PC構成ツールの実装
- 共有URL機能

### TODO

#### 5.1 データベース
- [ ] PcBuildモデル追加
- [ ] 期限切れデータ削除のCronジョブ

#### 5.2 PCビルダーUI
- [ ] `/pc-builder` - メイン画面
- [ ] パーツ選択UI
- [ ] 価格計算
- [ ] 互換性チェック（基本的なもの）

#### 5.3 共有機能
- [ ] 共有URL生成（nanoid使用）
- [ ] `/pc-builder/share/[id]` - 共有構成表示
- [ ] 2-3ヶ月で期限切れ

---

## Phase 6: ライブラリ

### 目的
- リンク集、フォント、オーディション情報の管理

### TODO

#### 6.1 データベース
- [ ] LibLink, LibFont, LibAuditionモデル追加

#### 6.2 管理画面
- [ ] `/admin/lib/links` - リンク管理
- [ ] `/admin/lib/fonts` - フォント管理
- [ ] `/admin/lib/auditions` - オーディション管理

#### 6.3 公開ページ
- [ ] `/lib/links` - リンク集表示
- [ ] `/lib/fonts` - フォント一覧
- [ ] `/lib/auditions` - オーディション情報

---

## Phase 7: 仕上げ

### 目的
- セキュリティ強化
- パフォーマンス最適化
- 公開前準備

### TODO

#### 7.1 セキュリティ
- [ ] LoginHistoryモデル追加（IP記録）
- [ ] ログイン時・投稿時のIP記録実装
- [ ] 論理削除の検討・実装

#### 7.2 利用規約・プライバシーポリシー
- [ ] 利用規約ページ作成
- [ ] プライバシーポリシーページ作成

#### 7.3 パフォーマンス
- [ ] 画像最適化確認
- [ ] キャッシュ戦略確認
- [ ] Lighthouse スコア確認

#### 7.4 エラーページ
- [ ] 404ページデザイン
- [ ] 500ページデザイン
- [ ] 「準備中」ページの統一デザイン

---

## 📚 関連ドキュメント

- [route-plan.md](./route-plan.md) - ルート設計
- [database-plan.md](./database-plan.md) - データベース設計案
- [sidebar-mobile-menu-renovation.md](./sidebar-mobile-menu-renovation.md) - サイドバー改修計画

---

## 📝 備考

- Phase順は目安であり、優先度に応じて入れ替え可能
- 各Phaseでモックアップ → スキーマ確定 → 実装の流れ
- 週次で進捗確認・優先度見直し推奨
