import type { Metadata } from 'next'
import { CleanupClient } from './components/CleanupClient'

export const metadata: Metadata = {
  title: 'ファイルクリーンアップ',
  robots: { index: false, follow: false },
}

export default function CleanupPage() {
  return <CleanupClient />
}
