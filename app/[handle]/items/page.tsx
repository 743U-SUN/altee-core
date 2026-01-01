import { getUserPublicItemsByHandle } from '@/app/actions/item-actions'
import { UserPublicItemList } from './components/UserPublicItemList'
import { notFound } from 'next/navigation'

interface UserItemsPageProps {
  params: Promise<{ handle: string }>
}

export default async function UserItemsPage({ params }: UserItemsPageProps) {
  const { handle } = await params

  // ユーザーの公開アイテム情報を取得
  const result = await getUserPublicItemsByHandle(handle)

  if (!result.success || !result.data) {
    notFound()
  }

  // ユーザー情報を取得するために、最初のアイテムからユーザー名を取得
  // または、Server Actionを拡張してユーザー情報も返すようにする
  const userItems = result.data

  // handleからユーザー名を取得（簡易版）
  const userName = `@${handle}`

  return (
    <div className="space-y-6">
      <UserPublicItemList
        userItems={userItems || []}
        userName={userName}
      />
    </div>
  )
}

// ページのメタデータを生成
export async function generateMetadata({ params }: UserItemsPageProps) {
  const { handle } = await params

  // ユーザー情報を取得してメタデータを生成
  const result = await getUserPublicItemsByHandle(handle)

  if (!result.success || !result.data) {
    return {
      title: 'ユーザーが見つかりません',
    }
  }

  const userItems = result.data
  const userName = `@${handle}`

  return {
    title: `${userName}さんのアイテム`,
    description: `${userName}さんが公開しているアイテム情報とレビューを確認できます。${userItems?.length || 0}個のアイテムが公開されています。`,
  }
}
