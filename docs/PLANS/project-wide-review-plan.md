# プロジェクト全体 Multi-Agent Review 計画

## Context

altee-core は ~570 の .ts/.tsx ファイルを持つ Next.js 16 アプリケーション。`/nextjs-multi-agent-review` スキルを使い、7つの専門エージェント（RSC Architecture, Loading Performance, Server Processing, Client Performance, Hydration & SSR, Security, Code Quality）を並列実行してコード品質を体系的にレビューする。

プロジェクト全体を一度にレビューすることは不可能なため、論理的なディレクトリ単位に分割し、優先度順に実行する。各セッションのレポートは `docs/REFACTOR/` に出力される。

## スキップ対象

| ディレクトリ | 理由 |
|---|---|
| `components/ui/` (47 files) | shadcn/ui 生成コード |
| `app/[handle]/` (17 files) | Phase 1-3 リファクタリング完了直後 |
| `app/demo/` (~35 files) | 手動テストページ、本番コードではない |
| `app/items/pc-parts/` | PC parts レビュー・リファクタリング完了直後 |

## レビュー実行チェックリスト

### Tier 1: セキュリティ重要層（Server Actions）

Server Actions はデータ変更の入口。認証・認可・入力検証の欠陥は即座にセキュリティインシデントに繋がる。

- [x] **Session 1** — `app/actions/admin/` + `app/actions/auth/`（10 files）
  - 対象: user-management.ts, link-type-actions.ts, managed-profile-actions.ts, cleanup-actions.ts, admin-stats.ts, auth-actions.ts 等
  - 重点: admin権限チェックの網羅性、特権昇格の防止、バルク操作の安全性
  - 依存: なし（最初に実施）

- [x] **Session 2** — `app/actions/user/`（7 files）
  - 対象: profile-actions.ts, section-actions.ts, theme-actions.ts, notification-actions.ts, character-actions.ts, gift-actions.ts 等
  - 重点: 他ユーザーのリソースを変更できないか（認可チェック）、プロフィール/セクションコンテンツのXSS、Zodスキーマの網羅性
  - 依存: Session 1（アクションパターンの基準確立後）

- [x] **Session 3** — `app/actions/content/` + `app/actions/social/`（11 files）
  - 対象: faq-actions.ts, article-actions.ts, item-actions.ts, pc-build-actions.ts, youtube-actions.ts, twitch-actions.ts, niconico-actions.ts 等
  - 重点: 外部APIトークンの安全な管理、動的クエリでのSQLインジェクション、コンテンツ系アクションのエラーハンドリング一貫性
  - 依存: Sessions 1-2

- [x] **Session 4** — `app/actions/media/` + `lib/image-uploader/`（9 files）
  - 対象: media-actions.ts, image-actions.ts, upload-actions.ts, svg-sanitizer.ts, image-validator.ts, upload-config.ts 等
  - 重点: SVG XSSサニタイズの完全性、ファイルタイプ検証バイパス、アップロードサイズ制限、R2パス操作
  - 依存: Sessions 1-3

- [x] **Session 5** — `auth.ts` + `middleware.ts` + `services/auth/` + `app/api/`（~8 files）
  - 対象: auth.ts, middleware.ts, services/auth/auth.ts, app/api/webhooks/*, app/api/health/*
  - 重点: Webhook署名検証（Twitch EventSub, YouTube PubSubHubbub）、middleware回避パス、セッション設定、CSRF保護
  - 依存: Sessions 1-4（認証層が保護する対象を理解した上で）

---

### Tier 2: 基盤コード（lib・services）

ここの問題は全消費者に波及する。早期発見が最も効果的。

- [x] **Session 6** — `lib/` ルートファイル（~18 files）
  - 対象: prisma.ts, user-data.ts, layout-config.ts, storage.ts, storage-init.ts, auth.ts, handle-utils.ts, lucide-icons.ts 等
  - 重点: layout-config.ts（437行 — 分解が必要な可能性大）、Prismaクライアント初期化パターン、ストレージユーティリティの安全性
  - 依存: Tier 1 完了後

- [x] **Session 7** — `lib/sections/` + `lib/queries/`（13 files）
  - 対象: registry.ts, section-types.ts, query helpers (faq, item, news, video)
  - 重点: セクションレジストリの完全性、N+1クエリ、インデックス不足、オーバーフェッチ
  - 依存: Session 6

- [x] **Session 8** — `lib/validations/` + `lib/pc-compatibility/`（~16 files）
  - 対象: Zodスキーマ群、PC互換性チェックルール
  - 重点: スキーマの許容範囲が広すぎないか、文字列長制限、必須フィールド漏れ、互換性ルールのロジック正確性
  - 依存: Sessions 1-4（どのアクションがどのスキーマを使うか把握後）

- [x] **Session 9** — `lib/themes/` + `services/`（~17 files）
  - 対象: テーマプリセット群、YouTube/Twitch/Niconico APIラッパー
  - 重点: APIキー露出リスク、外部API失敗時のエラーハンドリング、テーマプリセットのバンドルサイズ影響、tree-shaking
  - 依存: Session 6, Session 3

---

### Tier 3: 共通コンポーネント

パターンの問題は全ページに波及。一箇所の修正が多くのページに恩恵。

- [x] **Session 10** — `components/user-profile/` ルート + `header-edit/`（~17 files）
  - 対象: ProfileHeader.tsx, BannerImageModal.tsx, CharacterImageModal.tsx, NotificationEditModal.tsx, EditableSectionRenderer 等
  - 重点: プロフィルシェルのRSC境界、モーダル状態管理、Suspense配置
  - 依存: Session 7（セクションレジストリ）

- [x] **Session 11** — `components/user-profile/sections/`（レンダラー、26 files）
  - 対象: FAQSection, LinksSection, YouTubeLatestSection, ImageHeroSection, BarGraphSection 等（全セクションタイプ）
  - 重点: SCにできるのにCCになっているケース、next/image使用、YouTube/Twitchエンベッドの遅延読込、セクション間のパターン一貫性
  - 依存: Session 10

- [x] **Session 12** — `components/user-profile/sections/editors/`（23 files）
  - 対象: 全エディターモーダル（FAQEditModal, LinksEditModal, TimelineEditModal 等）+ useImageGridEditor フック
  - 重点: **最大の重複リスク領域**（6,000行のモーダルコード）。共通パターンの抽出可能性、クライアント側バリデーションとサーバーZodスキーマの整合性、dynamic import の必要性
  - 依存: Session 11, Session 2

- [x] **Session 13** — `components/layout/` + `components/sortable-list/` + `components/sidebar-content/` + `components/theme-provider/`（~22 files）
  - 対象: DashboardLayoutClient, Sidebar, SortableList, BackgroundSelector, ThemeProvider 等
  - 重点: レイアウトのRSC最大化、ドラッグ&ドロップのリレンダー性能、テーマ状態伝播、モバイル対応
  - 依存: Session 9（テーマ）

- [x] **Session 14** — `components/` 残り（profile, decorations, editor, image-uploader, notification, navigation, pwa, items, sections 等）（~20 files）
  - 対象: ProfileLayout, SectionRenderer, MarkdownEditor, ImageUploader, NotificationModal, YouTubeFacade, TwitchEmbed 等
  - 重点: マークダウンエディタのXSS、外部エンベッドの遅延読込パターン、小規模コンポーネント群の一貫性
  - 依存: Sessions 10-13

---

### Tier 4: ページレベル

末端ノード。問題は局所的だが、RSCアーキテクチャとローディングパターンの確認は重要。

- [x] **Session 15** — `app/dashboard/items/` + `app/dashboard/character/`（~23 files）
  - 対象: PCパーツ管理UI、キャラクター情報編集
  - 重点: PCパーツフォームモーダルの動的インポート、キャラクターデータ集約クエリ、ページレベルのSC/CC分割
  - 依存: Session 3, Session 8

- [x] **Session 16** — `app/dashboard/platforms/` + `app/dashboard/videos/` + `app/dashboard/news/`（~20 files）
  - 対象: プラットフォーム管理、動画管理、ユーザーニュース
  - 重点: タブベースレイアウトのデータフェッチ、外部APIデータの鮮度管理、プラットフォーム別コード分割
  - 依存: Session 3, Session 9

- [x] **Session 17** — `app/dashboard/` 残り（profile-editor, faqs, notifications, setup）（~15 files）
  - 対象: プロフィルエディタ、FAQ管理、通知設定、セットアップフロー
  - 重点: セットアップフロー回避の防止、プロフィルエディタのクライアント境界、FAQ最適化の検証
  - 依存: Session 2, Session 7, Session 10

- [x] **Session 18** — `app/admin/users/` + `app/admin/articles/`（25 files）
  - 対象: ユーザー管理（検索、フィルター、バルク操作、CSV出力）、記事CMS
  - 重点: ページレベルのadmin認可、CSVインジェクション、バルク操作の安全性、ページネーションクエリ効率
  - 依存: Session 1, Session 5

- [x] **Session 19** — `app/admin/media/`（16 files）
  - 対象: メディア管理（テーブル、フィルター、バルク削除、アップロード）
  - 重点: メディア削除認可、大規模テーブルのリレンダー性能、3つのカスタムフック分解品質
  - 依存: Session 4, Session 18

- [x] **Session 20** — `app/admin/items/` + `app/admin/item-categories/` + `app/admin/links/`（27 files）
  - 対象: アイテム管理、CSVインポート、カテゴリ管理、リンクタイプ管理
  - 重点: CSVインポートの入力検証（インジェクション、ファイルサイズ）、リンクタイプアイコンアップロード、フォームパターン一貫性
  - 依存: Session 1, Session 8

- [x] **Session 21** — `app/admin/attributes/` + `app/admin/managed-profiles/`（26 files）
  - 対象: 属性（カテゴリ＋タグ）CRUD、マネージドプロフィル管理
  - 重点: マネージドプロフィルのなりすまし防止策、属性ナビゲーションレイアウトのRSC構造、新機能のコード成熟度
  - 依存: Session 1

- [x] **Session 22** — `app/admin/section-backgrounds/` + `app/admin/blacklist/` + admin ルートページ（~17 files）
  - 対象: セクション背景プリセット、ブラックリスト管理、管理画面ルートページ
  - 重点: ブラックリスト回避可能性、背景ファイルアップロード検証、error/loading パターン一貫性
  - 依存: Session 1

---

### Tier 5: 型定義・スキーマ（キャップストーン）

- [x] **Session 23** — `types/` + `hooks/` + `constants/` + `prisma/schema.prisma`（~20 files）
  - 対象: 全型定義、カスタムフック、定数、データベーススキーマ
  - 重点: 型の正確性 vs 実行時データ、デッドタイプ、スキーマレベル制約（unique, cascade delete）、インデックス最適化
  - 依存: 全セッション完了後（クロスリファレンス可能）

---

## チェックポイント（修正実施タイミング）

| タイミング | 条件 | アクション |
|---|---|---|
| **Tier 1 完了後** | Sessions 1-5 完了 | セキュリティ指摘事項の優先修正。CRITICAL/HIGH を全件対応してから Tier 2 へ |
| **Tier 2 完了後** | Sessions 6-9 完了 | 基盤コードの問題修正。下流のコンポーネント・ページに波及するため先に対応 |
| **Tier 3 完了後** | Sessions 10-14 完了 | コンポーネントパターンの統一修正。特に editors/ の重複解消は大規模になる可能性 |
| **全完了後** | Session 23 完了 | 全体の傾向分析、再発防止のルール策定 |

## 実行ガイドライン

1. **1日2-3セッション**が現実的なペース。修正時間を含めて7-10日程度
2. **セッション横断パターン追跡**: 繰り返し出てくる指摘（例: "Zodバリデーション不足", "不要な 'use client'"）はリスト化し、バッチ修正の対象とする
3. **Session 12 は最重量**: editors/ は23ファイル・約6,000行。レポートが大量になる可能性があるため、修正時間を多めに確保
4. **各セッションの実行方法**: `/nextjs-multi-agent-review [対象ディレクトリ]` で実行

## 検証方法

各修正後:
1. `npm run build` — ビルドエラーゼロ確認
2. `npm run lint && npx tsc --noEmit` — Lint・型エラーゼロ確認
3. 該当する `app/demo/` ページでの手動動作確認
4. 修正が広範囲に及ぶ場合は Playwright E2E テスト実行
