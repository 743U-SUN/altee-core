import { Suspense } from "react"
import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { PlatformNavigation } from "./components/PlatformNavigation"

export default async function PlatformsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プラットフォーム設定</h1>
        <p className="text-muted-foreground">
          配信プラットフォームの設定を管理します。おすすめ動画やライブ配信の表示を設定できます。
        </p>
      </div>

      <Suspense fallback={<div className="h-10 border-b" />}>
        <PlatformNavigation />
      </Suspense>

      <div className="w-full max-w-5xl mx-auto min-h-[600px]">
        {children}
      </div>
    </div>
  )
}
