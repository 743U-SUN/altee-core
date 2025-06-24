const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // カスタムリンクタイプを作成
    const customLinkType = await prisma.linkType.upsert({
      where: { name: 'custom' },
      update: {},
      create: {
        name: 'custom',
        displayName: 'カスタムリンク',
        urlPattern: null,
        isCustom: true,
        isActive: true,
        sortOrder: 999, // 最後に表示
      },
    })

    console.log('Custom LinkType created/updated:', customLinkType)
  } catch (error) {
    console.error('Error creating custom LinkType:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()