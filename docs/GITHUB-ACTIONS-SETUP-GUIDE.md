# GitHub Actions自動デプロイ設定ガイド

## 🎯 概要
mainブランチへのpushで自動的にさくらVPSへデプロイする設定です。

## 📋 前提条件
- さくらVPSにSSH接続可能
- VPS上にGitリポジトリがクローン済み
- Docker環境構築済み

## 🚀 設定手順

### 1. SSH鍵作成（パスフレーズなし）
```bash
# ローカルで実行
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_github_actions -N ""
ssh-copy-id -i ~/.ssh/id_ed25519_github_actions.pub ubuntu@153.127.17.221
```

### 2. GitHub Secrets設定
リポジトリのSettings > Secrets and variables > Actionsで以下を作成：

| Name | Value |
|------|-------|
| SSH_PRIVATE_KEY | 秘密鍵の内容（`cat ~/.ssh/id_ed25519_github_actions`） |
| VPS_HOST | 153.127.17.221 |
| VPS_USER | ubuntu |

### 3. ワークフロー作成
`.github/workflows/deploy.yml`を作成（内容は現在のファイル参照）

### 4. VPS上の準備
```bash
# VPS上で実行
cd /home/ubuntu/altee-core

# 環境変数ファイル作成
echo -e "NODE_ENV=production\nNEXT_PUBLIC_APP_URL=https://altee.me\nNEXT_TELEMETRY_DISABLED=1" > .env.production
```

## 🔧 トラブルシューティング

### SSH接続エラー
- パスフレーズ付き鍵は使用不可
- 新しい鍵ペアを作成して再設定

### ビルドキャッシュ問題
- ワークフローで`--no-cache --pull`を使用
- 手動でクリア：`docker system prune -a`

### Gitリポジトリエラー
```bash
# VPS上で再クローン
cd /home/ubuntu
rm -rf altee-core
git clone https://github.com/ユーザー名/altee-core.git
```

## 📊 動作確認
1. mainブランチにpush
2. ActionsタブでGreen checkmark確認
3. https://altee.me で変更確認

## 🔄 デプロイフロー
1. GitHub Actionsトリガー（mainブランチpush）
2. VPSへSSH接続
3. `git pull origin main`
4. Dockerコンテナ再ビルド・再起動
5. ヘルスチェック（https://altee.me）