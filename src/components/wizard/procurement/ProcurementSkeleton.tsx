import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function ProcurementSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Tab bar: 4 tabs */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-t" />
        ))}
      </div>

      {/* Tab content: table card */}
      <Card className="p-4 space-y-4">
        {/* Card header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>

        {/* Table header */}
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* 5 rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}

        {/* Footer total row */}
        <div className="flex justify-end gap-4 pt-2 border-t">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </Card>

      {/* Status panel */}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  )
}
