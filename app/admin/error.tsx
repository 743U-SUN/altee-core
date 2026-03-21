'use client'

import { AdminErrorFallback } from '@/components/admin/AdminErrorFallback'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <AdminErrorFallback error={error} reset={reset} />
}
