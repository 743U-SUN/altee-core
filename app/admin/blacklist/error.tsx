'use client'

import { AdminErrorFallback } from '@/components/admin/AdminErrorFallback'

export default function BlacklistError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <AdminErrorFallback error={error} reset={reset} />
}
