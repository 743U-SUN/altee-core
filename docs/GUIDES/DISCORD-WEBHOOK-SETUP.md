# Discord Webhook 通知設定

## Discord Webhook URLの取得方法

1. **Discordサーバーの設定を開く**
   - 通知を受け取りたいチャンネルを右クリック
   - 「チャンネルの編集」を選択

2. **連携サービス → ウェブフック**
   - 「ウェブフックを作成」をクリック
   - 名前を設定（例：Altee Monitor）
   - 「ウェブフックURLをコピー」

3. **スクリプトに設定**
   ```bash
   # VPSで実行
   cd /home/ubuntu/altee-core
   nano scripts/error-monitor-discord.sh
   ```
   
   `DISCORD_WEBHOOK_URL=""` の部分にURLを貼り付け

4. **cronジョブに設定**
   ```bash
   crontab -e
   ```
   
   以下を追加：
   ```
   */5 * * * * /home/ubuntu/altee-core/scripts/error-monitor-discord.sh
   ```

## テスト方法

```bash
# 手動実行
./scripts/error-monitor-discord.sh

# エラーを発生させてテスト
docker exec altee-core-app echo "[ERROR] Test error"
./scripts/error-monitor-discord.sh
```

## メリット
- 設定が簡単
- 確実に通知が届く
- スマホアプリでも通知
- 無料で利用可能