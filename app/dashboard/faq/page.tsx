import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFaqCategories } from "@/app/actions/faq-actions"
import { FaqManagementSection } from "./faq-management-section"

export default async function FaqPage() {
  // Server Componentでデータフェッチ
  const faqResult = await getFaqCategories()
  
  if (!faqResult.success) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="w-full max-w-5xl mx-auto">
          <p className="text-destructive">
            FAQ情報の読み込みに失敗しました: {faqResult.error}
          </p>
        </div>
      </div>
    )
  }

  const faqCategories = faqResult.data || []

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">FAQ管理</h1>
        <p className="text-muted-foreground">
          よくある質問を管理します（カテゴリー最大10個、質問最大50個/カテゴリー）
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* FAQ管理 */}
          <Card>
            <CardHeader>
              <CardTitle>FAQ管理</CardTitle>
              <CardDescription>
                ドラッグ&ドロップで並び替えができます。設定したFAQは公開プロフィールに表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FaqManagementSection 
                initialFaqCategories={faqCategories as unknown[]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}