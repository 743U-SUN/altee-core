import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserLinks, getLinkTypes } from "@/app/actions/link-actions"
import { LinksListSection } from "./links-list-section"

export default async function LinksPage() {
  // Server Componentでデータフェッチ
  const [linksResult, linkTypesResult] = await Promise.all([
    getUserLinks(),
    getLinkTypes()
  ])
  
  if (!linksResult.success || !linkTypesResult.success) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="w-full max-w-5xl mx-auto">
          <p className="text-destructive">
            リンク情報の読み込みに失敗しました: {linksResult.error || linkTypesResult.error}
          </p>
        </div>
      </div>
    )
  }

  const userLinks = linksResult.data || []
  const linkTypes = linkTypesResult.data || []

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SNSリンク設定</h1>
        <p className="text-muted-foreground">
          SNSアカウントやWebサイトのリンクを管理します（最大20個）
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* リンク一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>マイリンク</CardTitle>
              <CardDescription>
                ドラッグ&ドロップで並び替えができます。設定したリンクは公開プロフィールに表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinksListSection 
                initialUserLinks={userLinks}
                initialLinkTypes={linkTypes}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}