import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBrands() {
  console.log('🌱 Seeding brands...')

  const brands = [
    // マウス系ブランド
    { name: 'Logitech', slug: 'logitech', website: 'https://www.logicool.co.jp/' },
    { name: 'Razer', slug: 'razer', website: 'https://www.razer.com/' },
    { name: 'SteelSeries', slug: 'steelseries', website: 'https://jp.steelseries.com/' },
    { name: 'Corsair', slug: 'corsair', website: 'https://www.corsair.com/' },
    { name: 'Zowie', slug: 'zowie', website: 'https://zowie.benq.com/' },
    { name: 'Finalmouse', slug: 'finalmouse', website: 'https://finalmouse.com/' },
    { name: 'Glorious', slug: 'glorious', website: 'https://www.gloriousgaming.com/' },
    
    // キーボード系ブランド
    { name: 'HHKB', slug: 'hhkb', website: 'https://www.pfu.ricoh.com/hhkb/' },
    { name: 'Realforce', slug: 'realforce', website: 'https://www.realforce.co.jp/' },
    { name: 'Keychron', slug: 'keychron', website: 'https://www.keychron.com/' },
    { name: 'Cherry', slug: 'cherry', website: 'https://www.cherry.de/' },
    { name: 'Ducky', slug: 'ducky', website: 'https://www.duckychannel.com.tw/' },
    { name: 'Leopold', slug: 'leopold', website: 'https://leopold.co.kr/' },
    { name: 'Varmilo', slug: 'varmilo', website: 'https://www.varmilo.com/' },
    
    // ヘッドセット系ブランド
    { name: 'Sony', slug: 'sony', website: 'https://www.sony.jp/' },
    { name: 'Audio-Technica', slug: 'audio-technica', website: 'https://www.audio-technica.co.jp/' },
    { name: 'Sennheiser', slug: 'sennheiser', website: 'https://www.sennheiser.com/' },
    { name: 'Beyerdynamic', slug: 'beyerdynamic', website: 'https://www.beyerdynamic.com/' },
    { name: 'HyperX', slug: 'hyperx', website: 'https://www.hyperxgaming.com/' },
    
    // その他
    { name: 'Apple', slug: 'apple', website: 'https://www.apple.com/' },
    { name: 'Microsoft', slug: 'microsoft', website: 'https://www.microsoft.com/' },
    { name: 'ELECOM', slug: 'elecom', website: 'https://www.elecom.co.jp/' },
    { name: 'サンワサプライ', slug: 'sanwa', website: 'https://www.sanwa.co.jp/' },
  ]

  for (const [index, brand] of brands.entries()) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: {
        ...brand,
        sortOrder: index,
      },
    })
    console.log(`✅ Created brand: ${brand.name}`)
  }

  console.log('🎉 Brand seeding completed!')
}

seedBrands()
  .catch((e) => {
    console.error('❌ Brand seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })