import { Skeleton } from '@/components/ui/skeleton';

export function ClientRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b last:border-0">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-48 flex-1" />
      <Skeleton className="h-4 w-8 ml-auto" />
    </div>
  );
}

export default ClientRowSkeleton;
