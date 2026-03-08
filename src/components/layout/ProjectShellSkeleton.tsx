import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function ProjectShellSkeleton() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stage tabs: 4 tabs */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-t" />
        ))}
      </div>

      {/* Content area */}
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    </div>
  )
}
