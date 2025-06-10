import { BaseLayout } from "@/components/layout/BaseLayout"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BaseLayout variant="user-profile">
      {children}
    </BaseLayout>
  )
}