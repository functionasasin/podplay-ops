import { Skeleton } from '@/components/ui/skeleton'

export function DeploymentWizardSkeleton() {
  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left: phase list sidebar (240px) */}
      <div className="w-60 shrink-0 border-r p-3 space-y-1 overflow-y-auto">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8 shrink-0" />
          </div>
        ))}
      </div>

      {/* Right: phase detail panel */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Phase header */}
        <div className="space-y-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Warning banner skeleton */}
        <Skeleton className="h-12 w-full rounded" />

        {/* Checklist steps: 8 items */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}
