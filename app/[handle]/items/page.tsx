import { Suspense } from 'react'
import { getUserPublicItemsByHandle, getPublicPcBuildByHandle } from '@/lib/queries/item-queries'
import { ItemsTabs } from './components/ItemsTabs'
import { notFound } from 'next/navigation'
import type { UserItemForPublicPage } from '@/types/item'
import type { PcBuildWithParts } from '@/types/pc-build'
import type { SerializedUserItemForPublicPage } from '@/types/item'
import type { SerializedPcBuildWithParts } from '@/types/pc-build'

interface UserItemsPageProps {
  params: Promise<{ handle: string }>
}

/** SC→CC 境界: UserItemForPublicPage の Date を string に変換 */
function serializeUserItems(
  userItems: UserItemForPublicPage[]
): SerializedUserItemForPublicPage[] {
  return userItems.map((userItem) => ({
    ...userItem,
    createdAt: userItem.createdAt.toISOString(),
    updatedAt: userItem.updatedAt.toISOString(),
    item: {
      ...userItem.item,
      createdAt: userItem.item.createdAt.toISOString(),
      updatedAt: userItem.item.updatedAt.toISOString(),
      category: {
        ...userItem.item.category,
        createdAt: userItem.item.category.createdAt.toISOString(),
        updatedAt: userItem.item.category.updatedAt.toISOString(),
      },
      // brand は { id, name } のみの型で Date フィールドなし
      brand: userItem.item.brand ?? null,
    },
  }))
}

/** SC→CC 境界: PcBuildWithParts の Date を string に変換 */
function serializePcBuild(
  pcBuild: PcBuildWithParts
): SerializedPcBuildWithParts {
  return {
    ...pcBuild,
    createdAt: pcBuild.createdAt.toISOString(),
    updatedAt: pcBuild.updatedAt.toISOString(),
    parts: pcBuild.parts.map((part) => ({
      ...part,
      createdAt: part.createdAt.toISOString(),
      updatedAt: part.updatedAt.toISOString(),
      item: part.item
        ? {
            ...part.item,
            createdAt: part.item.createdAt.toISOString(),
            updatedAt: part.item.updatedAt.toISOString(),
            category: {
              ...part.item.category,
              createdAt: part.item.category.createdAt.toISOString(),
              updatedAt: part.item.category.updatedAt.toISOString(),
            },
            brand: part.item.brand
              ? {
                  ...part.item.brand,
                  createdAt: part.item.brand.createdAt.toISOString(),
                  updatedAt: part.item.brand.updatedAt.toISOString(),
                }
              : null,
          }
        : null,
    })),
  }
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

  const userItems = serializeUserItems(itemsResult.data)
  const pcBuild =
    pcBuildResult.success && pcBuildResult.data
      ? serializePcBuild(pcBuildResult.data)
      : null
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
