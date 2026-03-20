import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { AttributeDashboard } from "./components/AttributeDashboard"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: '属性管理',
}

export default async function AttributesPage() {
  const session = await cachedAuth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // 統計情報を取得
  const [categoryCount, tagCount] = await Promise.all([
    prisma.category.count(),
    prisma.tag.count()
  ])

  return <AttributeDashboard categoryCount={categoryCount} tagCount={tagCount} />
}