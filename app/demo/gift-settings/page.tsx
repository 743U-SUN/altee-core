import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserGift } from "@/app/actions/user/gift-actions"
import { GiftSettings } from "@/app/dashboard/notifications/gift-settings"

/**
 * ギフト設定のデモページ
 * ブラウザから動作確認可能
 */
export default async function GiftSettingsDemo() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const result = await getUserGift()

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">ギフト設定デモ</h1>

      <div className="space-y-4 mb-8">
        <div className="p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">現在の設定データ:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <GiftSettings initialData={result.data ?? null} />
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">テスト手順:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>「ギフト設定を表示する」スイッチをONにする</li>
          <li>成功メッセージ「ギフト設定を表示に設定しました」が表示されることを確認</li>
          <li>画像をアップロードする（任意）</li>
          <li>リンクURLを入力する（https://で始まるURL）</li>
          <li>スイッチをOFF→ONにして再度保存できることを確認</li>
        </ol>
      </div>
    </div>
  )
}
