import type { Metadata } from 'next'
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: 'プラットフォーム設定',
  robots: { index: false, follow: false },
}

export default function PlatformsPage() {
  redirect("/dashboard/platforms/youtube")
}
