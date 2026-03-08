import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export function FinancialsWizardSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Tab bar: 4 tabs */}
      <div className="flex gap-1 border-b">
        {['Invoicing', 'Expenses', 'P&L', 'Go-Live'].map((_label, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-t" />
        ))}
      </div>

      {/* Invoice cards: 2 cards stacked */}
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </Card>
      ))}
    </div>
  )
}
