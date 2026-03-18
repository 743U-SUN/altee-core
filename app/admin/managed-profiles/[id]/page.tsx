import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { getManagedProfileDetail } from "@/app/actions/admin/managed-profile-actions"
import { BasicInfoTab } from "./components/BasicInfoTab"

export const metadata: Metadata = {
  title: "公式プロフィール編集",
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ManagedProfileDetailPage({ params }: PageProps) {
  const { id } = await params

  let profile
  try {
    profile = await getManagedProfileDetail(id)
  } catch {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">公式プロフィール編集</h1>
          <Badge variant="outline">MANAGED</Badge>
        </div>
        <div className="flex gap-2">
          {profile.handle && (
            <Button variant="outline" asChild>
              <Link href={`/@${profile.handle}`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" />
                公開ページ
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/admin/managed-profiles">一覧に戻る</Link>
          </Button>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール情報</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            <span className="text-muted-foreground">ハンドル:</span>{" "}
            <code>@{profile.handle}</code>
          </div>
          <div>
            <span className="text-muted-foreground">作成日:</span>{" "}
            {new Date(profile.createdAt).toLocaleDateString("ja-JP")}
          </div>
        </CardContent>
      </Card>

      {/* キャラクター基本情報フォーム */}
      <BasicInfoTab userId={id} initialData={profile.characterInfo} />
    </div>
  )
}
