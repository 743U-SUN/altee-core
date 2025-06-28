import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getUserNavData } from "@/lib/user-data"

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

  return (
    <BaseLayout variant="dashboard" user={user}>
      {children}
    </BaseLayout>
  )
}