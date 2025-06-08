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
