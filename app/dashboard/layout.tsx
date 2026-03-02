import { cachedAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserNavData } from "@/lib/user-data"
import { DashboardSidebarContent } from "@/components/sidebar-content/DashboardSidebarContent"
import { DashboardLayoutClient } from "@/components/layout/DashboardLayoutClient"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await cachedAuth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!session.user.isActive) {
    redirect('/auth/suspended');
  }

  const user = await getUserNavData();

  return (
    <DashboardLayoutClient
      user={user}
      sidebarContent={<DashboardSidebarContent userId={session.user.id} />}
    >
      {children}
    </DashboardLayoutClient>
  )
}