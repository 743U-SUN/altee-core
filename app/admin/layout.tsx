import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getAdminStats } from "@/app/actions/admin/stats"
import { getSidebarContent } from "@/lib/sidebar-content-registry"
import { getUserNavData } from "@/lib/user-data"

export default async function AdminLayout({
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