import { Skeleton } from '@/components/ui/skeleton'

export function SettingsSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Settings page heading */}
      <Skeleton className="h-8 w-28" />

      {/* Settings tab bar: 4 tabs */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-t" />
        ))}
      </div>

      {/* Form section 1 */}
      <div className="space-y-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
