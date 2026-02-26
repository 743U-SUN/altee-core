import { cache } from 'react'
import { getPublicFaqByHandle } from '@/app/actions/content/faq-actions'
import { FAQPublicContent } from './components/FAQPublicContent'
import type { FaqCategoryBase, FaqQuestionBase } from '@/types/faq'

interface FAQsPageProps {
  params: Promise<{ handle: string }>
}

export interface FaqCategoryWithQuestions extends FaqCategoryBase {
  questions: FaqQuestionBase[]
}

// リクエスト単位のデータフェッチの重複排除（generateMetadataとページ本体で共有）
const getCachedFaq = cache(async (handle: string) => {
  return getPublicFaqByHandle(handle)
})

export async function generateMetadata({ params }: FAQsPageProps) {
  const { handle } = await params

  // ユーザーの存在確認や動的メタデータ生成に再利用可能
  // const result = await getCachedFaq(handle)

  return {
    title: `@${handle} のFAQ`,
    description: `@${handle} のよくある質問をまとめたページです。`,
    // OpenGraph などの追加も容易
    openGraph: {
      title: `@${handle} のFAQ`,
      description: `@${handle} のよくある質問をまとめたページです。`,
    }
  }
}

export default async function FAQsPage({ params }: FAQsPageProps) {
  const { handle } = await params

  const result = await getCachedFaq(handle)
  const categories = (result.success ? result.data : []) as FaqCategoryWithQuestions[]

  return (
    <div className="space-y-6 w-full">
      <FAQPublicContent categories={categories} />
    </div>
  )
}
