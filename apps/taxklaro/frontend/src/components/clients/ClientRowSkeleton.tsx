import { Skeleton } from '@/components/ui/skeleton';

export function ClientRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-8 ml-auto" />
    </div>
  );
}

export default ClientRowSkeleton;
