import { Skeleton } from '@/components/ui/skeleton';

export function ClientRowSkeleton() {
  return (
    <tr className="border-b last:border-0">
      <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
      <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
      <td className="px-5 py-4 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
    </tr>
  );
}

export default ClientRowSkeleton;
