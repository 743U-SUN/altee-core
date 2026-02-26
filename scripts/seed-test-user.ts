/**
 * Phase 1テスト用のユーザーデータとセクションデータを作成
 *
 * 実行方法:
 * DATABASE_URL="postgresql://postgres:password@localhost:5433/altee_dev?schema=public" npx tsx scripts/seed-test-user.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// DATABASE_URL環境変数が必要
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://postgres:password@localhost:5433/altee_dev?schema=public'
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Creating test user data...')

  // テストユーザーの確認または作成
  let testUser = await prisma.user.findUnique({
    where: { handle: 'testhandle' },
    include: { profile: true },
  })

  if (!testUser) {
    console.log('Creating new test user...')
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        handle: 'testhandle',
        characterName: 'テストキャラクター',
        profile: {
          create: {
            themePreset: 'claymorphic',
            themeSettings: {
              visibility: {
                banner: false,
                character: true,
                gameButton: true,
                snsButton: true,
                notification: true,
              },
            },
          },
        },
      },
      include: { profile: true },
    })
    console.log(`✓ Created user: @${testUser.handle}`)
  } else {
    console.log(`✓ User already exists: @${testUser.handle}`)
    // 既存ユーザーの themeSettings を更新
    if (testUser.profile) {
      await prisma.userProfile.update({
        where: { userId: testUser.id },
        data: {
          themePreset: 'claymorphic',
          themeSettings: {
            visibility: {
              banner: false,
              character: true,
              gameButton: true,
              snsButton: true,
              notification: true,
            },
          },
        },
      })
      console.log('✓ Updated theme settings')
    }
  }

  // 既存のUserSectionを削除
  await prisma.userSection.deleteMany({
    where: { userId: testUser.id },
  })
  console.log('✓ Cleared existing sections')

  // ProfileCardセクション作成
  await prisma.userSection.create({
    data: {
      userId: testUser.id,
      sectionType: 'profile-card',
      title: null,
      sortOrder: 1,
      isVisible: true,
      data: {
        characterName: 'テストキャラクター',
        bio: 'こんにちは！これはPhase 1のテストプロフィールです。\n新しいセクションシステムで作成されています。',
      },
    },
  })
  console.log('✓ Created ProfileCard section')

  // FAQセクション作成
  await prisma.userSection.create({
    data: {
      userId: testUser.id,
      sectionType: 'faq',
      title: 'よくある質問',
      sortOrder: 2,
      isVisible: true,
      data: {
        categories: [
          {
            id: 'cat-1',
            name: '基本情報',
            sortOrder: 1,
            questions: [
              {
                id: 'q-1-1',
                question: 'このプロジェクトは何ですか？',
                answer:
                  'Phase 1のユーザープロフィールテーマシステムのテストです。新しいUserSectionモデルを使用しています。',
                sortOrder: 1,
              },
              {
                id: 'q-1-2',
                question: 'どんな機能がありますか？',
                answer:
                  'Claymorphicテーマ、レスポンシブレイアウト、セクションベースのコンテンツ管理などがあります。',
                sortOrder: 2,
              },
            ],
          },
          {
            id: 'cat-2',
            name: '技術スタック',
            sortOrder: 2,
            questions: [
              {
                id: 'q-2-1',
                question: '使用している技術は？',
                answer:
                  'Next.js 16、React 19、Prisma 7、PostgreSQL、TypeScriptを使用しています。',
                sortOrder: 1,
              },
            ],
          },
        ],
      },
    },
  })
  console.log('✓ Created FAQ section')

  // Linksセクション作成
  await prisma.userSection.create({
    data: {
      userId: testUser.id,
      sectionType: 'links',
      title: 'リンク集',
      sortOrder: 3,
      isVisible: true,
      data: {
        items: [
          {
            id: 'link-1',
            url: 'https://github.com',
            title: 'GitHub',
            iconType: 'preset',
            iconKey: 'github',
            sortOrder: 1,
          },
          {
            id: 'link-2',
            url: 'https://twitter.com',
            title: 'Twitter',
            iconType: 'preset',
            iconKey: 'twitter',
            sortOrder: 2,
          },
          {
            id: 'link-3',
            url: 'https://youtube.com',
            title: 'YouTube',
            iconType: 'preset',
            iconKey: 'youtube',
            sortOrder: 3,
          },
        ],
      },
    },
  })
  console.log('✓ Created Links section')

  // Youtubeセクション作成
  await prisma.userSection.create({
    data: {
      userId: testUser.id,
      sectionType: 'youtube',
      title: 'おすすめ動画',
      sortOrder: 4,
      isVisible: true,
      data: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        aspectRatio: '16:9',
      },
    },
  })
  console.log('✓ Created Youtube section')

  console.log('\n✅ Test data created successfully!')
  console.log(`\n🌐 View at: http://localhost:3000/@${testUser.handle}`)
  console.log(`📋 FAQ page: http://localhost:3000/@${testUser.handle}/faq`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
