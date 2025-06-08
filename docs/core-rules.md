# Next.jsの原則

## 使用する主な技術
- Next.js: ^15
- React: ^19
- PostgreSQL: ^17.4
- PrismaORM: ^6.7
- TypeScript: ^5
- Docker

1. コア原則
  - App Router を標準採用
  - TypeScript 必須（ESLint／型エラーは常にゼロ）
  - 大原則としてサーバー処理は Server Actions で実装。API Routes は外部API使用など、本当に必要な場合のみ。
  - YAGNI (You Aren't Gonna Need It): 必要になるまで作らない
  - KISS (Keep It Simple, Stupid): シンプルさは複雑さに勝る

2. ディレクトリレイアウト

app/         ルーティング & ページ  
components/  汎用 UI（再利用可能・ロジックなし）  
lib/         ユーティリティ関数  
hooks/       カスタムフック  
types/       型定義  
constants/   定数  
config/      設定値・環境変数ラッパー  
services/    外部 API ラッパーやビジネスロジック  
demo/        フロントエンドから実行できる手動テストページ

  - 専用（機能固有）コンポーネント … 対応する page.tsx と同階層
  - 汎用（再利用可能）コンポーネント … components/ に配置

3. データハンドリング

  - 依存条件  実装方法
    - ユーザー操作に依存しない	server components + Server Actions
    - ユーザー操作に依存する	client components + Server Actions + useSWR

  - 更新は Server Actions、即時反映は useSWR.mutate で楽観的更新

4. 表示

  - UI は極力自作せず、必ず shadcn/ui のコンポーネントを利用
  - アイコンは lucide-react を統一使用

5. 状態管理(UI, データ状態)

  - URL状態は nuqs に統一
  - グローバル状態ライブラリは 使用しない（認証はNextAuth
  SessionProvider、その他必要時は React Context + useReducer などで最小構成）
  - データ状態は Server State で管理

6. パフォーマンス

  - use client / useEffect / useState は最小限、まず RSC
  - クライアント側は Suspense でフォールバック
  - 動的 import で遅延読み込み、画像は next/image、リンクは next/link
  - ルートベースのコード分割を徹底

7. フォームとバリデーション

  - 制御コンポーネント + react-hook-form
  - スキーマ検証は Zod
  - クライアント／サーバー両方で入力チェック

8. 品質・セキュリティ・テスト

8-1 エラーハンドリング
  - ガード節で 早期 return、成功パスは最後にまとめる

8-2 アクセシビリティ
  - セマンティック HTML + ARIA、キーボード操作サポート

8-3 認証・認可の3層アーキテクチャ
  - Middleware：ルートレベルの基本認証チェック（/user/* → 認証必須）
  - Layout：詳細な状態確認とリダイレクト（onboarding完了、アカウント有効性）
  - Page/Server Actions：最終権限チェックと最小権限の原則（操作固有の権限）
  - 実装：各層でガード節使用、認証済み前提で後続処理
  - 詳細な実装指針は docs/security-guide.md を参照

8-4 テスト
  - demo/ ディレクトリ に UI ベースのテストページを配置し、すべての Server Actions・クライアント関数を ブラウザ経由で手動検証 できるようにする

9. 画像管理
  - ファイルストレージはさくらインターネットのオブジェクトストレージ(S3互換)を使用（開発段階ではMinIO）
  - 画像最適化・セキュリティ・アップロード処理は統一化されたシステムを利用
  - 詳細な実装指針は docs/image-handling-guide.md および docs/image-upload-guide.md を参照

⸻

実装フロー
	1.	設計：コア原則とディレクトリ決定
	2.	データ：取得（useSWR）・更新（Server Actions＋mutate）ルール確立
	3.	UI / State：shadcn/ui と lucide-react を使い、URL 状態は nuqs
	4.	パフォーマンス：RSC・Suspense・dynamic import で最適化
	5.	フォーム & バリデーション：Zod × react-hook-form
	6.	品質管理：エラー処理 → アクセシビリティ → 専用 Server Actions → demo/ で手動テスト