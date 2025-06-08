# Docker環境構築からさくらVPSデプロイまでの作業チェックリスト

## 🎯 本日の目標
Next.jsアプリケーションのDocker環境を構築し、さくらVPSへデプロイ可能な状態にする

## 📋 作業チェックリスト

### 1. Docker環境の基本構築

#### 1.1 Dockerfile作成
- [x] マルチステージビルドを使用したDockerfile作成
  - [x] 依存関係インストールステージ
  - [x] ビルドステージ
  - [x] 実行ステージ（軽量化）
- [x] Node.js 22 (LTS) ベースイメージ使用
- [x] セキュリティ考慮（non-rootユーザー実行）

#### 1.2 compose.yaml作成（2024年最新仕様）
- [x] 開発環境用設定（compose.dev.yaml）
  - [x] ホットリロード対応
  - [x] ボリュームマウント設定
  - [x] ポート設定（3000）
- [x] 本番環境用設定（compose.prod.yaml）
  - [x] 最適化されたビルド設定
  - [x] 環境変数設定
  - [x] ヘルスチェック設定

#### 1.3 .dockerignore作成
- [x] node_modules除外
- [x] .next除外
- [x] .git除外
- [x] その他不要ファイル除外

### 2. 環境変数管理

#### 2.1 環境変数ファイル作成
- [x] .env.example作成（テンプレート）→ 削除済み
- [x] .env.local（開発環境用）
- [x] .env.production（本番環境用）

#### 2.2 環境変数の定義
- [x] NODE_ENV
- [x] NEXT_PUBLIC_APP_URL
- [x] データベース接続情報（将来用）
- [x] その他必要な環境変数

### 3. ローカル動作確認

#### 3.1 Dockerビルド
- [x] 開発環境でのビルド確認（932MB）
  ```bash
  docker compose -f compose.dev.yaml build
  ```
- [x] 本番環境でのビルド確認（224MB - 軽量化成功）
  ```bash
  docker compose -f compose.prod.yaml build
  ```

#### 3.2 動作テスト
- [x] コンテナ起動確認
- [x] アプリケーションアクセス確認（http://localhost:3001）
- [x] ホットリロード動作確認（開発環境）
- [x] ログ出力確認（HTTP 200 OK確認済み）

### 4. さくらVPSデプロイ準備

#### 4.1 デプロイスクリプト作成
- [x] deploy.sh作成
  - [x] SSHアクセス設定
  - [x] Dockerイメージビルド
  - [x] コンテナ停止・起動
  - [x] ヘルスチェック

#### 4.2 GitHub Actions設定（オプション）
- [x] .github/workflows/deploy.yml作成
- [x] 自動デプロイ設定
- [x] シークレット設定

### 5. さくらVPSセットアップ

#### 5.1 VPS初期設定（必要な場合）
- [x] Docker/Docker Compose インストール
- [x] ファイアウォール設定（パケットフィルター）
- [x] Nginx設定（リバースプロキシ）
- [x] SSL証明書設定（Let's Encrypt）

#### 5.2 アプリケーションデプロイ
- [x] リポジトリクローン
- [x] 環境変数設定
- [x] Dockerイメージビルド
- [x] コンテナ起動
- [x] 動作確認

### 6. 運用準備

#### 6.1 監視・ログ設定
- [x] ログローテーション設定
- [x] ヘルスチェックエンドポイント作成
- [x] エラー通知設定

#### 6.2 バックアップ設定
- [ ] データバックアップスクリプト
- [ ] 定期バックアップ設定

## 🚀 推奨実行順序

1. **Phase 1: ローカルDocker環境構築**（1〜3）
   - 開発環境で動作確認を完了させる
   - 問題があれば修正

2. **Phase 2: デプロイ準備**（4）
   - スクリプト作成とテスト

3. **Phase 3: VPSデプロイ**（5〜6）
   - 本番環境へのデプロイと運用準備

## 📝 注意事項

- 各ステップで動作確認を行う
- エラーが発生した場合は原因を特定してから次に進む
- セキュリティを考慮した設定を心がける
- ドキュメント化を忘れない

## 🔧 トラブルシューティング用コマンド

```bash
# Dockerログ確認
docker-compose logs -f

# コンテナ状態確認
docker ps -a

# コンテナ内部確認
docker-compose exec app sh

# イメージ削除（クリーンビルド用）
docker-compose down --rmi all
```

## 📚 参考リンク

- [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [さくらVPS ドキュメント](https://manual.sakura.ad.jp/vps/)