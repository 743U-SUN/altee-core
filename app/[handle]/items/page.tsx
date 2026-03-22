import { Suspense } from 'react'
import { getUserPublicItemsByHandle } from '@/lib/queries/item-queries'
import { getPublicPcBuildByHandle } from '@/app/actions/content/pc-build-actions'
import { ItemsTabs } from './components/ItemsTabs'
import { notFound } from 'next/navigation'

interface UserItemsPageProps {
  params: Promise<{ handle: string }>
}

export default async function UserItemsPage({ params }: UserItemsPageProps) {
  const { handle } = await params

  const [itemsResult, pcBuildResult] = await Promise.all([
    getUserPublicItemsByHandle(handle),
    getPublicPcBuildByHandle(handle),
  ])

  if (!itemsResult.success || !itemsResult.data) {
    notFound()
  }

  const userItems = itemsResult.data
  const pcBuild = pcBuildResult.success ? (pcBuildResult.data ?? null) : null
  const userName = `@${handle}`

  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-48" />
            <div className="h-32 bg-muted rounded" />
          </div>
        }
      >
        <ItemsTabs
          userItems={userItems}
          pcBuild={pcBuild}
          userName={userName}
        />
      </Suspense>
    </div>
  )
}

export async function generateMetadata({ params }: UserItemsPageProps) {
  const { handle } = await params

  const itemsResult = await getUserPublicItemsByHandle(handle)

  if (!itemsResult.success || !itemsResult.data) {
    return {
      title: 'ユーザーが見つかりません',
    }
  }

  const userItems = itemsResult.data
  const userName = `@${handle}`

  return {
    title: `${userName}さんのアイテム`,
    description: `${userName}さんが公開しているアイテム情報とレビューを確認できます。${userItems?.length || 0}個のアイテムが公開されています。`,
  }
}
