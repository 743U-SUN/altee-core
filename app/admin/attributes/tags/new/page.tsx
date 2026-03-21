import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { TagForm } from "../components/TagForm"

export const metadata: Metadata = {
  title: '新規タグ作成 | Admin',
  robots: { index: false, follow: false },
}

export default async function NewTagPage() {
  await requireAdmin()

  return <TagForm mode="create" />
}
