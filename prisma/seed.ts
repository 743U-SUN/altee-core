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

  // アイテムカテゴリの作成
  console.log('Creating product categories...')

  // PCパーツ
  const pcPartsCategory = await prisma.itemCategory.upsert({
    where: { slug: 'pc-parts' },
    update: {},
    create: {
      name: 'PCパーツ',
      slug: 'pc-parts',
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'Cpu',
      description: 'PCパーツ各種',
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'cpu' },
    update: {},
    create: {
      name: 'CPU',
      slug: 'cpu',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'Cpu',
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'motherboard' },
    update: {},
    create: {
      name: 'マザーボード',
      slug: 'motherboard',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'CircuitBoard',
      sortOrder: 2,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'memory' },
    update: {},
    create: {
      name: 'メモリ',
      slug: 'memory',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'MemoryStick',
      sortOrder: 3,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'gpu' },
    update: {},
    create: {
      name: 'グラフィックボード',
      slug: 'gpu',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'Gpu',
      sortOrder: 4,
    },
  })

  const storageCategory = await prisma.itemCategory.upsert({
    where: { slug: 'storage' },
    update: {},
    create: {
      name: 'ストレージ',
      slug: 'storage',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'HardDrive',
      sortOrder: 5,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'ssd' },
    update: {},
    create: {
      name: 'SSD',
      slug: 'ssd',
      parentId: storageCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'hdd' },
    update: {},
    create: {
      name: 'HDD',
      slug: 'hdd',
      parentId: storageCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      sortOrder: 2,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'psu' },
    update: {},
    create: {
      name: '電源ユニット',
      slug: 'psu',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'Zap',
      sortOrder: 6,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'case' },
    update: {},
    create: {
      name: 'PCケース',
      slug: 'case',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'Box',
      sortOrder: 7,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'cpu-cooler' },
    update: {},
    create: {
      name: 'CPUクーラー',
      slug: 'cpu-cooler',
      parentId: pcPartsCategory.id,
      itemType: 'PC_PART',
      requiresCompatibilityCheck: true,
      icon: 'Fan',
      sortOrder: 8,
    },
  })

  // 周辺機器
  const peripheralsCategory = await prisma.itemCategory.upsert({
    where: { slug: 'peripherals' },
    update: {},
    create: {
      name: '周辺機器',
      slug: 'peripherals',
      itemType: 'PERIPHERAL',
      requiresCompatibilityCheck: false,
      icon: 'Cable',
      description: 'PC周辺機器',
      sortOrder: 2,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'mouse-product' },
    update: {},
    create: {
      name: 'マウス',
      slug: 'mouse-product',
      parentId: peripheralsCategory.id,
      itemType: 'PERIPHERAL',
      requiresCompatibilityCheck: false,
      icon: 'Mouse',
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'keyboard-product' },
    update: {},
    create: {
      name: 'キーボード',
      slug: 'keyboard-product',
      parentId: peripheralsCategory.id,
      itemType: 'PERIPHERAL',
      requiresCompatibilityCheck: false,
      icon: 'Keyboard',
      sortOrder: 2,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'display' },
    update: {},
    create: {
      name: 'ディスプレイ',
      slug: 'display',
      parentId: peripheralsCategory.id,
      itemType: 'PERIPHERAL',
      requiresCompatibilityCheck: false,
      icon: 'Monitor',
      sortOrder: 3,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'headset' },
    update: {},
    create: {
      name: 'ヘッドセット',
      slug: 'headset',
      parentId: peripheralsCategory.id,
      itemType: 'PERIPHERAL',
      requiresCompatibilityCheck: false,
      icon: 'Headphones',
      sortOrder: 4,
    },
  })

  // 食品
  const foodCategory = await prisma.itemCategory.upsert({
    where: { slug: 'food' },
    update: {},
    create: {
      name: '食品',
      slug: 'food',
      itemType: 'FOOD',
      requiresCompatibilityCheck: false,
      icon: 'Coffee',
      description: '食品・飲料',
      sortOrder: 3,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'beverages' },
    update: {},
    create: {
      name: '飲料',
      slug: 'beverages',
      parentId: foodCategory.id,
      itemType: 'FOOD',
      requiresCompatibilityCheck: false,
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'snacks' },
    update: {},
    create: {
      name: 'お菓子',
      slug: 'snacks',
      parentId: foodCategory.id,
      itemType: 'FOOD',
      requiresCompatibilityCheck: false,
      sortOrder: 2,
    },
  })

  // 本
  const booksCategory = await prisma.itemCategory.upsert({
    where: { slug: 'books' },
    update: {},
    create: {
      name: '本',
      slug: 'books',
      itemType: 'BOOK',
      requiresCompatibilityCheck: false,
      icon: 'Book',
      description: '書籍',
      sortOrder: 4,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'tech-books' },
    update: {},
    create: {
      name: '技術書',
      slug: 'tech-books',
      parentId: booksCategory.id,
      itemType: 'BOOK',
      requiresCompatibilityCheck: false,
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'business-books' },
    update: {},
    create: {
      name: 'ビジネス書',
      slug: 'business-books',
      parentId: booksCategory.id,
      itemType: 'BOOK',
      requiresCompatibilityCheck: false,
      sortOrder: 2,
    },
  })

  // マイク
  const microphonesCategory = await prisma.itemCategory.upsert({
    where: { slug: 'microphones' },
    update: {},
    create: {
      name: 'マイク',
      slug: 'microphones',
      itemType: 'MICROPHONE',
      requiresCompatibilityCheck: false,
      icon: 'Mic',
      description: 'マイク・録音機器',
      sortOrder: 5,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'condenser' },
    update: {},
    create: {
      name: 'コンデンサーマイク',
      slug: 'condenser',
      parentId: microphonesCategory.id,
      itemType: 'MICROPHONE',
      requiresCompatibilityCheck: false,
      sortOrder: 1,
    },
  })

  await prisma.itemCategory.upsert({
    where: { slug: 'dynamic' },
    update: {},
    create: {
      name: 'ダイナミックマイク',
      slug: 'dynamic',
      parentId: microphonesCategory.id,
      itemType: 'MICROPHONE',
      requiresCompatibilityCheck: false,
      sortOrder: 2,
    },
  })

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