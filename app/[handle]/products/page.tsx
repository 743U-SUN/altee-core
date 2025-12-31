import { getUserPublicProductsByHandle } from '@/app/actions/product-actions'
import { UserPublicProductList } from './components/UserPublicProductList'
import { notFound } from 'next/navigation'

interface UserProductsPageProps {
  params: Promise<{ handle: string }>
}

export default async function UserProductsPage({ params }: UserProductsPageProps) {
  const { handle } = await params

  // ユーザーの公開商品情報を取得
  const result = await getUserPublicProductsByHandle(handle)

  if (!result.success || !result.data) {
    notFound()
  }

  // ユーザー情報を取得するために、最初の商品からユーザー名を取得
  // または、Server Actionを拡張してユーザー情報も返すようにする
  const userProducts = result.data

  // handleからユーザー名を取得（簡易版）
  const userName = `@${handle}`

  return (
    <div className="space-y-6">
      <UserPublicProductList
        userProducts={userProducts || []}
        userName={userName}
      />
    </div>
  )
}

// ページのメタデータを生成
export async function generateMetadata({ params }: UserProductsPageProps) {
  const { handle } = await params

  // ユーザー情報を取得してメタデータを生成
  const result = await getUserPublicProductsByHandle(handle)

  if (!result.success || !result.data) {
    return {
      title: 'ユーザーが見つかりません',
    }
  }

  const userProducts = result.data
  const userName = `@${handle}`

  return {
    title: `${userName}さんの商品`,
    description: `${userName}さんが公開している商品情報とレビューを確認できます。${userProducts?.length || 0}個の商品が公開されています。`,
  }
}
