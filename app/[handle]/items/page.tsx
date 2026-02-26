import { cache } from 'react'
import { getUserPublicItemsByHandle } from '@/app/actions/content/item-actions'
import { UserPublicItemList } from './components/UserPublicItemList'
import { notFound } from 'next/navigation'

interface UserItemsPageProps {
  params: Promise<{ handle: string }>
}

// React.cache()でリクエスト単位のデデュプリケーション
const getItemsData = cache(async (handle: string) => {
  return getUserPublicItemsByHandle(handle)
})

export default async function UserItemsPage({ params }: UserItemsPageProps) {
  const { handle } = await params

  const result = await getItemsData(handle)

  if (!result.success || !result.data) {
    notFound()
  }

  const userItems = result.data
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

export async function generateMetadata({ params }: UserItemsPageProps) {
  const { handle } = await params

  const result = await getItemsData(handle)

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
