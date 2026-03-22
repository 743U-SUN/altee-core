import { Skeleton } from '@/components/ui/skeleton'

export default function HandleLoading() {
  return (
    <div className="w-full p-6 space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}
