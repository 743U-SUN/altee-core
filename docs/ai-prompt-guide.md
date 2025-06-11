# MinIO導入手順

## 概要
開発環境でさくらオブジェクトストレージを模擬するためのMinIO導入手順

## 導入手順チェックリスト

### 1. Docker Compose設定
- [ ] compose.dev.yamlにMinIOサービスを追加
- [ ] ポート9000(API)、9001(管理画面)を設定
- [ ] 永続化用のvolumeを設定

### 2. 環境変数設定
- [ ] .env.localにMinIO接続情報を追加
- [ ] 開発環境用の設定値を定義
- [ ] 本番環境との切り替え用設定を準備

### 3. AWS SDK設定
- [ ] @aws-sdk/client-s3パッケージの追加
- [ ] 統一ストレージクライアント作成(lib/storage.ts)
- [ ] MinIOとさくらストレージ両対応の設定

### 4. バケット初期化
- [x] 開発用バケットの自動作成機能（articles、images、temp等）
- [x] 初期化スクリプトまたはSeed機能
- [x] 必要なディレクトリ構造の作成（published/、drafts/等）

### 5. 基本操作機能実装
- [x] ファイルアップロード機能
- [x] ファイルダウンロード機能
- [x] ファイル削除機能
- [x] ファイル一覧取得機能

### 6. 記事管理システム統合
- [ ] Markdownファイルのアップロード
- [ ] 記事ファイルの取得・キャッシュ
- [ ] 記事メタデータの管理
- [ ] 記事の公開・非公開制御

### 7. 画像管理システム統合
- [x] 画像ファイルのアップロード
- [x] 画像の最適化・リサイズ
- [x] 画像URL生成機能
- [x] 画像の遅延読み込み対応

### 8. テスト・検証
- [x] アップロード/ダウンロードのテスト
- [x] エラーハンドリングの確認
- [ ] パフォーマンステスト
- [x] MinIO管理画面での動作確認

### 9. 本番移行準備
- [ ] さくらオブジェクトストレージ設定
- [ ] 環境変数の本番用設定
- [ ] データ移行手順の策定
- [ ] 切り替え手順の文書化

## 注意事項
- MinIOはS3互換APIなので、さくらストレージと同じコードで動作
- 開発環境のデータは永続化されるため、適切なクリーンアップが必要
- セキュリティ設定は開発用の簡易設定で問題なし

## アーキテクチャ設計
### ファイルアクセスパターン
#### ファイル操作（アップロード・削除）
- **Server Actions**を使用して環境差異を吸収
- **開発環境**: ブラウザ → Next.js Server Actions → MinIO
- **本番環境**: ブラウザ → Next.js Server Actions → さくらオブジェクトストレージ

#### ファイル配信（画像表示・ダウンロード）
- **API Route**を使用してプロキシ配信
- **開発環境**: ブラウザ → Next.js API Route → MinIO → 画像返却
- **本番環境**: ブラウザ → Next.js API Route → さくらオブジェクトストレージ → 画像返却
- さくらのサービス内通信は無制限のため、VPS経由を必須とする
- 外部からの直接アクセスは行わず、すべてVPS経由でアクセス


### 画像最適化戦略
#### 二段階最適化アプローチ
1. **アップロード時最適化**（Server Actions内）
   - リサイズ、WebP変換、品質調整
   - オブジェクトストレージの容量圧迫を防止
   - 最適化済み画像をオブジェクトストレージに保存

2. **表示時最適化**（Next.js Image）
   - `unoptimized={true}`で二重最適化を回避
   - 遅延読み込み（lazy loading）機能を活用
   - レスポンシブ対応（sizes、srcSet）を活用
   - priority設定でLCP最適化
   - placeholder機能でUX向上

#### 使用例
```jsx
<Image 
  src="/api/images/sample.png"
  alt="sample"
  width={800}
  height={600}
  unoptimized={true}
  placeholder="blur"
  priority={false} // 必要に応じてtrue
/>
```

## 作成ファイル一覧

### デモファイル
| ファイル | 場所 | 説明 |
|---------|------|------|
| page.tsx | app/demo/article/ | MinIOファイル操作のテスト用UI画面 |
| actions.ts | app/demo/article/ | Server Actions（アップロード、一覧取得、削除）のスケルトン |

### 設定ファイル
| ファイル | 場所 | 説明 |
|---------|------|------|
| compose.dev.yaml | / | MinIOサービス追加済み（ポート9000, 9001） |
| .env.local | / | MinIO接続設定追加済み |
| storage.ts | lib/ | 統一ストレージクライアント（MinIO/さくら両対応） |

#### app/demo/article/page.tsx
- MinIOへのファイルアップロードテスト用UI
- ファイル一覧取得テスト用UI
- 画像表示テスト用UI
- 基本的なフォームとボタンを配置

#### app/demo/article/actions.ts
- uploadFile: ファイルアップロード用Server Action（TODO）
- listFiles: ファイル一覧取得用Server Action（TODO）
- deleteFile: ファイル削除用Server Action（TODO）
- 現在はスケルトン実装、MinIO接続後に実装予定

#### lib/storage.ts
- S3互換クライアント（MinIO/さくらオブジェクトストレージ両対応）
- 環境変数から設定を自動読み込み
- STORAGE_BUCKET、STORAGE_ENDPOINTをexport
- 設定値の検証機能付き

## 導入済み項目
✅ compose.dev.yamlにMinIOサービス追加
✅ .env.localにMinIO接続情報追加  
✅ @aws-sdk/client-s3パッケージ追加
✅ 統一ストレージクライアント作成(lib/storage.ts)