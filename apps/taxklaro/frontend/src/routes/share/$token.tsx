import { createRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { publicRootRoute } from '../__root';
import { getSharedComputation, type SharedComputationData } from '@/lib/share';
import { SharedComputationNotFound } from '@/components/shared-computation/SharedComputationNotFound';
import { ResultsView } from '@/components/computation/ResultsView';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaxComputationResult } from '@/types/engine-output';

export const ShareTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/share/$token',
  component: SharePage,
});

function SharePage() {
  const { token } = ShareTokenRoute.useParams();
  const [data, setData] = useState<SharedComputationData | null | undefined>(undefined);

  useEffect(() => {
    getSharedComputation(token).then((result) => {
      setData(result);
    });
  }, [token]);

  if (data === undefined) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data === null) {
    return <SharedComputationNotFound />;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{data.title}</h1>
        <p className="text-sm text-muted-foreground">
          Tax Year {data.taxYear} · Shared by {data.orgName}
        </p>
      </div>
      {data.outputJson ? (
        <ResultsView
          result={data.outputJson as unknown as TaxComputationResult}
          readOnly={true}
        />
      ) : (
        <p className="text-muted-foreground">No computation results available.</p>
      )}
    </div>
  );
}
