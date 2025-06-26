import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserData } from "@/app/actions/userdata-actions"
import { UserDataListSection } from "./userdata-list-section"

export default async function UserDataPage() {
  // Server Componentでデータフェッチ
  const userDataResult = await getUserData()
  
  if (!userDataResult.success) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="w-full max-w-5xl mx-auto">
          <p className="text-destructive">
            データの読み込みに失敗しました: {userDataResult.error}
          </p>
        </div>
      </div>
    )
  }

  const userData = userDataResult.data || []

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ユーザーデータ設定</h1>
        <p className="text-muted-foreground">
          あなたの情報やプロフィールデータを管理します（最大30個）
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* データ一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>マイデータ</CardTitle>
              <CardDescription>
                ドラッグ&ドロップで並び替えができます。設定したデータは公開プロフィールに表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDataListSection 
                initialUserData={userData}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}