import { getUserPublicDevicesByHandle } from '@/app/actions/device-actions'
import { UserPublicDeviceList } from './components/UserPublicDeviceList'
import { notFound } from 'next/navigation'

interface UserDevicesPageProps {
  params: Promise<{ handle: string }>
}

export default async function UserDevicesPage({ params }: UserDevicesPageProps) {
  const { handle } = await params

  // ユーザーの公開デバイス情報を取得
  const result = await getUserPublicDevicesByHandle(handle)

  if (!result.success || !result.user) {
    notFound()
  }

  const { user, userDevices } = result

  return (
    <div className="space-y-6">
      <UserPublicDeviceList 
        userDevices={userDevices || []}
        userName={user.name || `@${user.handle}`}
      />
    </div>
  )
}

// ページのメタデータを生成
export async function generateMetadata({ params }: UserDevicesPageProps) {
  const { handle } = await params
  
  // ユーザー情報を取得してメタデータを生成
  const result = await getUserPublicDevicesByHandle(handle)
  
  if (!result.success || !result.user) {
    return {
      title: 'ユーザーが見つかりません',
    }
  }

  const { user, userDevices } = result
  const userName = user.name || `@${user.handle}`
  
  return {
    title: `${userName}さんのデバイス`,
    description: `${userName}さんが公開しているデバイス情報とレビューを確認できます。${userDevices?.length || 0}個のデバイスが公開されています。`,
  }
}