#!/bin/bash

# Discord Webhook を使ったエラー監視スクリプト

# 設定
CONTAINER_NAME="altee-core-app"
LOG_FILE="/var/log/altee-error-monitor.log"
LAST_CHECK_FILE="/var/tmp/altee-last-check"
DISCORD_WEBHOOK_URL=""  # ここにDiscord Webhook URLを設定

# Webhook URLが設定されているか確認
if [ -z "$DISCORD_WEBHOOK_URL" ]; then
    echo "エラー: DISCORD_WEBHOOK_URL が設定されていません"
    echo "scripts/error-monitor-discord.sh を編集してWebhook URLを設定してください"
    exit 1
fi

# Discord通知を送信する関数
send_discord_notification() {
    local message="$1"
    curl -H "Content-Type: application/json" \
         -X POST \
         -d "{\"content\": \"$message\"}" \
         "$DISCORD_WEBHOOK_URL"
}

# 最後のチェック時刻を取得
if [ -f "$LAST_CHECK_FILE" ]; then
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
    LAST_CHECK=$(date -d '1 hour ago' '+%Y-%m-%dT%H:%M:%S')
fi

# 現在時刻を保存
CURRENT_TIME=$(date '+%Y-%m-%dT%H:%M:%S')
echo "$CURRENT_TIME" > "$LAST_CHECK_FILE"

# Dockerログからエラーを検出
ERRORS=$(docker logs "$CONTAINER_NAME" --since "$LAST_CHECK" 2>&1 | grep -iE "(error|exception|fatal|failed|crash)" | grep -v "Error: 0" | head -5)

if [ -n "$ERRORS" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] エラーを検出しました" >> "$LOG_FILE"
    
    # Discord通知
    MESSAGE="🚨 **Altee エラー検知**
時刻: $CURRENT_TIME
コンテナ: $CONTAINER_NAME

\`\`\`
$ERRORS
\`\`\`

詳細: VPSにログインして確認してください"
    
    send_discord_notification "$MESSAGE"
    echo "$ERRORS" >> "$LOG_FILE"
fi

# ヘルスチェック
if ! curl -s -f https://altee.me/api/health > /dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ヘルスチェック失敗" >> "$LOG_FILE"
    
    MESSAGE="💔 **Altee ヘルスチェック失敗**
URL: https://altee.me/api/health
至急確認してください！"
    
    send_discord_notification "$MESSAGE"
fi