import { cachedAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CharacterNavigation } from "./components/CharacterNavigation"

export default async function CharacterLayout({
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
        <h1 className="text-3xl font-bold tracking-tight">キャラクター情報</h1>
        <p className="text-muted-foreground">
          キャラクターの基本情報や活動情報を設定します。
        </p>
      </div>

      <CharacterNavigation />

      <div className="w-full max-w-5xl mx-auto min-h-[600px]">
        {children}
      </div>
    </div>
  )
}
