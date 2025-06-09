# このプロジェクトで使用する様々なコマンドまとめ

## VPS

SSH:
  - エージェント起動: eval "$(ssh-agent -s)"
  - 鍵追加: ssh-add ~/.ssh/id_ed25519
  - 接続: ssh sakura-vps
  - 切断: exit

System操作:
  - 再起動: sudo reboot
  - 停止: sudo shutdown -h now
  - プロセス確認: ps aux | grep docker
  - リアルタイム監視: htop

Docker
  - サービス起動: docker compose -f compose.prod.yaml up -d
  - サービス停止: docker compose -f compose.prod.yaml down
  - サービス再起動: docker compose -f compose.prod.yaml restart
  - ログ確認: docker compose -f compose.prod.yaml logs -f
  - コンテナ状況確認: docker ps / docker ps -a
  - イメージ確認: docker images
  - 不要リソース削除: docker system prune -f

Git
  - 最新取得: git pull origin main
  - 状態確認: git status
  - ログ確認: git log --oneline -5

## ローカル

Docker:
  - 開発環境起動: docker compose -f compose.dev.yaml up -d
  - 開発環境停止: docker compose -f compose.dev.yaml down
  - 開発環境再起動: docker compose -f compose.dev.yaml restart
  - ログ確認: docker compose -f compose.dev.yaml logs -f
  - コンテナ状況確認: docker ps / docker ps -a
  - イメージ確認: docker images
  - 不要リソース削除: docker system prune -f

Git:
  - 最新取得: git pull origin main
  - 状態確認: git status
  - ログ確認: git log --oneline -5
  - ブランチ作成・切替: git checkout -b feature/new-feature
  - ブランチ一覧: git branch
  - 変更追加: git add .
  - コミット: git commit -m "コミットメッセージ"
  - プッシュ: git push origin branch-name

開発:
  - 開発環境起動: docker compose -f compose.dev.yaml up -d
  - 開発環境停止: docker compose -f compose.dev.yaml down
  - ビルド: docker compose -f compose.dev.yaml exec app npm run build
  - リント: docker compose -f compose.dev.yaml exec app npm run lint
  - 型チェック: docker compose -f compose.dev.yaml exec app npm run typecheck