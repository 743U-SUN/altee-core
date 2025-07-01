import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserDevices } from "@/app/actions/device-actions"
import { UserDeviceWithDetails } from "@/types/device"
import { UserDeviceListSection } from "./components/UserDeviceListSection"

export default async function UserDevicesPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // ユーザーのデバイス一覧を取得
  const userDevices = await getUserDevices(session.user.id)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">マイデバイス</h1>
        <p className="text-muted-foreground">
          あなたが使用しているデバイスを管理します
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* デバイス一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>登録デバイス</CardTitle>
              <CardDescription>
                Amazon URLから新しいデバイスを追加するか、既存のデバイスから選択できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDeviceListSection 
                initialUserDevices={userDevices as UserDeviceWithDetails[]}
                userId={session.user.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}