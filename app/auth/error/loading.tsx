import { Skeleton } from "@/components/ui/skeleton"

export default function AuthErrorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md border rounded-lg bg-white p-6 space-y-6">
        {/* Icon + Header */}
        <div className="text-center space-y-3">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-7 w-40 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        {/* Alert */}
        <Skeleton className="h-16 w-full rounded-md" />
        {/* Buttons */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
