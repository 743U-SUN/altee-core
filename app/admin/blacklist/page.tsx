import { Suspense } from "react"
import type { Metadata } from "next"
import { BlacklistTable } from "./components/BlacklistTable"
import { AddBlacklistForm } from "./components/AddBlacklistForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: "ブラックリスト管理 | 管理画面",
  robots: { index: false, follow: false },
}

export default async function BlacklistPage() {
  await requireAdmin()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ブラックリスト管理</h1>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 新規追加フォーム */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              メール追加
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddBlacklistForm />
          </CardContent>
        </Card>

        {/* ブラックリスト一覧 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ブラックリスト一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
              <BlacklistTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}