# さくらVPS Next.js デプロイガイド

## 🎯 概要
Next.jsアプリケーションをさくらVPSにDockerでデプロイする完全ガイドです。

## 📋 前提条件
- さくらVPS契約済み
- ローカル環境にSSH鍵設定済み
- Docker/Docker Compose環境

## 🚀 デプロイ手順

### 1. 環境変数設定

`.env.deploy`ファイルを作成：
```bash
VPS_HOST=xxx.xxx.xxx.xxx  # コントロールパネルで確認したIPアドレス
VPS_USER=ubuntu           # VPSのユーザー名
VPS_PORT=22               # SSHポート
```

### 2. SSH接続確認

```bash
# SSH鍵にパスフレーズがある場合
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 接続テスト
./deploy.sh --check
```

### 3. VPS初期セットアップ

```bash
./deploy.sh --init
```

Docker/Docker Composeが自動インストールされます。

### 4. アプリケーションデプロイ

```bash
./deploy.sh --deploy
```

ファイル転送、ビルド、起動が自動実行されます。

### 5. パケットフィルタ設定

**重要：さくらVPSの外部アクセス許可設定**

1. [コントロールパネル](https://secure.sakura.ad.jp/vps/)にログイン
2. 対象サーバー選択
3. **「パケットフィルター設定」**をクリック
4. **「パケットフィルター設定を追加する」**
5. 設定値：
   - フィルタタイプ：**カスタム**
   - ポート番号：**3000**
   - プロトコル：**TCP**
6. 設定保存

**約1-2分で反映されます。**

### 6. 動作確認

ブラウザで以下にアクセス：
```
http://あなたのVPS_IP:3000
```

## 🛠️ 作成されるファイル構成

```
altee-core/
├── Dockerfile                # Node.js 22 Alpine、マルチステージビルド
├── compose.yaml              # デフォルト設定
├── compose.dev.yaml          # 開発環境（ホットリロード）
├── compose.prod.yaml         # 本番環境（軽量化）
├── .dockerignore             # 除外ファイル設定
├── .env.deploy               # VPS接続情報
├── .env.example              # 環境変数テンプレート
├── .env.production           # 本番環境変数
└── deploy.sh                 # デプロイスクリプト
```

## 🔧 トラブルシューティング

### SSH接続できない
```bash
# パスフレーズ付きSSH鍵の場合
ssh-add ~/.ssh/id_ed25519
```

### 外部アクセスできない
- **パケットフィルタ**でポート3000を許可
- または**パケットフィルタを無効化**

### コンテナが起動しない
```bash
# VPS上でログ確認
ssh VPS_USER@VPS_HOST
cd /home/VPS_USER/altee-core
docker compose -f compose.prod.yaml logs
```

## 📊 デプロイ結果

- **Dockerイメージサイズ**：224MB（本番用）
- **ビルド時間**：約2-3分
- **メモリ使用量**：約50MB

## 🔒 セキュリティ考慮事項

- SSH鍵認証使用
- non-rootユーザーでコンテナ実行
- パケットフィルタで必要最小限のポート開放
- 定期的なOSアップデート推奨

## 📚 コマンドリファレンス

```bash
# 接続確認
./deploy.sh --check

# 初期セットアップ
./deploy.sh --init

# デプロイ実行
./deploy.sh --deploy

# ヘルプ表示
./deploy.sh --help
```

## 🎉 完了

デプロイ成功後、Next.jsアプリケーションが以下でアクセス可能：
- **本番URL**: `http://VPS_IP:3000`
- **管理**: さくらVPSコントロールパネル
- **監視**: `docker compose logs -f`