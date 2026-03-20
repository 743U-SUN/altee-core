/**
 * YouTube データ → UserSection マイグレーションスクリプト
 *
 * 既存の User.youtubeChannelId + YouTubeRecommendedVideo テーブルから
 * 新しいセクションベースの構造 (UserSection page='videos') にデータを移行
 *
 * 使い方:
 *   DATABASE_URL="..." npx tsx scripts/migrate-youtube-to-sections.ts
 *
 * ロールバック:
 *   旧テーブル・フィールドは残したままなので、セクションを削除するだけでロールバック可能
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log('=== YouTube → UserSection マイグレーション開始 ===')
  if (DRY_RUN) console.log('*** DRY RUN モード（データベースは変更されません） ***')

  // 移行対象ユーザーを取得
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { youtubeChannelId: { not: null } },
        { youtubeRecommendedVideos: { some: {} } },
      ],
    },
    select: {
      id: true,
      handle: true,
      youtubeChannelId: true,
      youtubeRssFeedLimit: true,
      youtubeRecommendedVideos: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  console.log(`移行対象ユーザー: ${users.length}人`)

  let createdLatest = 0
  let createdRecommended = 0
  let skippedLatest = 0
  let skippedRecommended = 0

  for (const user of users) {
    console.log(`\n--- ユーザー: ${user.handle || user.id} ---`)

    try {
      await prisma.$transaction(async (tx) => {
        // youtube-latest セクション作成（channelIdがある場合のみ）
        if (user.youtubeChannelId) {
          const existingLatest = await tx.userSection.findFirst({
            where: {
              userId: user.id,
              sectionType: 'youtube-latest',
              page: 'videos',
            },
          })

          if (existingLatest) {
            console.log('  youtube-latest: 既に存在 (スキップ)')
            skippedLatest++
          } else if (!DRY_RUN) {
            const maxSort = await tx.userSection.findFirst({
              where: { userId: user.id, page: 'videos' },
              orderBy: { sortOrder: 'desc' },
              select: { sortOrder: true },
            })

            await tx.userSection.create({
              data: {
                userId: user.id,
                sectionType: 'youtube-latest',
                page: 'videos',
                sortOrder: (maxSort?.sortOrder ?? -1) + 1,
                data: {
                  channelId: user.youtubeChannelId,
                  rssFeedLimit: user.youtubeRssFeedLimit ?? 6,
                },
              },
            })

            console.log(`  youtube-latest: 作成 (channelId=${user.youtubeChannelId})`)
            createdLatest++
          } else {
            console.log(`  youtube-latest: 作成予定 (channelId=${user.youtubeChannelId})`)
            createdLatest++
          }
        }

        // youtube-recommended セクション作成（動画がある場合のみ）
        if (user.youtubeRecommendedVideos.length > 0) {
          const existingRecommended = await tx.userSection.findFirst({
            where: {
              userId: user.id,
              sectionType: 'youtube-recommended',
              page: 'videos',
            },
          })

          if (existingRecommended) {
            console.log('  youtube-recommended: 既に存在 (スキップ)')
            skippedRecommended++
          } else if (!DRY_RUN) {
            const maxSort = await tx.userSection.findFirst({
              where: { userId: user.id, page: 'videos' },
              orderBy: { sortOrder: 'desc' },
              select: { sortOrder: true },
            })

            const items = user.youtubeRecommendedVideos.map((video, index) => ({
              id: nanoid(),
              videoId: video.videoId,
              title: video.title || '',
              thumbnail: video.thumbnail || '',
              sortOrder: index,
            }))

            await tx.userSection.create({
              data: {
                userId: user.id,
                sectionType: 'youtube-recommended',
                page: 'videos',
                sortOrder: (maxSort?.sortOrder ?? -1) + 1,
                data: { items },
              },
            })

            console.log(`  youtube-recommended: 作成 (${items.length}本の動画)`)
            createdRecommended++
          } else {
            console.log(`  youtube-recommended: 作成予定 (${user.youtubeRecommendedVideos.length}本の動画)`)
            createdRecommended++
          }
        }
      })
    } catch (error) {
      console.error(`  エラー（ユーザー ${user.handle || user.id} をスキップ）:`, error)
    }
  }

  console.log('\n=== マイグレーション完了 ===')
  console.log(`youtube-latest: 作成=${createdLatest}, スキップ=${skippedLatest}`)
  console.log(`youtube-recommended: 作成=${createdRecommended}, スキップ=${skippedRecommended}`)
  console.log('\n注意: 旧テーブル・フィールドは残したままです。安定稼働確認後に削除してください。')
}

main()
  .catch((error) => {
    console.error('マイグレーションエラー:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
