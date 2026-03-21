import type { Metadata } from 'next'
import { Suspense } from "react"
import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { AttributeNavigation } from "./components/AttributeNavigation"

export const metadata: Metadata = {
  title: '属性管理 | Admin',
}

export default async function AttributesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await cachedAuth()

  // 管理者権限チェック（Layout層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // アクティブユーザーチェック
  if (!session?.user?.isActive) {
    redirect('/auth/suspended')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">属性管理</h1>
        <p className="text-muted-foreground">
          記事の分類・属性を統合管理します。
        </p>
      </div>
      
      <Suspense fallback={<div className="h-10 border-b" />}>
        <AttributeNavigation />
      </Suspense>
      
      <div className="min-h-[600px]">
        {children}
      </div>
    </div>
  )
}