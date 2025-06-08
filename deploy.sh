#!/bin/bash

# =============================================================================
# altee-core さくらVPSデプロイスクリプト
# =============================================================================

set -e  # エラー時に停止

# 設定値（環境に合わせて変更してください）
VPS_HOST="${VPS_HOST:-153.127.17.221}"
VPS_USER="${VPS_USER:-ubuntu}"
VPS_PORT="${VPS_PORT:-22}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/$VPS_USER/altee-core}"
APP_PORT="${APP_PORT:-3000}"

# 色付きログ用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 使用方法を表示
show_usage() {
    cat << EOF
使用方法: $0 [オプション]

オプション:
  -h, --help          このヘルプを表示
  -c, --check         VPS接続確認のみ実行
  -i, --init          VPS初期セットアップ
  -d, --deploy        アプリケーションデプロイ実行
  --host HOST         VPSホスト名
  --user USER         SSHユーザー名
  --port PORT         SSHポート番号

環境変数:
  VPS_HOST           VPSホスト名
  VPS_USER           SSHユーザー名  
  VPS_PORT           SSHポート番号
  DEPLOY_PATH        デプロイ先パス
  APP_PORT           アプリケーションポート

例:
  $0 --check                    # 接続確認
  $0 --init                     # 初期セットアップ
  $0 --deploy                   # デプロイ実行
  $0 --host example.com --deploy   # ホスト指定してデプロイ
EOF
}

# VPS接続確認
check_vps_connection() {
    log_info "VPS接続確認中: $VPS_USER@$VPS_HOST:$VPS_PORT"
    
    if ssh -p "$VPS_PORT" -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'VPS接続成功'" &>/dev/null; then
        log_success "VPS接続確認完了"
        return 0
    else
        log_error "VPS接続失敗 - SSH設定を確認してください"
        return 1
    fi
}

# VPS初期セットアップ
init_vps() {
    log_info "VPS初期セットアップ開始"
    
    # Docker/Docker Composeのインストール確認
    log_info "Docker環境確認中..."
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << 'EOF'
        # Dockerインストール確認
        if ! command -v docker &> /dev/null; then
            echo "Dockerをインストール中..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        else
            echo "Docker既にインストール済み"
        fi
        
        # Docker Composeインストール確認  
        if ! command -v docker compose &> /dev/null; then
            echo "Docker Compose v2をインストール中..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        else
            echo "Docker Compose既にインストール済み"
        fi
        
        # Dockerサービス起動
        sudo systemctl enable docker
        sudo systemctl start docker
        
        echo "Docker環境セットアップ完了"
EOF
    
    log_success "VPS初期セットアップ完了"
}

# ローカルビルド確認
check_local_build() {
    log_info "ローカルビルド確認中..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Dockerがインストールされていません"
        return 1
    fi
    
    if [ ! -f "compose.prod.yaml" ]; then
        log_error "compose.prod.yamlが見つかりません"
        return 1
    fi
    
    log_success "ローカル環境確認完了"
}

# アプリケーションデプロイ
deploy_app() {
    log_info "アプリケーションデプロイ開始"
    
    # ローカル確認
    check_local_build
    
    # デプロイディレクトリ作成
    log_info "デプロイディレクトリ準備中..."
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "mkdir -p $DEPLOY_PATH"
    
    # ファイル転送（除外ファイルを指定）
    log_info "ファイル転送中..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude '.git' \
        --exclude '*.log' \
        --exclude '.env.local' \
        -e "ssh -p $VPS_PORT" \
        ./ "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/"
    
    # VPS上でビルド・起動
    log_info "VPS上でビルド・デプロイ実行中..."
    ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" << EOF
        cd $DEPLOY_PATH
        
        # 環境変数ファイルの確認
        if [ ! -f ".env.production" ]; then
            echo "NODE_ENV=production" > .env.production
            echo "NEXT_PUBLIC_APP_URL=http://$(curl -s ifconfig.me):$APP_PORT" >> .env.production
            echo "NEXT_TELEMETRY_DISABLED=1" >> .env.production
            echo ".env.production ファイルを作成しました。必要に応じて編集してください。"
        fi
        
        # 既存コンテナ停止・削除
        if docker compose -f compose.prod.yaml ps -q | grep -q .; then
            echo "既存コンテナを停止中..."
            docker compose -f compose.prod.yaml down
        fi
        
        # イメージビルド
        echo "Dockerイメージビルド中..."
        docker compose -f compose.prod.yaml build
        
        # コンテナ起動
        echo "コンテナ起動中..."
        docker compose -f compose.prod.yaml up -d
        
        # 起動確認
        sleep 10
        if docker compose -f compose.prod.yaml ps | grep -q "Up"; then
            echo "デプロイ成功！"
            docker compose -f compose.prod.yaml ps
        else
            echo "デプロイに失敗しました"
            docker compose -f compose.prod.yaml logs
            exit 1
        fi
EOF
    
    # デプロイ完了通知
    VPS_IP=$(ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "curl -s ifconfig.me")
    log_success "デプロイ完了！"
    log_info "アクセスURL: http://$VPS_IP:$APP_PORT"
}

# ヘルスチェック
health_check() {
    log_info "ヘルスチェック実行中..."
    
    VPS_IP=$(ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "curl -s ifconfig.me")
    
    if curl -f -s "http://$VPS_IP:$APP_PORT" > /dev/null; then
        log_success "アプリケーション正常稼働中"
        return 0
    else
        log_error "アプリケーションにアクセスできません"
        return 1
    fi
}

# メイン処理
main() {
    # パラメータ解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -c|--check)
                CHECK_ONLY=true
                shift
                ;;
            -i|--init)
                INIT_VPS=true
                shift
                ;;
            -d|--deploy)
                DEPLOY_APP=true
                shift
                ;;
            --host)
                VPS_HOST="$2"
                shift 2
                ;;
            --user)
                VPS_USER="$2"
                shift 2
                ;;
            --port)
                VPS_PORT="$2"
                shift 2
                ;;
            *)
                log_error "不明なオプション: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 設定確認
    if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ]; then
        log_error "VPS_HOST と VPS_USER の設定が必要です"
        show_usage
        exit 1
    fi
    
    log_info "=== altee-core VPSデプロイスクリプト ==="
    log_info "ターゲット: $VPS_USER@$VPS_HOST:$VPS_PORT"
    log_info "デプロイパス: $DEPLOY_PATH"
    
    # 接続確認
    if ! check_vps_connection; then
        exit 1
    fi
    
    # オプションに応じた処理
    if [ "$CHECK_ONLY" = true ]; then
        log_success "接続確認完了"
        exit 0
    fi
    
    if [ "$INIT_VPS" = true ]; then
        init_vps
        log_success "初期セットアップ完了"
    fi
    
    if [ "$DEPLOY_APP" = true ]; then
        deploy_app
        health_check
    fi
    
    # オプションが指定されない場合のデフォルト動作
    if [ "$INIT_VPS" != true ] && [ "$DEPLOY_APP" != true ] && [ "$CHECK_ONLY" != true ]; then
        log_info "オプションが指定されていません。--help でヘルプを確認してください"
        show_usage
        exit 1
    fi
}

# スクリプト実行
main "$@"