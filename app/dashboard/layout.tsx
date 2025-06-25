import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { BaseLayout } from "@/components/layout/BaseLayout"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <BaseLayout variant="dashboard">
      {children}
    </BaseLayout>
  )
}