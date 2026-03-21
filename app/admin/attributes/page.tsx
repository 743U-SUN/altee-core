import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { AttributeDashboard } from "./components/AttributeDashboard"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: '属性管理 | Admin',
}

export default async function AttributesPage() {
  await requireAdmin()

  // 統計情報を取得
  const [categoryCount, tagCount] = await Promise.all([
    prisma.category.count(),
    prisma.tag.count()
  ])

  return <AttributeDashboard categoryCount={categoryCount} tagCount={tagCount} />
}
