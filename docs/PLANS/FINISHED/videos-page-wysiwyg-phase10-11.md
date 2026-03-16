# Phase 10-11: データマイグレーション + クリーンアップ - 詳細実装計画

---

## Phase 10: データマイグレーション

### 10.1 マイグレーションスクリプト

**新規:** `scripts/migrate-youtube-to-sections.ts`

### 処理フロー

```
1. 全ユーザーを取得（youtubeChannelId or YouTubeRecommendedVideo が存在するユーザー）

2. 各ユーザーについて:
   a. youtubeChannelId が存在する場合:
      → youtube-latest セクション作成
      {
        sectionType: 'youtube-latest',
        page: 'videos',
        data: { channelId: user.youtubeChannelId, rssFeedLimit: user.youtubeRssFeedLimit || 6 },
        sortOrder: 0,
      }

   b. YouTubeRecommendedVideo レコードが存在する場合:
      → youtube-recommended セクション作成
      {
        sectionType: 'youtube-recommended',
        page: 'videos',
        data: {
          items: recommendedVideos.map(v => ({
            id: nanoid(),
            videoId: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail,
            sortOrder: v.sortOrder,
          }))
        },
        sortOrder: 1,
      }

3. 処理結果のサマリーを出力
```

### データ変換マッピング

| 移行元 | 移行先 |
|--------|--------|
| `User.youtubeChannelId` | `youtube-latest` セクション → `data.channelId` |
| `User.youtubeRssFeedLimit` | `youtube-latest` セクション → `data.rssFeedLimit` |
| `YouTubeRecommendedVideo.videoId` | `youtube-recommended` セクション → `data.items[].videoId` |
| `YouTubeRecommendedVideo.title` | `youtube-recommended` セクション → `data.items[].title` |
| `YouTubeRecommendedVideo.thumbnail` | `youtube-recommended` セクション → `data.items[].thumbnail` |
| `YouTubeRecommendedVideo.sortOrder` | `youtube-recommended` セクション → `data.items[].sortOrder` |

### スクリプト構成

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { nanoid } from 'nanoid'

async function main() {
  // PrismaClient + PrismaPg アダプターパターン（seed-test-user.ts と同じ）
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  // 1. 対象ユーザー取得
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { youtubeChannelId: { not: null } },
        { youtubeRecommendedVideos: { some: {} } },
      ],
    },
    include: { youtubeRecommendedVideos: { orderBy: { sortOrder: 'asc' } } },
  })

  console.log(`対象ユーザー: ${users.length}名`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const user of users) {
    try {
      // 重複チェック（既にセクションが存在する場合はスキップ）
      const existing = await prisma.userSection.findMany({
        where: { userId: user.id, page: 'videos' },
      })

      if (existing.length > 0) {
        console.log(`[SKIP] ${user.id}: videos セクション既存`)
        skipped++
        continue
      }

      let sortOrder = 0

      // youtube-latest セクション作成
      if (user.youtubeChannelId) {
        await prisma.userSection.create({
          data: {
            userId: user.id,
            sectionType: 'youtube-latest',
            page: 'videos',
            sortOrder: sortOrder++,
            data: {
              channelId: user.youtubeChannelId,
              rssFeedLimit: user.youtubeRssFeedLimit ?? 6,
            },
          },
        })
        created++
      }

      // youtube-recommended セクション作成
      if (user.youtubeRecommendedVideos.length > 0) {
        await prisma.userSection.create({
          data: {
            userId: user.id,
            sectionType: 'youtube-recommended',
            page: 'videos',
            sortOrder: sortOrder++,
            data: {
              items: user.youtubeRecommendedVideos.map((v, idx) => ({
                id: nanoid(),
                videoId: v.videoId,
                title: v.title,
                thumbnail: v.thumbnail,
                sortOrder: idx,
              })),
            },
          },
        })
        created++
      }
    } catch (error) {
      console.error(`[ERROR] ${user.id}:`, error)
      errors++
    }
  }

  console.log(`完了: 作成=${created}, スキップ=${skipped}, エラー=${errors}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch(console.error)
```

### 実行方法

```bash
# ローカル
DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" \
  npx tsx scripts/migrate-youtube-to-sections.ts

# 本番（要SSH）
DATABASE_URL="..." npx tsx scripts/migrate-youtube-to-sections.ts
```

### ロールバック手順

```sql
-- 作成されたセクションを削除
DELETE FROM user_sections WHERE page = 'videos';
```

旧フィールド・テーブルはそのまま残しているため、ロールバックで完全に元に戻る。

---

## 本番環境での実行手順

1. **バックアップ**: `pg_dump` でデータベースのバックアップ取得
2. **メンテナンスモード**: 不要（既存機能に影響なし）
3. **スクリプト実行**: `npx tsx scripts/migrate-youtube-to-sections.ts`
4. **検証**: 数名のユーザーの `/@{handle}/videos` ページを確認
5. **問題発生時**: ロールバック SQL 実行

---

## Phase 11: クリーンアップ（後日実施）

### 段階的な実施順序

安定稼働確認後（Phase 10 から最低1週間以上）、以下の順序で段階的にクリーンアップ。

### 11a. リダイレクト設定

**Phase 8 で対応済み。** `next.config.ts` に `/dashboard/platforms` → `/dashboard/videos` のリダイレクト設定。

### 11b. 旧 Server Actions の廃止

**ファイル:** `app/actions/social/youtube-actions.ts`

| 関数 | 対応 | 理由 |
|------|------|------|
| `updateYoutubeChannel` | 段階的廃止 | `updateYouTubeLatestSection` に移行済み |
| `addRecommendedVideo` | 段階的廃止 | `YouTubeRecommendedEditModal` で直接 `updateSection` を使用 |
| `removeRecommendedVideo` | 段階的廃止 | 同上 |
| `reorderRecommendedVideos` | 段階的廃止 | 同上 |
| `getYouTubeMetadata` | **残す** | 新エディタモーダルからも使用 |

**手順:**
1. `@deprecated` JSDoc を追加
2. 呼び出し元がないことを確認
3. 関数を削除

### 11c. PubSubHubbub Webhook の移行

**ファイル:** `app/api/webhooks/youtube/route.ts`

現在は `User.youtubeChannelId` でユーザーを検索:
```typescript
const user = await prisma.user.findFirst({
  where: { youtubeChannelId: channelId },
})
```

移行後は `UserSection.data` 内の channelId で検索:
```typescript
const section = await prisma.userSection.findFirst({
  where: {
    sectionType: 'youtube-latest',
    page: 'videos',
  },
  // data JSON 内の channelId での検索は Prisma では直接不可
  // → 全 youtube-latest セクションを取得してフィルタ or Raw SQL
})
```

**重要:** JSON 内検索のパフォーマンスを考慮し、以下のいずれかを採用:
- Prisma Raw SQL: `WHERE data->>'channelId' = $1`
- `User.youtubeChannelId` を維持（ライブ配信でも使用するため）

### 11d. platform-actions.ts の移行

**ファイル:** `app/actions/social/platform-actions.ts`

| 関数 | 依存先 | 移行方法 |
|------|--------|---------|
| `getCurrentLiveStream()` | `User.youtubeChannelId` | UserSection から channelId 取得に変更 |
| `getTopRecommendedVideo()` | `YouTubeRecommendedVideo` テーブル | UserSection.data.items から取得に変更 |

### 11e. 旧フィールド・テーブルの削除

**最終段階。** 11b-11d の全移行完了後に実施。

```prisma
// 削除するフィールド
model User {
  // youtubeChannelId      String?   // 削除
  // youtubeRssFeedLimit   Int?      // 削除
}

// 削除するモデル
// model YouTubeRecommendedVideo { ... }
```

**マイグレーション:**
```bash
npm run db:migrate -- --name remove_legacy_youtube_fields
```

---

## 安全確認チェックリスト

| # | 確認項目 | 確認方法 |
|---|---------|---------|
| 1 | 全ユーザーのデータが正しく移行されている | `SELECT COUNT(*) FROM user_sections WHERE page = 'videos'` |
| 2 | 公開ページで旧データと同じ内容が表示される | 複数ユーザーの `/@{handle}/videos` を目視確認 |
| 3 | ライブ配信機能が正常動作する | ライブ配信のテスト |
| 4 | PubSubHubbub Webhook が正常動作する | YouTube アップロード通知のテスト |
| 5 | 旧 Server Actions が呼ばれていないこと | サーバーログ確認（@deprecated 関数の呼び出しがないこと） |
| 6 | `/dashboard/platforms` のリダイレクトが動作する | ブラウザでアクセスして確認 |

---

## タイムライン（推奨）

| 時期 | 実施内容 |
|------|---------|
| Phase 10 | データマイグレーションスクリプト実行 |
| +1週間 | 安定稼働確認、エラーログ監視 |
| +2週間 | 11b: 旧 Server Actions 廃止 |
| +3週間 | 11c-11d: Webhook + platform-actions 移行 |
| +1ヶ月 | 11e: 旧フィールド・テーブル削除 |
