# Prisma スキーマ更新・マイグレーション完全ガイド

このガイドでは、Prismaスキーマの変更から本番環境への安全なデプロイまでの手順を説明します。

## 📋 基本ワークフロー概要

1. **ローカル**: スキーマ編集 → マイグレーション作成 → テスト
2. **Git**: マイグレーションファイルをコミット・プッシュ
3. **本番**: コードプル → バックアップ → マイグレーション実行

---

## 🔧 ローカル開発での手順

### 1. Prismaスキーマを編集
```prisma
// prisma/schema.prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  price       Int
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("products")
}
```

### 2. マイグレーション作成
```bash
# 方法1: npm scriptを使用（対話式で名前入力）
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate

# 方法2: npxで名前を直接指定（推奨）
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npx prisma migrate dev --name add_product_table

# 方法3: Docker環境内で実行（環境変数設定済み）
docker compose -f compose.dev.yaml exec app npx prisma migrate dev --name add_product_table

# → prisma/migrations/20241209123456_add_product_table/ が作成される
```

**💡 コマンド短縮のコツ:**
```bash
# 環境変数を設定してコマンドを短縮
export DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public"
npm run db:migrate
npx prisma migrate dev --name add_product_table

# または.env.localファイルを使用してDocker経由がおすすめ
docker compose -f compose.dev.yaml exec app npx prisma migrate dev --name add_product_table
```

### 3. 生成されたファイル確認
- `prisma/migrations/20241209123456_add_product_table/migration.sql`
- マイグレーション履歴が正しく記録されていることを確認

### 4. Prisma Client再生成
```bash
npm run db:generate
```

### 5. ローカルテスト
- Prisma Studioで新テーブル確認: http://localhost:5555
- アプリケーションコードでの動作確認

---

## 📝 Git管理

### コミット対象ファイル
```bash
# 必ずコミットするファイル
prisma/schema.prisma                    # スキーマ定義
prisma/migrations/                      # マイグレーション履歴

# コミット例
git add prisma/
git commit -m "feat: Add Product table with price and description fields

- Add Product model to prisma/schema.prisma
- Create migration for products table
- Include id, name, price, description, timestamps"

git push origin main
```

---

## 🚀 本番環境デプロイ

### 1. VPSにSSH接続
```bash
ssh sakura-vps
cd /path/to/altee-core
```

### 2. 最新コードを取得
```bash
git pull origin main
```

### 3. 本番マイグレーション実行（推奨）
```bash
# 自動バックアップ付きマイグレーション
./scripts/migrate-production.sh
```

### 4. 手動実行の場合
```bash
# 手動バックアップ
./scripts/backup-database.sh "before-add-product-table"

# マイグレーション実行
docker compose -f compose.prod.yaml exec app npx prisma migrate deploy

# 動作確認
docker compose -f compose.prod.yaml exec app npx prisma studio
```

---

## ⚠️ 重要な注意事項

### やってはいけないこと
- ❌ **本番で `db:push`**: マイグレーション履歴が残らない
- ❌ **マイグレーションファイルの手動編集**: 一度作成されたマイグレーションは変更禁止
- ❌ **本番での直接SQL実行**: 必ずPrismaマイグレーション経由
- ❌ **バックアップなしでのマイグレーション**: データ損失リスク

### 安全な運用ルール
- ✅ **必ずローカルでテスト**: 本番前に開発環境で検証
- ✅ **マイグレーション前にバックアップ**: 自動スクリプト使用
- ✅ **段階的デプロイ**: 大きな変更は小分けして実行
- ✅ **ロールバック計画**: 問題時の復旧手順を事前準備

---

## 🔄 マイグレーションの種類

### スキーマプッシュ（開発のみ）
```bash
# 開発環境での迅速なプロトタイピング用（ローカル）
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:push

# Docker環境での実行（推奨）
docker compose -f compose.dev.yaml exec app npx prisma db push
```
- マイグレーション履歴なし
- 開発時の試行錯誤に使用
- **本番環境では絶対に使用禁止**

### マイグレーション（本番推奨）
```bash
# 本番環境対応の正式手順（ローカル）
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npx prisma migrate dev --name migration_name

# Docker環境での実行（推奨）
docker compose -f compose.dev.yaml exec app npx prisma migrate dev --name migration_name
```
- マイグレーション履歴あり
- 本番環境で安全に実行可能
- チーム開発で必須

---

## 🆘 トラブルシューティング

### マイグレーション失敗時
```bash
# 1. バックアップから復元
docker compose -f compose.prod.yaml exec -T db psql -U postgres altee_prod < backups/backup_YYYYMMDD_HHMMSS_description.sql

# 2. マイグレーション状態確認
docker compose -f compose.prod.yaml exec app npx prisma migrate status

# 3. 必要に応じて手動修正
# 詳細は公式ドキュメント参照
```

### よくあるエラー
- **"Migration failed"**: スキーマ競合、手動でSQLを確認
- **"Database is out of sync"**: `prisma migrate resolve` で履歴修正
- **"Connection refused"**: データベース接続設定を確認

---

## 📚 参考リンク

- [Prisma Migrate公式ドキュメント](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [マイグレーションのベストプラクティス](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- プロジェクト内: `docs/ai-prompt-guide.md` - 実装チェックリスト
- プロジェクト内: `docs/GUIDES/COMMAND-GUIDE.md` - 基本コマンド一覧