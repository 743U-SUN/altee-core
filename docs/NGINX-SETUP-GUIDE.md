# Nginx + SSL設定ガイド

## 🎯 概要
Next.jsアプリケーションにNginxリバースプロキシとLet's Encrypt SSL証明書を設定する手順です。

## 📋 前提条件
- さくらVPSにNext.jsアプリケーションがデプロイ済み
- 独自ドメインのDNS設定完了（A レコード設定）
- パケットフィルターでポート80/443を許可

## 🚀 設定手順

### 1. Nginx設定ファイル作成

```bash
# ディレクトリ作成
mkdir nginx

# 設定ファイル作成
nginx/nginx.conf          # メイン設定
nginx/default.conf        # サイト別設定
compose.nginx.yaml        # Nginx + App + Certbot
```

### 2. パケットフィルター設定
さくらVPSコントロールパネルで以下を追加：
- ポート80（HTTP）
- ポート443（HTTPS）

### 3. HTTP設定でデプロイ
```bash
# nginx/default.confはHTTP専用設定で作成
./deploy.sh --deploy

# VPS上でコンテナ切り替え
ssh ubuntu@153.127.17.221
docker compose -f compose.prod.yaml down
docker compose -f compose.nginx.yaml up -d
```

### 4. SSL証明書取得
```bash
# VPS上で実行
sudo docker compose -f compose.nginx.yaml --profile ssl-setup run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  -d altee.me -d www.altee.me \
  --email your-email@example.com --agree-tos --no-eff-email
```

### 5. HTTPS設定に更新
```bash
# ローカルでnginx/default.confをHTTPS対応に更新
./deploy.sh --deploy

# VPS上でNginx再起動
docker compose -f compose.nginx.yaml restart nginx
```

## 📂 作成されるファイル構成

```
altee-core/
├── nginx/
│   ├── nginx.conf           # Nginxメイン設定
│   └── default.conf         # サイト設定（リバースプロキシ + SSL）
├── compose.nginx.yaml       # Nginx付きDocker Compose
├── .env.production          # 本番環境変数（HTTPS URL）
└── docs/NGINX-SETUP-GUIDE.md
```

## 🔄 SSL証明書更新（重要）

**証明書期限：2025年9月6日**

### 自動更新設定
```bash
# VPS上でcronジョブ設定
sudo crontab -e

# 以下を追加（毎月1日午前3時に更新チェック）
0 3 1 * * cd /home/ubuntu/altee-core && docker compose -f compose.nginx.yaml --profile ssl-setup run --rm certbot renew && docker compose -f compose.nginx.yaml restart nginx
```

### 手動更新（期限切れ対応）
```bash
# VPS上で実行
cd /home/ubuntu/altee-core

# 証明書更新
sudo docker compose -f compose.nginx.yaml --profile ssl-setup run --rm certbot renew

# Nginx再起動
docker compose -f compose.nginx.yaml restart nginx

# 確認
curl -I https://altee.me
```

## 🛠️ トラブルシューティング

### アクセスできない場合
```bash
# パケットフィルター確認
# コンテナ状況確認
docker compose -f compose.nginx.yaml ps

# Nginxログ確認
docker compose -f compose.nginx.yaml logs nginx
```

### SSL証明書エラー
```bash
# 証明書状況確認
sudo docker compose -f compose.nginx.yaml --profile ssl-setup run --rm certbot certificates

# 強制更新
sudo docker compose -f compose.nginx.yaml --profile ssl-setup run --rm certbot renew --force-renewal
```

## 📊 設定結果

- **HTTP**: http://altee.me → https://altee.me（自動リダイレクト）
- **HTTPS**: https://altee.me（SSL証明書付き）
- **セキュリティ**: セキュリティヘッダー設定済み
- **パフォーマンス**: 静的ファイルキャッシュ設定済み

## 🔒 セキュリティ考慮事項

- SSL証明書自動更新設定
- セキュリティヘッダー（HSTS、CSP等）
- Let's Encrypt認証用パス除外設定
- プロキシヘッダー適切設定