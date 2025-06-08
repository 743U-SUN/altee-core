#!/bin/bash

# エラー監視スクリプト
# Dockerコンテナのログを監視し、エラーが発生したらメール通知

# 設定
CONTAINER_NAME="altee-core-app"
LOG_FILE="/var/log/altee-error-monitor.log"
LAST_CHECK_FILE="/var/tmp/altee-last-check"
EMAIL_TO="your-email@example.com"  # 通知先メールアドレスを設定してください
EMAIL_SUBJECT="[Altee] エラー検知通知"

# 最後のチェック時刻を取得（初回は1時間前）
if [ -f "$LAST_CHECK_FILE" ]; then
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
    LAST_CHECK=$(date -d '1 hour ago' '+%Y-%m-%dT%H:%M:%S')
fi

# 現在時刻を保存
CURRENT_TIME=$(date '+%Y-%m-%dT%H:%M:%S')
echo "$CURRENT_TIME" > "$LAST_CHECK_FILE"

# Dockerログからエラーを検出
ERRORS=$(docker logs "$CONTAINER_NAME" --since "$LAST_CHECK" 2>&1 | grep -iE "(error|exception|fatal|failed|crash)" | grep -v "Error: 0")

if [ -n "$ERRORS" ]; then
    # エラーが見つかった場合
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] エラーを検出しました" >> "$LOG_FILE"
    
    # メール本文を作成
    EMAIL_BODY="Alteeでエラーが検出されました。

発生時刻: $CURRENT_TIME
コンテナ: $CONTAINER_NAME

検出されたエラー:
---
$ERRORS
---

詳細はVPSのログを確認してください:
docker logs $CONTAINER_NAME --tail 100

ヘルスチェック: https://altee.me/api/health
"

    # メール送信（mailコマンドまたはsendmailを使用）
    echo "$EMAIL_BODY" | mail -s "$EMAIL_SUBJECT" "$EMAIL_TO"
    
    # ログに記録
    echo "$ERRORS" >> "$LOG_FILE"
    echo "---" >> "$LOG_FILE"
fi

# ヘルスチェックも実行
HEALTH_STATUS=$(curl -s https://altee.me/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH_STATUS" != "healthy" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ヘルスチェック失敗: $HEALTH_STATUS" >> "$LOG_FILE"
    
    # ヘルスチェック失敗もメール通知
    echo "Alteeのヘルスチェックが失敗しました。

状態: $HEALTH_STATUS
URL: https://altee.me/api/health

至急確認してください。" | mail -s "[Altee] ヘルスチェック失敗" "$EMAIL_TO"
fi