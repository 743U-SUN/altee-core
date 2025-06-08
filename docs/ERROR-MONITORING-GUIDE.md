# エラー監視設定ガイド

## 概要
Dockerコンテナのログを監視し、エラー発生時にメール通知を行います。

## セットアップ手順

### 1. VPSでの初期設定
```bash
# VPSにSSH接続後
cd /home/ubuntu/altee-core

# メール送信用パッケージをインストール
sudo apt-get update
sudo apt-get install -y mailutils

# セットアップスクリプトを実行
./scripts/setup-error-monitoring.sh
```

### 2. メールアドレスの設定
セットアップスクリプト実行時に通知先メールアドレスを入力

### 3. 動作確認
```bash
# 手動でスクリプトを実行
./scripts/error-monitor.sh

# ログを確認
tail -f /var/log/altee-error-monitor.log
```

## 監視内容

### エラー検出
- Dockerログから以下のキーワードを検出:
  - error
  - exception
  - fatal
  - failed
  - crash

### ヘルスチェック
- 5分ごとに `/api/health` をチェック
- `status` が `healthy` 以外の場合に通知

## cronジョブ
```bash
# 設定確認
crontab -l

# 手動編集が必要な場合
crontab -e
```

## トラブルシューティング

### メールが届かない場合
1. スパムフォルダを確認
2. VPSのメール設定を確認:
   ```bash
   echo "テストメール" | mail -s "テスト" your-email@example.com
   ```

### 外部SMTPサービスの利用
より確実な配信のため、以下のサービスの利用を推奨:
- SendGrid
- AWS SES
- Mailgun

## 通知メールの例
```
件名: [Altee] エラー検知通知

Alteeでエラーが検出されました。

発生時刻: 2025-06-08T12:00:00
コンテナ: altee-core-app

検出されたエラー:
---
[ERROR] Database connection failed
---
```