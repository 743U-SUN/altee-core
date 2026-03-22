import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cachedAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserNavData } from "@/lib/user-data"
import { DashboardSidebarContent } from "@/components/sidebar-content/DashboardSidebarContent"
import { CharacterSidebarContent } from "@/components/sidebar-content/CharacterSidebarContent"
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: {
    template: '%s | ダッシュボード',
    default: 'ダッシュボード',
  },
}

async function DashboardLayoutContent({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string
}) {
  const user = await getUserNavData();

  return (
    <DashboardLayoutClient
      user={user}
      sidebarContent={<DashboardSidebarContent userId={userId} />}
      sidebarRoutes={[
        { path: '/dashboard/character', content: <CharacterSidebarContent /> },
      ]}
    >
      {children}
    </DashboardLayoutClient>
  )
}

function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* サイドバー */}
      <div className="hidden lg:block w-[350px] border-r p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      {/* メイン */}
      <div className="flex-1">
        <div className="h-14 border-b px-4 flex items-center">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await cachedAuth();

  // 認証チェック（Suspense 前に完了させる）
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!session.user.isActive) {
    redirect('/auth/suspended');
  }

  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <DashboardLayoutContent userId={session.user.id}>
        {children}
      </DashboardLayoutContent>
    </Suspense>
  )
}
