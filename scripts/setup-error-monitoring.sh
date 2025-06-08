#!/bin/bash

# エラー監視の設定スクリプト

echo "=== Altee エラー監視設定 ==="
echo

# メールアドレスの設定
echo "通知先メールアドレスを入力してください:"
read -r EMAIL_ADDRESS

if [ -z "$EMAIL_ADDRESS" ]; then
    echo "エラー: メールアドレスが入力されていません"
    exit 1
fi

# error-monitor.shのメールアドレスを更新
sed -i "s/your-email@example.com/$EMAIL_ADDRESS/g" /home/ubuntu/altee-core/scripts/error-monitor.sh

# cronジョブの設定（5分ごとに実行）
CRON_JOB="*/5 * * * * /home/ubuntu/altee-core/scripts/error-monitor.sh"

# 既存のcronジョブを確認
if crontab -l 2>/dev/null | grep -q "error-monitor.sh"; then
    echo "既にcronジョブが設定されています"
else
    # cronジョブを追加
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "cronジョブを設定しました（5分ごとに実行）"
fi

# mailコマンドの確認
if ! command -v mail &> /dev/null; then
    echo
    echo "警告: mailコマンドが見つかりません"
    echo "メール送信にはmailutilsパッケージが必要です:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install -y mailutils"
    echo
    echo "または、外部SMTPサービス（SendGrid、AWS SES等）の設定が必要です"
fi

echo
echo "設定が完了しました！"
echo "テスト実行: ./scripts/error-monitor.sh"
echo "ログ確認: tail -f /var/log/altee-error-monitor.log"