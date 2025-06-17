import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getAdminStats } from "@/app/actions/admin-stats"
import { getSidebarContent } from "@/lib/sidebar-content-registry"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  
  // 認証チェック
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }
  
  // アクティブユーザーチェック
  if (!session.user.isActive) {
    redirect('/suspended');
  }
  
  // 管理者権限チェック
  if (session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }
  
  // 統計データを取得してサイドバーコンテンツを生成
  const stats = await getAdminStats()
  const adminSidebarContent = getSidebarContent("admin", stats)
  
  return (
    <BaseLayout 
      variant="admin"
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