import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { ManagedProfileList } from "./components/ManagedProfileList"

export const metadata: Metadata = {
  title: "公式プロフィール管理",
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ManagedProfilesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const search = typeof params.search === "string" ? params.search : ""

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">公式プロフィール管理</h1>
        <Button asChild>
          <Link href="/admin/managed-profiles/new">
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MANAGEDプロフィール一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
            <ManagedProfileList currentPage={currentPage} search={search} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
