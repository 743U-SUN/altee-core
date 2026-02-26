import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getUserNavData } from "@/lib/user-data"
import { DashboardSidebarContent } from "@/components/sidebar-content/DashboardSidebarContent"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const user = await getUserNavData();

  // パスを取得して条件分岐（プレビュー表示ページのみサイドバー・パディング無効化を適用）
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isPreviewPage =
    pathname.startsWith('/dashboard/profile-editor') ||
    pathname.startsWith('/dashboard/faqs');

  return (
    <BaseLayout
      variant="dashboard"
      user={user}
      overrides={isPreviewPage ? {
        secondSidebar: {
          content: <DashboardSidebarContent userId={session.user.id} />
        },
        // プレビュー表示のためパディングを無効化
        mainClassName: "p-0 gap-0 lg:pb-0"
      } : undefined}
    >
      {children}
    </BaseLayout>
  )
}