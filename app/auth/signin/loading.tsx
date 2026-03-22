import { Skeleton } from "@/components/ui/skeleton"

export default function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border rounded-lg bg-card p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-7 w-32 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        {/* Buttons */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
        {/* Separator + link */}
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  )
}
