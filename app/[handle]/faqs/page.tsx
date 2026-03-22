import { getPublicFaqByHandle } from '@/lib/queries/faq-queries'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { FAQPublicContent } from './components/FAQPublicContent'
import type { FaqCategoryWithQuestions } from '@/types/faq'

interface FAQsPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: FAQsPageProps) {
  const { handle } = await params

  return {
    title: `@${handle} のFAQ`,
    description: `@${handle} のよくある質問をまとめたページです。`,
    openGraph: {
      title: `@${handle} のFAQ`,
      description: `@${handle} のよくある質問をまとめたページです。`,
    }
  }
}

export default async function FAQsPage({ params }: FAQsPageProps) {
  const { handle } = await params

  const [result, presets] = await Promise.all([
    getPublicFaqByHandle(handle),
    getActivePresets(),
  ])
  const categories = (result.success ? result.data : []) as FaqCategoryWithQuestions[]

  return (
    <div className="space-y-6 w-full">
      <FAQPublicContent categories={categories} presets={presets} />
    </div>
  )
}
