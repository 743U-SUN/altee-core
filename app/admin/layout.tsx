import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BaseLayout } from "@/components/layout/BaseLayout"

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
  
  return (
    <BaseLayout variant="admin">
      {children}
    </BaseLayout>
  )
}