# ConoHaオブジェクトストレージ導入手順

## 概要
開発・本番環境統一のConoHaオブジェクトストレージ導入手順。S3Proxy経由でS3互換APIを使用し、既存のコードベースを活用。

## 導入手順チェックリスト

### 1. ConoHaアカウント・コンテナ準備
- [x] ConoHaアカウント作成
- [x] オブジェクトストレージサービス契約（月額450円/100GB〜）
- [x] APIユーザー作成・認証情報取得
- [x] 必要なコンテナ作成（imagesコンテナ作成完了）

### 2. S3Proxy Docker設定
- [x] compose.dev.yamlにS3Proxyサービス追加
- [x] ConoHa認証情報の環境変数設定
- [x] S3Proxy経由でのアクセス確認

### 3. 環境変数設定
- [x] .env.localにConoHa接続情報追加
- [x] S3Proxy経由のエンドポイント設定
- [x] 本番環境用設定の準備

### 4. 既存コード調整
- [x] MinIO/さくらストレージ参照の削除・ConoHaに変更
- [x] コメント・UI文言の統一（8箇所更新完了）
- [x] Docker Compose設定の調整

### 5. 基本操作機能確認
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
- [x] アップロード/ダウンロードのテスト（画像アップロード成功確認）
- [x] エラーハンドリングの確認
- [ ] パフォーマンステスト
- [x] ConoHa API経由での動作確認（ファイル存在確認済み）

### 9. 本番環境設定
- [ ] 本番環境用S3Proxy設定
- [ ] 環境変数の本番用設定
- [ ] 運用手順の文書化

## 注意事項
- ConoHaオブジェクトストレージは従量課金なしの定額制
- 転送量・リクエスト数無制限のため、直接アクセスが可能
- S3Proxy経由でS3互換APIを使用し、既存コードを活用

## アーキテクチャ設計

### ファイルアクセスパターン

#### ファイル操作（アップロード・削除）
- **Server Actions**を使用してストレージ操作を統一
- **開発・本番共通**: ブラウザ → Next.js Server Actions → S3Proxy → ConoHaオブジェクトストレージ

#### ファイル配信（画像表示・ダウンロード）
- **直接アクセス**によるシンプルな配信
- **開発・本番共通**: ブラウザ → ConoHaオブジェクトストレージ → 画像返却（直接）
- 転送量・リクエスト数無制限のため、プロキシ配信不要
- CDN機能活用によるパフォーマンス向上

### 画像最適化戦略

#### 二段階最適化アプローチ
1. **アップロード時最適化**（Server Actions内）
   - リサイズ、WebP変換、品質調整
   - オブジェクトストレージの容量効率化
   - 最適化済み画像をConoHaに保存

2. **表示時最適化**（Next.js Image）
   - `unoptimized={true}`で二重最適化を回避
   - 遅延読み込み（lazy loading）機能を活用
   - レスポンシブ対応（sizes、srcSet）を活用
   - priority設定でLCP最適化
   - placeholder機能でUX向上

#### 使用例
```jsx
<Image 
  src="https://object-storage.tyo2.conoha.io/v1/container/images/sample.webp"
  alt="sample"
  width={800}
  height={600}
  unoptimized={true}
  placeholder="blur"
  priority={false} // 必要に応じてtrue
/>
```

## Docker Compose設定例

### S3Proxyサービス設定
```yaml
s3proxy:
  image: andrewgaul/s3proxy:latest
  container_name: altee-core-s3proxy
  ports:
    - "8081:8080"
  environment:
    - S3PROXY_AUTHORIZATION=aws-v2-or-v4
    - S3PROXY_IDENTITY=${CONOHA_ACCESS_KEY}
    - S3PROXY_CREDENTIAL=${CONOHA_SECRET_KEY}
    - JCLOUDS_PROVIDER=openstack-swift
    - JCLOUDS_ENDPOINT=https://identity.tyo1.conoha.io/v2.0
    - JCLOUDS_IDENTITY=${CONOHA_TENANT_NAME}:${CONOHA_API_USER}
    - JCLOUDS_CREDENTIAL=${CONOHA_API_PASSWORD}
    - JCLOUDS_REGIONS=tyo1
  restart: unless-stopped
  networks:
    - altee-network
```

## 環境変数設定例

### 開発・本番共通設定
```bash
# ConoHa認証情報
CONOHA_TENANT_NAME=your_tenant_name
CONOHA_API_USER=your_api_user
CONOHA_API_PASSWORD=your_api_password
CONOHA_ACCESS_KEY=your_access_key
CONOHA_SECRET_KEY=your_secret_key

# S3Proxy経由の設定
STORAGE_ENDPOINT=http://localhost:8081  # 開発環境
STORAGE_ACCESS_KEY=${CONOHA_ACCESS_KEY}
STORAGE_SECRET_KEY=${CONOHA_SECRET_KEY}
STORAGE_BUCKET=images  # ConoHaコンテナ名
STORAGE_REGION=tyo1
STORAGE_FORCE_PATH_STYLE=true
```

## 作成・変更ファイル一覧

### 設定ファイル
| ファイル | 場所 | 説明 |
|---------|------|------|
| compose.dev.yaml | / | S3Proxyサービス追加（MinIO削除） |
| .env.local | / | ConoHa接続設定 |
| storage.ts | lib/ | S3Proxy経由の設定調整 |

### デモファイル
| ファイル | 場所 | 説明 |
|---------|------|------|
| page.tsx | app/demo/article/ | ConoHaファイル操作のテスト用UI画面 |
| actions.ts | app/demo/article/ | Server Actions（アップロード、一覧取得、削除） |

### API関連（変更または削除）
| ファイル | 場所 | 説明 |
|---------|------|------|
| route.ts | app/api/files/[...path]/ | プロキシ配信削除または簡素化 |

## 導入済み項目
✅ @aws-sdk/client-s3パッケージ追加
✅ 統一ストレージクライアント作成(lib/storage.ts)
✅ 画像アップローダーコンポーネント実装
✅ Server Actions実装

## 移行時の利点
- **コスト予測可能**: 従量課金なしの定額制
- **開発・本番統一**: 環境差異によるトラブル削減
- **シンプルアーキテクチャ**: プロキシ配信不要
- **パフォーマンス向上**: 直接アクセスによる高速化
- **運用コスト削減**: MinIOメンテナンス不要