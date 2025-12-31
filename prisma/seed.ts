import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // デバイスカテゴリの作成
  console.log('Creating device categories...')
  
  const mouseCategory = await prisma.deviceCategory.upsert({
    where: { slug: 'mouse' },
    update: {},
    create: {
      name: 'マウス',
      slug: 'mouse',
      icon: 'Mouse',
      description: 'PC用マウス・ポインティングデバイス',
      sortOrder: 1,
    },
  })

  const keyboardCategory = await prisma.deviceCategory.upsert({
    where: { slug: 'keyboard' },
    update: {},
    create: {
      name: 'キーボード',
      slug: 'keyboard',
      icon: 'Keyboard',
      description: 'PC用キーボード・入力デバイス',
      sortOrder: 2,
    },
  })

  // マウス属性の作成
  console.log('Creating mouse attributes...')
  
  const mouseAttributes = [
    { name: 'DPI', type: 'NUMBER', unit: 'DPI', sortOrder: 1 },
    { name: 'ボタン数', type: 'NUMBER', unit: '個', sortOrder: 2 },
    { name: '接続方式', type: 'SELECT', options: ['ワイヤレス', '有線', '両対応'], sortOrder: 3 },
    { name: 'センサータイプ', type: 'SELECT', options: ['光学', 'レーザー'], sortOrder: 4 },
    { name: '重量', type: 'NUMBER', unit: 'g', sortOrder: 5 },
  ] as const

  for (const attr of mouseAttributes) {
    const existing = await prisma.categoryAttribute.findFirst({
      where: {
        categoryId: mouseCategory.id,
        name: attr.name,
      },
    })

    if (!existing) {
      await prisma.categoryAttribute.create({
        data: {
          categoryId: mouseCategory.id,
          name: attr.name,
          type: attr.type,
          unit: 'unit' in attr ? (attr.unit as string) : undefined,
          options: 'options' in attr ? JSON.parse(JSON.stringify(attr.options)) : undefined,
          required: false,
          sortOrder: attr.sortOrder,
        },
      })
    }
  }

  // キーボード属性の作成
  console.log('Creating keyboard attributes...')
  
  const keyboardAttributes = [
    { name: 'キー配列', type: 'SELECT', options: ['日本語', '英語', 'その他'], sortOrder: 1 },
    { name: 'キースイッチ', type: 'SELECT', options: ['メカニカル', 'メンブレン', '静電容量'], sortOrder: 2 },
    { name: '接続方式', type: 'SELECT', options: ['ワイヤレス', '有線', '両対応'], sortOrder: 3 },
    { name: 'バックライト', type: 'SELECT', options: ['無', '有', 'RGB'], sortOrder: 4 },
    { name: 'サイズ', type: 'SELECT', options: ['フルサイズ', 'テンキーレス', '60%', '65%', '75%', 'その他'], sortOrder: 5 },
  ] as const

  for (const attr of keyboardAttributes) {
    const existing = await prisma.categoryAttribute.findFirst({
      where: {
        categoryId: keyboardCategory.id,
        name: attr.name,
      },
    })

    if (!existing) {
      await prisma.categoryAttribute.create({
        data: {
          categoryId: keyboardCategory.id,
          name: attr.name,
          type: attr.type,
          unit: 'unit' in attr ? (attr.unit as string) : undefined,
          options: 'options' in attr ? JSON.parse(JSON.stringify(attr.options)) : undefined,
          required: false,
          sortOrder: attr.sortOrder,
        },
      })
    }
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })