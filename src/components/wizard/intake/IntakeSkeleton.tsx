import { Fragment } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function IntakeSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Step progress bar: 6 circles connected by lines */}
      <div className="flex items-center gap-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Fragment key={i}>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            {i < 5 && <Skeleton className="h-1 flex-1" />}
          </Fragment>
        ))}
      </div>

      {/* Step title */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Form fields: 4 rows of label + input */}
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>

      {/* Form footer: Back + Next buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
