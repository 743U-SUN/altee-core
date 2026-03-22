import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getAdminStats } from "@/app/actions/admin/stats"
import { getSidebarContent } from "@/lib/sidebar-content-registry"
import { getUserNavData } from "@/lib/user-data"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: {
    template: '%s | Admin',
    default: '管理画面',
  },
}

async function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await cachedAuth();

  // 認証チェック
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // アクティブユーザーチェック
  if (!session.user.isActive) {
    redirect('/auth/suspended');
  }

  // 管理者権限チェック
  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  // 統計データとユーザー情報を並列取得
  const [stats, user] = await Promise.all([
    getAdminStats(),
    getUserNavData(),
  ])
  const adminSidebarContent = getSidebarContent("admin", stats)

  return (
    <BaseLayout
      variant="admin"
      user={user}
      overrides={{
        secondSidebar: {
          content: adminSidebarContent
        }
      }}
    >
      {children}
    </BaseLayout>
  )
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block w-[350px] border-r p-4 space-y-4">
        <Skeleton className="h-8 w-24" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1">
        <div className="h-14 border-b px-4 flex items-center">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AdminLayoutSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
