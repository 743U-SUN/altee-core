/**
 * 初期背景プリセット投入スクリプト
 *
 * 使い方:
 *   npx tsx scripts/seed-section-backgrounds.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PRESETS = [
  // ===== Solid Colors =====
  {
    name: 'Midnight Blue',
    category: 'solid',
    config: { color: '#1a1a2e' },
    sortOrder: 0,
  },
  {
    name: 'Deep Purple',
    category: 'solid',
    config: { color: '#2d1b69' },
    sortOrder: 1,
  },
  {
    name: 'Forest Green',
    category: 'solid',
    config: { color: '#1b4332' },
    sortOrder: 2,
  },
  {
    name: 'Warm Gray',
    category: 'solid',
    config: { color: '#374151' },
    sortOrder: 3,
  },
  {
    name: 'Soft White',
    category: 'solid',
    config: { color: '#f8fafc' },
    sortOrder: 4,
  },
  {
    name: 'Cream',
    category: 'solid',
    config: { color: '#fef3c7' },
    sortOrder: 5,
  },

  // ===== Gradients =====
  {
    name: 'Sunset',
    category: 'gradient',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#f97316', position: 0 },
        { color: '#ec4899', position: 50 },
        { color: '#8b5cf6', position: 100 },
      ],
    },
    sortOrder: 10,
  },
  {
    name: 'Ocean',
    category: 'gradient',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#1a1a2e', position: 0 },
        { color: '#16213e', position: 50 },
        { color: '#0f3460', position: 100 },
      ],
    },
    sortOrder: 11,
  },
  {
    name: 'Aurora',
    category: 'gradient',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 },
      ],
    },
    sortOrder: 12,
  },
  {
    name: 'Mint Fresh',
    category: 'gradient',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#a8edea', position: 0 },
        { color: '#fed6e3', position: 100 },
      ],
    },
    sortOrder: 13,
  },
  {
    name: 'Dark Charcoal',
    category: 'gradient',
    config: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: '#232526', position: 0 },
        { color: '#414345', position: 100 },
      ],
    },
    sortOrder: 14,
  },
  {
    name: 'Cherry Blossom',
    category: 'gradient',
    config: {
      type: 'linear',
      angle: 135,
      stops: [
        { color: '#ffecd2', position: 0 },
        { color: '#fcb69f', position: 100 },
      ],
    },
    sortOrder: 15,
  },
]

async function main() {
  console.log('Seeding section background presets...')

  for (const preset of PRESETS) {
    await prisma.sectionBackgroundPreset.upsert({
      where: { id: `seed-${preset.name.toLowerCase().replace(/\s+/g, '-')}` },
      create: {
        id: `seed-${preset.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: preset.name,
        category: preset.category,
        config: preset.config,
        isActive: true,
        sortOrder: preset.sortOrder,
      },
      update: {
        name: preset.name,
        category: preset.category,
        config: preset.config,
        sortOrder: preset.sortOrder,
      },
    })
    console.log(`  + ${preset.name} (${preset.category})`)
  }

  console.log(`Done! ${PRESETS.length} presets seeded.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
