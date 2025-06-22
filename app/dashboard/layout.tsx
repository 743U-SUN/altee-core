import { BaseLayout } from "@/components/layout/BaseLayout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BaseLayout variant="dashboard">
      {children}
    </BaseLayout>
  )
}