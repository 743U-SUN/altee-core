# Phase 1: データベース基盤 - 詳細実装計画

## 概要

UserSection モデルに `page` カラムを追加し、プロフィールページと動画ページのセクションを区別できるデータベース基盤を構築する。変更は最小限で、既存の全機能が `page` のデフォルト値 `"profile"` により完全に後方互換を保つ。

---

## 1.1 Prisma スキーマ修正

**ファイル:** `prisma/schema.prisma`

**現在の UserSection モデル (L271-287):**

```prisma
model UserSection {
  id          String   @id @default(cuid())
  userId      String
  sectionType String
  title       String?
  sortOrder   Int
  isVisible   Boolean  @default(true)
  data        Json
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, sortOrder])
  @@map("user_sections")
}
```

**変更後:**

```prisma
model UserSection {
  id          String   @id @default(cuid())
  userId      String
  sectionType String
  title       String?
  sortOrder   Int
  isVisible   Boolean  @default(true)
  data        Json
  settings    Json?
  page        String   @default("profile")  // "profile" | "videos"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, sortOrder])
  @@index([userId, page, sortOrder])  // 新規: page別クエリ最適化
  @@map("user_sections")
}
```

**設計判断:**
- `page` は `String` 型（enum ではない）。将来的に `"items"` や `"schedule"` など追加される可能性があり、enum だとマイグレーションのたびに ALTER TYPE が必要になるため
- 既存インデックス `@@index([userId, sortOrder])` は残す（安全策）
- 新インデックス `@@index([userId, page, sortOrder])` を追加し、page でフィルタした並び順取得を高速化

---

## 1.2 マイグレーション実行

### 生成される SQL（参考）

```sql
ALTER TABLE "user_sections" ADD COLUMN "page" TEXT NOT NULL DEFAULT 'profile';
CREATE INDEX "user_sections_userId_page_sortOrder_idx" ON "user_sections"("userId", "page", "sortOrder");
```

`@default("profile")` により既存の全レコードは自動的に `page = 'profile'` で初期化される。データマイグレーションスクリプトは不要。

### コマンド

```bash
# ローカル環境
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npm run db:migrate -- --name add_section_page_column

# Prisma Client 再生成確認
npm run db:generate

# マイグレーションファイルの生成確認
ls prisma/migrations/ | tail -1
```

---

## 検証方法

### 静的チェック

```bash
npm run lint && npx tsc --noEmit
```

### 後方互換テスト

| テスト項目 | 手順 | 期待結果 |
|-----------|------|---------|
| プロフィール編集ページ | `/dashboard/profile-editor` にアクセス | 既存セクションが全て表示される |
| セクション追加・編集・削除・並び替え | 各操作を実行 | 正常動作 |
| 公開プロフィールページ | `/@{handle}` にアクセス | セクションが正常に表示される |
| 公開動画ページ | `/@{handle}/videos` にアクセス | 既存表示が正常（まだ UserSection 未使用のため影響なし） |

### データベースレベル

```sql
SELECT page, COUNT(*) FROM user_sections GROUP BY page;
-- 期待値: profile | (既存レコード数)

SELECT indexname FROM pg_indexes WHERE tablename = 'user_sections';
-- 期待値: userId_sortOrder_idx と userId_page_sortOrder_idx の両方が存在
```

---

## リスクと注意点

| リスク | 影響度 | 軽減策 |
|--------|--------|--------|
| 既存データの破壊 | 低 | `@default("profile")` で全既存レコードに自動設定。NOT NULL + DEFAULT なので安全 |
| 既存クエリの挙動変化 | 低 | 既存クエリは `page` フィルタ未指定だが、全レコードが `page: 'profile'` なので結果同一 |
| 本番マイグレーション時間 | 低 | PostgreSQL 11+ では ADD COLUMN with DEFAULT は即座完了（メタデータのみ変更） |
| page 値のバリデーション不足 | 中 | Phase 3 の Server Actions で許可値バリデーションを追加 |

---

## 既存コードへの影響

**Phase 1 の変更は Prisma スキーマのみ。アプリケーションコードの変更は一切不要。**

以下は Phase 1 では変更せず、後続フェーズで対応する:

| ファイル | 変更不要の理由 | 対応Phase |
|----------|-------------|-----------|
| `app/actions/user/section-actions.ts` | page フィルタなしでも全レコードが profile なので結果同一 | Phase 3 |
| `app/dashboard/profile-editor/page.tsx` | 同上 | Phase 3 |
| `lib/handle-utils.ts` | 同上 | Phase 9 |
| `types/profile-sections.ts` | 既存コードが page を参照しない | Phase 2 |
| `scripts/seed-test-user.ts` | デフォルト値 'profile' が適用されるため正常動作 | 変更不要 |
